import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/middleware'

async function getAdminPayouts(request: AuthenticatedRequest) {
  try {
    if (!request.user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Allow both admins and finance analysts to access payout management
    if (!['ADMIN', 'FINANCE_ANALYST'].includes(request.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Admin or Finance Analyst access required' },
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

    return NextResponse.json({
      success: true,
      data: payouts,
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

export const GET = withAuth(getAdminPayouts)
