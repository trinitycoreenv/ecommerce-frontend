import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/middleware"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await requireAuth(request)
    const productId = params.id

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        vendor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                // lastName: true, // Field doesn't exist in schema
                email: true
              }
            }
          }
        },
        category: true
      }
    })

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      )
    }

    // Check access permissions
    if (user.role === "VENDOR" && product.vendorId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: product
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
    const productId = params.id

    // Only vendors can update their own products, admins can update any
    if (user.role !== "ADMIN") {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { vendorId: true }
      })

      if (!product || product.vendorId !== user.id) {
        return NextResponse.json(
          { success: false, error: "Access denied" },
          { status: 403 }
        )
      }
    }

    const body = await request.json()
    const updateData = {
      name: body.name,
      description: body.description,
      price: body.price,
      categoryId: body.categoryId,
      sku: body.sku,
      inventory: body.inventory,
      status: body.status,
      images: body.images,
      metadata: body.metadata
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: updateData,
      include: {
        vendor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                // lastName: true, // Field doesn't exist in schema
                email: true
              }
            }
          }
        },
        category: true
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedProduct
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
    const productId = params.id

    // Only vendors can delete their own products, admins can delete any
    if (user.role !== "ADMIN") {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { vendorId: true }
      })

      if (!product || product.vendorId !== user.id) {
        return NextResponse.json(
          { success: false, error: "Access denied" },
          { status: 403 }
        )
      }
    }

    await prisma.product.delete({
      where: { id: productId }
    })

    return NextResponse.json({
      success: true,
      data: { message: "Product deleted successfully" }
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.status || 500 }
    )
  }
}