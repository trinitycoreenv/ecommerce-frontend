import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/middleware'
import { OrderStatus } from '@prisma/client'

interface UpdateOrderStatusRequest {
  status: OrderStatus
  notes?: string
  trackingNumber?: string
  estimatedDelivery?: string
}

async function updateOrderStatus(
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body: UpdateOrderStatusRequest = await request.json()
    const { status, notes, trackingNumber, estimatedDelivery } = body
    const orderId = params.id

    if (!request.user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Get the order with vendor information
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        vendor: {
          include: {
            user: {
              select: {
                email: true,
                name: true
              }
            }
          }
        },
        customer: {
          select: {
            email: true,
            name: true
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

    // Check permissions
    const isVendor = request.user.role === 'VENDOR' && order.vendor.userId === request.user.userId
    const isAdmin = request.user.role === 'ADMIN'
    const isCustomer = request.user.role === 'CUSTOMER' && order.customerId === request.user.userId

    if (!isVendor && !isAdmin && !isCustomer) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Validate status transitions
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['PROCESSING', 'CANCELLED'],
      PROCESSING: ['SHIPPED', 'CANCELLED'],
      SHIPPED: ['DELIVERED', 'RETURNED'],
      DELIVERED: ['COMPLETED', 'RETURNED'],
      CANCELLED: [],
      RETURNED: ['REFUNDED'],
      REFUNDED: [],
      COMPLETED: []
    }

    if (!validTransitions[order.status].includes(status)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot change status from ${order.status} to ${status}` 
        },
        { status: 400 }
      )
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        metadata: {
          ...(order.metadata as any || {}),
          statusNotes: notes,
          trackingNumber,
          estimatedDelivery,
          statusUpdatedBy: request.user.userId,
          statusUpdatedAt: new Date().toISOString()
        }
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
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
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: true
              }
            },
            variant: {
              select: {
                id: true,
                name: true,
                attributes: true
              }
            }
          }
        }
      }
    })

    // Log the status change
    await prisma.auditLog.create({
      data: {
        userId: request.user.userId,
        action: 'UPDATE_ORDER_STATUS',
        resource: 'ORDER',
        resourceId: orderId,
        details: {
          orderNumber: order.orderNumber,
          previousStatus: order.status,
          newStatus: status,
          notes: notes,
          trackingNumber: trackingNumber
        }
      }
    })

    // Send notification email
    try {
      const { EmailService } = await import('@/lib/email')
      
      let subject = ''
      let statusMessage = ''
      
      switch (status) {
        case 'CONFIRMED':
          subject = `Order Confirmed: ${order.orderNumber}`
          statusMessage = 'Your order has been confirmed and is being prepared.'
          break
        case 'PROCESSING':
          subject = `Order Processing: ${order.orderNumber}`
          statusMessage = 'Your order is being processed and will be shipped soon.'
          break
        case 'SHIPPED':
          subject = `Order Shipped: ${order.orderNumber}`
          statusMessage = `Your order has been shipped! ${trackingNumber ? `Tracking number: ${trackingNumber}` : ''}`
          break
        case 'DELIVERED':
          subject = `Order Delivered: ${order.orderNumber}`
          statusMessage = 'Your order has been delivered. Thank you for your purchase!'
          break
        case 'CANCELLED':
          subject = `Order Cancelled: ${order.orderNumber}`
          statusMessage = 'Your order has been cancelled.'
          break
        case 'RETURNED':
          subject = `Order Returned: ${order.orderNumber}`
          statusMessage = 'Your order return has been processed.'
          break
        case 'REFUNDED':
          subject = `Order Refunded: ${order.orderNumber}`
          statusMessage = 'Your order has been refunded.'
          break
        case 'COMPLETED':
          subject = `Order Completed: ${order.orderNumber}`
          statusMessage = 'Your order has been completed. Thank you for your business!'
          break
      }

      await EmailService.sendEmail({
        to: order.customer.email,
        subject: subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Order Status Update</h2>
            <p>Hello ${order.customer.name},</p>
            <p>${statusMessage}</p>
            
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3>Order Details:</h3>
              <p><strong>Order Number:</strong> ${order.orderNumber}</p>
              <p><strong>Status:</strong> ${status}</p>
              <p><strong>Total:</strong> $${order.totalPrice}</p>
              ${trackingNumber ? `<p><strong>Tracking Number:</strong> ${trackingNumber}</p>` : ''}
              ${estimatedDelivery ? `<p><strong>Estimated Delivery:</strong> ${estimatedDelivery}</p>` : ''}
            </div>
            
            ${notes ? `
              <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3>Notes:</h3>
                <p>${notes}</p>
              </div>
            ` : ''}
            
            <p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/shop/orders" 
                 style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                View Your Orders
              </a>
            </p>
            
            <p>Best regards,<br>The E-commerce Platform Team</p>
          </div>
        `,
        text: `
          Order Status Update
          
          Hello ${order.customer.name},
          
          ${statusMessage}
          
          Order Details:
          - Order Number: ${order.orderNumber}
          - Status: ${status}
          - Total: $${order.totalPrice}
          ${trackingNumber ? `- Tracking Number: ${trackingNumber}` : ''}
          ${estimatedDelivery ? `- Estimated Delivery: ${estimatedDelivery}` : ''}
          
          ${notes ? `Notes: ${notes}` : ''}
          
          View your orders: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/shop/orders
          
          Best regards,
          The E-commerce Platform Team
        `
      })
    } catch (emailError) {
      console.error('Failed to send status update email:', emailError)
      // Don't fail the status update if email fails
    }

    return NextResponse.json({
      success: true,
      data: updatedOrder,
      message: `Order status updated to ${status}`
    })

  } catch (error) {
    return handleApiError(error)
  }
}

export const PUT = withAuth(updateOrderStatus)
