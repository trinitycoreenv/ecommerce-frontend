import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'

async function ensureVendorProfile(request: AuthenticatedRequest) {
  try {
    if (!request.user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    if (request.user.role !== 'VENDOR') {
      return NextResponse.json(
        { success: false, error: 'Only vendors can access this endpoint' },
        { status: 403 }
      )
    }

    // Check if vendor profile exists
    const existingVendor = await prisma.vendor.findUnique({
      where: { userId: request.user.userId }
    })

    if (existingVendor) {
      return NextResponse.json({
        success: true,
        data: {
          vendor: existingVendor,
          message: 'Vendor profile already exists'
        }
      })
    }

    // Create vendor profile if it doesn't exist
    const vendor = await prisma.vendor.create({
      data: {
        userId: request.user.userId,
        businessName: `${request.user.name}'s Business`, // Default business name
        businessAddress: 'Address not provided',
        taxId: 'TAX_NOT_PROVIDED',
        status: 'PENDING_VERIFICATION'
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        vendor,
        message: 'Vendor profile created successfully'
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error ensuring vendor profile:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to ensure vendor profile' },
      { status: 500 }
    )
  }
}

export const POST = withAuth(ensureVendorProfile)
