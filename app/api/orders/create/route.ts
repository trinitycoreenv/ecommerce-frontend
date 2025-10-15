import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/middleware'
import { OrderStatus } from '@prisma/client'
// Using crypto.randomUUID() instead of uuid package

interface CreateOrderRequest {
  items: Array<{
    productId: string
    variantId?: string
    quantity: number
    price: number
  }>
  shippingAddress: {
    firstName: string
    lastName: string
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  billingAddress?: {
    firstName: string
    lastName: string
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  shippingMethod: {
    type: 'standard' | 'express' | 'economy'
    cost: number
    estimatedDays: number
  }
  paymentMethod: {
    type: 'card' | 'paypal' | 'stripe'
    token?: string
    last4?: string
    brand?: string
  }
  notes?: string
}

async function createOrder(request: AuthenticatedRequest) {
  try {
    const body: CreateOrderRequest = await request.json()
    const { items, shippingAddress, billingAddress, shippingMethod, paymentMethod, notes } = body

    if (!request.user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    if (request.user.role !== 'CUSTOMER') {
      return NextResponse.json(
        { success: false, error: 'Only customers can create orders' },
        { status: 403 }
      )
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order must contain at least one item' },
        { status: 400 }
      )
    }

    // Validate and get product details
    const productIds = items.map(item => item.productId)
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        status: 'APPROVED' // Only allow approved products
      },
      include: {
        vendor: true,
        variants: {
          where: {
            isActive: true
          }
        }
      }
    })

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { success: false, error: 'One or more products are not available' },
        { status: 400 }
      )
    }

    // Group items by vendor for separate orders
    const vendorGroups = new Map<string, typeof items>()
    
    for (const item of items) {
      const product = products.find(p => p.id === item.productId)
      if (!product) continue

      const variant = item.variantId 
        ? product.variants.find(v => v.id === item.variantId)
        : null

      // Check inventory
      const availableQuantity = variant ? variant.inventory : product.inventory
      if (availableQuantity < item.quantity) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Insufficient inventory for ${product.name}. Available: ${availableQuantity}, Requested: ${item.quantity}` 
          },
          { status: 400 }
        )
      }

      // Check price matches
      const expectedPrice = variant ? (variant.price || product.price) : product.price
      if (Math.abs(Number(expectedPrice) - Number(item.price)) > 0.01) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Price mismatch for ${product.name}. Expected: $${expectedPrice}, Received: $${item.price}` 
          },
          { status: 400 }
        )
      }

      // Group by vendor
      if (!vendorGroups.has(product.vendorId)) {
        vendorGroups.set(product.vendorId, [])
      }
      vendorGroups.get(product.vendorId)!.push(item)
    }

    // Create orders for each vendor
    const createdOrders = []
    
    for (const [vendorId, vendorItems] of vendorGroups) {
      const vendor = products.find(p => p.vendorId === vendorId)?.vendor
      if (!vendor) continue

      // Calculate totals
      const subtotal = vendorItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      const shippingCost = shippingMethod.cost
      const tax = subtotal * 0.08 // 8% tax
      const total = subtotal + shippingCost + tax

      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`

      // Create order in transaction
      const order = await prisma.$transaction(async (tx) => {
        // Create the order
        const newOrder = await tx.order.create({
          data: {
            customerId: request.user!.userId,
            vendorId: vendorId,
            orderNumber: orderNumber,
            status: OrderStatus.PENDING,
            totalPrice: total,
            shippingAddress: shippingAddress,
            billingAddress: billingAddress || shippingAddress,
            shippingMethod: shippingMethod,
            // paymentMethod: paymentMethod, // Field doesn't exist in schema
            notes: notes,
            subtotal: subtotal,
            shippingCost: shippingCost,
            tax: tax
          }
        })

        // Create order items
        const orderItems = await Promise.all(
          vendorItems.map(async (item) => {
            const product = products.find(p => p.id === item.productId)!
            const variant = item.variantId 
              ? product.variants.find(v => v.id === item.variantId)
              : null

            return tx.orderItem.create({
              data: {
                orderId: newOrder.id,
                productId: item.productId,
                variantId: item.variantId,
                quantity: item.quantity,
                price: item.price
              }
            })
          })
        )

        // Update inventory
        for (const item of vendorItems) {
          const product = products.find(p => p.id === item.productId)!
          const variant = item.variantId 
            ? product.variants.find(v => v.id === item.variantId)
            : null

          if (variant) {
            await tx.productVariant.update({
              where: { id: item.variantId! },
              data: { inventory: { decrement: item.quantity } }
            })
          } else {
            await tx.product.update({
              where: { id: item.productId },
              data: { inventory: { decrement: item.quantity } }
            })
          }
        }

        // Calculate commission based on vendor's subscription tier
        const { CommissionService } = await import('@/lib/services/commission')
        const commissionCalculation = await CommissionService.calculateCommission(
          newOrder.id,
          vendorId,
          total
        )
        const commission = commissionCalculation.commissionAmount
        const netPayout = commissionCalculation.netPayout

        // Create transaction record
        const transaction = await tx.transaction.create({
          data: {
            orderId: newOrder.id,
            customerId: request.user!.userId,
            vendorId: vendorId,
            amount: total,
            commission: commission,
            netPayout: netPayout,
            type: 'ORDER',
            status: 'PENDING',
            paymentMethod: paymentMethod.type
          }
        })

        return {
          order: newOrder,
          items: orderItems,
          transaction: transaction
        }
      })

      createdOrders.push({
        ...order.order,
        vendor: vendor,
        items: order.items,
        transaction: order.transaction
      })

      // Log order creation
      await prisma.auditLog.create({
        data: {
          userId: request.user.userId,
          action: 'CREATE_ORDER',
          resource: 'ORDER',
          resourceId: order.order.id,
          details: {
            orderNumber: orderNumber,
            vendorId: vendorId,
            totalAmount: total,
            itemCount: vendorItems.length
          }
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        orders: createdOrders,
        totalOrders: createdOrders.length,
        totalAmount: createdOrders.reduce((sum, order) => sum + Number(order.totalPrice), 0)
      },
      message: `Successfully created ${createdOrders.length} order(s)`
    }, { status: 201 })

  } catch (error) {
    return handleApiError(error)
  }
}

export const POST = withAuth(createOrder)
