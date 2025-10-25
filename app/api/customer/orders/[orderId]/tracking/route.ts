import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { ShippingService } from '@/lib/services/shipping'

/**
 * GET /api/customer/orders/[orderId]/tracking
 * Get tracking information for a customer's order
 */
async function getOrderTracking(
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params
    const userId = request.user.userId

    // Get the order and verify it belongs to the customer
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    // Verify the order belongs to the authenticated customer
    if (order.customerId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    // Get shipment information
    const shipment = await prisma.shipment.findFirst({
      where: { orderId },
      orderBy: { createdAt: 'desc' }
    })

    if (!shipment) {
      return NextResponse.json(
        { success: false, error: 'No shipment found for this order' },
        { status: 404 }
      )
    }

    // Get tracking events from Shippo if available
    let trackingEvents = []
    if (shipment.trackingNumber && shipment.carrier) {
      try {
        trackingEvents = await ShippingService.getTrackingInfo(
          shipment.trackingNumber,
          shipment.carrier
        )
      } catch (error) {
        console.error('Error fetching tracking info from Shippo:', error)
        // Continue without tracking events if Shippo fails
      }
    }

    // Return shipment and tracking information
    return NextResponse.json({
      success: true,
      data: {
        id: shipment.id,
        orderId: order.id,
        orderNumber: order.orderNumber,
        carrier: shipment.carrier,
        trackingNumber: shipment.trackingNumber,
        status: shipment.status,
        estimatedDelivery: shipment.estimatedDelivery,
        actualDelivery: shipment.actualDelivery,
        shippingCost: Number(shipment.shippingCost || 0),
        createdAt: shipment.createdAt,
        trackingEvents: trackingEvents.map(event => ({
          timestamp: event.timestamp,
          status: event.status,
          location: event.location,
          description: event.description
        }))
      }
    })
  } catch (error) {
    console.error('Error getting order tracking:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get tracking information' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(getOrderTracking)

