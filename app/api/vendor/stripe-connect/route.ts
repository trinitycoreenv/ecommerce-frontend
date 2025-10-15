import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { PaymentService } from '@/lib/payment-service'

/**
 * GET /api/vendor/stripe-connect - Get Stripe Connect account status
 */
async function getStripeConnectStatus(request: AuthenticatedRequest) {
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

    const stripe = PaymentService.getStripe()

    // Check if vendor has Stripe Connect account
    if (vendor.payoutSettings?.stripeAccountId) {
      try {
        const account = await stripe.accounts.retrieve(vendor.payoutSettings.stripeAccountId)
        
        return NextResponse.json({
          success: true,
          data: {
            hasStripeAccount: true,
            accountId: vendor.payoutSettings.stripeAccountId,
            accountStatus: account.details_submitted ? 'complete' : 'incomplete',
            chargesEnabled: account.charges_enabled,
            payoutsEnabled: account.payouts_enabled,
            requirements: account.requirements,
            businessType: account.business_type,
            country: account.country,
            email: account.email
          }
        })
      } catch (error) {
        console.error('Error retrieving Stripe account:', error)
        return NextResponse.json({
          success: true,
          data: {
            hasStripeAccount: false,
            error: 'Stripe account not found or invalid'
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        hasStripeAccount: false
      }
    })

  } catch (error) {
    console.error('Error getting Stripe Connect status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get Stripe Connect status' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/vendor/stripe-connect - Create Stripe Connect account
 */
async function createStripeConnectAccount(request: AuthenticatedRequest) {
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
    const { businessName, businessType, country = 'US', email } = body

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

    const stripe = PaymentService.getStripe()

    // Create Stripe Connect account
    const account = await stripe.accounts.create({
      type: 'express', // Express accounts are easier to set up
      country: country,
      email: email || request.user.email,
      business_type: businessType || 'individual',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true }
      },
      business_profile: {
        name: businessName || vendor.businessName,
        product_description: 'E-commerce vendor on TrinityCore platform'
      },
      settings: {
        payouts: {
          schedule: {
            interval: 'daily'
          }
        }
      }
    })

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/vendor/payouts?refresh=true`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/vendor/payouts?success=true`,
      type: 'account_onboarding'
    })

    // Update vendor payout settings
    if (vendor.payoutSettings) {
      await prisma.vendorPayoutSettings.update({
        where: { id: vendor.payoutSettings.id },
        data: {
          stripeAccountId: account.id,
          payoutMethod: 'STRIPE'
        }
      })
    } else {
      await prisma.vendorPayoutSettings.create({
        data: {
          vendorId: vendor.id,
          stripeAccountId: account.id,
          payoutMethod: 'STRIPE',
          payoutFrequency: 'WEEKLY',
          minimumPayout: 50.00,
          isActive: true
        }
      })
    }

    // Log the account creation
    await prisma.auditLog.create({
      data: {
        userId: request.user.userId,
        action: 'CREATE_STRIPE_CONNECT_ACCOUNT',
        resource: 'VENDOR_PAYOUT_SETTINGS',
        resourceId: vendor.id,
        details: {
          stripeAccountId: account.id,
          businessName: businessName || vendor.businessName,
          country
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        accountId: account.id,
        onboardingUrl: accountLink.url,
        message: 'Stripe Connect account created. Please complete onboarding to enable payouts.'
      }
    })

  } catch (error) {
    console.error('Error creating Stripe Connect account:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create Stripe Connect account' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(getStripeConnectStatus)
export const POST = withAuth(createStripeConnectAccount)
