import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { InventoryService } from '@/lib/services/inventory'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/inventory/[productId]/movements - Get stock movement history
 */
async function getStockMovements(
  request: AuthenticatedRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const { productId } = params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

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
    if (request.user.role === 'VENDOR' && product.vendorId !== request.user.userId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    const movements = await InventoryService.getStockMovementHistory(productId, limit)

    return NextResponse.json({
      success: true,
      data: movements
    })
  } catch (error) {
    console.error('Error getting stock movements:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get stock movements' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(getStockMovements)
