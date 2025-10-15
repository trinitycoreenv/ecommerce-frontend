import { prisma } from '../prisma'
import { PayoutStatus } from '@prisma/client'
import { PaymentService } from '../payment-service'

export interface PayoutCalculation {
  vendorId: string
  totalAmount: number
  commissionCount: number
  commissions: Array<{
    id: string
    amount: number
    orderNumber: string
  }>
}

export interface PayoutSchedule {
  vendorId: string
  nextPayoutDate: Date
  frequency: string
  minimumAmount: number
}

export class PayoutService {
  /**
   * Calculate pending payouts for a vendor
   */
  static async calculatePendingPayouts(vendorId: string): Promise<PayoutCalculation | null> {
    try {
      // Get vendor's payout settings
      const vendorSettings = await prisma.vendorPayoutSettings.findUnique({
        where: { vendorId }
      })

      if (!vendorSettings || !vendorSettings.isActive) {
        return null
      }

      // Get unpaid commissions
      const unpaidCommissions = await prisma.commission.findMany({
        where: {
          vendorId,
          status: 'CALCULATED',
          payoutId: null
        },
        include: {
          order: {
            select: {
              orderNumber: true
            }
          }
        },
        orderBy: {
          calculatedAt: 'asc'
        }
      })

      if (unpaidCommissions.length === 0) {
        return null
      }

      const totalAmount = unpaidCommissions.reduce(
        (sum, commission) => sum + Number(commission.amount),
        0
      )

      // Check if amount meets minimum payout threshold
      if (totalAmount < Number(vendorSettings.minimumPayout)) {
        return null
      }

      return {
        vendorId,
        totalAmount,
        commissionCount: unpaidCommissions.length,
        commissions: unpaidCommissions.map(commission => ({
          id: commission.id,
          amount: Number(commission.amount),
          orderNumber: commission.order.orderNumber
        }))
      }
    } catch (error) {
      console.error('Error calculating pending payouts:', error)
      throw error
    }
  }

  /**
   * Create a scheduled payout
   */
  static async createScheduledPayout(
    vendorId: string,
    scheduledDate: Date,
    amount: number,
    commissionIds: string[]
  ): Promise<string> {
    try {
    const payout = await prisma.payout.create({
      data: {
        vendorId,
        amount,
        scheduledDate,
        status: PayoutStatus.PENDING,
          metadata: {
            commissionIds,
            createdBy: 'SYSTEM',
            createdAt: new Date().toISOString()
          }
        }
      })

      // Link commissions to payout
      await prisma.commission.updateMany({
      where: {
          id: { in: commissionIds }
        },
        data: {
          payoutId: payout.id
        }
      })

      console.log(`✅ Scheduled payout created: ${payout.id} for vendor ${vendorId}`)
      return payout.id
    } catch (error) {
      console.error('Error creating scheduled payout:', error)
      throw error
    }
  }

  /**
   * Process a payout (execute the actual payment)
   */
  static async processPayout(payoutId: string): Promise<boolean> {
    try {
    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
        include: {
          vendor: {
            include: {
              payoutSettings: true,
              user: true
            }
          },
          commissions: true
        }
    })

    if (!payout) {
      throw new Error('Payout not found')
    }

    if (payout.status !== PayoutStatus.PENDING && payout.status !== PayoutStatus.PROCESSING) {
      throw new Error('Payout is not in pending or processing status')
    }

      // Update status to processing (only if currently pending)
      if (payout.status === PayoutStatus.PENDING) {
      await prisma.payout.update({
        where: { id: payoutId },
        data: { status: PayoutStatus.PROCESSING }
      })
      }

