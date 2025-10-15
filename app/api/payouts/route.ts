import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/middleware'

async function getPayouts(request: AuthenticatedRequest) {
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

    // Get all payouts for this vendor
    const payouts = await prisma.payout.findMany({
      where: { vendorId: vendor.id },
      include: {
        commissions: {
          include: {
            order: {
              select: {
                orderNumber: true,
                totalPrice: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Process payout data for frontend
    const processedPayouts = payouts.map(payout => ({
      id: payout.id,
      amount: Number(payout.amount),
      status: payout.status,
      paymentMethod: payout.paymentMethod,
      scheduledDate: payout.scheduledDate,
      processedAt: payout.processedAt,
      createdAt: payout.createdAt,
      commissions: payout.commissions.map(commission => ({
        id: commission.id,
        amount: Number(commission.amount),
        orderNumber: commission.order?.orderNumber,
        orderTotal: Number(commission.order?.totalPrice || 0)
      }))
    }))

    return NextResponse.json({
      success: true,
      data: processedPayouts
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

export const GET = withAuth(getPayouts)