import { NextRequest, NextResponse } from "next/server"
import { TransactionService } from "@/lib/services/transaction"
import { requireAuth } from "@/lib/middleware"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await requireAuth(request)
    const transactionId = params.id

    const transaction = await TransactionService.getTransactionById(transactionId)

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: "Transaction not found" },
        { status: 404 }
      )
    }

    // Check access permissions
    if (user.role === "VENDOR" && transaction.vendorId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      )
    }

    if (user.role === "CUSTOMER" && transaction.customerId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: transaction
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
    const transactionId = params.id

    // Only admins and finance analysts can update transactions
    if (!["ADMIN", "FINANCE_ANALYST"].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions to update transactions" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const updateData = {
      status: body.status,
      description: body.description,
      referenceId: body.referenceId
    }

    const transaction = await TransactionService.updateTransaction(transactionId, updateData, user.id)

    return NextResponse.json({
      success: true,
      data: transaction
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.status || 500 }
    )
  }
}