      try {
        // Process payment based on vendor's payout method
        let paymentResult: any = null

        if (payout.vendor.payoutSettings?.payoutMethod === 'STRIPE' || !payout.vendor.payoutSettings?.payoutMethod) {
          // Use Stripe with vendor's subscription payment method
          paymentResult = await this.processStripePayout(payout)
        } else if (payout.vendor.payoutSettings?.payoutMethod === 'BANK_TRANSFER') {
          paymentResult = await this.processBankTransferPayout(payout)
        } else {
          throw new Error('Unsupported payout method')
        }

        // Update payout with success
        await prisma.payout.update({
        where: { id: payoutId },
        data: {
          status: PayoutStatus.COMPLETED,
            processedAt: new Date(),
            paymentId: paymentResult.id,
            stripeTransferId: paymentResult.stripeTransferId,
            metadata: {
              ...(payout.metadata as any || {}),
              paymentResult,
              processedAt: new Date().toISOString()
            }
          }
        })

        // Update commissions as paid
        await prisma.commission.updateMany({
          where: {
            payoutId: payoutId
          },
          data: {
            status: 'PAID',
            paidAt: new Date()
          }
        })

        // Update vendor's last payout date (create if doesn't exist)
        await prisma.vendorPayoutSettings.upsert({
          where: { vendorId: payout.vendorId },
          update: {
            lastPayoutDate: new Date(),
            nextPayoutDate: this.calculateNextPayoutDate(
              payout.vendor.payoutSettings?.payoutFrequency || 'WEEKLY'
            )
          },
          create: {
            vendorId: payout.vendorId,
            lastPayoutDate: new Date(),
            nextPayoutDate: this.calculateNextPayoutDate(
              payout.vendor.payoutSettings?.payoutFrequency || 'WEEKLY'
            ),
            minimumPayout: 50,
            payoutFrequency: 'WEEKLY',
            payoutMethod: 'STRIPE'
          }
        })

        // Send payout notification email
        await this.sendPayoutNotificationEmail(payout, paymentResult)

        console.log(`✅ Payout processed successfully: ${payoutId}`)
        return true

      } catch (paymentError) {
        // Handle payment failure
      await prisma.payout.update({
        where: { id: payoutId },
          data: {
            status: PayoutStatus.FAILED,
            failureReason: paymentError instanceof Error ? paymentError.message : 'Unknown error',
            retryCount: { increment: 1 }
          }
        })

        console.error(`❌ Payout failed: ${payoutId}`, paymentError)
        throw paymentError
      }

    } catch (error) {
      console.error('Error processing payout:', error)
      throw error
    }
  }

  /**
   * Process Stripe payout
   */
  private static async processStripePayout(payout: any): Promise<any> {
    try {
      // Import Stripe dynamically to avoid issues if not configured
      const Stripe = require('stripe')
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2024-12-18.acacia',
      })

      // Get vendor's subscription to find their payment method
      const vendorSubscription = await prisma.subscription.findFirst({
        where: {
          vendorId: payout.vendorId,
          status: 'ACTIVE'
        }
      })

      if (!vendorSubscription || !vendorSubscription.stripeCustomerId) {
        throw new Error('Vendor does not have an active subscription with Stripe customer ID')
      }

      // Get the customer from Stripe to find their default payment method
      const customer = await stripe.customers.retrieve(vendorSubscription.stripeCustomerId)
      
      if (!customer || !customer.invoice_settings?.default_payment_method) {
        throw new Error('Vendor does not have a default payment method configured')
      }

      // For payouts, we'll create a refund to the payment method
      // This simulates sending money back to the vendor's card
      // In a real implementation, you might use Stripe Connect or direct bank transfers
      
      // Create a payment intent to the vendor's payment method (reverse payment)
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(Number(payout.amount) * 100), // Convert to cents
        currency: 'usd', // Use USD to match subscription currency
        payment_method: customer.invoice_settings.default_payment_method as string,
        customer: customer.id,
        confirm: true,
        description: `Payout for vendor ${payout.vendor.businessName}`,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never'
        },
        metadata: {
          payoutId: payout.id,
          vendorId: payout.vendorId,
          type: 'vendor_payout',
          commissionCount: payout.commissions.length
        }
      })

      console.log(`💳 Stripe payout created: ${paymentIntent.id}`)
      
      return {
        id: paymentIntent.id,
        stripePaymentIntentId: paymentIntent.id,
      amount: Number(payout.amount),
      currency: 'usd',
        status: paymentIntent.status,
        paymentIntent: paymentIntent
      }
    } catch (error) {
      console.error('Stripe payout error:', error)
      throw new Error(`Stripe payout failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Process bank transfer payout
   */
  private static async processBankTransferPayout(payout: any): Promise<any> {
    // In a real implementation, you would integrate with a banking API
    // For now, we'll simulate the transfer
    const transferResult = {
      id: `bt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount: Number(payout.amount),
      currency: 'php',
      status: 'initiated'
    }

    console.log(`🏦 Bank transfer initiated: ${transferResult.id}`)
    return transferResult
  }

  /**
   * Send payout notification email
   */
  private static async sendPayoutNotificationEmail(payout: any, paymentResult: any): Promise<void> {
    try {
      const EmailService = (await import('../email')).default
      
      await EmailService.sendEmail({
        to: payout.vendor.user.email,
        subject: `Payout Processed: $${Number(payout.amount).toFixed(2)}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Payout Processed Successfully!</h2>
            <p>Hello ${payout.vendor.user.name},</p>
            <p>Your payout has been processed and should appear in your account within 1-2 business days.</p>
            
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3>Payout Details:</h3>
              <p><strong>Amount:</strong> $${Number(payout.amount).toFixed(2)}</p>
              <p><strong>Payment Method:</strong> ${payout.vendor.payoutSettings?.payoutMethod}</p>
              <p><strong>Transaction ID:</strong> ${paymentResult.id}</p>
              <p><strong>Commissions Included:</strong> ${payout.commissions.length}</p>
            </div>
            
            <p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/vendor/payouts" 
                 style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                View Payout History
              </a>
            </p>
            
            <p>Thank you for selling with us!</p>
            <p>Best regards,<br>The E-commerce Platform Team</p>
          </div>
        `,
        text: `
          Payout Processed Successfully!
          
          Hello ${payout.vendor.user.name},
          
          Your payout has been processed and should appear in your account within 1-2 business days.
          
          Payout Details:
          - Amount: $${Number(payout.amount).toFixed(2)}
          - Payment Method: ${payout.vendor.payoutSettings?.payoutMethod}
          - Transaction ID: ${paymentResult.id}
          - Commissions Included: ${payout.commissions.length}
          
          View payout history: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/vendor/payouts
          
          Thank you for selling with us!
          Best regards,
          The E-commerce Platform Team
        `
      })
    } catch (error) {
      console.error('Failed to send payout notification email:', error)
      // Don't fail the payout if email fails
    }
  }

  /**
   * Calculate next payout date based on frequency
   */
  private static calculateNextPayoutDate(frequency: string): Date {
    const now = new Date()
    
    switch (frequency) {
      case 'DAILY':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000)
      case 'WEEKLY':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      case 'MONTHLY':
        return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())
      default:
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // Default to weekly
    }
  }

  /**
   * Get vendors ready for payout
   */
  static async getVendorsReadyForPayout(): Promise<PayoutSchedule[]> {
    try {
      const vendors = await prisma.vendorPayoutSettings.findMany({
          where: {
          isActive: true,
          nextPayoutDate: {
            lte: new Date()
          }
        },
        include: {
          vendor: {
            select: {
              id: true,
              businessName: true
            }
          }
        }
      })

      return vendors.map(vendor => ({
        vendorId: vendor.vendorId,
        nextPayoutDate: vendor.nextPayoutDate!,
        frequency: vendor.payoutFrequency,
        minimumAmount: Number(vendor.minimumPayout)
      }))
    } catch (error) {
      console.error('Error getting vendors ready for payout:', error)
      throw error
    }
  }

  /**
   * Process all pending payouts
   */
  static async processAllPendingPayouts(): Promise<{
    processed: number
    failed: number
    skipped: number
  }> {
    try {
      const vendorsReady = await this.getVendorsReadyForPayout()
      let processed = 0
      let failed = 0
      let skipped = 0

      for (const vendorSchedule of vendorsReady) {
        try {
          const payoutCalculation = await this.calculatePendingPayouts(vendorSchedule.vendorId)
          
          if (!payoutCalculation) {
            skipped++
            continue
          }

          // Create and process payout
          const payoutId = await this.createScheduledPayout(
            vendorSchedule.vendorId,
            new Date(),
            payoutCalculation.totalAmount,
            payoutCalculation.commissions.map(c => c.id)
          )

          await this.processPayout(payoutId)
          processed++

        } catch (error) {
          console.error(`Failed to process payout for vendor ${vendorSchedule.vendorId}:`, error)
          failed++
        }
      }

      console.log(`📊 Payout processing complete: ${processed} processed, ${failed} failed, ${skipped} skipped`)
      
      return { processed, failed, skipped }
    } catch (error) {
      console.error('Error processing all pending payouts:', error)
      throw error
    }
  }

  /**
   * Process all existing PROCESSING payouts
   */
  static async processAllProcessingPayouts(): Promise<{
    processed: number
    failed: number
    skipped: number
  }> {
    try {
      const processingPayouts = await prisma.payout.findMany({
        where: {
          status: PayoutStatus.PROCESSING
        },
        include: {
          vendor: {
            include: {
              subscriptions: {
                where: { status: 'ACTIVE' },
                include: {
                  plan: true
                }
              }
            }
          }
        }
      })

      let processed = 0
      let failed = 0
      let skipped = 0

      for (const payout of processingPayouts) {
        try {
          // Check if vendor has active subscription
          if (!payout.vendor.subscriptions || payout.vendor.subscriptions.length === 0) {
            console.log(`Skipping payout ${payout.id}: No active subscription`)
            skipped++
            continue
          }

          // Process the payout
          await this.processPayout(payout.id)
          processed++
          console.log(`Successfully processed payout ${payout.id}`)
        } catch (error) {
          console.error(`Failed to process payout ${payout.id}:`, error)
          failed++
        }
      }

      return { processed, failed, skipped }
    } catch (error) {
      console.error('Error processing all processing payouts:', error)
      throw error
    }
  }

  /**
   * Retry failed payouts
   */
  static async retryFailedPayouts(): Promise<number> {
    try {
      const failedPayouts = await prisma.payout.findMany({
        where: {
          status: PayoutStatus.FAILED,
          retryCount: { lt: 3 } // Max 3 retries
        }
      })

      let retried = 0

      for (const payout of failedPayouts) {
        try {
          await this.processPayout(payout.id)
          retried++
        } catch (error) {
          console.error(`Retry failed for payout ${payout.id}:`, error)
        }
      }

      console.log(`🔄 Retried ${retried} failed payouts`)
      return retried
    } catch (error) {
      console.error('Error retrying failed payouts:', error)
      throw error
    }
  }
}