import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/vendor/shipping - Get vendor shipping data
 */
async function getVendorShipping(request: AuthenticatedRequest) {
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
      order: {
        vendorId: vendor.id
      }
    }

    if (status && status !== 'all') {
      whereClause.status = status
    }

    const [shipments, total] = await Promise.all([
      prisma.shipment.findMany({
        where: whereClause,
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              totalPrice: true,
              customer: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit
      }),
      prisma.shipment.count({ where: whereClause })
    ])

    // Calculate shipping statistics
    const shipmentStats = await prisma.shipment.groupBy({
      by: ['status'],
      where: {
        order: {
          vendorId: vendor.id
        }
      },
      _count: { id: true }
    })

    const stats = {
      PENDING: 0,
      PICKED_UP: 0,
      IN_TRANSIT: 0,
      OUT_FOR_DELIVERY: 0,
      DELIVERED: 0,
      FAILED_DELIVERY: 0,
      RETURNED: 0
    }

    shipmentStats.forEach(stat => {
      stats[stat.status as keyof typeof stats] = stat._count.id
    })

    // Calculate carrier usage
    const carrierStats = await prisma.shipment.groupBy({
      by: ['carrier'],
      where: {
        order: {
          vendorId: vendor.id
        }
      },
      _count: { id: true }
    })

    const carrierUsage = carrierStats.map(stat => ({
      carrier: stat.carrier,
      count: stat._count.id
    }))

    // Calculate average delivery time
    const deliveredShipments = await prisma.shipment.findMany({
      where: {
        order: {
          vendorId: vendor.id
        },
        status: 'DELIVERED',
        actualDelivery: {
          not: null
        }
      },
      select: {
        createdAt: true,
        actualDelivery: true
      }
    })

    const totalDeliveryTime = deliveredShipments.reduce((sum, shipment) => {
      if (shipment.actualDelivery) {
        const deliveryTime = shipment.actualDelivery.getTime() - shipment.createdAt.getTime()
        return sum + deliveryTime
      }
      return sum
    }, 0)

    const averageDeliveryTime = deliveredShipments.length > 0 
      ? Math.round(totalDeliveryTime / deliveredShipments.length / (1000 * 60 * 60 * 24)) // Convert to days
      : 0

    // Calculate total shipping cost
    const totalShippingCost = await prisma.shipment.aggregate({
      where: {
        order: {
          vendorId: vendor.id
        }
      },
      _sum: {
        shippingCost: true
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        shipments,
        stats,
        carrierUsage,
        averageDeliveryTime,
        totalShippingCost: Number(totalShippingCost._sum.shippingCost || 0)
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error getting vendor shipping:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get vendor shipping' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(getVendorShipping)
