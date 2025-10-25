import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { OrderStatus } from '@prisma/client'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireAuth(request)
    const { id: orderId } = await params

    // Get vendor ID from user
    const vendor = await prisma.vendor.findUnique({
      where: { userId: user.id },
      select: { id: true }
    })

    if (!vendor && user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Vendor not found' },
        { status: 404 }
      )
    }

    // Get the order to verify ownership
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              select: {
                vendorId: true
              }
            }
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

    // Verify that the vendor owns at least one product in this order
    if (user.role !== 'ADMIN') {
      const hasVendorProduct = order.items.some(
        item => item.product.vendorId === vendor!.id
      )

      if (!hasVendorProduct) {
        return NextResponse.json(
          { success: false, error: 'Access denied - you can only update orders containing your products' },
          { status: 403 }
        )
      }
    }

    // Get the new status from request body
    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Status is required' },
        { status: 400 }
      )
    }

    // Validate status
    const validStatuses: OrderStatus[] = [
      'PENDING',
      'CONFIRMED',
      'PROCESSING',
      'SHIPPED',
      'DELIVERED',
      'CANCELLED',
      'REFUNDED'
    ]

    if (!validStatuses.includes(status as OrderStatus)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Update the order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: status as OrderStatus,
        updatedAt: new Date()
      },
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
              include: {
                vendor: {
                  include: {
                    user: {
                      select: {
                        name: true,
                        email: true
                      }
                    }
                  }
                }
              }
            },
            variant: true
          }
        },
        transactions: {
          select: {
            id: true,
            type: true,
            amount: true,
            status: true,
            createdAt: true
          }
        }
      }
    })

    // If status is SHIPPED, update shipment status as well
    if (status === 'SHIPPED') {
      await prisma.shipment.updateMany({
        where: { orderId: orderId },
        data: {
          status: 'IN_TRANSIT',
          updatedAt: new Date()
        }
      })
    }

    // If status is DELIVERED, update shipment status
    if (status === 'DELIVERED') {
      await prisma.shipment.updateMany({
        where: { orderId: orderId },
        data: {
          status: 'DELIVERED',
          actualDelivery: new Date(),
          updatedAt: new Date()
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: updatedOrder,
      message: 'Order status updated successfully'
    })

  } catch (error: any) {
    console.error('Error updating order status:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update order status' },
      { status: error.status || 500 }
    )
  }
}

