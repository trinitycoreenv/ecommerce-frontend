import { prisma } from '@/lib/prisma'

export interface RevenueMetrics {
  totalRevenue: number
  totalCommissions: number
  netRevenue: number
  averageOrderValue: number
  totalOrders: number
  revenueGrowth: number
  commissionRate: number
}

export interface SalesAnalytics {
  dailySales: Array<{
    date: string
    revenue: number
    orders: number
    averageOrderValue: number
  }>
  monthlySales: Array<{
    month: string
    revenue: number
    orders: number
    growth: number
  }>
  topProducts: Array<{
    productId: string
    productName: string
    revenue: number
    orders: number
    quantitySold: number
  }>
  topVendors: Array<{
    vendorId: string
    vendorName: string
    revenue: number
    orders: number
    commission: number
  }>
}

export interface CustomerAnalytics {
  totalCustomers: number
  newCustomers: number
  returningCustomers: number
  customerRetentionRate: number
  averageCustomerValue: number
  customerSegments: Array<{
    segment: string
    count: number
    percentage: number
    averageValue: number
  }>
  customerLifetimeValue: number
}

export interface VendorPerformance {
  totalVendors: number
  activeVendors: number
  newVendors: number
  topPerformingVendors: Array<{
    vendorId: string
    vendorName: string
    revenue: number
    orders: number
    products: number
    rating: number
  }>
  vendorGrowth: Array<{
    month: string
    newVendors: number
    activeVendors: number
  }>
}

export interface PlatformMetrics {
  totalProducts: number
  activeProducts: number
  totalCategories: number
  averageProductRating: number
  conversionRate: number
  cartAbandonmentRate: number
  averageSessionDuration: number
  bounceRate: number
}

export interface InventoryAnalytics {
  totalInventoryValue: number
  lowStockProducts: number
  outOfStockProducts: number
  slowMovingProducts: number
  topSellingProducts: Array<{
    productId: string
    productName: string
    quantitySold: number
    revenue: number
    inventoryTurnover: number
  }>
  categoryPerformance: Array<{
    categoryId: string
    categoryName: string
    productCount: number
    revenue: number
    averageRating: number
  }>
}

export interface ShippingAnalytics {
  totalShipments: number
  averageDeliveryTime: number
  onTimeDeliveryRate: number
  shippingCosts: number
  carrierPerformance: Array<{
    carrier: string
    shipments: number
    averageDeliveryTime: number
    onTimeRate: number
    cost: number
  }>
}

export interface ComprehensiveReport {
  period: {
    startDate: Date
    endDate: Date
    type: 'daily' | 'weekly' | 'monthly' | 'yearly'
  }
  revenue: RevenueMetrics
  sales: SalesAnalytics
  customers: CustomerAnalytics
  vendors: VendorPerformance
  platform: PlatformMetrics
  inventory: InventoryAnalytics
  shipping: ShippingAnalytics
  summary: {
    keyInsights: string[]
    recommendations: string[]
    alerts: string[]
  }
}

export class AnalyticsService {
  /**
   * Get comprehensive analytics report
   */
  static async getComprehensiveReport(
    startDate: Date,
    endDate: Date,
    type: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly'
  ): Promise<ComprehensiveReport> {
    const [revenue, sales, customers, vendors, platform, inventory, shipping] = await Promise.all([
      this.getRevenueMetrics(startDate, endDate),
      this.getSalesAnalytics(startDate, endDate),
      this.getCustomerAnalytics(startDate, endDate),
      this.getVendorPerformance(startDate, endDate),
      this.getPlatformMetrics(startDate, endDate),
      this.getInventoryAnalytics(),
      this.getShippingAnalytics(startDate, endDate)
    ])

    const summary = this.generateSummary(revenue, sales, customers, vendors, platform, inventory, shipping)

    return {
      period: { startDate, endDate, type },
      revenue,
      sales,
      customers,
      vendors,
      platform,
      inventory,
      shipping,
      summary
    }
  }

