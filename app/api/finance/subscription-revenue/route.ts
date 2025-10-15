import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/finance/subscription-revenue - Get subscription revenue data for finance dashboard
 */
async function getSubscriptionRevenue(request: AuthenticatedRequest) {
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

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Get subscription revenue data
    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        ...(startDate && endDate && {
          startDate: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        })
      },
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        plan: {
          select: {
            name: true,
            tier: true,
            price: true,
            trialDays: true
          }
        }
      },
      orderBy: { startDate: 'desc' }
    })

    // Calculate subscription revenue metrics
    const totalMRR = subscriptions.reduce((sum, sub) => {
      if (sub.billingCycle === 'MONTHLY') {
        return sum + Number(sub.price)
      } else if (sub.billingCycle === 'YEARLY') {
        return sum + (Number(sub.price) / 12)
      }
      return sum
    }, 0)

    const totalARR = totalMRR * 12

    // Calculate trial vs paid subscriptions
    const now = new Date()
    const trialSubscriptions = subscriptions.filter(sub => 
      sub.trialEndDate && sub.trialEndDate > now
    )
    const paidSubscriptions = subscriptions.filter(sub => 
      !sub.trialEndDate || sub.trialEndDate <= now
    )

    // Calculate revenue by tier
    const revenueByTier = subscriptions.reduce((acc, sub) => {
      const tier = sub.tier
      if (!acc[tier]) {
        acc[tier] = { count: 0, revenue: 0 }
      }
      acc[tier].count += 1
      acc[tier].revenue += Number(sub.price)
      return acc
    }, {} as Record<string, { count: number; revenue: number }>)

    // Calculate monthly subscription revenue trend
    const monthlyRevenue = await prisma.subscription.groupBy({
      by: ['startDate'],
      _sum: {
        price: true
      },
      where: {
        status: 'ACTIVE',
        billingCycle: 'MONTHLY'
      },
      orderBy: {
        startDate: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        totalMRR,
        totalARR,
        totalSubscriptions: subscriptions.length,
        trialSubscriptions: trialSubscriptions.length,
        paidSubscriptions: paidSubscriptions.length,
        revenueByTier,
        subscriptions: subscriptions.map(sub => ({
          id: sub.id,
          vendor: sub.vendor.businessName,
          vendorEmail: sub.vendor.user.email,
          plan: sub.plan?.name || 'Unknown Plan',
          tier: sub.tier,
          price: Number(sub.price),
          billingCycle: sub.billingCycle,
          status: sub.status,
          startDate: sub.startDate,
          trialEndDate: sub.trialEndDate,
          nextBillingDate: sub.nextBillingDate,
          isTrial: sub.trialEndDate && sub.trialEndDate > now
        })),
        monthlyTrend: monthlyRevenue.map(item => ({
          month: item.startDate,
          revenue: Number(item._sum.price || 0)
        }))
      }
    })

  } catch (error) {
    console.error('Error getting subscription revenue:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get subscription revenue' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(getSubscriptionRevenue)
