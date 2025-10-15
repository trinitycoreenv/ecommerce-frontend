import { NextRequest, NextResponse } from "next/server"
import { CategoryService } from "@/lib/services/category"
import { requireAuth } from "@/lib/middleware"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const categoryId = params.id
    const category = await CategoryService.getCategoryById(categoryId)

    if (!category) {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: category
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
    const categoryId = params.id

    // Only admins can update categories
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Only administrators can update categories" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const updateData = {
      name: body.name,
      description: body.description,
      parentId: body.parentId,
      imageUrl: body.imageUrl,
      isActive: body.isActive
    }

    const category = await CategoryService.updateCategory(categoryId, updateData, user.id)

    return NextResponse.json({
      success: true,
      data: category
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
    const categoryId = params.id

    // Only admins can delete categories
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Only administrators can delete categories" },
        { status: 403 }
      )
    }

    const result = await CategoryService.deleteCategory(categoryId, user.id)

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
