import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { ShippingService } from '@/lib/services/shipping'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/shipping/track - Get tracking information
 */
async function getTrackingInfo(request: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const trackingNumber = searchParams.get('trackingNumber')
    const carrier = searchParams.get('carrier')

    if (!trackingNumber || !carrier) {
      return NextResponse.json(
        { success: false, error: 'Missing trackingNumber or carrier' },
        { status: 400 }
      )
    }

    // Check if user has access to this shipment
    const shipment = await prisma.shipment.findFirst({
      where: {
        trackingNumber,
        carrier
      },
      include: {
        order: {
          select: {
            id: true,
            vendorId: true,
            customerId: true
          }
        }
      }
    })

    if (!shipment) {
      return NextResponse.json(
        { success: false, error: 'Shipment not found' },
        { status: 404 }
      )
    }

    // Check permissions
    if (request.user.role === 'VENDOR' && shipment.order.vendorId !== request.user.userId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    if (request.user.role === 'CUSTOMER' && shipment.order.customerId !== request.user.userId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    // Get tracking information
    const trackingInfo = await ShippingService.getTrackingInfo(trackingNumber, carrier)

    return NextResponse.json({
      success: true,
      data: {
        trackingNumber,
        carrier,
        shipment: {
          id: shipment.id,
          status: shipment.status,
          createdAt: shipment.createdAt,
          estimatedDelivery: shipment.estimatedDelivery,
          actualDelivery: shipment.actualDelivery
        },
        trackingEvents: trackingInfo
      }
    })
  } catch (error) {
    console.error('Error getting tracking info:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get tracking information' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(getTrackingInfo)
