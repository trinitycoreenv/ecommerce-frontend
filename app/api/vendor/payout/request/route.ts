import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { PayoutService } from '@/lib/services/payout'

/**
 * POST /api/vendor/payout/request - Request manual payout
 */
async function requestManualPayout(request: AuthenticatedRequest) {
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

    const body = await request.json()
    const { amount: requestedAmount, notes } = body

    // Convert amount to number and validate
    const amount = parseFloat(requestedAmount)
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid payout amount' },
        { status: 400 }
      )
    }

    // Get vendor profile
    const vendor = await prisma.vendor.findUnique({
      where: { userId: request.user.userId },
      include: {
        payoutSettings: true
      }
    })

    if (!vendor) {
      return NextResponse.json(
        { success: false, error: 'Vendor profile not found' },
        { status: 404 }
      )
    }

    // Check if vendor has an active subscription (which provides the payment method)
    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        vendorId: vendor.id,
        status: 'ACTIVE'
      }
    })

    if (!activeSubscription) {
      return NextResponse.json(
        { success: false, error: 'No active subscription found. Please subscribe to a plan first.' },
        { status: 400 }
      )
    }

    // Get available balance (total earnings - total payouts)
    const commissions = await prisma.commission.findMany({
      where: { vendorId: vendor.id },
      include: {
        order: {
          select: {
            totalPrice: true
          }
        }
      }
    })

    const payouts = await prisma.payout.findMany({
      where: { vendorId: vendor.id }
    })

    // Calculate total earnings
    const totalEarnings = commissions.reduce((sum, commission) => {
      const orderTotal = commission.breakdown?.orderTotal || Number(commission.order?.totalPrice) || 0
      const commissionAmount = Number(commission.amount)
      const vendorNetPayout = orderTotal - commissionAmount
      return sum + vendorNetPayout
    }, 0)
    
    // Calculate total payouts (all payouts, regardless of status)
    const totalPayouts = payouts.reduce((sum, payout) => sum + Number(payout.amount), 0)
    
    // Available balance = Total earnings - Total payouts
    const availableBalance = totalEarnings - totalPayouts

    // Check if requested amount is available
    if (amount > availableBalance) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Insufficient balance. Available: $${availableBalance.toFixed(2)}, Requested: $${amount.toFixed(2)}` 
        },
        { status: 400 }
      )
    }

    // Check minimum payout amount (default to 50 if no settings)
    const minimumPayout = Number(vendor.payoutSettings?.minimumPayout || 50)
    if (amount < minimumPayout) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Minimum payout amount is $${minimumPayout.toFixed(2)}` 
        },
        { status: 400 }
      )
    }

    // Create payout request
    const payout = await prisma.payout.create({
      data: {
        vendorId: vendor.id,
        amount: parseFloat(amount),
        scheduledDate: new Date(), // Immediate payout
        status: 'PENDING',
        notes: notes || 'Manual payout request',
        metadata: {
          type: 'MANUAL_REQUEST',
          requestedBy: request.user.userId,
          requestedAt: new Date().toISOString(),
          availableBalance,
          minimumPayout
        }
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

    // Associate pending commissions with this payout
    const commissionsToInclude = commissions.slice(0, Math.ceil(amount / (availableBalance / commissions.length)))
    
    await prisma.commission.updateMany({
      where: {
        id: {
          in: commissionsToInclude.map(c => c.id)
        }
      },
      data: {
        payoutId: payout.id
      }
    })

    // Log the payout request
    await prisma.auditLog.create({
      data: {
        userId: request.user.userId,
        action: 'REQUEST_MANUAL_PAYOUT',
        resource: 'PAYOUT',
        resourceId: payout.id,
        details: {
          amount: parseFloat(amount),
          availableBalance,
          vendorId: vendor.id,
          notes: notes || 'Manual payout request'
        }
      }
    })

    // Process the payout immediately (in a real system, this might be queued)
    try {
      await PayoutService.processPayout(payout.id)
      
      // Update payout status
      await prisma.payout.update({
        where: { id: payout.id },
        data: {
          status: 'PROCESSING',
          processedAt: new Date()
        }
      })

      return NextResponse.json({
        success: true,
        data: {
          payoutId: payout.id,
          amount: parseFloat(amount),
          status: 'PROCESSING',
          message: 'Payout request submitted and is being processed'
        }
      })

    } catch (payoutError) {
      console.error('Payout processing error:', payoutError)
      
      // Update payout status to failed
      await prisma.payout.update({
        where: { id: payout.id },
        data: {
          status: 'FAILED',
          failureReason: payoutError instanceof Error ? payoutError.message : 'Unknown error'
        }
      })

      return NextResponse.json({
        success: false,
        error: 'Payout processing failed. Please try again or contact support.'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error requesting manual payout:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process payout request' },
      { status: 500 }
    )
  }
}

export const POST = withAuth(requestManualPayout)
