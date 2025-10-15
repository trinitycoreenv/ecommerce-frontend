import { NextRequest, NextResponse } from "next/server"
import { UserService } from "@/lib/services/user"
import { requireAuth } from "@/lib/middleware"

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth(request)
    
    // Only admins can view all users
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Only administrators can view all users" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get("role") as any
    const isActive = searchParams.get("isActive")
    const search = searchParams.get("search")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")

    const filters: any = {}
    if (role) filters.role = role
    if (isActive !== null) filters.isActive = isActive === "true"
    if (search) filters.search = search
    if (page) filters.page = page
    if (limit) filters.limit = limit

    const result = await UserService.getUsers(filters)

    return NextResponse.json({
      success: true,
      data: result.users,
      pagination: result.pagination
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.status || 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth(request)
    
    // Only admins can create users
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Only administrators can create users" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const userData = {
      email: body.email,
      password: body.password,
      name: body.name || `${body.firstName || ''} ${body.lastName || ''}`.trim(),
      role: body.role,
      phone: body.phone,
      address: body.address
    }

    const newUser = await UserService.createUser(userData, user.id)

    return NextResponse.json({
      success: true,
      data: newUser
    }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.status || 500 }
    )
  }
}
