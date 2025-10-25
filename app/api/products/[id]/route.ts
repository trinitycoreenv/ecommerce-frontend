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
    if (user.role === "VENDOR") {
      // For vendors, get the vendor ID from the vendor table
      const vendor = await prisma.vendor.findUnique({
        where: { userId: user.id },
        select: { id: true }
      })

      if (!vendor || product.vendorId !== vendor.id) {
        return NextResponse.json(
          { success: false, error: "Access denied - you can only view your own products" },
          { status: 403 }
        )
      }
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
      // For vendors, get the vendor ID from the vendor table
      const vendor = await prisma.vendor.findUnique({
        where: { userId: user.id },
        select: { id: true }
      })

      if (!vendor) {
        return NextResponse.json(
          { success: false, error: "Vendor not found" },
          { status: 404 }
        )
      }

      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { vendorId: true }
      })

      if (!product || product.vendorId !== vendor.id) {
        return NextResponse.json(
          { success: false, error: "Access denied - you can only update your own products" },
          { status: 403 }
        )
      }
    }

    const body = await request.json()

    // Build update data object, only including fields that are provided
    const updateData: any = {}

    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.price !== undefined) updateData.price = parseFloat(body.price.toString())
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId
    if (body.sku !== undefined) updateData.sku = body.sku
    if (body.inventory !== undefined) updateData.inventory = parseInt(body.inventory.toString())
    if (body.status !== undefined) updateData.status = body.status
    if (body.images !== undefined) updateData.images = body.images
    if (body.metadata !== undefined) updateData.metadata = body.metadata
    if (body.weight !== undefined) updateData.weight = parseFloat(body.weight.toString())
    if (body.dimensions !== undefined) updateData.dimensions = body.dimensions
    if (body.tags !== undefined) updateData.tags = body.tags
    if (body.isDigital !== undefined) updateData.isDigital = body.isDigital
    if (body.requiresShipping !== undefined) updateData.requiresShipping = body.requiresShipping
    if (body.lowStockThreshold !== undefined) updateData.lowStockThreshold = parseInt(body.lowStockThreshold.toString())

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

    // Auto-validate product against policies after update
    try {
      const { PolicyService } = await import('@/lib/services/policy')
      const validationResult = await PolicyService.validateProduct(productId, true)

      if (!validationResult.isCompliant) {
        console.log(`Product ${productId} has ${validationResult.violations.length} policy violations after update`)
      }
    } catch (policyError) {
      console.error('Policy validation error:', policyError)
      // Don't fail product update if policy validation fails
    }

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
      // For vendors, get the vendor ID from the vendor table
      const vendor = await prisma.vendor.findUnique({
        where: { userId: user.id },
        select: { id: true }
      })

      if (!vendor) {
        return NextResponse.json(
          { success: false, error: "Vendor not found" },
          { status: 404 }
        )
      }

      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { vendorId: true }
      })

      if (!product || product.vendorId !== vendor.id) {
        return NextResponse.json(
          { success: false, error: "Access denied - you can only delete your own products" },
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