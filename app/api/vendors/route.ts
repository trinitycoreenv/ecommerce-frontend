import { NextRequest, NextResponse } from "next/server"
import { VendorService } from "@/lib/services/vendor"
import { requireAuth } from "@/lib/middleware"

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth(request)
    
    // Only admins can view all vendors
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Only administrators can view all vendors" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get("isActive")
    const businessType = searchParams.get("businessType")
    const search = searchParams.get("search")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")

    const filters: any = {}
    if (isActive !== null) filters.isActive = isActive === "true"
    if (businessType) filters.businessType = businessType
    if (search) filters.search = search
    if (page) filters.page = page
    if (limit) filters.limit = limit

    const result = await VendorService.getVendors(filters)

    return NextResponse.json({
      success: true,
      data: result.vendors,
      pagination: result.pagination
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.status || 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth(request)
    
    // Only admins can create vendors
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Only administrators can create vendors" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const vendorData = {
      userId: body.userId,
      businessName: body.businessName,
      businessType: body.businessType,
      taxId: body.taxId,
      address: body.address,
      bankDetails: body.bankDetails
    }

    const vendor = await VendorService.createVendor(vendorData, user.id)

    return NextResponse.json({
      success: true,
      data: vendor
    }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.status || 500 }
    )
  }
}
