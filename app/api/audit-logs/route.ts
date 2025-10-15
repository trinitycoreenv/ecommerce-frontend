import { NextRequest, NextResponse } from "next/server"
import { AuditService } from "@/lib/services/audit"
import { requireAuth } from "@/lib/middleware"

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth(request)
    
    // Only admins can view audit logs
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Only administrators can view audit logs" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const action = searchParams.get("action")
    const entityType = searchParams.get("entityType")
    const entityId = searchParams.get("entityId")
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")

    const filters: any = {}
    if (userId) filters.userId = userId
    if (action) filters.action = action
    if (entityType) filters.entityType = entityType
    if (entityId) filters.entityId = entityId
    if (dateFrom) filters.dateFrom = new Date(dateFrom)
    if (dateTo) filters.dateTo = new Date(dateTo)
    if (page) filters.page = page
    if (limit) filters.limit = limit

    const result = await AuditService.getAuditLogs(filters)

    return NextResponse.json({
      success: true,
      data: result.logs,
      pagination: result.pagination
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.status || 500 }
    )
  }
}
