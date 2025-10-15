import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/finance/dashboard - Get comprehensive finance dashboard data
 */
async function getFinanceDashboard(request: AuthenticatedRequest) {
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

    // Use same date range as admin analytics (all time data)
    const endDate = new Date()
    const startDate = new Date('2024-01-01') // Start from beginning of year

    // Get subscription revenue data (same as admin analytics)
    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: {
        vendor: {
          select: {
            businessName: true
          }
        },
        plan: {
          select: {
            name: true,
            tier: true,
            price: true
          }
        }
      }
    })

    // Calculate subscription revenue metrics (same as admin analytics)
    const totalMRR = subscriptions.reduce((sum, sub) => {
      if (sub.billingCycle === 'MONTHLY') {
        return sum + Number(sub.price)
      } else if (sub.billingCycle === 'YEARLY') {
        return sum + (Number(sub.price) / 12)
      }
      return sum
    }, 0)

    // Get all orders (not just delivered) to match admin analytics
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                vendor: true
              }
            }
          }
        }
      }
    })

    // Calculate transaction revenue and commissions (same as admin analytics)
    let totalTransactionRevenue = 0
    let totalCommissions = 0

    orders.forEach(order => {
      const orderTotal = Number(order.totalPrice)
      totalTransactionRevenue += orderTotal
      
      // Use subscription-based commission calculation (same as admin)
      const vendor = order.items[0]?.product?.vendor
      if (vendor) {
        const vendorSubscription = subscriptions.find(sub => sub.vendorId === vendor.id)
        let commissionRate = 0.15 // Default rate
        
        if (vendorSubscription) {
          // Use subscription tier-based commission rates
          switch (vendorSubscription.tier) {
            case 'BASIC':
              commissionRate = 0.20
              break
            case 'PRO':
              commissionRate = 0.15
              break
            case 'ENTERPRISE':
              commissionRate = 0.10
              break
            default:
              commissionRate = 0.15
          }
        }
        
        const commission = orderTotal * commissionRate
        totalCommissions += commission
      }
    })

    // Get pending payouts
    const pendingPayouts = await prisma.payout.findMany({
      where: {
        status: 'PENDING'
      },
      include: {
        vendor: {
          select: {
            businessName: true
          }
        }
      }
    })

    const totalPendingPayouts = pendingPayouts.reduce((sum, payout) => 
      sum + Number(payout.amount), 0
    )

    // Calculate total platform revenue (subscriptions + commissions)
    const totalPlatformRevenue = totalMRR + totalCommissions

    // Get subscription statistics
    const subscriptionStats = await prisma.subscription.groupBy({
      by: ['tier'],
      _count: {
        id: true
      },
      where: {
        status: 'ACTIVE'
      }
    })

    const tierStats = subscriptionStats.reduce((acc, stat) => {
      acc[stat.tier] = stat._count.id
      return acc
    }, {} as Record<string, number>)

    // Get recent subscription activity
    const recentSubscriptions = await prisma.subscription.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        vendor: {
          select: {
            businessName: true
          }
        },
        plan: {
          select: {
            name: true,
            tier: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        // Revenue Metrics
        totalPlatformRevenue,
        subscriptionRevenue: {
          mrr: totalMRR,
          arr: totalMRR * 12,
          activeSubscriptions: subscriptions.length
        },
        transactionRevenue: {
          total: totalTransactionRevenue,
          commissions: totalCommissions,
          orders: orders.length
        },
        pendingPayouts: {
          total: totalPendingPayouts,
          count: pendingPayouts.length
        },
        
        // Subscription Statistics
        subscriptionStats: {
          byTier: tierStats,
          totalActive: subscriptions.length
        },
        
        // Recent Activity
        recentSubscriptions: recentSubscriptions.map(sub => ({
          id: sub.id,
          vendor: sub.vendor.businessName,
          plan: sub.plan?.name || 'Unknown',
          tier: sub.tier,
          price: Number(sub.price),
          status: sub.status,
          startDate: sub.startDate,
          isTrial: sub.trialEndDate && sub.trialEndDate > new Date()
        })),
        
        // Pending Payouts Summary
        pendingPayoutsSummary: {
          total: totalPendingPayouts,
          count: pendingPayouts.length
        },
        
        // Pending Payouts Details
        pendingPayouts: pendingPayouts.map(payout => ({
          id: payout.id,
          vendor: payout.vendor.businessName,
          amount: Number(payout.amount),
          status: payout.status,
          scheduledDate: payout.scheduledDate
        }))
      }
    })

  } catch (error) {
    console.error('Error getting finance dashboard data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get finance dashboard data' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(getFinanceDashboard)
