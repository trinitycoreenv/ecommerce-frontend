import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { ShippingService } from '@/lib/services/shipping'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/shipping/labels - Create shipping label
 */
async function createShippingLabel(request: AuthenticatedRequest) {
  try {
    const body = await request.json()
    const { fromAddress, toAddress, packageInfo, service, carrier, orderId } = body

    // Validate required fields
    if (!fromAddress || !toAddress || !packageInfo || !service || !carrier || !orderId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if user has access to this order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { 
        id: true, 
        vendorId: true,
        customerId: true,
        status: true
      }
    })

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    // Check permissions
    if (request.user.role === 'VENDOR' && order.vendorId !== request.user.userId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    if (request.user.role === 'CUSTOMER' && order.customerId !== request.user.userId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    // Check if order is in a valid state for shipping
    if (!['CONFIRMED', 'PROCESSING'].includes(order.status)) {
      return NextResponse.json(
        { success: false, error: 'Order is not in a valid state for shipping' },
        { status: 400 }
      )
    }

    // Create shipping label
    const label = await ShippingService.createShippingLabel(
      fromAddress,
      toAddress,
      packageInfo,
      service,
      carrier,
      orderId
    )

    // Update order status to SHIPPED
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'SHIPPED' }
    })

    return NextResponse.json({
      success: true,
      data: label
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating shipping label:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create shipping label' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/shipping/labels - Get shipping labels
 */
async function getShippingLabels(request: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')
    const carrier = searchParams.get('carrier')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let whereClause: any = {}

    // Filter by order if specified
    if (orderId) {
      whereClause.orderId = orderId
    }

    // Filter by carrier if specified
    if (carrier) {
      whereClause.carrier = carrier
    }

    // Filter by status if specified
    if (status) {
      whereClause.status = status
    }

    // Role-based filtering
    if (request.user.role === 'VENDOR') {
      whereClause.order = {
        vendorId: request.user.userId
      }
    } else if (request.user.role === 'CUSTOMER') {
      whereClause.order = {
        customerId: request.user.userId
      }
    }

    const shipments = await prisma.shipment.findMany({
      where: whereClause,
      include: {
        order: {
          include: {
            customer: {
              select: {
                name: true,
                email: true
              }
            },
            vendor: {
              select: {
                businessName: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    })

    return NextResponse.json({
      success: true,
      data: shipments
    })
  } catch (error) {
    console.error('Error getting shipping labels:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get shipping labels' },
      { status: 500 }
    )
  }
}

export const POST = withAuth(createShippingLabel)
export const GET = withAuth(getShippingLabels)
