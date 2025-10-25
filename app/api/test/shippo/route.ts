import { NextResponse } from "next/server"
import { getShippo } from "@/lib/clients/shippo"
import { ShipmentStatus } from "@prisma/client"

export async function GET() {
  try {
    console.log('🚀 Starting Shippo integration test...\n')
    const results: any = {}
    const shippo = getShippo()

    // 1. Test carrier accounts
    console.log('1️⃣ Testing carrier accounts...')
    const carrierAccounts = await shippo.carrierAccounts.list({}, {})
    results.carriers = {
      count: carrierAccounts.results.length,
      accounts: carrierAccounts.results.map((account: any) => ({
        carrier: account.carrier,
        active: account.active
      }))
    }
    console.log(`✓ Found ${results.carriers.count} carrier accounts`)

    // 2. Create test addresses
    console.log('2️⃣ Creating test addresses...')
    const fromAddress = {
      name: 'Warehouse',
      company: 'Test Company',
      street1: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      zip: '94111',
      country: 'US',
      phone: '+1 555 341 9393',
      email: 'test@example.com'
    }

    const toAddress = {
      name: 'Customer Name',
      street1: '456 Oak St',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      country: 'US',
      phone: '+1 555 123 4567',
      email: 'customer@example.com'
    }

    results.addresses = { from: fromAddress, to: toAddress }
    console.log('✓ Created test addresses')

    // 3. Create test parcel
    console.log('3️⃣ Creating test parcel...')
    const parcel = {
      length: '10',
      width: '8',
      height: '4',
      distanceUnit: 'in',
      weight: '2',
      massUnit: 'lb'
    }
    results.parcel = parcel
    console.log('✓ Created test parcel')

    // 4. Create shipment and get rates
    console.log('4️⃣ Creating shipment and getting rates...')
    const shipment = await shippo.shipments.create({
      address_from: fromAddress,
      address_to: toAddress,
      parcels: [parcel],
      async: false
    })

    results.shipment = {
      id: shipment.object_id,
      status: shipment.status,
      rates: shipment.rates.map((rate: any) => ({
        provider: rate.provider,
        service: rate.servicelevel.name,
        amount: rate.amount,
        days: rate.estimated_days
      }))
    }
    console.log(`✓ Created shipment with ${results.shipment.rates.length} rates`)

    // 5. Create a test transaction (purchase label)
    if (shipment.rates && shipment.rates.length > 0) {
      console.log('5️⃣ Creating test transaction (purchasing label)...')
      const rate = shipment.rates[0] // Use the first rate
      const transaction = await shippo.transactions.create({
        rate: rate.object_id,
        label_file_type: 'PDF',
        async: false
      })

      results.transaction = {
        id: transaction.object_id,
        status: transaction.status,
        trackingNumber: transaction.tracking_number,
        labelUrl: transaction.label_url
      }
      console.log('✓ Created transaction')

      // 6. Track the shipment
      if (transaction.tracking_number) {
        console.log('6️⃣ Testing tracking...')
        await new Promise(resolve => setTimeout(resolve, 2000)) // Wait for tracking
        const tracking = await shippo.trackingStatus.get({
          carrier: rate.provider,
          tracking_number: transaction.tracking_number
        })

        results.tracking = {
          status: tracking.tracking_status.status,
          details: tracking.tracking_status.status_details
        }
        console.log('✓ Retrieved tracking information')
      }
    }

    console.log('\n✨ All tests completed successfully!')
    return NextResponse.json({
      success: true,
      message: "Shippo integration test completed successfully",
      results
    })

  } catch (error: any) {
    console.error('\n❌ Test failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      detail: error.detail || error.stack
    }, { status: 500 })
  }
}