import { NextRequest, NextResponse } from "next/server"
import { UserService } from "@/lib/services/user"
import { requireAuth } from "@/lib/middleware"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await requireAuth(request)
    const userId = params.id

    // Only admins can activate users
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Only administrators can activate users" },
        { status: 403 }
      )
    }

    const result = await UserService.activateUser(userId, user.id)

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.status || 500 }
    )
  }
}
