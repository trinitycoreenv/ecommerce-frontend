import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/vendor/orders - Get vendor orders
 */
async function getVendorOrders(request: AuthenticatedRequest) {
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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')

    const whereClause: any = {
      vendorId: vendor.id
    }

    if (status && status !== 'all') {
      whereClause.status = status
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: whereClause,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  price: true,
                  images: true
                }
              }
            }
          },
          shipments: {
            select: {
              id: true,
              status: true,
              trackingNumber: true,
              carrier: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit
      }),
      prisma.order.count({ where: whereClause })
    ])

    // Calculate order statistics
    const orderStats = await prisma.order.groupBy({
      by: ['status'],
      where: { vendorId: vendor.id },
      _count: { id: true }
    })

    const stats = {
      PENDING: 0,
      CONFIRMED: 0,
      PROCESSING: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
      REFUNDED: 0
    }

    orderStats.forEach(stat => {
      stats[stat.status as keyof typeof stats] = stat._count.id
    })

    return NextResponse.json({
      success: true,
      data: orders,
      stats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error getting vendor orders:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get vendor orders' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(getVendorOrders)
