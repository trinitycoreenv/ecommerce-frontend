import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { handleApiError } from '@/lib/middleware'
import { PayoutService } from '@/lib/services/payout'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/finance/payouts/[id]/process - Process a payout (Finance Analyst)
 */
async function processFinancePayout(request: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    const payoutId = params.id

    if (!request.user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Only finance analysts and admins can process payouts
    if (!['FINANCE_ANALYST', 'ADMIN'].includes(request.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Finance Analyst or Admin access required' },
        { status: 403 }
      )
    }

    // Check if payout exists
    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
      include: {
        vendor: {
          select: {
            businessName: true
          }
        }
      }
    })

    if (!payout) {
      return NextResponse.json(
        { success: false, error: 'Payout not found' },
        { status: 404 }
      )
    }

    if (payout.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: 'Payout is not in pending status' },
        { status: 400 }
      )
    }

    try {
      const success = await PayoutService.processPayout(payoutId)
      
      if (success) {
        // Log the action for audit trail
        await prisma.auditLog.create({
          data: {
            userId: request.user.userId,
            action: 'PAYOUT_PROCESSED',
            entityType: 'PAYOUT',
            entityId: payoutId,
            details: {
              vendorId: payout.vendorId,
              amount: Number(payout.amount),
              vendorName: payout.vendor.businessName,
              processedBy: request.user.email
            }
          }
        })

        return NextResponse.json({
          success: true,
          message: 'Payout processed successfully'
        })
      } else {
        return NextResponse.json(
          { success: false, error: 'Failed to process payout' },
          { status: 500 }
        )
      }
    } catch (error) {
      console.error('Payout processing error:', error)
      
      // Log the error for audit trail
      await prisma.auditLog.create({
        data: {
          userId: request.user.userId,
          action: 'PAYOUT_PROCESS_FAILED',
          entityType: 'PAYOUT',
          entityId: payoutId,
          details: {
            vendorId: payout.vendorId,
            amount: Number(payout.amount),
            vendorName: payout.vendor.businessName,
            error: error instanceof Error ? error.message : 'Unknown error',
            processedBy: request.user.email
          }
        }
      })

      return NextResponse.json(
        { 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to process payout' 
        },
        { status: 500 }
      )
    }

  } catch (error) {
    return handleApiError(error)
  }
}

export const POST = withAuth(processFinancePayout)
