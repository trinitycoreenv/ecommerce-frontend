import { NextRequest, NextResponse } from "next/server"
import { AuditService } from "@/lib/services/audit"
import { requireAuth } from "@/lib/middleware"

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth(request)
    
    // Only admins can view audit statistics
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Only administrators can view audit statistics" },
        { status: 403 }
      )
    }

    const stats = await AuditService.getAuditStats()

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
