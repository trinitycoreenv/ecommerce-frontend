import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { SubscriptionStatus, OrderStatus, PayoutStatus } from '@prisma/client'

async function getAdminDashboardData(request: AuthenticatedRequest) {
  try {
    if (!request.user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Only admins and finance analysts can access this endpoint
    if (!['ADMIN', 'FINANCE_ANALYST'].includes(request.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Admin or Finance access required' },
        { status: 403 }
      )
    }

    // Fetch all dashboard data concurrently
    const [
      subscriptionRevenue,
      commissionRevenue,
      activeVendors,
      pendingApprovals,
      activeShipments,
      subscriptionStats,
      vendorStats,
      recentSubscriptions,
      recentVendors
    ] = await Promise.all([
      // Subscription Revenue
      prisma.subscription.aggregate({
        where: { status: SubscriptionStatus.ACTIVE },
        _sum: { price: true }
      }),

      // Commission Revenue (platform's commission from product sales)
      prisma.commission.aggregate({
        where: { 
          status: { in: ['CALCULATED', 'PAID'] } // Include both calculated and paid commissions
        },
        _sum: { amount: true }
      }),

      // Active Vendors
      prisma.vendor.count({
        where: { status: 'ACTIVE' }
      }),

      // Pending Approvals (products pending approval)
      prisma.product.count({
        where: { 
          status: 'PENDING_APPROVAL'
        }
      }),

      // Active Shipments
      prisma.shipment.count({
        where: { status: 'IN_TRANSIT' }
      }),

      // Subscription Statistics
      prisma.subscription.groupBy({
        by: ['status'],
        _count: { id: true },
        _sum: { price: true }
      }),

      // Vendor Statistics
      prisma.vendor.groupBy({
        by: ['status'],
        _count: { id: true }
      }),

      // Recent Subscriptions
      prisma.subscription.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          vendor: {
            select: {
              businessName: true,
              user: { select: { name: true, email: true } }
            }
          },
          plan: {
            select: { name: true, tier: true, price: true }
          }
        }
      }),

      // Recent Vendors
      prisma.vendor.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
          subscriptions: {
            where: { status: SubscriptionStatus.ACTIVE },
            include: { plan: { select: { name: true, tier: true } } },
            take: 1
          }
        }
      })
    ])

    // Process subscription stats
    const subscriptionStatusStats = subscriptionStats.reduce((acc, stat) => {
      acc[stat.status] = {
        count: stat._count.id,
        revenue: Number(stat._sum.price || 0)
      }
      return acc
    }, {} as Record<string, { count: number; revenue: number }>)

    // Process vendor stats
    const vendorStatusStats = vendorStats.reduce((acc, stat) => {
      acc[stat.status] = stat._count.id
      return acc
    }, {} as Record<string, number>)

    // Calculate monthly recurring revenue (MRR) from subscriptions
    const mrr = Number(subscriptionRevenue._sum.price || 0)

    // Calculate total commission revenue
    const totalCommissionRevenue = Number(commissionRevenue._sum.amount || 0)

    // Calculate total admin revenue (subscriptions + commissions)
    const totalAdminRevenue = mrr + totalCommissionRevenue

    // Calculate annual recurring revenue (ARR)
    const arr = mrr * 12

    return NextResponse.json({
      success: true,
      data: {
        // KPI Cards
        totalRevenue: totalAdminRevenue,
        subscriptionRevenue: mrr,
        commissionRevenue: totalCommissionRevenue,
        activeVendors,
        pendingApprovals,
        activeShipments,
        
        // Revenue Metrics
        mrr,
        arr,
        
        // Statistics
        subscriptionStats: subscriptionStatusStats,
        vendorStats: vendorStatusStats,
        
        // Recent Activity
        recentSubscriptions,
        recentVendors,
        
        // Summary
        summary: {
          totalSubscriptions: subscriptionStats.reduce((sum, stat) => sum + stat._count.id, 0),
          totalVendors: vendorStats.reduce((sum, stat) => sum + stat._count.id, 0),
          activeSubscriptions: subscriptionStatusStats.ACTIVE?.count || 0,
          activeVendors,
          monthlyRevenue: mrr
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
    console.error('Error fetching admin dashboard data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(getAdminDashboardData)
