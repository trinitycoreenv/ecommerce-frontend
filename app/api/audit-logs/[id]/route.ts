import { NextRequest, NextResponse } from "next/server"
import { AuditService } from "@/lib/services/audit"
import { requireAuth } from "@/lib/middleware"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await requireAuth(request)
    const logId = params.id

    // Only admins can view audit logs
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Only administrators can view audit logs" },
        { status: 403 }
      )
    }

    const log = await AuditService.getAuditLogById(logId)

    if (!log) {
      return NextResponse.json(
        { success: false, error: "Audit log not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: log
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.status || 500 }
    )
  }
}
