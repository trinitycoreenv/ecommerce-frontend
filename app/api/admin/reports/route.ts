import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/middleware'

async function getAdminReports(request: AuthenticatedRequest) {
  try {
    if (!request.user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Only admins can access this endpoint
    if (request.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const reportType = searchParams.get('type') || 'overview'

    // Default to last 30 days if no dates provided
    const defaultEndDate = new Date()
    const defaultStartDate = new Date()
    defaultStartDate.setDate(defaultStartDate.getDate() - 30)

    const start = startDate ? new Date(startDate) : defaultStartDate
    const end = endDate ? new Date(endDate) : defaultEndDate

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format' },
        { status: 400 }
      )
    }

    if (start >= end) {
      return NextResponse.json(
        { success: false, error: 'Start date must be before end date' },
        { status: 400 }
      )
    }

    // Fetch comprehensive report data
    const [
      revenueData,
      orderData,
      vendorData,
      commissionData,
      payoutData,
      subscriptionData
    ] = await Promise.all([
      // Revenue Data
      prisma.order.aggregate({
        where: {
          status: 'CONFIRMED',
          createdAt: { gte: start, lte: end }
        },
        _sum: { totalPrice: true },
        _count: { id: true }
      }),

      // Order Data
      prisma.order.groupBy({
        by: ['status'],
        where: {
          createdAt: { gte: start, lte: end }
        },
        _count: { id: true },
        _sum: { totalPrice: true }
      }),

      // Vendor Data
      prisma.vendor.groupBy({
        by: ['status'],
        where: {
          createdAt: { gte: start, lte: end }
        },
        _count: { id: true }
      }),

      // Commission Data
      prisma.commission.aggregate({
        where: {
          createdAt: { gte: start, lte: end }
        },
        _sum: { amount: true },
        _count: { id: true }
      }),

      // Payout Data
      prisma.payout.groupBy({
        by: ['status'],
        where: {
          createdAt: { gte: start, lte: end }
        },
        _sum: { amount: true },
        _count: { id: true }
      }),

      // Subscription Data
      prisma.subscription.groupBy({
        by: ['status'],
        where: {
          createdAt: { gte: start, lte: end }
        },
        _sum: { price: true },
        _count: { id: true }
      })
    ])

    // Calculate daily revenue trend
    const dailyRevenue = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        SUM(total_price) as revenue,
        COUNT(*) as orders
      FROM orders 
      WHERE status = 'CONFIRMED' 
        AND created_at >= ${start} 
        AND created_at <= ${end}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `

    // Calculate top vendors
    const topVendors = await prisma.vendor.findMany({
      include: {
        orders: {
          where: {
            status: 'CONFIRMED',
            createdAt: { gte: start, lte: end }
          },
          select: {
            totalPrice: true
          }
        },
        commissions: {
          where: {
            createdAt: { gte: start, lte: end }
          },
          select: {
            amount: true
          }
        },
        _count: {
          select: {
            products: true
          }
        }
      },
      orderBy: {
        orders: {
          _count: 'desc'
        }
      },
      take: 10
    })

    // Calculate top products
    const topProducts = await prisma.product.findMany({
      include: {
        orderItems: {
          where: {
            order: {
              status: 'CONFIRMED',
              createdAt: { gte: start, lte: end }
            }
          },
          select: {
            quantity: true,
            price: true
          }
        },
        vendor: {
          select: {
            businessName: true
          }
        }
      },
      orderBy: {
        orderItems: {
          _count: 'desc'
        }
      },
      take: 10
    })

    // Process data for response
    const processedTopVendors = topVendors.map(vendor => ({
      id: vendor.id,
      businessName: vendor.businessName,
      totalRevenue: vendor.orders.reduce((sum, order) => sum + Number(order.totalPrice), 0),
      totalCommissions: vendor.commissions.reduce((sum, commission) => sum + Number(commission.amount), 0),
      orderCount: vendor.orders.length,
      productCount: vendor._count.products
    }))

    const processedTopProducts = topProducts.map(product => ({
      id: product.id,
      name: product.name,
      totalRevenue: product.orderItems.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0),
      totalQuantity: product.orderItems.reduce((sum, item) => sum + item.quantity, 0),
      vendorName: product.vendor.businessName
    }))

    return NextResponse.json({
      success: true,
      data: {
        period: {
          startDate: start,
          endDate: end,
          type: reportType
        },
        summary: {
          totalRevenue: Number(revenueData._sum.totalPrice || 0),
          totalOrders: revenueData._count.id,
          totalCommissions: Number(commissionData._sum.amount || 0),
          averageOrderValue: revenueData._count.id > 0 ? Number(revenueData._sum.totalPrice || 0) / revenueData._count.id : 0
        },
        breakdown: {
          orders: orderData.map(item => ({
            ...item,
            _sum: item._sum ? {
              totalPrice: Number(item._sum.totalPrice || 0)
            } : undefined
          })),
          vendors: vendorData,
          commissions: {
            _sum: {
              amount: Number(commissionData._sum.amount || 0)
            },
            _count: commissionData._count
          },
          payouts: payoutData.map(item => ({
            ...item,
            _sum: item._sum ? {
              amount: Number(item._sum.amount || 0)
            } : undefined
          })),
          subscriptions: subscriptionData.map(item => ({
            ...item,
            _sum: item._sum ? {
              price: Number(item._sum.price || 0)
            } : undefined
          }))
        },
        trends: {
          dailyRevenue: dailyRevenue.map((item: any) => ({
            date: item.date,
            revenue: Number(item.revenue || 0),
            orders: Number(item.orders || 0)
          }))
        },
        topPerformers: {
          vendors: processedTopVendors,
          products: processedTopProducts
        }
      }
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    return handleApiError(error)
  }
}

export const GET = withAuth(getAdminReports)
