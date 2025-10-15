import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/vendor/analytics - Get vendor-specific analytics data
 */
async function getVendorAnalytics(request: AuthenticatedRequest) {
  try {
    if (!request.user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    if (request.user.role !== 'VENDOR') {
      return NextResponse.json(
        { success: false, error: 'Vendor access required' },
        { status: 403 }
      )
    }

    // Get vendor profile
    const vendor = await prisma.vendor.findUnique({
      where: { userId: request.user.userId }
    })

    if (!vendor) {
      return NextResponse.json(
        { success: false, error: 'Vendor profile not found' },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Default to last 30 days if no dates provided
    const defaultEndDate = new Date()
    const defaultStartDate = new Date()
    defaultStartDate.setDate(defaultStartDate.getDate() - 30)

    const start = startDate ? new Date(startDate) : defaultStartDate
    const end = endDate ? new Date(endDate) : defaultEndDate

    // Fetch all data concurrently
    const [
      // Revenue data from commissions
      commissions,
      // Orders data
      orders,
      // Products data
      products,
      // Order items for sales analysis
      orderItems
    ] = await Promise.all([
      // Get commissions for this vendor
      prisma.commission.findMany({
        where: {
          vendorId: vendor.id,
          createdAt: {
            gte: start,
            lte: end
          }
        },
        include: {
          order: {
            select: {
              orderNumber: true,
              totalPrice: true,
              createdAt: true,
              customer: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),

      // Get orders for this vendor
      prisma.order.findMany({
        where: {
          vendorId: vendor.id,
          createdAt: {
            gte: start,
            lte: end
          }
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  price: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),

      // Get products for this vendor
      prisma.product.findMany({
        where: {
          vendorId: vendor.id
        },
        include: {
          category: {
            select: {
              name: true
            }
          },
          variants: true
        }
      }),

      // Get order items for sales analysis
      prisma.orderItem.findMany({
        where: {
          order: {
            vendorId: vendor.id,
            createdAt: {
              gte: start,
              lte: end
            }
          }
        },
        include: {
          product: {
            select: {
              name: true,
              price: true
            }
          },
          order: {
            select: {
              createdAt: true,
              totalPrice: true
            }
          }
        }
      })
    ])

    // Calculate revenue metrics
    // Total revenue should be the sum of all order totals (gross revenue)
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalPrice), 0)
    
    // Total commissions paid to platform
    const totalCommissions = commissions.reduce((sum, commission) => sum + Number(commission.amount), 0)
    
    // Net revenue is total revenue minus platform commissions (vendor's actual earnings)
    const netRevenue = totalRevenue - totalCommissions
    
    const totalOrders = orders.length
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Calculate unique customers
    const uniqueCustomers = new Set(orders.map(order => order.customerId))
    const totalCustomers = uniqueCustomers.size

    // Calculate new customers (customers who made their first order in this period)
    const allCustomerOrders = await prisma.order.findMany({
      where: {
        vendorId: vendor.id,
        customerId: {
          in: Array.from(uniqueCustomers)
        }
      },
      select: {
        customerId: true,
        createdAt: true
      },
      orderBy: { createdAt: 'asc' }
    })

    const customerFirstOrders = new Map()
    allCustomerOrders.forEach(order => {
      if (!customerFirstOrders.has(order.customerId)) {
        customerFirstOrders.set(order.customerId, order.createdAt)
      }
    })

    const newCustomers = Array.from(customerFirstOrders.entries()).filter(
      ([_, firstOrderDate]) => firstOrderDate >= start
    ).length

    const returningCustomers = totalCustomers - newCustomers
    const averageCustomerValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0

    // Calculate product metrics
    const totalProducts = products.length
    const activeProducts = products.filter(p => p.status === 'APPROVED').length
    const lowStockProducts = products.filter(product => {
      const totalStock = product.inventory + product.variants.reduce((sum, variant) => sum + variant.inventory, 0)
      return totalStock <= (product.lowStockThreshold || 10)
    }).length
    const outOfStockProducts = products.filter(product => {
      const totalStock = product.inventory + product.variants.reduce((sum, variant) => sum + variant.inventory, 0)
      return totalStock === 0
    }).length

    // Calculate top selling products (from all orders to match total revenue)
    const productSales = new Map()
    
    orderItems.forEach(item => {
      const productId = item.productId
      const productName = item.product.name
      const quantity = item.quantity
      const revenue = quantity * Number(item.price)

      if (productSales.has(productId)) {
        const existing = productSales.get(productId)
        existing.quantitySold += quantity
        existing.revenue += revenue
        existing.orders += 1
      } else {
        productSales.set(productId, {
          productId,
          productName,
          quantitySold: quantity,
          revenue,
          orders: 1
        })
      }
    })

    const topSellingProducts = Array.from(productSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Calculate daily sales (from all orders to match total revenue)
    const dailySales = new Map()
    orderItems.forEach(item => {
      const date = item.order.createdAt.toISOString().split('T')[0]
      const revenue = item.quantity * Number(item.price)

      if (dailySales.has(date)) {
        const existing = dailySales.get(date)
        existing.revenue += revenue
        existing.orders += 1
        existing.averageOrderValue = existing.revenue / existing.orders
      } else {
        dailySales.set(date, {
          date,
          revenue,
          orders: 1,
          averageOrderValue: revenue
        })
      }
    })

    const dailySalesArray = Array.from(dailySales.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Calculate revenue growth (compare with previous period)
    const previousStart = new Date(start.getTime() - (end.getTime() - start.getTime()))
    const previousCommissions = await prisma.commission.findMany({
      where: {
        vendorId: vendor.id,
        createdAt: {
          gte: previousStart,
          lt: start
        }
      },
      include: {
        order: {
          select: {
            totalPrice: true
          }
        }
      }
    })

    const previousRevenue = previousCommissions.reduce((sum, commission) => {
      const orderTotal = commission.breakdown?.orderTotal || Number(commission.order?.totalPrice) || 0
      const commissionAmount = Number(commission.amount)
      const vendorNetPayout = orderTotal - commissionAmount
      return sum + vendorNetPayout
    }, 0)

    const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0

    return NextResponse.json({
      success: true,
      data: {
        revenue: {
          totalRevenue,
          totalCommissions,
          netRevenue,
          averageOrderValue,
          totalOrders,
          revenueGrowth
        },
        sales: {
          dailySales: dailySalesArray,
          topProducts: topSellingProducts
        },
        customers: {
          totalCustomers,
          newCustomers,
          returningCustomers,
          averageCustomerValue
        },
        products: {
          totalProducts,
          activeProducts,
          lowStockProducts,
          outOfStockProducts,
          topSellingProducts: topSellingProducts.slice(0, 5)
        },
        performance: {
          conversionRate: 0, // Would need more data to calculate
          averageRating: 0, // Would need review system
          totalReviews: 0, // Would need review system
          responseTime: 0 // Would need support system
        }
      }
    })

  } catch (error) {
    console.error('Error getting vendor analytics:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get vendor analytics' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(getVendorAnalytics)
