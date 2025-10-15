import { NextRequest, NextResponse } from 'next/server'
import { withAdmin, withFinance, withOperations, AuthenticatedRequest } from '@/lib/middleware'
import { CommissionService } from '@/lib/services/commission'
import { PayoutService } from '@/lib/services/payout'
import { handleApiError } from '@/lib/middleware'
import { ReportType } from '@prisma/client'

async function getReports(request: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as ReportType | null
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const whereClause: any = {}
    if (type) {
      whereClause.type = type
    }

    const { prisma } = await import('@/lib/prisma')
    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where: whereClause,
        include: {
          generatedBy: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: { generatedAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit
      }),
      prisma.report.count({ where: whereClause })
    ])

    return NextResponse.json({
      success: true,
      data: reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    return handleApiError(error)
  }
}

async function generateReport(request: AuthenticatedRequest) {
  try {
    const body = await request.json()
    const { type, title, filters } = body

    if (!request.user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    if (!type || !Object.values(ReportType).includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid report type' },
        { status: 400 }
      )
    }

    const { prisma } = await import('@/lib/prisma')
    let reportData: any = {}

    // Generate report based on type
    switch (type) {
      case ReportType.SALES_SUMMARY:
        reportData = await generateSalesSummary(filters)
        break
      
      case ReportType.COMMISSION_REPORT:
        reportData = await CommissionService.getCommissionReport(
          new Date(filters.startDate),
          new Date(filters.endDate),
          filters.vendorId
        )
        break
      
      case ReportType.VENDOR_PERFORMANCE:
        reportData = await generateVendorPerformanceReport(filters)
        break
      
      case ReportType.LOGISTICS_REPORT:
        reportData = await generateLogisticsReport(filters)
        break
      
      case ReportType.FINANCIAL_SUMMARY:
        reportData = await generateFinancialSummary(filters)
        break
      
      default:
        return NextResponse.json(
          { success: false, error: 'Unsupported report type' },
          { status: 400 }
        )
    }

    // Save report to database
    const report = await prisma.report.create({
      data: {
        type,
        title: title || `${type} Report`,
        data: reportData,
        filters: filters || {},
        generatedBy: request.user.userId
      }
    })

    // Log report generation
    await prisma.auditLog.create({
      data: {
        userId: request.user.userId,
        action: 'GENERATE_REPORT',
        resource: 'REPORT',
        resourceId: report.id,
        details: { type, title }
      }
    })

    return NextResponse.json({
      success: true,
      data: report
    }, { status: 201 })

  } catch (error) {
    return handleApiError(error)
  }
}

// Helper functions for report generation
async function generateSalesSummary(filters: any) {
  const { prisma } = await import('@/lib/prisma')
  
  const whereClause: any = {}
  if (filters.startDate && filters.endDate) {
    whereClause.createdAt = {
      gte: new Date(filters.startDate),
      lte: new Date(filters.endDate)
    }
  }

  const [totalSales, totalOrders, totalVendors, orderStatusBreakdown] = await Promise.all([
    prisma.transaction.aggregate({
      where: { ...whereClause, status: 'COMPLETED' },
      _sum: { amount: true }
    }),
    prisma.order.count({ where: whereClause }),
    prisma.vendor.count({ where: { status: 'ACTIVE' } }),
    prisma.order.groupBy({
      by: ['status'],
      where: whereClause,
      _count: { id: true }
    })
  ])

  return {
    period: {
      start: filters.startDate,
      end: filters.endDate
    },
    totalSales: Number(totalSales._sum.amount || 0),
    totalOrders,
    totalVendors,
    orderStatusBreakdown: orderStatusBreakdown.map(item => ({
      status: item.status,
      count: item._count.id
    }))
  }
}

