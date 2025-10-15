import { NextRequest, NextResponse } from "next/server"
import { VendorService } from "@/lib/services/vendor"
import { requireAuth } from "@/lib/middleware"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await requireAuth(request)
    const vendorId = params.id

    // Users can only view their own vendor profile, admins can view any vendor
    if (user.role !== "ADMIN") {
      const vendor = await VendorService.getVendorByUserId(user.id)
      if (!vendor || vendor.id !== vendorId) {
        return NextResponse.json(
          { success: false, error: "Access denied" },
          { status: 403 }
        )
      }
    }

    const vendor = await VendorService.getVendorById(vendorId)

    if (!vendor) {
      return NextResponse.json(
        { success: false, error: "Vendor not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: vendor
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.status || 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await requireAuth(request)
    const vendorId = params.id

    // Users can only update their own vendor profile, admins can update any vendor
    if (user.role !== "ADMIN") {
      const vendor = await VendorService.getVendorByUserId(user.id)
      if (!vendor || vendor.id !== vendorId) {
        return NextResponse.json(
          { success: false, error: "Access denied" },
          { status: 403 }
        )
      }
    }

    const body = await request.json()
    const updateData = {
      businessName: body.businessName,
      businessType: body.businessType,
      taxId: body.taxId,
      address: body.address,
      bankDetails: body.bankDetails,
      isActive: body.isActive
    }

    const vendor = await VendorService.updateVendor(vendorId, updateData, user.id)

    return NextResponse.json({
      success: true,
      data: vendor
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.status || 500 }
    )
  }
}
