import { NextRequest, NextResponse } from "next/server"
import { AuditService } from "@/lib/services/audit"
import { requireAuth } from "@/lib/middleware"

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { user } = await requireAuth(request)
    const userId = params.userId

    // Users can only view their own activity, admins can view any user's activity
    if (user.role !== "ADMIN" && user.id !== userId) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get("days") || "30")

    const activity = await AuditService.getUserActivity(userId, days)

    return NextResponse.json({
      success: true,
      data: activity
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.status || 500 }
    )
  }
}