async function generateVendorPerformanceReport(filters: any) {
  const { prisma } = await import('@/lib/prisma')
  
  const whereClause: any = {}
  if (filters.startDate && filters.endDate) {
    whereClause.createdAt = {
      gte: new Date(filters.startDate),
      lte: new Date(filters.endDate)
    }
  }

  const vendors = await prisma.vendor.findMany({
    where: { status: 'ACTIVE' },
    include: {
      user: {
        select: {
          name: true,
          email: true
        }
      },
      transactions: {
        where: { ...whereClause, status: 'COMPLETED' },
        select: {
          amount: true,
          commission: true,
          netPayout: true
        }
      },
      orders: {
        where: whereClause,
        select: {
          totalPrice: true,
          status: true
        }
      }
    }
  })

  return vendors.map(vendor => {
    const totalSales = vendor.transactions.reduce(
      (sum, tx) => sum + Number(tx.amount),
      0
    )
    const totalCommissions = vendor.transactions.reduce(
      (sum, tx) => sum + Number(tx.commission),
      0
    )
    const totalOrders = vendor.orders.length
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0
    const fulfillmentRate = totalOrders > 0 
      ? vendor.orders.filter(o => o.status === 'DELIVERED').length / totalOrders
      : 0

    return {
      vendorId: vendor.id,
      vendorName: vendor.businessName,
      totalSales,
      totalOrders,
      averageOrderValue,
      commissionEarned: totalCommissions,
      fulfillmentRate
    }
  })
}

async function generateLogisticsReport(filters: any) {
  const { prisma } = await import('@/lib/prisma')
  
  const whereClause: any = {}
  if (filters.startDate && filters.endDate) {
    whereClause.createdAt = {
      gte: new Date(filters.startDate),
      lte: new Date(filters.endDate)
    }
  }

  const [shipmentStats, carrierBreakdown, slaPerformance] = await Promise.all([
    prisma.shipment.groupBy({
      by: ['status'],
      where: whereClause,
      _count: { id: true }
    }),
    prisma.shipment.groupBy({
      by: ['carrier'],
      where: whereClause,
      _count: { id: true }
    }),
    prisma.shipment.findMany({
      where: {
        ...whereClause,
        status: 'DELIVERED',
        actualDelivery: { not: null },
        slaDeadline: { not: null }
      },
      select: {
        actualDelivery: true,
        slaDeadline: true
      }
    })
  ])

  const onTimeDeliveries = slaPerformance.filter(s => 
    s.actualDelivery && s.slaDeadline && s.actualDelivery <= s.slaDeadline
  ).length

  const onTimeRate = slaPerformance.length > 0 
    ? onTimeDeliveries / slaPerformance.length 
    : 0

  return {
    shipmentStats: shipmentStats.map(item => ({
      status: item.status,
      count: item._count.id
    })),
    carrierBreakdown: carrierBreakdown.map(item => ({
      carrier: item.carrier,
      count: item._count.id
    })),
    slaPerformance: {
      totalDeliveries: slaPerformance.length,
      onTimeDeliveries,
      onTimeRate
    }
  }
}

async function generateFinancialSummary(filters: any) {
  const { prisma } = await import('@/lib/prisma')
  
  const whereClause: any = {}
  if (filters.startDate && filters.endDate) {
    whereClause.createdAt = {
      gte: new Date(filters.startDate),
      lte: new Date(filters.endDate)
    }
  }

  const [revenue, commissions, payouts, transactionStats] = await Promise.all([
    prisma.transaction.aggregate({
      where: { ...whereClause, status: 'COMPLETED' },
      _sum: { amount: true }
    }),
    prisma.transaction.aggregate({
      where: { ...whereClause, status: 'COMPLETED' },
      _sum: { commission: true }
    }),
    prisma.payout.aggregate({
      where: { ...whereClause, status: 'COMPLETED' },
      _sum: { amount: true }
    }),
    prisma.transaction.groupBy({
      by: ['status'],
      where: whereClause,
      _sum: { amount: true },
      _count: { id: true }
    })
  ])

  return {
    revenue: {
      total: Number(revenue._sum.amount || 0),
      commissions: Number(commissions._sum.commission || 0),
      netRevenue: Number(revenue._sum.amount || 0) - Number(commissions._sum.commission || 0)
    },
    payouts: {
      total: Number(payouts._sum.amount || 0)
    },
    transactionStats: transactionStats.map(item => ({
      status: item.status,
      amount: Number(item._sum.amount || 0),
      count: item._count.id
    }))
  }
}

export const GET = withAdmin(getReports)
export const POST = withFinance(generateReport)
