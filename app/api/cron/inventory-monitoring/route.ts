import { NextRequest, NextResponse } from 'next/server'
import { InventoryService } from '@/lib/services/inventory'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/cron/inventory-monitoring - Automated inventory monitoring
 * This endpoint should be called by a cron job to check for stock alerts
 */
export async function POST(request: NextRequest) {
  try {
    // Verify the request is from a legitimate cron service
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'your-cron-secret'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('Starting automated inventory monitoring...')

    // Get all active products
    const products = await prisma.product.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true,
        vendorId: true
      }
    })

    let alertsSent = 0
    let errors = 0

    // Check each product for stock alerts
    for (const product of products) {
      try {
        await InventoryService.checkStockAlerts(product.id)
        alertsSent++
      } catch (error) {
        console.error(`Error checking alerts for product ${product.id}:`, error)
        errors++
      }
    }

    // Generate inventory report
    const report = await InventoryService.getInventoryReport()
    
    // Log the monitoring results
    await prisma.auditLog.create({
      data: {
        userId: 'system',
        action: 'INVENTORY_MONITORING',
        resource: 'INVENTORY',
        details: {
          productsChecked: products.length,
          alertsSent,
          errors,
          report: {
            totalProducts: report.totalProducts,
            lowStockProducts: report.lowStockProducts,
            outOfStockProducts: report.outOfStockProducts,
            reorderNeeded: report.reorderNeeded
          }
        },
        ipAddress: '127.0.0.1'
      }
    })

    console.log(`Inventory monitoring completed: ${products.length} products checked, ${alertsSent} alerts sent, ${errors} errors`)

    return NextResponse.json({
      success: true,
      data: {
        productsChecked: products.length,
        alertsSent,
        errors,
        report: {
          totalProducts: report.totalProducts,
          lowStockProducts: report.lowStockProducts,
          outOfStockProducts: report.outOfStockProducts,
          reorderNeeded: report.reorderNeeded
        }
      },
      message: 'Inventory monitoring completed successfully'
    })
  } catch (error) {
    console.error('Error in inventory monitoring:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to complete inventory monitoring' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/cron/inventory-monitoring - Manual trigger for testing
 */
export async function GET(request: NextRequest) {
  try {
    // This is for manual testing - in production, you might want to restrict this
    console.log('Manual inventory monitoring triggered...')

    const products = await prisma.product.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true,
        vendorId: true
      }
    })

    let alertsSent = 0
    let errors = 0

    for (const product of products) {
      try {
        await InventoryService.checkStockAlerts(product.id)
        alertsSent++
      } catch (error) {
        console.error(`Error checking alerts for product ${product.id}:`, error)
        errors++
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        productsChecked: products.length,
        alertsSent,
        errors
      },
      message: 'Manual inventory monitoring completed'
    })
  } catch (error) {
    console.error('Error in manual inventory monitoring:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to complete manual inventory monitoring' },
      { status: 500 }
    )
  }
}
