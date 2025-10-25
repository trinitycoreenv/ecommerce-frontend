import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkShipments() {
  try {
    console.log('🔍 Checking shipment records in database...\n')

    // Get all shipments
    const shipments = await prisma.shipment.findMany({
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            customer: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`📦 Total shipments found: ${shipments.length}\n`)

    if (shipments.length === 0) {
      console.log('❌ No shipments found in database!')
      console.log('This means shipments are not being created when orders are placed.\n')
    } else {
      shipments.forEach((shipment, index) => {
        console.log(`\n--- Shipment ${index + 1} ---`)
        console.log(`ID: ${shipment.id}`)
        console.log(`Order: ${shipment.order.orderNumber} (${shipment.order.status})`)
        console.log(`Customer: ${shipment.order.customer.name}`)
        console.log(`Carrier: ${shipment.carrier}`)
        console.log(`Tracking Number: ${shipment.trackingNumber || 'NULL'}`)
        console.log(`Status: ${shipment.status}`)
        console.log(`Estimated Delivery: ${shipment.estimatedDelivery || 'NULL'}`)
        console.log(`Actual Delivery: ${shipment.actualDelivery || 'NULL'}`)
        console.log(`SLA Deadline: ${shipment.slaDeadline || 'NULL'}`)
        console.log(`Shipping Cost: ${shipment.shippingCost || 'NULL'}`)
        console.log(`Created: ${shipment.createdAt}`)
        console.log(`Updated: ${shipment.updatedAt}`)
      })
    }

    // Check orders without shipments
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
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    })

    if (ordersWithoutShipments.length > 0) {
      console.log(`\n\n⚠️  Found ${ordersWithoutShipments.length} orders WITHOUT shipments:`)
      ordersWithoutShipments.forEach((order, index) => {
        console.log(`${index + 1}. ${order.orderNumber} - Status: ${order.status} - Created: ${order.createdAt}`)
      })
    } else {
      console.log('\n\n✅ All orders have shipments!')
    }

  } catch (error) {
    console.error('❌ Error checking shipments:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkShipments()

