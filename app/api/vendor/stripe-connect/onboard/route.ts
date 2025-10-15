import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { PaymentService } from '@/lib/payment-service'

/**
 * GET /api/vendor/stripe-connect/onboard - Create onboarding link for existing account
 */
async function createOnboardingLink(request: AuthenticatedRequest) {
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

    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('account')

    if (!accountId) {
      return NextResponse.json(
        { success: false, error: 'Account ID is required' },
        { status: 400 }
      )
    }

    const stripe = PaymentService.getStripe()

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/vendor/payouts?refresh=true`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/vendor/payouts?success=true`,
      type: 'account_onboarding'
    })

    // Redirect to Stripe onboarding
    return NextResponse.redirect(accountLink.url)

  } catch (error) {
    console.error('Error creating onboarding link:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create onboarding link' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(createOnboardingLink)
