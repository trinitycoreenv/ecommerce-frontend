import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/middleware'

/**
 * GET /api/finance/payouts - Get all payouts for Finance Analyst management
 */
async function getFinancePayouts(request: AuthenticatedRequest) {
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
    const vendorId = searchParams.get('vendorId')
    const search = searchParams.get('search')

    const whereClause: any = {}

    // Apply filters
    if (status && status !== 'all') {
      whereClause.status = status
    }

    if (vendorId && vendorId !== 'all') {
      whereClause.vendorId = vendorId
    }

    if (search) {
      whereClause.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { vendor: { businessName: { contains: search, mode: 'insensitive' } } }
      ]
    }

    const [payouts, total] = await Promise.all([
      prisma.payout.findMany({
        where: whereClause,
        include: {
          vendor: {
            select: {
              id: true,
              businessName: true,
              user: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          },
          commissions: {
            select: {
              id: true,
              amount: true,
              order: {
                select: {
                  orderNumber: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit
      }),
      prisma.payout.count({ where: whereClause })
    ])

    // Calculate summary statistics
    const [pendingPayouts, processingPayouts, completedPayouts, failedPayouts, totalProcessed] = await Promise.all([
      prisma.payout.aggregate({
        where: { status: 'PENDING' },
        _sum: { amount: true },
        _count: { id: true }
      }),
      prisma.payout.aggregate({
        where: { status: 'PROCESSING' },
        _sum: { amount: true },
        _count: { id: true }
      }),
      prisma.payout.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
        _count: { id: true }
      }),
      prisma.payout.aggregate({
        where: { status: 'FAILED' },
        _sum: { amount: true },
        _count: { id: true }
      }),
      prisma.payout.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true }
      })
    ])

    // Transform payouts data for frontend
    const transformedPayouts = payouts.map(payout => ({
      id: payout.id,
      vendor: payout.vendor?.businessName || 'Unknown Vendor',
      amount: Number(payout.amount),
      period: `${payout.createdAt.toISOString().split('T')[0]} - ${payout.scheduledDate ? payout.scheduledDate.toISOString().split('T')[0] : 'N/A'}`,
      status: payout.status.toLowerCase(),
      dueDate: payout.scheduledDate ? payout.scheduledDate.toISOString().split('T')[0] : 'N/A'
    }))

    return NextResponse.json({
      success: true,
      data: transformedPayouts,
      stats: {
        PENDING: {
          count: pendingPayouts._count.id,
          total: Number(pendingPayouts._sum.amount || 0)
        },
        PROCESSING: {
          count: processingPayouts._count.id,
          total: Number(processingPayouts._sum.amount || 0)
        },
        COMPLETED: {
          count: completedPayouts._count.id,
          total: Number(completedPayouts._sum.amount || 0)
        },
        FAILED: {
          count: failedPayouts._count.id,
          total: Number(failedPayouts._sum.amount || 0)
        },
        totalProcessed: Number(totalProcessed._sum.amount || 0)
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
 * POST /api/finance/payouts - Create a new payout (Finance Analyst)
 */
async function createFinancePayout(request: AuthenticatedRequest) {
  try {
    if (!request.user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Only finance analysts and admins can create payouts
    if (!['FINANCE_ANALYST', 'ADMIN'].includes(request.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Finance Analyst or Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { vendorId, amount, scheduledDate, paymentMethod, notes } = body

    // Validate required fields
    if (!vendorId || !amount || !scheduledDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: vendorId, amount, scheduledDate' },
        { status: 400 }
      )
    }

    // Validate amount
    if (amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Amount must be greater than 0' },
        { status: 400 }
      )
    }

    // Check if vendor exists
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId }
    })

    if (!vendor) {
      return NextResponse.json(
        { success: false, error: 'Vendor not found' },
        { status: 404 }
      )
    }

    // Create payout
    const payout = await prisma.payout.create({
      data: {
        vendorId,
        amount: parseFloat(amount),
        status: 'PENDING',
        scheduledDate: new Date(scheduledDate),
        paymentMethod: paymentMethod || 'STRIPE',
        notes: notes || null,
        createdBy: request.user.userId
      },
      include: {
        vendor: {
          select: {
            businessName: true,
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

    // Log the action for audit trail
    await prisma.auditLog.create({
      data: {
        userId: request.user.userId,
        action: 'PAYOUT_CREATED',
        entityType: 'PAYOUT',
        entityId: payout.id,
        details: {
          vendorId,
          amount: parseFloat(amount),
          scheduledDate: new Date(scheduledDate),
          createdBy: request.user.email
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: payout,
      message: 'Payout created successfully'
    }, { status: 201 })

  } catch (error) {
    return handleApiError(error)
  }
}

export const GET = withAuth(getFinancePayouts)
export const POST = withAuth(createFinancePayout)
