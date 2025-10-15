import { NextRequest, NextResponse } from "next/server"
import { TransactionService } from "@/lib/services/transaction"
import { requireAuth } from "@/lib/middleware"

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth(request)
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") as any
    const type = searchParams.get("type") as any
    const vendorId = searchParams.get("vendorId")
    const orderId = searchParams.get("orderId")
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")

    const filters: any = {}
    if (status) filters.status = status
    if (type) filters.type = type
    if (vendorId) filters.vendorId = vendorId
    if (orderId) filters.orderId = orderId
    if (dateFrom) filters.dateFrom = new Date(dateFrom)
    if (dateTo) filters.dateTo = new Date(dateTo)
    if (page) filters.page = page
    if (limit) filters.limit = limit

    const result = await TransactionService.getTransactions(filters)

    return NextResponse.json({
      success: true,
      data: result.transactions,
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
    
    // Only admins and finance analysts can create transactions
    if (!["ADMIN", "FINANCE_ANALYST"].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions to create transactions" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const transactionData = {
      orderId: body.orderId,
      vendorId: body.vendorId,
      amount: body.amount,
      type: body.type,
      description: body.description,
      paymentMethod: body.paymentMethod,
      referenceId: body.referenceId
    }

    const transaction = await TransactionService.createTransaction(transactionData, user.id)

    return NextResponse.json({
      success: true,
      data: transaction
    }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.status || 500 }
    )
  }
}
