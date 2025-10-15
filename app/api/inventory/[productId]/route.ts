import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { InventoryService } from '@/lib/services/inventory'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/inventory/[productId] - Get product inventory details
 */
async function getProductInventory(
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params

    // Check if user has access to this product
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { vendorId: true }
    })

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    // Only allow vendors to see their own products, or admins to see all
    if (request.user.role === 'VENDOR') {
      const vendor = await prisma.vendor.findUnique({
        where: { userId: request.user.userId }
      })
      if (!vendor || product.vendorId !== vendor.id) {
        return NextResponse.json(
          { success: false, error: 'Access denied' },
          { status: 403 }
        )
      }
    }

    const inventory = await InventoryService.getProductInventory(productId)

    return NextResponse.json({
      success: true,
      data: inventory
    })
  } catch (error) {
    console.error('Error getting product inventory:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get product inventory' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/inventory/[productId] - Update product inventory
 */
async function updateProductInventory(
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params
    const body = await request.json()
    const { quantity, movementType, reason, referenceId, referenceType } = body

    if (!quantity || !movementType || !reason) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if user has access to this product
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { vendorId: true }
    })

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    // Only allow vendors to update their own products, or admins to update all
    if (request.user.role === 'VENDOR') {
      const vendor = await prisma.vendor.findUnique({
        where: { userId: request.user.userId }
      })
      if (!vendor || product.vendorId !== vendor.id) {
        return NextResponse.json(
          { success: false, error: 'Access denied' },
          { status: 403 }
        )
      }
    }

    const result = await InventoryService.updateInventory(
      productId,
      quantity,
      movementType,
      reason,
      request.user.userId,
      referenceId,
      referenceType
    )

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Error updating product inventory:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update product inventory' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(getProductInventory)
export const PUT = withAuth(updateProductInventory)
