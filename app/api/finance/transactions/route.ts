import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/middleware'

/**
 * GET /api/finance/transactions - Get all transactions for Finance Analyst management
 */
async function getFinanceTransactions(request: AuthenticatedRequest) {
  try {
    if (!request.user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Only finance analysts and admins can access this endpoint
    if (!['FINANCE_ANALYST', 'ADMIN'].includes(request.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Finance Analyst or Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const whereClause: any = {}

    // Apply filters
    if (status && status !== 'all') {
      whereClause.status = status
    }

    if (search) {
      whereClause.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { customer: { email: { contains: search, mode: 'insensitive' } } }
      ]
    }

    const [transactions, total] = await Promise.all([
      prisma.order.findMany({
        where: whereClause,
        include: {
          customer: {
            select: {
              name: true,
              email: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  vendor: {
                    select: {
                      businessName: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit
      }),
      prisma.order.count({ where: whereClause })
    ])

    // Calculate summary statistics
    const [totalRevenue, totalTransactions, pendingPayouts, platformCommission] = await Promise.all([
      prisma.order.aggregate({
        where: { status: 'DELIVERED' },
        _sum: { totalPrice: true }
      }),
      prisma.order.count(),
      prisma.payout.aggregate({
        where: { status: 'PENDING' },
        _sum: { amount: true }
      }),
      prisma.commission.aggregate({
        _sum: { amount: true }
      })
    ])

    // Transform transactions data for frontend
    const transformedTransactions = transactions.map(order => {
      // Safely extract vendor name
      let vendorName = 'Unknown Vendor'
      if (order.items && order.items.length > 0) {
        const firstItem = order.items[0]
        if (firstItem?.product?.vendor?.businessName) {
          vendorName = firstItem.product.vendor.businessName
        }
      }
      
      // Safely extract customer name
      let customerName = 'Unknown Customer'
      if (order.customer?.name) {
        customerName = order.customer.name
      }
      
      return {
        id: order.orderNumber || order.id,
        date: order.createdAt.toISOString().split('T')[0],
        vendor: vendorName,
        customer: customerName,
        amount: Number(order.totalPrice),
        commission: Number(order.totalPrice) * 0.1, // 10% commission rate
        status: order.status.toLowerCase()
      }
    })

    return NextResponse.json({
      success: true,
      data: transformedTransactions,
      stats: {
        totalTransactions: totalTransactions,
        totalVolume: Number(totalRevenue._sum.totalPrice || 0),
        pendingPayouts: Number(pendingPayouts._sum.amount || 0),
        platformCommission: Number(platformCommission._sum.amount || 0)
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PUT /api/finance/transactions - Update transaction status (Finance Analyst)
 */
async function updateTransactionStatus(request: AuthenticatedRequest) {
  try {
    if (!request.user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Only finance analysts and admins can update transaction status
    if (!['FINANCE_ANALYST', 'ADMIN'].includes(request.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Finance Analyst or Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { transactionId, status, notes } = body

    // Validate required fields
    if (!transactionId || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: transactionId, status' },
        { status: 400 }
      )
    }

    // Validate status
    if (!['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Check if transaction exists
    const existingTransaction = await prisma.order.findUnique({
      where: { id: transactionId },
      include: {
        customer: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    if (!existingTransaction) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // Update transaction status
    const updatedTransaction = await prisma.order.update({
      where: { id: transactionId },
      data: {
        status,
        updatedAt: new Date()
      },
      include: {
        customer: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    // Log the action for audit trail
    await prisma.auditLog.create({
      data: {
        userId: request.user.userId,
        action: 'TRANSACTION_STATUS_UPDATED',
        entityType: 'ORDER',
        entityId: transactionId,
        details: {
          oldStatus: existingTransaction.status,
          newStatus: status,
          orderNumber: existingTransaction.orderNumber,
          totalPrice: Number(existingTransaction.totalPrice),
          customerName: existingTransaction.customer?.name,
          customerEmail: existingTransaction.customer?.email,
          notes: notes || null,
          updatedBy: request.user.email
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedTransaction,
      message: 'Transaction status updated successfully'
    })

  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/finance/transactions - Process refund (Finance Analyst)
 */
async function processRefund(request: AuthenticatedRequest) {
  try {
    if (!request.user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Only finance analysts and admins can process refunds
    if (!['FINANCE_ANALYST', 'ADMIN'].includes(request.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Finance Analyst or Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { transactionId, refundAmount, reason } = body

    // Validate required fields
    if (!transactionId || !refundAmount || !reason) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: transactionId, refundAmount, reason' },
        { status: 400 }
      )
    }

    // Validate refund amount
    if (refundAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Refund amount must be greater than 0' },
        { status: 400 }
      )
    }

    // Check if transaction exists
    const existingTransaction = await prisma.order.findUnique({
      where: { id: transactionId },
      include: {
        customer: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    if (!existingTransaction) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // Validate refund amount doesn't exceed order total
    if (refundAmount > Number(existingTransaction.totalPrice)) {
      return NextResponse.json(
        { success: false, error: 'Refund amount cannot exceed order total' },
        { status: 400 }
      )
    }

    // Update transaction status to refunded
    const updatedTransaction = await prisma.order.update({
      where: { id: transactionId },
      data: {
        status: 'REFUNDED',
        updatedAt: new Date()
      },
      include: {
        customer: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    // Log the action for audit trail
    await prisma.auditLog.create({
      data: {
        userId: request.user.userId,
        action: 'REFUND_PROCESSED',
        entityType: 'ORDER',
        entityId: transactionId,
        details: {
          orderNumber: existingTransaction.orderNumber,
          originalAmount: Number(existingTransaction.totalPrice),
          refundAmount: parseFloat(refundAmount),
          reason: reason,
          customerName: existingTransaction.customer?.name,
          customerEmail: existingTransaction.customer?.email,
          processedBy: request.user.email
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedTransaction,
      message: 'Refund processed successfully'
    })

  } catch (error) {
    return handleApiError(error)
  }
}

export const GET = withAuth(getFinanceTransactions)
export const PUT = withAuth(updateTransactionStatus)
export const POST = withAuth(processRefund)
