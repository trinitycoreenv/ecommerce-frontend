import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'

async function getSubscriptions(request: AuthenticatedRequest) {
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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const tier = searchParams.get('tier')

    const whereClause: any = {}

    // Status filter
    if (status) {
      whereClause.status = status
    }

    // Tier filter
    if (tier) {
      whereClause.tier = tier
    }

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where: whereClause,
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
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit
      }),
      prisma.subscription.count({ where: whereClause })
    ])

    // Get subscription statistics
    const stats = await prisma.subscription.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    })

    const statusStats = stats.reduce((acc, stat) => {
      acc[stat.status] = stat._count.id
      return acc
    }, {} as Record<string, number>)

    // Get tier statistics
    const tierStats = await prisma.subscription.groupBy({
      by: ['tier'],
      _count: {
        id: true
      },
      where: {
        status: 'ACTIVE'
      }
    })

    const tierCounts = tierStats.reduce((acc, stat) => {
      acc[stat.tier] = stat._count.id
      return acc
    }, {} as Record<string, number>)

    // Calculate revenue
    const revenueStats = await prisma.subscription.aggregate({
      where: {
        status: 'ACTIVE'
      },
      _sum: {
        price: true
      }
    })

    return NextResponse.json({
      success: true,
      data: subscriptions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats: {
        subscriptions: statusStats,
        tiers: tierCounts,
        totalRevenue: revenueStats._sum.price || 0
      }
    })

  } catch (error) {
    console.error('Error fetching subscriptions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch subscriptions' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(getSubscriptions)
