import { NextRequest, NextResponse } from "next/server"
import { TransactionService } from "@/lib/services/transaction"
import { requireAuth } from "@/lib/middleware"

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth(request)
    
    // Only admins and finance analysts can view transaction statistics
    if (!["ADMIN", "FINANCE_ANALYST"].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions to view transaction statistics" },
        { status: 403 }
      )
    }

    const stats = await TransactionService.getTransactionStats()

    return NextResponse.json({
      success: true,
      data: stats
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.status || 500 }
    )
  }
}
