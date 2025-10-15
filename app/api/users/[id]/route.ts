import { NextRequest, NextResponse } from "next/server"
import { UserService } from "@/lib/services/user"
import { requireAuth } from "@/lib/middleware"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await requireAuth(request)
    const userId = params.id

    // Users can only view their own profile, admins can view any profile
    if (user.role !== "ADMIN" && user.id !== userId) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      )
    }

    const userProfile = await UserService.getUserById(userId)

    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: userProfile
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.status || 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await requireAuth(request)
    const userId = params.id

    // Users can only update their own profile, admins can update any profile
    if (user.role !== "ADMIN" && user.id !== userId) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const updateData = {
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone,
      address: body.address,
      isActive: body.isActive
    }

    const updatedUser = await UserService.updateUser(userId, updateData, user.id)

    return NextResponse.json({
      success: true,
      data: updatedUser
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.status || 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await requireAuth(request)
    const userId = params.id

    // Only admins can deactivate users
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Only administrators can deactivate users" },
        { status: 403 }
      )
    }

    // Prevent self-deactivation
    if (user.id === userId) {
      return NextResponse.json(
        { success: false, error: "Cannot deactivate your own account" },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(request.url)
    const reason = searchParams.get("reason")

    const result = await UserService.deactivateUser(userId, user.id, reason || undefined)

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
