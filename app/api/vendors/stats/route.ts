import { NextRequest, NextResponse } from "next/server"
import { VendorService } from "@/lib/services/vendor"
import { requireAuth } from "@/lib/middleware"

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth(request)
    
    // Only admins can view vendor statistics
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Only administrators can view vendor statistics" },
        { status: 403 }
      )
    }

    const stats = await VendorService.getVendorStats()

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
