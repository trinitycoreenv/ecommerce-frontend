import { prisma } from '../prisma'
import { SubscriptionTier } from '@prisma/client'
import { CommissionCalculation } from '../types'

export class CommissionService {
  private static readonly COMMISSION_RATES = {
    [SubscriptionTier.BASIC]: 0.1,      // 10%
    [SubscriptionTier.PREMIUM]: 0.08,   // 8%
    [SubscriptionTier.ENTERPRISE]: 0.05  // 5%
  }

  static async calculateCommission(
    orderId: string,
    vendorId: string,
    grossAmount: number
  ): Promise<CommissionCalculation> {
    // Get vendor's current subscription tier
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      include: {
        subscriptions: {
          where: {
            status: 'ACTIVE',
            startDate: { lte: new Date() },
            OR: [
              { endDate: null },
              { endDate: { gte: new Date() } }
            ]
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    if (!vendor) {
      throw new Error('Vendor not found')
    }

    // Determine commission rate
    let commissionRate = this.COMMISSION_RATES[SubscriptionTier.BASIC] // Default rate
    
    if (vendor.subscriptions.length > 0) {
      const activeSubscription = vendor.subscriptions[0]
      commissionRate = this.COMMISSION_RATES[activeSubscription.tier]
    } else {
      // Use vendor's custom commission rate if no active subscription
      commissionRate = Number(vendor.commissionRate)
    }

    const commissionAmount = grossAmount * commissionRate
    const netPayout = grossAmount - commissionAmount

    return {
      orderId,
      vendorId,
      grossAmount,
      commissionRate,
      commissionAmount,
      netPayout
    }
  }

  static async getCommissionSummary(
    vendorId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalCommissions: number
    totalPayouts: number
    transactionCount: number
    averageCommissionRate: number
  }> {
    const whereClause: any = { vendorId }
    
    if (startDate || endDate) {
      whereClause.createdAt = {}
      if (startDate) whereClause.createdAt.gte = startDate
      if (endDate) whereClause.createdAt.lte = endDate
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      select: {
        commission: true,
        netPayout: true
      }
    })

    const totalCommissions = transactions.reduce(
      (sum, tx) => sum + Number(tx.commission),
      0
    )
    
    const totalPayouts = transactions.reduce(
      (sum, tx) => sum + Number(tx.netPayout),
      0
    )

    const averageCommissionRate = transactions.length > 0
      ? totalCommissions / (totalCommissions + totalPayouts)
      : 0

    return {
      totalCommissions,
      totalPayouts,
      transactionCount: transactions.length,
      averageCommissionRate
    }
  }

  static async updateVendorCommissionRate(
    vendorId: string,
    newRate: number
  ): Promise<void> {
    if (newRate < 0 || newRate > 1) {
      throw new Error('Commission rate must be between 0 and 1')
    }

    await prisma.vendor.update({
      where: { id: vendorId },
      data: { commissionRate: newRate }
    })
  }

  static async getCommissionReport(
    startDate: Date,
    endDate: Date,
    vendorId?: string
  ): Promise<{
    totalCommissions: number
    totalRevenue: number
    vendorBreakdown: Array<{
      vendorId: string
      vendorName: string
      totalCommissions: number
      totalRevenue: number
      commissionRate: number
    }>
  }> {
    const whereClause: any = {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    }

    if (vendorId) {
      whereClause.vendorId = vendorId
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        vendor: {
          select: {
            businessName: true,
            commissionRate: true
          }
        }
      }
    })

    const totalCommissions = transactions.reduce(
      (sum, tx) => sum + Number(tx.commission),
      0
    )

    const totalRevenue = transactions.reduce(
      (sum, tx) => sum + Number(tx.amount),
      0
    )

    // Group by vendor
    const vendorMap = new Map<string, {
      vendorName: string
      totalCommissions: number
      totalRevenue: number
      commissionRate: number
    }>()

    transactions.forEach(tx => {
      const existing = vendorMap.get(tx.vendorId) || {
        vendorName: tx.vendor.businessName,
        totalCommissions: 0,
        totalRevenue: 0,
        commissionRate: Number(tx.vendor.commissionRate)
      }

      existing.totalCommissions += Number(tx.commission)
      existing.totalRevenue += Number(tx.amount)

      vendorMap.set(tx.vendorId, existing)
    })

    const vendorBreakdown = Array.from(vendorMap.entries()).map(
      ([vendorId, data]) => ({
        vendorId,
        ...data
      })
    )

    return {
      totalCommissions,
      totalRevenue,
      vendorBreakdown
    }
  }

  static async processCommission(orderId: string): Promise<void> {
    try {
      // Get order details
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          vendor: true,
          items: true
        }
      })

      if (!order) {
        throw new Error('Order not found')
      }

      // Check if commission already exists
      const existingCommission = await prisma.commission.findFirst({
        where: { orderId: order.id }
      })

      if (existingCommission) {
        console.log('Commission already exists for order:', orderId)
        return
      }

      // Calculate commission
      const commissionCalculation = await this.calculateCommission(
        order.id,
        order.vendorId,
        Number(order.totalPrice)
      )

      // Create commission record
      await prisma.commission.create({
        data: {
          orderId: order.id,
          vendorId: order.vendorId,
          amount: commissionCalculation.commissionAmount,
          rate: commissionCalculation.commissionRate,
          status: 'CALCULATED',
          calculatedAt: new Date(),
          breakdown: commissionCalculation as any,
        }
      })

      // Update transaction with commission details
      await prisma.transaction.updateMany({
        where: { orderId: order.id },
        data: {
          commission: commissionCalculation.commissionAmount,
          netPayout: commissionCalculation.netPayout,
        }
      })

      console.log('✅ Commission processed for order:', orderId)
    } catch (error) {
      console.error('Failed to process commission:', error)
      throw error
    }
  }
}
