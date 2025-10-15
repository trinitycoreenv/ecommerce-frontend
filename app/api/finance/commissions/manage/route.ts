import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/middleware'

/**
 * GET /api/finance/commissions/manage - Get all commissions for Finance Analyst management
 */
async function getFinanceCommissions(request: AuthenticatedRequest) {
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
        { order: { orderNumber: { contains: search, mode: 'insensitive' } } },
        { vendor: { businessName: { contains: search, mode: 'insensitive' } } }
      ]
    }

    const [commissions, total] = await Promise.all([
      prisma.commission.findMany({
        where: whereClause,
        include: {
          order: {
            select: {
              orderNumber: true,
              totalPrice: true,
              status: true,
              createdAt: true
            }
          },
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
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit
      }),
      prisma.commission.count({ where: whereClause })
    ])

    // Calculate summary statistics
    const [totalCommissions, pendingCommissions, calculatedCommissions, paidCommissions] = await Promise.all([
      prisma.commission.aggregate({
        _sum: { amount: true }
      }),
      prisma.commission.count({
        where: { status: 'PENDING' }
      }),
      prisma.commission.count({
        where: { status: 'CALCULATED' }
      }),
      prisma.commission.count({
        where: { status: 'PAID' }
      })
    ])

    const pendingAmount = await prisma.commission.aggregate({
      where: { status: 'PENDING' },
      _sum: { amount: true }
    })

    const calculatedAmount = await prisma.commission.aggregate({
      where: { status: 'CALCULATED' },
      _sum: { amount: true }
    })

    const paidAmount = await prisma.commission.aggregate({
      where: { status: 'PAID' },
      _sum: { amount: true }
    })

    return NextResponse.json({
      success: true,
      data: commissions,
      stats: {
        totalCommissions: Number(totalCommissions._sum.amount || 0),
        PENDING: {
          count: pendingCommissions,
          total: Number(pendingAmount._sum.amount || 0)
        },
        CALCULATED: {
          count: calculatedCommissions,
          total: Number(calculatedAmount._sum.amount || 0)
        },
        PAID: {
          count: paidCommissions,
          total: Number(paidAmount._sum.amount || 0)
        }
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
 * PUT /api/finance/commissions/manage - Update commission status (Finance Analyst)
 */
async function updateCommissionStatus(request: AuthenticatedRequest) {
  try {
    if (!request.user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Only finance analysts and admins can update commission status
    if (!['FINANCE_ANALYST', 'ADMIN'].includes(request.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Finance Analyst or Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { commissionId, status, notes } = body

    // Validate required fields
    if (!commissionId || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: commissionId, status' },
        { status: 400 }
      )
    }

    // Validate status
    if (!['PENDING', 'CALCULATED', 'PAID', 'CANCELLED'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Check if commission exists
    const existingCommission = await prisma.commission.findUnique({
      where: { id: commissionId },
      include: {
        vendor: {
          select: {
            businessName: true
          }
        },
        order: {
          select: {
            orderNumber: true
          }
        }
      }
    })

    if (!existingCommission) {
      return NextResponse.json(
        { success: false, error: 'Commission not found' },
        { status: 404 }
      )
    }

    // Update commission status
    const updatedCommission = await prisma.commission.update({
      where: { id: commissionId },
      data: {
        status,
        notes: notes || null,
        updatedAt: new Date()
      },
      include: {
        vendor: {
          select: {
            businessName: true
          }
        },
        order: {
          select: {
            orderNumber: true
          }
        }
      }
    })

    // Log the action for audit trail
    await prisma.auditLog.create({
      data: {
        userId: request.user.userId,
        action: 'COMMISSION_STATUS_UPDATED',
        entityType: 'COMMISSION',
        entityId: commissionId,
        details: {
          oldStatus: existingCommission.status,
          newStatus: status,
          vendorId: existingCommission.vendorId,
          amount: Number(existingCommission.amount),
          vendorName: existingCommission.vendor.businessName,
          orderNumber: existingCommission.order.orderNumber,
          notes: notes || null,
          updatedBy: request.user.email
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedCommission,
      message: 'Commission status updated successfully'
    })

  } catch (error) {
    return handleApiError(error)
  }
}

export const GET = withAuth(getFinanceCommissions)
export const PUT = withAuth(updateCommissionStatus)
