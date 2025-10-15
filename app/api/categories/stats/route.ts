import { NextRequest, NextResponse } from "next/server"
import { CategoryService } from "@/lib/services/category"
import { requireAuth } from "@/lib/middleware"

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth(request)
    
    // Only admins can view category stats
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Only administrators can view category statistics" },
        { status: 403 }
      )
    }

    const stats = await CategoryService.getCategoryStats()

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
