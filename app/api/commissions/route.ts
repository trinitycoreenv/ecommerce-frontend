import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/middleware'

async function getCommissions(request: AuthenticatedRequest) {
  try {
    if (!request.user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Allow both admins and finance analysts to access commission management
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

    console.log('Commission API - Filters:', { status, vendorId, search })
    console.log('Commission API - Where clause:', whereClause)

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

    console.log('Commission API - Found commissions:', commissions.length)
    console.log('Commission API - Stats:', {
      totalCommissions: Number(totalCommissions._sum.amount || 0),
      PENDING: { count: pendingCommissions, total: Number(pendingAmount._sum.amount || 0) },
      CALCULATED: { count: calculatedCommissions, total: Number(calculatedAmount._sum.amount || 0) },
      PAID: { count: paidCommissions, total: Number(paidAmount._sum.amount || 0) }
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

export const GET = withAuth(getCommissions)