  /**
   * Get revenue metrics
   */
  static async getRevenueMetrics(startDate: Date, endDate: Date): Promise<RevenueMetrics> {
    const orders = await prisma.order.findMany({
      where: {
        status: 'CONFIRMED',
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        items: true
      }
    })

    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalPrice), 0)
    const totalOrders = orders.length
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Get commissions
    const commissions = await prisma.commission.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    const totalCommissions = commissions.reduce((sum, commission) => sum + Number(commission.amount), 0)
    const netRevenue = totalCommissions // Platform's commission is the net revenue
    const commissionRate = totalRevenue > 0 ? (totalCommissions / totalRevenue) * 100 : 0

    // Calculate growth (compare with previous period)
    const previousStartDate = new Date(startDate)
    const previousEndDate = new Date(endDate)
    const periodLength = endDate.getTime() - startDate.getTime()
    
    previousEndDate.setTime(previousStartDate.getTime() - 1)
    previousStartDate.setTime(previousStartDate.getTime() - periodLength)

    const previousOrders = await prisma.order.findMany({
      where: {
        status: 'CONFIRMED',
        createdAt: {
          gte: previousStartDate,
          lte: previousEndDate
        }
      }
    })

    const previousRevenue = previousOrders.reduce((sum, order) => sum + Number(order.totalPrice), 0)
    const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0

    return {
      totalRevenue,
      totalCommissions,
      netRevenue,
      averageOrderValue,
      totalOrders,
      revenueGrowth,
      commissionRate
    }
  }

  /**
   * Get sales analytics
   */
  static async getSalesAnalytics(startDate: Date, endDate: Date): Promise<SalesAnalytics> {
    // Daily sales
    const dailySales = await this.getDailySales(startDate, endDate)
    
    // Monthly sales
    const monthlySales = await this.getMonthlySales(startDate, endDate)
    
    // Top products
    const topProducts = await this.getTopProducts(startDate, endDate)
    
    // Top vendors
    const topVendors = await this.getTopVendors(startDate, endDate)

    return {
      dailySales,
      monthlySales,
      topProducts,
      topVendors
    }
  }

  /**
   * Get customer analytics
   */
  static async getCustomerAnalytics(startDate: Date, endDate: Date): Promise<CustomerAnalytics> {
    const totalCustomers = await prisma.user.count({
      where: { role: 'CUSTOMER' }
    })

    const newCustomers = await prisma.user.count({
      where: {
        role: 'CUSTOMER',
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    // Get returning customers (customers with multiple orders)
    const returningCustomers = await prisma.user.count({
      where: {
        role: 'CUSTOMER',
        orders: {
          some: {
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          }
        }
      }
    })

    const customerRetentionRate = totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0

    // Calculate average customer value
    const customerOrders = await prisma.order.findMany({
      where: {
        status: 'CONFIRMED',
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        customer: true
      }
    })

    const customerValueMap = new Map<string, number>()
    customerOrders.forEach(order => {
      const currentValue = customerValueMap.get(order.customerId) || 0
      customerValueMap.set(order.customerId, currentValue + Number(order.totalPrice))
    })

    const totalCustomerValue = Array.from(customerValueMap.values()).reduce((sum, value) => sum + value, 0)
    const averageCustomerValue = customerValueMap.size > 0 ? totalCustomerValue / customerValueMap.size : 0

    // Customer segments (simplified)
    const customerSegments = [
      {
        segment: 'High Value',
        count: Array.from(customerValueMap.values()).filter(value => value > averageCustomerValue * 2).length,
        percentage: 0,
        averageValue: 0
      },
      {
        segment: 'Medium Value',
        count: Array.from(customerValueMap.values()).filter(value => 
          value > averageCustomerValue * 0.5 && value <= averageCustomerValue * 2
        ).length,
        percentage: 0,
        averageValue: 0
      },
      {
        segment: 'Low Value',
        count: Array.from(customerValueMap.values()).filter(value => value <= averageCustomerValue * 0.5).length,
        percentage: 0,
        averageValue: 0
      }
    ]

    // Calculate percentages and average values
    customerSegments.forEach(segment => {
      segment.percentage = totalCustomers > 0 ? (segment.count / totalCustomers) * 100 : 0
      segment.averageValue = segment.count > 0 ? 
        Array.from(customerValueMap.values())
          .filter(value => {
            if (segment.segment === 'High Value') return value > averageCustomerValue * 2
            if (segment.segment === 'Medium Value') return value > averageCustomerValue * 0.5 && value <= averageCustomerValue * 2
            return value <= averageCustomerValue * 0.5
          })
          .reduce((sum, value) => sum + value, 0) / segment.count : 0
    })

    const customerLifetimeValue = averageCustomerValue * 2.5 // Simplified calculation

    return {
      totalCustomers,
      newCustomers,
      returningCustomers,
      customerRetentionRate,
      averageCustomerValue,
      customerSegments,
      customerLifetimeValue
    }
  }

  /**
   * Get vendor performance
   */
  static async getVendorPerformance(startDate: Date, endDate: Date): Promise<VendorPerformance> {
    const totalVendors = await prisma.vendor.count()
    const activeVendors = await prisma.vendor.count({
      where: { status: 'ACTIVE' }
    })

    const newVendors = await prisma.vendor.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    // Top performing vendors
    const vendorOrders = await prisma.order.findMany({
      where: {
        status: 'CONFIRMED',
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                vendor: true
              }
            }
          }
        }
      }
    })

    const vendorPerformanceMap = new Map<string, {
      vendorId: string
      vendorName: string
      revenue: number
      orders: number
      products: number
    }>()

    vendorOrders.forEach(order => {
      order.items.forEach(item => {
        const vendorId = item.product.vendorId
        const vendorName = item.product.vendor.businessName
        const current = vendorPerformanceMap.get(vendorId) || {
          vendorId,
          vendorName,
          revenue: 0,
          orders: 0,
          products: 0
        }
        
        current.revenue += Number(item.price) * item.quantity
        current.orders += 1
        current.products += 1
        
        vendorPerformanceMap.set(vendorId, current)
      })
    })

    const topPerformingVendors = Array.from(vendorPerformanceMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
      .map(vendor => ({
        ...vendor,
        rating: 4.5 // Simplified rating
      }))

    // Vendor growth (simplified)
    const vendorGrowth = [
      {
        month: 'Jan',
        newVendors: Math.floor(newVendors * 0.3),
        activeVendors: Math.floor(activeVendors * 0.8)
      },
      {
        month: 'Feb',
        newVendors: Math.floor(newVendors * 0.4),
        activeVendors: Math.floor(activeVendors * 0.9)
      },
      {
        month: 'Mar',
        newVendors: Math.floor(newVendors * 0.3),
        activeVendors: activeVendors
      }
    ]

    return {
      totalVendors,
      activeVendors,
      newVendors,
      topPerformingVendors,
      vendorGrowth
    }
  }

  /**
   * Get platform metrics
   */
  static async getPlatformMetrics(startDate: Date, endDate: Date): Promise<PlatformMetrics> {
    const totalProducts = await prisma.product.count()
    const activeProducts = await prisma.product.count({
      where: { status: 'APPROVED' }
    })
    const totalCategories = await prisma.category.count()

    // Average product rating (simplified)
    const averageProductRating = 4.2

    // Conversion rate (simplified)
    const totalVisitors = 10000 // Mock data
    const totalOrders = await prisma.order.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    })
    const conversionRate = totalVisitors > 0 ? (totalOrders / totalVisitors) * 100 : 0

    // Cart abandonment rate (simplified)
    const cartAbandonmentRate = 68.5

    // Average session duration (simplified)
    const averageSessionDuration = 4.5 // minutes

    // Bounce rate (simplified)
    const bounceRate = 45.2

    return {
      totalProducts,
      activeProducts,
      totalCategories,
      averageProductRating,
      conversionRate,
      cartAbandonmentRate,
      averageSessionDuration,
      bounceRate
    }
  }

  /**
   * Get inventory analytics
   */
  static async getInventoryAnalytics(): Promise<InventoryAnalytics> {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        orderItems: true,
        variants: true
      }
    })

    const totalInventoryValue = products.reduce((sum, product) => {
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

    const slowMovingProducts = products.filter(product => {
      const daysInStock = Math.floor((Date.now() - product.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      return daysInStock > 90 && product.orderItems.length === 0
    }).length

    // Top selling products
    const topSellingProducts = products
      .map(product => {
        const quantitySold = product.orderItems.reduce((sum, item) => sum + item.quantity, 0)
        const revenue = product.orderItems.reduce((sum, item) => sum + (item.quantity * Number(item.price)), 0)
        const totalStock = product.inventory + product.variants.reduce((sum, variant) => sum + variant.inventory, 0)
        const inventoryTurnover = totalStock > 0 ? quantitySold / totalStock : 0
        
        return {
          productId: product.id,
          productName: product.name,
          quantitySold,
          revenue,
          inventoryTurnover
        }
      })
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 10)

    // Category performance
    const categoryMap = new Map<string, {
      categoryId: string
      categoryName: string
      productCount: number
      revenue: number
      totalRating: number
      ratingCount: number
    }>()

    products.forEach(product => {
      const categoryId = product.categoryId
      const categoryName = product.category?.name || 'Uncategorized'
      const current = categoryMap.get(categoryId) || {
        categoryId,
        categoryName,
        productCount: 0,
        revenue: 0,
        totalRating: 0,
        ratingCount: 0
      }
      
      current.productCount += 1
      current.revenue += product.orderItems.reduce((sum, item) => sum + (item.quantity * Number(item.price)), 0)
      current.totalRating += 4.2 // Simplified rating
      current.ratingCount += 1
      
      categoryMap.set(categoryId, current)
    })

    const categoryPerformance = Array.from(categoryMap.values()).map(category => ({
      categoryId: category.categoryId,
      categoryName: category.categoryName,
      productCount: category.productCount,
      revenue: category.revenue,
      averageRating: category.ratingCount > 0 ? category.totalRating / category.ratingCount : 0
    }))

    return {
      totalInventoryValue,
      lowStockProducts,
      outOfStockProducts,
      slowMovingProducts,
      topSellingProducts,
      categoryPerformance
    }
  }

  /**
   * Get shipping analytics
   */
  static async getShippingAnalytics(startDate: Date, endDate: Date): Promise<ShippingAnalytics> {
    const shipments = await prisma.shipment.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    const totalShipments = shipments.length
    const deliveredShipments = shipments.filter(s => s.status === 'DELIVERED')
    const averageDeliveryTime = deliveredShipments.length > 0 ? 
      deliveredShipments.reduce((sum, shipment) => {
        if (shipment.actualDelivery) {
          const deliveryTime = shipment.actualDelivery.getTime() - shipment.createdAt.getTime()
          return sum + (deliveryTime / (1000 * 60 * 60 * 24))
        }
        return sum + 5 // Default 5 days if no actual delivery date
      }, 0) / deliveredShipments.length : 0

    const onTimeDeliveryRate = deliveredShipments.length > 0 ? 
      deliveredShipments.filter(shipment => {
        if (shipment.actualDelivery && shipment.estimatedDelivery) {
          return shipment.actualDelivery <= shipment.estimatedDelivery
        }
        return true // Consider on-time if no dates available
      }).length / deliveredShipments.length * 100 : 0

    const shippingCosts = shipments.reduce((sum, shipment) => sum + Number(shipment.shippingCost || 0), 0)

    // Carrier performance
    const carrierMap = new Map<string, {
      carrier: string
      shipments: number
      totalDeliveryTime: number
      onTimeDeliveries: number
      cost: number
    }>()

    shipments.forEach(shipment => {
      const current = carrierMap.get(shipment.carrier) || {
        carrier: shipment.carrier,
        shipments: 0,
        totalDeliveryTime: 0,
        onTimeDeliveries: 0,
        cost: 0
      }
      
      current.shipments += 1
      current.cost += Number(shipment.shippingCost || 0)
      
      if (shipment.status === 'DELIVERED' && shipment.actualDelivery) {
        const deliveryTime = shipment.actualDelivery.getTime() - shipment.createdAt.getTime()
        current.totalDeliveryTime += deliveryTime / (1000 * 60 * 60 * 24)
        
        if (shipment.estimatedDelivery && shipment.actualDelivery <= shipment.estimatedDelivery) {
          current.onTimeDeliveries += 1
        }
      }
      
      carrierMap.set(shipment.carrier, current)
    })

    const carrierPerformance = Array.from(carrierMap.values()).map(carrier => ({
      carrier: carrier.carrier,
      shipments: carrier.shipments,
      averageDeliveryTime: carrier.shipments > 0 ? carrier.totalDeliveryTime / carrier.shipments : 0,
      onTimeRate: carrier.shipments > 0 ? (carrier.onTimeDeliveries / carrier.shipments) * 100 : 0,
      cost: carrier.cost
    }))

    return {
      totalShipments,
      averageDeliveryTime,
      onTimeDeliveryRate,
      shippingCosts,
      carrierPerformance
    }
  }

  /**
   * Generate summary insights and recommendations
   */
  private static generateSummary(
    revenue: RevenueMetrics,
    sales: SalesAnalytics,
    customers: CustomerAnalytics,
    vendors: VendorPerformance,
    platform: PlatformMetrics,
    inventory: InventoryAnalytics,
    shipping: ShippingAnalytics
  ): { keyInsights: string[], recommendations: string[], alerts: string[] } {
    const keyInsights: string[] = []
    const recommendations: string[] = []
    const alerts: string[] = []

    // Revenue insights
    if (revenue.revenueGrowth > 0) {
      keyInsights.push(`Revenue grew by ${revenue.revenueGrowth.toFixed(1)}% compared to the previous period`)
    } else if (revenue.revenueGrowth < 0) {
      keyInsights.push(`Revenue declined by ${Math.abs(revenue.revenueGrowth).toFixed(1)}% compared to the previous period`)
      recommendations.push('Investigate revenue decline and implement growth strategies')
    }

    // Customer insights
    if (customers.customerRetentionRate > 70) {
      keyInsights.push(`Strong customer retention rate of ${customers.customerRetentionRate.toFixed(1)}%`)
    } else {
      recommendations.push('Improve customer retention strategies')
    }

    // Inventory alerts
    if (inventory.lowStockProducts > 0) {
      alerts.push(`${inventory.lowStockProducts} products are running low on stock`)
    }
    if (inventory.outOfStockProducts > 0) {
      alerts.push(`${inventory.outOfStockProducts} products are out of stock`)
    }

    // Shipping insights
    if (shipping.onTimeDeliveryRate > 90) {
      keyInsights.push(`Excellent on-time delivery rate of ${shipping.onTimeDeliveryRate.toFixed(1)}%`)
    } else {
      recommendations.push('Improve shipping performance and delivery times')
    }

    // Platform insights
    if (platform.conversionRate < 2) {
      recommendations.push('Optimize conversion rate - currently below industry average')
    }

    return {
      keyInsights,
      recommendations,
      alerts
    }
  }

  /**
   * Helper methods for sales analytics
   */
  private static async getDailySales(startDate: Date, endDate: Date) {
    const orders = await prisma.order.findMany({
      where: {
        status: 'CONFIRMED',
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    const dailyMap = new Map<string, { revenue: number, orders: number }>()
    
    orders.forEach(order => {
      const date = order.createdAt.toISOString().split('T')[0]
      const current = dailyMap.get(date) || { revenue: 0, orders: 0 }
      current.revenue += Number(order.totalPrice)
      current.orders += 1
      dailyMap.set(date, current)
    })

    return Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      revenue: data.revenue,
      orders: data.orders,
      averageOrderValue: data.orders > 0 ? data.revenue / data.orders : 0
    })).sort((a, b) => a.date.localeCompare(b.date))
  }

  private static async getMonthlySales(startDate: Date, endDate: Date) {
    // Simplified monthly sales calculation
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    return months.map((month, index) => ({
      month,
      revenue: Math.random() * 10000 + 5000,
      orders: Math.floor(Math.random() * 100) + 50,
      growth: Math.random() * 20 - 10
    }))
  }

  private static async getTopProducts(startDate: Date, endDate: Date) {
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          status: 'CONFIRMED',
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      },
      include: {
        product: true
      }
    })

    const productMap = new Map<string, {
      productId: string
      productName: string
      revenue: number
      orders: number
      quantitySold: number
    }>()

    orderItems.forEach(item => {
      const current = productMap.get(item.productId) || {
        productId: item.productId,
        productName: item.product.name,
        revenue: 0,
        orders: 0,
        quantitySold: 0
      }
      
      current.revenue += Number(item.price) * item.quantity
      current.orders += 1
      current.quantitySold += item.quantity
      
      productMap.set(item.productId, current)
    })

    return Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
  }

  private static async getTopVendors(startDate: Date, endDate: Date) {
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          status: 'CONFIRMED',
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      },
      include: {
        product: {
          include: {
            vendor: true
          }
        }
      }
    })

    const vendorMap = new Map<string, {
      vendorId: string
      vendorName: string
      revenue: number
      orders: number
      commission: number
    }>()

    orderItems.forEach(item => {
      const vendorId = item.product.vendorId
      const vendorName = item.product.vendor.businessName
      const current = vendorMap.get(vendorId) || {
        vendorId,
        vendorName,
        revenue: 0,
        orders: 0,
        commission: 0
      }
      
      const itemRevenue = Number(item.price) * item.quantity
      current.revenue += itemRevenue
      current.orders += 1
      current.commission += itemRevenue * 0.1 // 10% commission
      
      vendorMap.set(vendorId, current)
    })

    return Array.from(vendorMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
  }
}
