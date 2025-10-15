import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { InventoryService } from '@/lib/services/inventory'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/inventory/alerts - Get stock alerts
 */
async function getStockAlerts(request: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vendorId = searchParams.get('vendorId')
    const severity = searchParams.get('severity')
    const alertType = searchParams.get('alertType')

    // Only allow vendors to see their own alerts, or admins to see all
    const targetVendorId = request.user.role === 'VENDOR' ? request.user.userId : vendorId || undefined

    let alerts = await InventoryService.getStockAlerts(targetVendorId)

    // Filter by severity if specified
    if (severity) {
      alerts = alerts.filter(alert => alert.severity === severity)
    }

    // Filter by alert type if specified
    if (alertType) {
      alerts = alerts.filter(alert => alert.alertType === alertType)
    }

    // Sort by severity (CRITICAL > HIGH > MEDIUM > LOW)
    const severityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }
    alerts.sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity])

    return NextResponse.json({
      success: true,
      data: {
        alerts,
        total: alerts.length,
        critical: alerts.filter(a => a.severity === 'CRITICAL').length,
        high: alerts.filter(a => a.severity === 'HIGH').length,
        medium: alerts.filter(a => a.severity === 'MEDIUM').length,
        low: alerts.filter(a => a.severity === 'LOW').length
      }
    })
  } catch (error) {
    console.error('Error getting stock alerts:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get stock alerts' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/inventory/alerts/check - Manually trigger stock alert check
 */
async function checkStockAlerts(request: AuthenticatedRequest) {
  try {
    const body = await request.json()
    const { productId, vendorId } = body

    // Only allow admins or vendors to trigger checks
    if (request.user.role === 'VENDOR' && vendorId) {
      const vendor = await prisma.vendor.findUnique({
        where: { userId: request.user.userId }
      })
      if (!vendor || vendorId !== vendor.id) {
        return NextResponse.json(
          { success: false, error: 'Access denied' },
          { status: 403 }
        )
      }
    }

    if (productId) {
      // Check specific product
      await InventoryService.checkStockAlerts(productId)
    } else {
      // Check all products for a vendor
      const targetVendorId = request.user.role === 'VENDOR' ? request.user.userId : vendorId
      const products = await prisma.product.findMany({
        where: {
          vendorId: targetVendorId,
          isActive: true
        },
        select: { id: true }
      })

      for (const product of products) {
        await InventoryService.checkStockAlerts(product.id)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Stock alert check completed'
    })
  } catch (error) {
    console.error('Error checking stock alerts:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to check stock alerts' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(getStockAlerts)
export const POST = withAuth(checkStockAlerts)
