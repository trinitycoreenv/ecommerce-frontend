import { NextRequest, NextResponse } from "next/server"
import { withAuth, AuthenticatedRequest } from "@/lib/middleware"
import { prisma } from "@/lib/prisma"
import { ShipmentStatus } from "@prisma/client"

export const GET = withAuth(getShipments)

async function getShipments(req: AuthenticatedRequest) {
  try {
    // Operations manager access is enforced by middleware
    if (req.user?.role !== "OPERATIONS_MANAGER") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    // Get query params
    const searchParams = req.nextUrl.searchParams
    const status = searchParams.get("status") || "pending"
    const carrier = searchParams.get("carrier") || ""
    const dateRange = searchParams.get("dateRange") || "today"

    // Build date filter
    let dateFilter = {}
    const now = new Date()
    switch (dateRange) {
      case "today":
        dateFilter = {
          createdAt: {
            gte: new Date(now.setHours(0, 0, 0, 0))
          }
        }
        break
      case "week":
        dateFilter = {
          createdAt: {
            gte: new Date(now.setDate(now.getDate() - 7))
          }
        }
        break
      case "month":
        dateFilter = {
          createdAt: {
            gte: new Date(now.setMonth(now.getMonth() - 1))
          }
        }
        break
      // "all" case doesn't need a date filter
    }

    // Build carrier filter
    const carrierFilter = carrier ? { carrier } : {}

    // Build status filter - don't include status if "all"
    const statusFilter = status && status.toLowerCase() !== 'all'
      ? { status: status.toUpperCase() as ShipmentStatus }
      : {}

    // Get shipments
    const shipments = await prisma.shipment.findMany({
      where: {
        ...dateFilter,
        ...carrierFilter,
        ...statusFilter
      },
      include: {
        order: {
          include: {
            customer: { select: { name: true, email: true } },
            vendor: { select: { businessName: true } }
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    // Get stats
    const stats = await prisma.shipment.groupBy({
      by: ["status"],
      _count: {
        _all: true
      },
      where: {
        ...dateFilter,
        ...carrierFilter
      }
    })

    // Format stats
    const formattedStats = {
      total: 0,
      pending: 0,
      inTransit: 0,
      delivered: 0,
      exceptions: 0
    }

    stats.forEach((stat: { status: string; _count: { _all: number } }) => {
      formattedStats.total += stat._count._all
      switch (stat.status.toLowerCase()) {
        case "pending":
          formattedStats.pending = stat._count._all
          break
        case "in_transit":
          formattedStats.inTransit = stat._count._all
          break
        case "delivered":
          formattedStats.delivered = stat._count._all
          break
        case "exception":
          formattedStats.exceptions = stat._count._all
          break
      }
    })

    return NextResponse.json({
      success: true,
      data: shipments,
      stats: formattedStats
    })

  } catch (error) {
    console.error("Error fetching shipments:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}