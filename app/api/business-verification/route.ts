import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { BusinessVerificationService } from '@/lib/services/business-verification'

/**
 * POST /api/business-verification - Create business verification
 */
async function createBusinessVerification(request: AuthenticatedRequest) {
  try {
    const body = await request.json()
    const { businessLicense, taxId, businessAddress, phoneNumber, website, businessType, documents } = body

    // Only vendors can create business verification
    if (request.user.role !== 'VENDOR') {
      return NextResponse.json(
        { success: false, error: 'Only vendors can create business verification' },
        { status: 403 }
      )
    }

    // Validate business information
    const validation = BusinessVerificationService.validateBusinessInfo({
      businessLicense,
      taxId,
      phoneNumber,
      website,
      businessType
    })

    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.errors },
        { status: 400 }
      )
    }

    // Check if verification already exists
    const existingVerification = await BusinessVerificationService.getVerificationByVendorId(request.user.userId)
    if (existingVerification) {
      return NextResponse.json(
        { success: false, error: 'Business verification already exists for this vendor' },
        { status: 400 }
      )
    }

    const verification = await BusinessVerificationService.createVerification({
      vendorId: request.user.userId,
      businessLicense,
      taxId,
      businessAddress,
      phoneNumber,
      website,
      businessType,
      documents: documents || []
    })

    return NextResponse.json({
      success: true,
      data: verification
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating business verification:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create business verification' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/business-verification - Get business verification
 */
async function getBusinessVerification(request: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vendorId = searchParams.get('vendorId')

    let targetVendorId = request.user.userId

    // Admins can view any vendor's verification
    if (request.user.role === 'ADMIN' && vendorId) {
      targetVendorId = vendorId
    } else if (request.user.role !== 'VENDOR') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    const verification = await BusinessVerificationService.getVerificationByVendorId(targetVendorId)

    return NextResponse.json({
      success: true,
      data: verification
    })
  } catch (error) {
    console.error('Error getting business verification:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get business verification' },
      { status: 500 }
    )
  }
}

export const POST = withAuth(createBusinessVerification)
export const GET = withAuth(getBusinessVerification)
