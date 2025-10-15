import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/middleware'

async function getVendorPayoutSettings(request: AuthenticatedRequest) {
  try {
    if (!request.user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    if (request.user.role !== 'VENDOR') {
      return NextResponse.json(
        { success: false, error: 'Only vendors can access payout settings' },
        { status: 403 }
      )
    }

    // Get vendor ID for the user
    const vendor = await prisma.vendor.findUnique({
      where: { userId: request.user.userId }
    })
    
    if (!vendor) {
      return NextResponse.json(
        { success: false, error: 'Vendor profile not found' },
        { status: 404 }
      )
    }

    let settings = await prisma.vendorPayoutSettings.findUnique({
      where: { vendorId: vendor.id }
    })

    // Create default settings if none exist
    if (!settings) {
      settings = await prisma.vendorPayoutSettings.create({
        data: {
          vendorId: vendor.id,
          payoutFrequency: 'WEEKLY',
          minimumPayout: 50.00,
          payoutMethod: 'STRIPE',
          isActive: true
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: settings
    })

  } catch (error) {
    return handleApiError(error)
  }
}

async function updateVendorPayoutSettings(request: AuthenticatedRequest) {
  try {
    const body = await request.json()
    const { 
      payoutFrequency, 
      minimumPayout, 
      payoutMethod, 
      stripeAccountId, 
      bankAccountDetails,
      isActive 
    } = body

    if (!request.user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    if (request.user.role !== 'VENDOR') {
      return NextResponse.json(
        { success: false, error: 'Only vendors can update payout settings' },
        { status: 403 }
      )
    }

    // Get vendor ID for the user
    const vendor = await prisma.vendor.findUnique({
      where: { userId: request.user.userId }
    })
    
    if (!vendor) {
      return NextResponse.json(
        { success: false, error: 'Vendor profile not found' },
        { status: 404 }
      )
    }

    // Validate payout frequency
    if (payoutFrequency && !['DAILY', 'WEEKLY', 'MONTHLY'].includes(payoutFrequency)) {
      return NextResponse.json(
        { success: false, error: 'Invalid payout frequency' },
        { status: 400 }
      )
    }

    // Validate minimum payout
    if (minimumPayout && (minimumPayout < 10 || minimumPayout > 10000)) {
      return NextResponse.json(
        { success: false, error: 'Minimum payout must be between $10 and $10,000' },
        { status: 400 }
      )
    }

    // Validate payout method
    if (payoutMethod && !['STRIPE', 'BANK_TRANSFER', 'PAYPAL'].includes(payoutMethod)) {
      return NextResponse.json(
        { success: false, error: 'Invalid payout method' },
        { status: 400 }
      )
    }

    // Update or create settings
    const settings = await prisma.vendorPayoutSettings.upsert({
      where: { vendorId: vendor.id },
      update: {
        payoutFrequency: payoutFrequency || undefined,
        minimumPayout: minimumPayout ? parseFloat(minimumPayout) : undefined,
        payoutMethod: payoutMethod || undefined,
        stripeAccountId: stripeAccountId || undefined,
        bankAccountDetails: bankAccountDetails || undefined,
        isActive: isActive !== undefined ? isActive : undefined,
        nextPayoutDate: payoutFrequency ? calculateNextPayoutDate(payoutFrequency) : undefined
      },
      create: {
        vendorId: vendor.id,
        payoutFrequency: payoutFrequency || 'WEEKLY',
        minimumPayout: minimumPayout ? parseFloat(minimumPayout) : 50.00,
        payoutMethod: payoutMethod || 'STRIPE',
        stripeAccountId: stripeAccountId || null,
        bankAccountDetails: bankAccountDetails || null,
        isActive: isActive !== undefined ? isActive : true,
        nextPayoutDate: calculateNextPayoutDate(payoutFrequency || 'WEEKLY')
      }
    })

    // Log settings update
    await prisma.auditLog.create({
      data: {
        userId: request.user.userId,
        action: 'UPDATE_PAYOUT_SETTINGS',
        resource: 'VENDOR_PAYOUT_SETTINGS',
        resourceId: settings.id,
        details: {
          payoutFrequency: settings.payoutFrequency,
          minimumPayout: Number(settings.minimumPayout),
          payoutMethod: settings.payoutMethod,
          isActive: settings.isActive
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: settings,
      message: 'Payout settings updated successfully'
    })

  } catch (error) {
    return handleApiError(error)
  }
}

function calculateNextPayoutDate(frequency: string): Date {
  const now = new Date()
  
  switch (frequency) {
    case 'DAILY':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000)
    case 'WEEKLY':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    case 'MONTHLY':
      return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())
    default:
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // Default to weekly
  }
}

export const GET = withAuth(getVendorPayoutSettings)
export const PUT = withAuth(updateVendorPayoutSettings)
