import { prisma } from '@/lib/prisma'
import { EmailService } from '@/lib/email'

export interface InventoryAlert {
  id: string
  productId: string
  productName: string
  currentStock: number
  threshold: number
  alertType: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'REORDER_POINT'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  vendorId: string
  vendorName: string
  lastAlertSent?: Date
  isActive: boolean
}

export interface StockMovement {
  id: string
  productId: string
  productName: string
  movementType: 'IN' | 'OUT' | 'ADJUSTMENT' | 'RETURN'
  quantity: number
  previousStock: number
  newStock: number
  reason: string
  referenceId?: string
  referenceType?: 'ORDER' | 'RETURN' | 'ADJUSTMENT' | 'PURCHASE'
  performedBy: string
  performedByName: string
  timestamp: Date
}

export interface InventoryReport {
  totalProducts: number
  totalValue: number
  lowStockProducts: number
  outOfStockProducts: number
  reorderNeeded: number
  topSellingProducts: Array<{
    productId: string
    productName: string
    quantitySold: number
    revenue: number
  }>
  slowMovingProducts: Array<{
    productId: string
    productName: string
    currentStock: number
    daysInStock: number
  }>
  categoryBreakdown: Array<{
    categoryId: string
    categoryName: string
    productCount: number
    totalValue: number
  }>
}

