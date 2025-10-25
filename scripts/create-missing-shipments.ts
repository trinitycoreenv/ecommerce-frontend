import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createMissingShipments() {
  try {
    console.log('🔍 Finding orders without shipments...\n')

    // Get all orders without shipments
    const ordersWithoutShipments = await prisma.order.findMany({
      where: {
        shipments: {
          none: {}
        }
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        shippingMethod: true,
        shippingCost: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`📦 Found ${ordersWithoutShipments.length} orders without shipments\n`)

    if (ordersWithoutShipments.length === 0) {
      console.log('✅ All orders already have shipments!')
      return
    }

    let created = 0
    let failed = 0

    for (const order of ordersWithoutShipments) {
      try {
        // Parse shipping method from JSON if needed
        const shippingMethod = typeof order.shippingMethod === 'string' 
          ? JSON.parse(order.shippingMethod) 
          : order.shippingMethod

        const estimatedDays = shippingMethod?.estimatedDays || 7

        // Calculate estimated delivery
        const estimatedDeliveryDate = new Date(order.createdAt)
        estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + estimatedDays)
        
        // Calculate SLA deadline (2 days after estimated delivery)
        const slaDeadline = new Date(estimatedDeliveryDate)
        slaDeadline.setDate(slaDeadline.getDate() + 2)

        // Determine carrier based on shipping method type
        let carrier = 'UPS' // default
        if (shippingMethod?.type === 'express') {
          carrier = 'FedEx'
        } else if (shippingMethod?.type === 'economy') {
          carrier = 'USPS'
        }

        // Determine shipment status based on order status
        let shipmentStatus = 'PENDING'
        if (order.status === 'SHIPPED') {
          shipmentStatus = 'IN_TRANSIT'
        } else if (order.status === 'DELIVERED') {
          shipmentStatus = 'DELIVERED'
        } else if (order.status === 'CANCELLED') {
          shipmentStatus = 'CANCELLED'
        }

        // Create shipment
        await prisma.shipment.create({
          data: {
            orderId: order.id,
            carrier: carrier,
            trackingNumber: `TRK-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            status: shipmentStatus,
            estimatedDelivery: estimatedDeliveryDate,
            slaDeadline: slaDeadline,
            shippingCost: order.shippingCost || 0,
            actualDelivery: order.status === 'DELIVERED' ? new Date() : null,
            notes: `Shipment created retroactively for order ${order.orderNumber}`
          }
        })

        created++
        console.log(`✅ Created shipment for order ${order.orderNumber} (${order.status})`)

      } catch (error: any) {
        failed++
        console.error(`❌ Failed to create shipment for order ${order.orderNumber}:`, error.message)
      }
    }

    console.log(`\n📊 Summary:`)
    console.log(`   ✅ Successfully created: ${created} shipments`)
    console.log(`   ❌ Failed: ${failed} shipments`)
    console.log(`\n🎉 Done!`)

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createMissingShipments()

