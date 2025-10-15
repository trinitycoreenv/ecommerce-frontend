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

    // Users can only change their own password
    if (user.id !== userId) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const passwordData = {
      currentPassword: body.currentPassword,
      newPassword: body.newPassword
    }

    const result = await UserService.updatePassword(userId, passwordData, user.id)

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