export class InventoryService {
  /**
   * Get current inventory status for a product
   */
  static async getProductInventory(productId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        vendor: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        category: true,
        variants: true
      }
    })

    if (!product) {
      throw new Error('Product not found')
    }

    const totalStock = product.inventory + product.variants.reduce((sum, variant) => sum + variant.inventory, 0)
    const lowStockThreshold = product.lowStockThreshold || 10
    const reorderPoint = Math.ceil(lowStockThreshold * 1.5)

    return {
      productId: product.id,
      productName: product.name,
      currentStock: totalStock,
      lowStockThreshold,
      reorderPoint,
      isLowStock: totalStock <= lowStockThreshold,
      isOutOfStock: totalStock === 0,
      needsReorder: totalStock <= reorderPoint,
      vendor: product.vendor,
      category: product.category,
      variants: product.variants
    }
  }

  /**
   * Update product inventory
   */
  static async updateInventory(
    productId: string,
    quantity: number,
    movementType: 'IN' | 'OUT' | 'ADJUSTMENT',
    reason: string,
    performedBy: string,
    referenceId?: string,
    referenceType?: 'ORDER' | 'RETURN' | 'ADJUSTMENT' | 'PURCHASE'
  ) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        vendor: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    if (!product) {
      throw new Error('Product not found')
    }

    const previousStock = product.inventory
    let newStock: number

    switch (movementType) {
      case 'IN':
        newStock = previousStock + quantity
        break
      case 'OUT':
        newStock = Math.max(0, previousStock - quantity)
        break
      case 'ADJUSTMENT':
        newStock = quantity
        break
      default:
        throw new Error('Invalid movement type')
    }

    // Update product inventory
    await prisma.product.update({
      where: { id: productId },
      data: { inventory: newStock }
    })

    // Log stock movement
    await this.logStockMovement({
      productId,
      productName: product.name,
      movementType,
      quantity: Math.abs(newStock - previousStock),
      previousStock,
      newStock,
      reason,
      referenceId,
      referenceType,
      performedBy,
      performedByName: product.vendor.user.name || 'System'
    })

    // Check for stock alerts
    await this.checkStockAlerts(productId)

    return {
      productId,
      previousStock,
      newStock,
      movementType,
      quantity: Math.abs(newStock - previousStock)
    }
  }

  /**
   * Get all active stock alerts
   */
  static async getStockAlerts(vendorId?: string): Promise<InventoryAlert[]> {
    const whereClause = vendorId ? { vendorId } : {}
    
    const products = await prisma.product.findMany({
      where: {
        ...whereClause,
        status: 'APPROVED'
      },
      include: {
        vendor: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        variants: true
      }
    })

    const alerts: InventoryAlert[] = []

    for (const product of products) {
      const totalStock = product.inventory + product.variants.reduce((sum, variant) => sum + variant.inventory, 0)
      const lowStockThreshold = product.lowStockThreshold || 10
      const reorderPoint = Math.ceil(lowStockThreshold * 1.5)

      if (totalStock === 0) {
        alerts.push({
          id: `${product.id}-out`,
          productId: product.id,
          productName: product.name,
          currentStock: totalStock,
          threshold: 0,
          alertType: 'OUT_OF_STOCK',
          severity: 'CRITICAL',
          vendorId: product.vendorId,
          vendorName: product.vendor.businessName,
          status: 'APPROVED'
        })
      } else if (totalStock <= lowStockThreshold) {
        alerts.push({
          id: `${product.id}-low`,
          productId: product.id,
          productName: product.name,
          currentStock: totalStock,
          threshold: lowStockThreshold,
          alertType: 'LOW_STOCK',
          severity: totalStock <= Math.ceil(lowStockThreshold / 2) ? 'HIGH' : 'MEDIUM',
          vendorId: product.vendorId,
          vendorName: product.vendor.businessName,
          status: 'APPROVED'
        })
      } else if (totalStock <= reorderPoint) {
        alerts.push({
          id: `${product.id}-reorder`,
          productId: product.id,
          productName: product.name,
          currentStock: totalStock,
          threshold: reorderPoint,
          alertType: 'REORDER_POINT',
          severity: 'LOW',
          vendorId: product.vendorId,
          vendorName: product.vendor.businessName,
          status: 'APPROVED'
        })
      }
    }

    return alerts
  }

  /**
   * Check and send stock alerts for a specific product
   */
  static async checkStockAlerts(productId: string) {
    const inventory = await this.getProductInventory(productId)
    
    if (inventory.isOutOfStock) {
      await this.sendStockAlert(productId, 'OUT_OF_STOCK', 'CRITICAL')
    } else if (inventory.isLowStock) {
      await this.sendStockAlert(productId, 'LOW_STOCK', 'HIGH')
    } else if (inventory.needsReorder) {
      await this.sendStockAlert(productId, 'REORDER_POINT', 'MEDIUM')
    }
  }

  /**
   * Send stock alert notifications
   */
  static async sendStockAlert(
    productId: string,
    alertType: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'REORDER_POINT',
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  ) {
    const inventory = await this.getProductInventory(productId)
    
    if (!inventory.vendor.user.email) {
      console.warn(`No email found for vendor ${inventory.vendor.id}`)
      return
    }

    const alertMessages = {
      OUT_OF_STOCK: {
        subject: `🚨 CRITICAL: ${inventory.productName} is OUT OF STOCK`,
        message: `Your product "${inventory.productName}" is completely out of stock. Immediate action required!`
      },
      LOW_STOCK: {
        subject: `⚠️ LOW STOCK ALERT: ${inventory.productName}`,
        message: `Your product "${inventory.productName}" is running low on stock (${inventory.currentStock} remaining). Consider restocking soon.`
      },
      REORDER_POINT: {
        subject: `📦 REORDER ALERT: ${inventory.productName}`,
        message: `Your product "${inventory.productName}" has reached the reorder point (${inventory.currentStock} remaining). Consider placing a reorder.`
      }
    }

    const alert = alertMessages[alertType]

    try {
      await EmailService.sendEmail({
        to: inventory.vendor.user.email,
        subject: alert.subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: ${severity === 'CRITICAL' ? '#dc2626' : severity === 'HIGH' ? '#ea580c' : '#d97706'};">
              ${alert.subject}
            </h2>
            <p>${alert.message}</p>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Product Details:</h3>
              <ul>
                <li><strong>Product:</strong> ${inventory.productName}</li>
                <li><strong>Current Stock:</strong> ${inventory.currentStock}</li>
                <li><strong>Low Stock Threshold:</strong> ${inventory.lowStockThreshold}</li>
                <li><strong>Reorder Point:</strong> ${inventory.reorderPoint}</li>
                <li><strong>Category:</strong> ${inventory.category?.name || 'N/A'}</li>
              </ul>
            </div>
            <p>Please log in to your vendor dashboard to manage your inventory.</p>
            <p>Best regards,<br>E-commerce Platform Team</p>
          </div>
        `
      })

      console.log(`Stock alert sent for product ${productId}: ${alertType}`)
    } catch (error) {
      console.error(`Failed to send stock alert for product ${productId}:`, error)
    }
  }

  /**
   * Log stock movement for audit trail
   */
  static async logStockMovement(movement: Omit<StockMovement, 'id' | 'timestamp'>) {
    // In a real implementation, you might want to store this in a separate table
    // For now, we'll log it to the audit log
    await prisma.auditLog.create({
      data: {
        userId: movement.performedBy,
        action: 'INVENTORY_UPDATE',
        resource: 'INVENTORY',
        resourceId: movement.productId,
        details: {
          productId: movement.productId,
          productName: movement.productName,
          movementType: movement.movementType,
          quantity: movement.quantity,
          previousStock: movement.previousStock,
          newStock: movement.newStock,
          reason: movement.reason,
          referenceId: movement.referenceId,
          referenceType: movement.referenceType
        },
        ipAddress: '127.0.0.1'
      }
    })
  }

  /**
   * Get inventory report
   */
  static async getInventoryReport(vendorId?: string): Promise<InventoryReport> {
    const whereClause = vendorId ? { vendorId } : {}
    
    const products = await prisma.product.findMany({
      where: {
        ...whereClause,
        status: 'APPROVED'
      },
      include: {
        category: true,
        variants: true,
        orderItems: {
          include: {
            order: true
          }
        }
      }
    })

    const totalProducts = products.length
    const totalValue = products.reduce((sum, product) => {
      const totalStock = product.inventory + product.variants.reduce((vSum, variant) => vSum + variant.inventory, 0)
      return sum + (totalStock * Number(product.price))
    }, 0)

    const lowStockProducts = products.filter(product => {
      const totalStock = product.inventory + product.variants.reduce((sum, variant) => sum + variant.inventory, 0)
      return totalStock <= (product.lowStockThreshold || 10)
    }).length

    const outOfStockProducts = products.filter(product => {
      const totalStock = product.inventory + product.variants.reduce((sum, variant) => sum + variant.inventory, 0)
      return totalStock === 0
    }).length

    const reorderNeeded = products.filter(product => {
      const totalStock = product.inventory + product.variants.reduce((sum, variant) => sum + variant.inventory, 0)
      const reorderPoint = Math.ceil((product.lowStockThreshold || 10) * 1.5)
      return totalStock <= reorderPoint
    }).length

    // Top selling products
    const topSellingProducts = products
      .map(product => {
        const confirmedOrderItems = product.orderItems.filter(item => item.order.status === 'CONFIRMED')
        const quantitySold = confirmedOrderItems.reduce((sum, item) => sum + item.quantity, 0)
        const revenue = confirmedOrderItems.reduce((sum, item) => sum + (item.quantity * Number(item.price)), 0)
        return {
          productId: product.id,
          productName: product.name,
          quantitySold,
          revenue
        }
      })
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 10)

    // Slow moving products
    const slowMovingProducts = products
      .map(product => {
        const totalStock = product.inventory + product.variants.reduce((sum, variant) => sum + variant.inventory, 0)
        const daysInStock = Math.floor((Date.now() - product.createdAt.getTime()) / (1000 * 60 * 60 * 24))
        return {
          productId: product.id,
          productName: product.name,
          currentStock: totalStock,
          daysInStock
        }
      })
      .filter(product => product.currentStock > 0)
      .sort((a, b) => b.daysInStock - a.daysInStock)
      .slice(0, 10)

    // Category breakdown
    const categoryMap = new Map()
    products.forEach(product => {
      const categoryId = product.categoryId
      const categoryName = product.category?.name || 'Uncategorized'
      const totalStock = product.inventory + product.variants.reduce((sum, variant) => sum + variant.inventory, 0)
      const value = totalStock * Number(product.price)

      if (categoryMap.has(categoryId)) {
        const existing = categoryMap.get(categoryId)
        existing.productCount += 1
        existing.totalValue += value
      } else {
        categoryMap.set(categoryId, {
          categoryId,
          categoryName,
          productCount: 1,
          totalValue: value
        })
      }
    })

    const categoryBreakdown = Array.from(categoryMap.values())

    return {
      totalProducts,
      totalValue,
      lowStockProducts,
      outOfStockProducts,
      reorderNeeded,
      topSellingProducts,
      slowMovingProducts,
      categoryBreakdown
    }
  }

  /**
   * Bulk update inventory for multiple products
   */
  static async bulkUpdateInventory(
    updates: Array<{
      productId: string
      quantity: number
      movementType: 'IN' | 'OUT' | 'ADJUSTMENT'
      reason: string
    }>,
    performedBy: string
  ) {
    const results = []

    for (const update of updates) {
      try {
        const result = await this.updateInventory(
          update.productId,
          update.quantity,
          update.movementType,
          update.reason,
          performedBy
        )
        results.push({ ...result, success: true })
      } catch (error) {
        results.push({
          productId: update.productId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return results
  }

  /**
   * Get stock movement history for a product
   */
  static async getStockMovementHistory(productId: string, limit: number = 50) {
    const movements = await prisma.auditLog.findMany({
      where: {
        resource: 'INVENTORY',
        resourceId: productId,
        action: 'INVENTORY_UPDATE'
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    return movements.map(movement => ({
      id: movement.id,
      productId: movement.resourceId,
      movementType: movement.details?.movementType,
      quantity: movement.details?.quantity,
      previousStock: movement.details?.previousStock,
      newStock: movement.details?.newStock,
      reason: movement.details?.reason,
      referenceId: movement.details?.referenceId,
      referenceType: movement.details?.referenceType,
      performedBy: movement.userId,
      performedByName: movement.user?.name || 'System',
      timestamp: movement.createdAt
    }))
  }
}
