import { NextRequest, NextResponse } from "next/server"
import { CategoryService } from "@/lib/services/category"

export async function GET(request: NextRequest) {
  try {
    const tree = await CategoryService.getCategoryTree()

    return NextResponse.json({
      success: true,
      data: tree
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.status || 500 }
    )
  }
}
