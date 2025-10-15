import { NextRequest, NextResponse } from 'next/server'
import { PayoutService } from '@/lib/services/payout'

// This endpoint can be called by a cron service like Vercel Cron, GitHub Actions, or external cron services
export async function GET(request: NextRequest) {
  try {
    // Verify the request is from an authorized source
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('🔄 Starting automated payout processing...')
    
    // Process all pending payouts
    const result = await PayoutService.processAllPendingPayouts()
    
    // Retry failed payouts
    const retried = await PayoutService.retryFailedPayouts()
    
    console.log('✅ Automated payout processing completed:', {
      processed: result.processed,
      failed: result.failed,
      skipped: result.skipped,
      retried
    })

    return NextResponse.json({
      success: true,
      message: 'Payout processing completed',
      data: {
        ...result,
        retried
      }
    })

  } catch (error) {
    console.error('❌ Automated payout processing failed:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

// Also support POST for webhook-style calls
export async function POST(request: NextRequest) {
  return GET(request)
}
