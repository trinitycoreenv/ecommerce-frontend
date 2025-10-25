import { NextResponse } from "next/server"
import { withAuth, AuthenticatedRequest } from "@/lib/middleware"
import { prisma } from "@/lib/prisma"
import { getShippo } from "@/lib/clients/shippo"
import { ShipmentStatus } from "@prisma/client"

export const POST = withAuth(cancelShipment)

async function cancelShipment(
  req: AuthenticatedRequest,
  context?: { params: any }
): Promise<NextResponse> {
  try {
    // Operations manager access is enforced by middleware
    if (req.user?.role !== "OPERATIONS_MANAGER") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const shipmentId = context?.params?.shipmentId
    if (!shipmentId) {
      return NextResponse.json(
        { success: false, error: "Shipment ID is required" },
        { status: 400 }
      )
    }

    // Get shipment from database
    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId }
    })

    if (!shipment) {
      return NextResponse.json(
        { success: false, error: "Shipment not found" },
        { status: 404 }
      )
    }

    // Initialize Shippo client
    const shippo = getShippo()

    // Cancel shipment in Shippo if we have a transaction ID
    if (shipment.trackingNumber) {
      await shippo.refunds.create({
        "transaction": shipment.trackingNumber
      })
    }

    // Update shipment status in database
    await prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        status: ShipmentStatus.RETURNED,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Error cancelling shipment:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}