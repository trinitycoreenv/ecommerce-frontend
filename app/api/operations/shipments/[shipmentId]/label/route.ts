import { NextResponse } from "next/server"
import { withAuth, AuthenticatedRequest } from "@/lib/middleware"
import { prisma } from "@/lib/prisma"
import { getShippo } from "@/lib/clients/shippo"
import { ShipmentStatus } from "@prisma/client"

export const GET = withAuth(getShipmentLabel)

async function getShipmentLabel(
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

    // Get label URL from Shippo using tracking number as transaction ID
    if (!shipment.trackingNumber) {
      return NextResponse.json(
        { success: false, error: "No tracking number available" },
        { status: 400 }
      )
    }

    try {
      // For now, return a mock response since we need to properly configure Shippo types
      // TODO: Implement actual Shippo label retrieval
      return NextResponse.json({ 
        success: true,
        labelUrl: `https://api.goshippo.com/shipping-labels/${shipment.trackingNumber}.pdf`
      })
    } catch (error) {
      console.error("Error retrieving Shippo label:", error)
      return NextResponse.json(
        { success: false, error: "Failed to retrieve shipping label" },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error("Error getting shipping label:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}