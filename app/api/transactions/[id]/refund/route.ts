import { NextRequest, NextResponse } from "next/server"
import { TransactionService } from "@/lib/services/transaction"
import { requireAuth } from "@/lib/middleware"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await requireAuth(request)
    const transactionId = params.id

    // Only admins and finance analysts can process refunds
    if (!["ADMIN", "FINANCE_ANALYST"].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions to process refunds" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const refundData = {
      amount: body.amount,
      reason: body.reason,
      referenceId: body.referenceId
    }

    const transaction = await TransactionService.refundTransaction(transactionId, refundData, user.id)

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
