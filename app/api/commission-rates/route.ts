import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/middleware'

async function getCommissionRates(request: AuthenticatedRequest) {
  try {
    if (!request.user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Allow both admins and finance analysts to access commission rates
    if (!['ADMIN', 'FINANCE_ANALYST'].includes(request.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Admin or Finance Analyst access required' },
        { status: 403 }
      )
    }

    const commissionRates = await prisma.commissionRate.findMany({
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
        },
        category: {
          select: {
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: commissionRates
    })

  } catch (error) {
    return handleApiError(error)
  }
}

async function createCommissionRate(request: AuthenticatedRequest) {
  try {
    if (!request.user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Allow both admins and finance analysts to create commission rates
    if (!['ADMIN', 'FINANCE_ANALYST'].includes(request.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Admin or Finance Analyst access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { vendorId, categoryId, rate, type, minAmount, maxAmount, effectiveFrom, effectiveTo } = body

    // Validate required fields
    if (!vendorId || !rate || !type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: vendorId, rate, type' },
        { status: 400 }
      )
    }

    // Validate rate
    if (rate < 0 || rate > 100) {
      return NextResponse.json(
        { success: false, error: 'Rate must be between 0 and 100' },
        { status: 400 }
      )
    }

    const commissionRate = await prisma.commissionRate.create({
      data: {
        vendorId,
        categoryId: categoryId || null,
        rate: parseFloat(rate),
        type,
        minAmount: minAmount ? parseFloat(minAmount) : null,
        maxAmount: maxAmount ? parseFloat(maxAmount) : null,
        effectiveFrom: new Date(effectiveFrom),
        effectiveTo: effectiveTo ? new Date(effectiveTo) : null
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
        },
        category: {
          select: {
            name: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: commissionRate
    }, { status: 201 })

  } catch (error) {
    return handleApiError(error)
  }
}

export const GET = withAuth(getCommissionRates)
export const POST = withAuth(createCommissionRate)