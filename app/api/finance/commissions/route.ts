import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/finance/commissions - Get commission analysis data
 */
async function getCommissionAnalysis(request: AuthenticatedRequest) {
  try {
    if (!request.user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Only finance analysts and admins can access this endpoint
    if (!['FINANCE_ANALYST', 'ADMIN'].includes(request.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Finance access required' },
        { status: 403 }
      )
    }

    // Get date range (default to last 30 days)
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)

    // Get all commissions
    const commissions = await prisma.commission.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        vendor: {
          select: {
            businessName: true,
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        order: {
          select: {
            totalPrice: true,
            createdAt: true
          }
        }
      }
    })

    // Calculate total commission
    const totalCommission = commissions.reduce((sum, commission) => 
      sum + Number(commission.amount), 0
    )

    // Get gross revenue from orders
    const orders = await prisma.order.findMany({
      where: {
        status: 'DELIVERED',
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    const grossRevenue = orders.reduce((sum, order) => 
      sum + Number(order.totalPrice), 0
    )

    // Calculate average commission rate
    const averageRate = grossRevenue > 0 ? (totalCommission / grossRevenue) * 100 : 0

    // Get active vendors count
    const activeVendors = await prisma.vendor.count({
      where: { status: 'ACTIVE' }
    })

    // Get top vendors by commission
    const vendorCommissionMap = new Map<string, {
      vendorId: string
      vendorName: string
      totalCommission: number
      orderCount: number
      averageOrderValue: number
    }>()

    commissions.forEach(commission => {
      const vendorId = commission.vendorId
      const vendorName = commission.vendor.businessName
      const current = vendorCommissionMap.get(vendorId) || {
        vendorId,
        vendorName,
        totalCommission: 0,
        orderCount: 0,
        averageOrderValue: 0
      }
      
      current.totalCommission += Number(commission.amount)
      current.orderCount += 1
      current.averageOrderValue = current.totalCommission / current.orderCount
      
      vendorCommissionMap.set(vendorId, current)
    })

    const topVendorsByCommission = Array.from(vendorCommissionMap.values())
      .sort((a, b) => b.totalCommission - a.totalCommission)
      .slice(0, 10)

    // Get commission trends (monthly for last 6 months)
    const monthlyTrends = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date()
      monthStart.setMonth(monthStart.getMonth() - i, 1)
      monthStart.setHours(0, 0, 0, 0)
      
      const monthEnd = new Date(monthStart)
      monthEnd.setMonth(monthEnd.getMonth() + 1, 0)
      monthEnd.setHours(23, 59, 59, 999)

      const monthCommissions = await prisma.commission.findMany({
        where: {
          createdAt: {
            gte: monthStart,
            lte: monthEnd
          }
        }
      })

      const monthTotal = monthCommissions.reduce((sum, commission) => 
        sum + Number(commission.amount), 0
      )

      monthlyTrends.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        commission: monthTotal,
        count: monthCommissions.length
      })
    }

    // Get revenue by category (simplified - using product categories)
    const categoryRevenue = await prisma.product.groupBy({
      by: ['categoryId'],
      _sum: {
        price: true
      },
      _count: {
        id: true
      }
    })

    const categories = await prisma.category.findMany({
      where: {
        id: {
          in: categoryRevenue.map(cat => cat.categoryId)
        }
      }
    })

    const revenueByCategory = categoryRevenue.map(cat => {
      const category = categories.find(c => c.id === cat.categoryId)
      return {
        category: category?.name || 'Uncategorized',
        revenue: Number(cat._sum.price || 0),
        productCount: cat._count.id
      }
    }).sort((a, b) => b.revenue - a.revenue)

    return NextResponse.json({
      success: true,
      data: {
        // KPI Metrics
        totalCommission,
        grossRevenue,
        averageRate,
        activeVendors,
        
        // Top Vendors
        topVendorsByCommission,
        
        // Trends
        monthlyTrends,
        
        // Category Revenue
        revenueByCategory,
        
        // Commission Details
        commissions: commissions.map(commission => ({
          id: commission.id,
          vendor: commission.vendor.businessName,
          amount: Number(commission.amount),
          rate: Number(commission.rate),
          orderTotal: Number(commission.order?.totalPrice || 0),
          createdAt: commission.createdAt,
          status: commission.status
        }))
      }
    })

  } catch (error) {
    console.error('Error getting commission analysis:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get commission analysis' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(getCommissionAnalysis)
