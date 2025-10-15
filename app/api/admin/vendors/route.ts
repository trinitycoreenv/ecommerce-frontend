import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'

async function getVendors(request: AuthenticatedRequest) {
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
    const search = searchParams.get('search')
    const status = searchParams.get('status')

    const whereClause: any = {}

    // Search filter
    if (search) {
      whereClause.OR = [
        { businessName: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } }
      ]
    }

    // Status filter
    if (status) {
      whereClause.status = status
    }

    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              emailVerified: true,
              createdAt: true
            }
          },
          subscriptions: {
            where: { status: 'ACTIVE' },
            include: {
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
            take: 1
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit
      }),
      prisma.vendor.count({ where: whereClause })
    ])

    // Get vendor statistics
    const stats = await prisma.vendor.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    })

    const statusStats = stats.reduce((acc, stat) => {
      acc[stat.status] = stat._count.id
      return acc
    }, {} as Record<string, number>)

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

    return NextResponse.json({
      success: true,
      data: vendors,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats: {
        vendors: statusStats,
        subscriptions: tierStats
      }
    })

  } catch (error) {
    console.error('Error fetching vendors:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vendors' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(getVendors)
