import { NextRequest, NextResponse } from "next/server"
import { AuditService } from "@/lib/services/audit"
import { requireAuth } from "@/lib/middleware"

export async function GET(
  request: NextRequest,
  { params }: { params: { entityType: string; entityId: string } }
) {
  try {
    const { user } = await requireAuth(request)
    const { entityType, entityId } = params

    // Only admins can view entity history
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Only administrators can view entity history" },
        { status: 403 }
      )
    }

    const history = await AuditService.getEntityHistory(entityType, entityId)

    return NextResponse.json({
      success: true,
      data: history
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.status || 500 }
    )
  }
}
