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

    // Only admins and finance analysts can process payments
    if (!["ADMIN", "FINANCE_ANALYST"].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions to process payments" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const paymentData = {
      paymentMethod: body.paymentMethod,
      referenceId: body.referenceId,
      gatewayResponse: body.gatewayResponse
    }

    const transaction = await TransactionService.processPayment(transactionId, paymentData, user.id)

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
