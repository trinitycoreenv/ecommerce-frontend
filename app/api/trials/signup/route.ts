import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { TrialFraudPreventionService } from '@/lib/services/trial-fraud-prevention'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/trials/signup - Start a trial with fraud prevention
 */
async function startTrial(request: AuthenticatedRequest) {
  try {
    const body = await request.json()
    const { planId, paymentCardLast4, stripeCustomerId } = body

    // Get client IP and user agent
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Check if plan supports trials
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId }
    })

    if (!plan) {
      return NextResponse.json(
        { success: false, error: 'Plan not found' },
        { status: 404 }
      )
    }

    if (plan.trialDays === 0) {
      return NextResponse.json(
        { success: false, error: 'This plan does not support trials' },
        { status: 400 }
      )
    }

    // Prepare trial signup data
    const trialData = {
      userId: request.user.userId,
      planId,
      email: request.user.email,
      phoneNumber: request.user.phone,
      ipAddress,
      userAgent,
      paymentCardLast4,
      stripeCustomerId
    }

    // Check fraud prevention
    const fraudResult = await TrialFraudPreventionService.checkTrialEligibility(trialData)

    if (!fraudResult.isAllowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Trial not allowed due to fraud prevention',
          details: {
            fraudScore: fraudResult.fraudScore,
            riskLevel: fraudResult.riskLevel,
            reasons: fraudResult.reasons
          }
        },
        { status: 403 }
      )
    }

    // Record trial usage
    await TrialFraudPreventionService.recordTrialUsage(trialData, fraudResult)

    // Create trial subscription
    const trialStartDate = new Date()
    const trialEndDate = new Date(trialStartDate.getTime() + plan.trialDays * 24 * 60 * 60 * 1000)

    const subscription = await prisma.subscription.create({
      data: {
        vendorId: request.user.userId, // Assuming user is a vendor
        planId: planId,
        tier: plan.tier as any,
        startDate: trialStartDate,
        endDate: trialEndDate,
        status: 'ACTIVE',
        price: 0, // Free during trial
        billingCycle: 'MONTHLY',
        trialEndDate: trialEndDate,
        stripeCustomerId: stripeCustomerId,
        autoRenew: true
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        subscription,
        trialEndDate,
        fraudScore: fraudResult.fraudScore,
        riskLevel: fraudResult.riskLevel
      },
      message: 'Trial started successfully'
    })
  } catch (error) {
    console.error('Error starting trial:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to start trial' },
      { status: 500 }
    )
  }
}

export const POST = withAuth(startTrial)
