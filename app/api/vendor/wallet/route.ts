import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/vendor/wallet - Get vendor wallet balance and earnings
 */
async function getVendorWallet(request: AuthenticatedRequest) {
  try {
    if (!request.user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    if (request.user.role !== 'VENDOR') {
      return NextResponse.json(
        { success: false, error: 'Vendor access required' },
        { status: 403 }
      )
    }

    // Get vendor profile
    const vendor = await prisma.vendor.findUnique({
      where: { userId: request.user.userId }
    })

    if (!vendor) {
      return NextResponse.json(
        { success: false, error: 'Vendor profile not found' },
        { status: 404 }
      )
    }

    // Get all commissions for this vendor
    const commissions = await prisma.commission.findMany({
      where: { vendorId: vendor.id },
      include: {
        order: {
          select: {
            orderNumber: true,
            totalPrice: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Get all payouts for this vendor
    const payouts = await prisma.payout.findMany({
      where: { vendorId: vendor.id },
      orderBy: { createdAt: 'desc' }
    })

    // Calculate total earnings first
    const totalEarnings = commissions.reduce((sum, commission) => {
      const orderTotal = commission.breakdown?.orderTotal || Number(commission.order?.totalPrice) || 0
      const commissionAmount = Number(commission.amount)
      const vendorNetPayout = orderTotal - commissionAmount
      return sum + vendorNetPayout
    }, 0)
    
    // Calculate total payouts (all payouts, regardless of status)
    const totalPayouts = payouts.reduce((sum, payout) => sum + Number(payout.amount), 0)
    
    // Available balance = Total earnings - Total payouts
    const availableBalance = totalEarnings - totalPayouts


    const totalPaidOut = payouts
      .filter(payout => payout.status === 'COMPLETED')
      .reduce((sum, payout) => sum + Number(payout.amount), 0)

    const pendingPayouts = payouts
      .filter(payout => ['PENDING', 'PROCESSING'].includes(payout.status))
      .reduce((sum, payout) => sum + Number(payout.amount), 0)

    // Get recent earnings (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentEarnings = commissions
      .filter(commission => commission.createdAt >= thirtyDaysAgo)
      .reduce((sum, commission) => {
        // Calculate vendor's net payout, not platform commission
        const orderTotal = commission.breakdown?.orderTotal || 0
        const commissionAmount = Number(commission.amount)
        const vendorNetPayout = orderTotal - commissionAmount
        return sum + vendorNetPayout
      }, 0)

    // Get pending commissions (not yet included in any payout)
    const pendingCommissions = commissions.filter(commission => commission.payoutId === null)
    const pendingCommissionAmount = pendingCommissions.reduce((sum, commission) => {
      const orderTotal = commission.breakdown?.orderTotal || Number(commission.order?.totalPrice) || 0
      const commissionAmount = Number(commission.amount)
      const vendorNetPayout = orderTotal - commissionAmount
      return sum + vendorNetPayout
    }, 0)

    return NextResponse.json({
      success: true,
      data: {
        // Wallet Balance
        availableBalance,
        totalEarnings,
        totalPaidOut,
        pendingPayouts,
        recentEarnings,
        
        // Commission Details
        totalCommissions: commissions.length,
        pendingCommissions: pendingCommissions.length,
        pendingCommissionAmount,
        
        // Recent Activity
        recentCommissions: commissions.slice(0, 10).map(commission => ({
          id: commission.id,
          amount: Number(commission.amount),
          orderNumber: commission.order.orderNumber,
          orderTotal: Number(commission.order.totalPrice),
          rate: Number(commission.rate),
          createdAt: commission.createdAt,
          status: commission.status
        })),
        
        // Payout History
        recentPayouts: payouts.slice(0, 5).map(payout => ({
          id: payout.id,
          amount: Number(payout.amount),
          status: payout.status,
          scheduledDate: payout.scheduledDate,
          processedAt: payout.processedAt,
          createdAt: payout.createdAt
        }))
      }
    })

  } catch (error) {
    console.error('Error getting vendor wallet:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get wallet data' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(getVendorWallet)
