import { NextRequest, NextResponse } from "next/server"
import { ShipmentService } from "@/lib/services/shipment"
import { requireAuth } from "@/lib/middleware"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await requireAuth(request)
    const shipmentId = params.id

    const shipment = await ShipmentService.getShipmentById(shipmentId)

    if (!shipment) {
      return NextResponse.json(
        { success: false, error: "Shipment not found" },
        { status: 404 }
      )
    }

    // Check access permissions
    if (user.role === "CUSTOMER" && shipment.order.customerId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      )
    }

    if (user.role === "VENDOR") {
      const hasVendorProducts = shipment.order.orderItems?.some((item: any) => item.product.vendorId === user.id) || false
      if (!hasVendorProducts) {
        return NextResponse.json(
          { success: false, error: "Access denied" },
          { status: 403 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      data: shipment
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.status || 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await requireAuth(request)
    const shipmentId = params.id

    // Only admins and operations managers can update shipments
    if (!["ADMIN", "OPERATIONS_MANAGER"].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions to update shipments" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const updateData = {
      status: body.status,
      trackingNumber: body.trackingNumber,
      carrier: body.carrier,
      estimatedDelivery: body.estimatedDelivery ? new Date(body.estimatedDelivery) : undefined,
      actualDelivery: body.actualDelivery ? new Date(body.actualDelivery) : undefined,
      notes: body.notes
    }

    const shipment = await ShipmentService.updateShipment(shipmentId, updateData, user.id)

    return NextResponse.json({
      success: true,
      data: shipment
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.status || 500 }
    )
  }
}
