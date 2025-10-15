import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/test/add-commission - Add test commission data for testing payouts
 */
async function addTestCommission(request: AuthenticatedRequest) {
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

    // Create a test order first
    const testOrder = await prisma.order.create({
      data: {
        customerId: request.user.userId, // Using vendor as customer for test
        vendorId: vendor.id,
        orderNumber: `TEST-${Date.now()}`,
        status: 'DELIVERED',
        totalPrice: 1000.00,
        subtotal: 900.00,
        shippingCost: 50.00,
        tax: 50.00,
        paymentMethod: 'STRIPE',
        shippingAddress: {
          street: '123 Test Street',
          city: 'Test City',
          state: 'Test State',
          zipCode: '12345',
          country: 'Test Country'
        },
        billingAddress: {
          street: '123 Test Street',
          city: 'Test City',
          state: 'Test State',
          zipCode: '12345',
          country: 'Test Country'
        },
        metadata: {
          test: true,
          createdBy: 'test-api'
        }
      }
    })

    // Create test order items
    await prisma.orderItem.create({
      data: {
        orderId: testOrder.id,
        productId: 'test-product-id', // This would normally be a real product
        quantity: 1,
        price: 1000.00,
        metadata: {
          test: true
        }
      }
    })

    // Create test commission
    const commission = await prisma.commission.create({
      data: {
        vendorId: vendor.id,
        orderId: testOrder.id,
        amount: 100.00, // 10% commission on 1000
        rate: 0.10,
        status: 'CALCULATED',
        metadata: {
          test: true,
          createdBy: 'test-api'
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        order: testOrder,
        commission: commission,
        message: 'Test commission added successfully'
      }
    })

  } catch (error) {
    console.error('Error adding test commission:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to add test commission' },
      { status: 500 }
    )
  }
}

export const POST = withAuth(addTestCommission)
