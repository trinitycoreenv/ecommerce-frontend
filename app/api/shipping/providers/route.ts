import { NextRequest, NextResponse } from 'next/server'
import { ShippingService } from '@/lib/services/shipping'

/**
 * GET /api/shipping/providers - Get available shipping providers
 */
export async function GET(request: NextRequest) {
  try {
    const providers = ShippingService.getProviders()

    return NextResponse.json({
      success: true,
      data: providers
    })
  } catch (error) {
    console.error('Error getting shipping providers:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get shipping providers' },
      { status: 500 }
    )
  }
}
