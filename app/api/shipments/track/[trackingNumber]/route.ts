import { NextRequest, NextResponse } from "next/server"
import { ShipmentService } from "@/lib/services/shipment"

export async function GET(
  request: NextRequest,
  { params }: { params: { trackingNumber: string } }
) {
  try {
    const trackingNumber = params.trackingNumber

    const trackingInfo = await ShipmentService.trackShipment(trackingNumber)

    return NextResponse.json({
      success: true,
      data: trackingInfo
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.status || 500 }
    )
  }
}
