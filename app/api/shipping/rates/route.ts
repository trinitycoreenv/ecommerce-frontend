import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { ShippingService } from '@/lib/services/shipping'

/**
 * POST /api/shipping/rates - Get shipping rates
 */
async function getShippingRates(request: AuthenticatedRequest) {
  try {
    const body = await request.json()
    const { fromAddress, toAddress, packageInfo, services } = body

    // Validate required fields
    if (!fromAddress || !toAddress || !packageInfo) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: fromAddress, toAddress, packageInfo' },
        { status: 400 }
      )
    }

    // Validate package dimensions
    if (!packageInfo.length || !packageInfo.width || !packageInfo.height || !packageInfo.weight) {
      return NextResponse.json(
        { success: false, error: 'Package dimensions must include length, width, height, and weight' },
        { status: 400 }
      )
    }

    // Get shipping rates
    const rates = await ShippingService.getShippingRates(
      fromAddress,
      toAddress,
      packageInfo,
      services
    )

    return NextResponse.json({
      success: true,
      data: {
        rates,
        totalRates: rates.length,
        cheapestRate: rates.length > 0 ? rates[0] : null,
        fastestRate: rates.length > 0 ? rates.reduce((fastest, rate) => 
          rate.estimatedDays < fastest.estimatedDays ? rate : fastest
        ) : null
      }
    })
  } catch (error) {
    console.error('Error getting shipping rates:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get shipping rates' },
      { status: 500 }
    )
  }
}

export const POST = withAuth(getShippingRates)
