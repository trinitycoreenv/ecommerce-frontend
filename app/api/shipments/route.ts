import { NextRequest, NextResponse } from "next/server"
import { ShipmentService } from "@/lib/services/shipment"
import { requireAuth } from "@/lib/middleware"

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth(request)
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") as any
    const carrier = searchParams.get("carrier")
    const orderId = searchParams.get("orderId")
    const vendorId = searchParams.get("vendorId")
    const customerId = searchParams.get("customerId")
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")

    const filters: any = {}
    if (status) filters.status = status
    if (carrier) filters.carrier = carrier
    if (orderId) filters.orderId = orderId
    if (vendorId) filters.vendorId = vendorId
    if (customerId) filters.customerId = customerId
    if (dateFrom) filters.dateFrom = new Date(dateFrom)
    if (dateTo) filters.dateTo = new Date(dateTo)
    if (page) filters.page = page
    if (limit) filters.limit = limit

    const result = await ShipmentService.getShipments(filters)

    return NextResponse.json({
      success: true,
      data: result.shipments,
      pagination: result.pagination
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.status || 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth(request)
    
    // Only admins and operations managers can create shipments
    if (!["ADMIN", "OPERATIONS_MANAGER"].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions to create shipments" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const shipmentData = {
      orderId: body.orderId,
      carrier: body.carrier,
      trackingNumber: body.trackingNumber,
      shippingMethod: body.shippingMethod,
      estimatedDelivery: body.estimatedDelivery ? new Date(body.estimatedDelivery) : undefined,
      shippingCost: body.shippingCost
    }

    const shipment = await ShipmentService.createShipment(shipmentData, user.id)

    return NextResponse.json({
      success: true,
      data: shipment
    }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.status || 500 }
    )
  }
}
