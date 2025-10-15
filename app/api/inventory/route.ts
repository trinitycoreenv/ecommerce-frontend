import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { InventoryService } from '@/lib/services/inventory'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/inventory - Get inventory report
 */
async function getInventoryReport(request: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vendorId = searchParams.get('vendorId')
    
    // Only allow vendors to see their own inventory, or admins to see all
    let actualVendorId = vendorId
    if (request.user.role === 'VENDOR') {
      const vendor = await prisma.vendor.findUnique({
        where: { userId: request.user.userId }
      })
      if (!vendor) {
        return NextResponse.json(
          { success: false, error: 'Vendor profile not found' },
          { status: 404 }
        )
      }
      actualVendorId = vendor.id
    } else if (vendorId) {
      // Admin can specify vendorId, but we need to validate it exists
      const vendor = await prisma.vendor.findUnique({
        where: { id: vendorId }
      })
      if (!vendor) {
        return NextResponse.json(
          { success: false, error: 'Vendor not found' },
          { status: 404 }
        )
      }
    }

    const report = await InventoryService.getInventoryReport(actualVendorId)

    return NextResponse.json({
      success: true,
      data: report
    })
  } catch (error) {
    console.error('Error getting inventory report:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get inventory report' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/inventory/bulk-update - Bulk update inventory
 */
async function bulkUpdateInventory(request: AuthenticatedRequest) {
  try {
    const body = await request.json()
    const { updates } = body

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json(
        { success: false, error: 'Invalid updates array' },
        { status: 400 }
      )
    }

    // Validate that vendor can only update their own products
    if (request.user.role === 'VENDOR') {
      const vendor = await prisma.vendor.findUnique({
        where: { userId: request.user.userId }
      })
      if (!vendor) {
        return NextResponse.json(
          { success: false, error: 'Vendor profile not found' },
          { status: 404 }
        )
      }

      for (const update of updates) {
        const product = await prisma.product.findUnique({
          where: { id: update.productId },
          select: { vendorId: true }
        })

        if (!product || product.vendorId !== vendor.id) {
          return NextResponse.json(
            { success: false, error: 'Access denied to update this product' },
            { status: 403 }
          )
        }
      }
    }

    const results = await InventoryService.bulkUpdateInventory(
      updates,
      request.user.userId
    )

    return NextResponse.json({
      success: true,
      data: results
    })
  } catch (error) {
    console.error('Error bulk updating inventory:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to bulk update inventory' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(getInventoryReport)
export const POST = withAuth(bulkUpdateInventory)
