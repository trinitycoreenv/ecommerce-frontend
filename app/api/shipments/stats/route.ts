import { NextRequest, NextResponse } from "next/server"
import { ShipmentService } from "@/lib/services/shipment"
import { requireAuth } from "@/lib/middleware"

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth(request)
    
    // Only admins and operations managers can view shipment statistics
    if (!["ADMIN", "OPERATIONS_MANAGER"].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions to view shipment statistics" },
        { status: 403 }
      )
    }

    const stats = await ShipmentService.getShipmentStats()

    return NextResponse.json({
      success: true,
      data: stats
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.status || 500 }
    )
  }
}
