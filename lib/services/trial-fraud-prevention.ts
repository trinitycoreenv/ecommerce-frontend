import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface TrialSignupData {
  userId: string
  planId: string
  email: string
  phoneNumber?: string
  ipAddress: string
  userAgent?: string
  paymentCardLast4?: string
  stripeCustomerId?: string
}

export interface FraudCheckResult {
  isAllowed: boolean
  fraudScore: number
  reasons: string[]
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
}

class TrialFraudPreventionService {
  /**
   * Check if user is eligible for trial based on fraud prevention rules
   */
  static async checkTrialEligibility(data: TrialSignupData): Promise<FraudCheckResult> {
    const reasons: string[] = []
    let fraudScore = 0

    // Check 1: Previous trial usage
    const previousTrials = await prisma.trialUsage.findMany({
      where: {
        OR: [
          { userId: data.userId },
          { email: data.email },
          { ipAddress: data.ipAddress },
          ...(data.phoneNumber ? [{ phoneNumber: data.phoneNumber }] : []),
          ...(data.paymentCardLast4 ? [{ paymentCardLast4: data.paymentCardLast4 }] : [])
        ]
      }
    })

    if (previousTrials.length > 0) {
      fraudScore += 50
      reasons.push('Previous trial usage detected')
    }

    // Check 2: Multiple trials from same IP
    const ipTrials = await prisma.trialUsage.count({
      where: {
        ipAddress: data.ipAddress,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      }
    })

    if (ipTrials >= 3) {
      fraudScore += 30
      reasons.push('Multiple trials from same IP address')
    }

    // Check 3: Multiple trials with same email domain
    const emailDomain = data.email.split('@')[1]
    const domainTrials = await prisma.trialUsage.count({
      where: {
        email: {
          endsWith: `@${emailDomain}`
        },
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      }
    })

    if (domainTrials >= 5) {
      fraudScore += 25
      reasons.push('Multiple trials from same email domain')
    }

    // Check 4: Suspicious email patterns
    if (this.isSuspiciousEmail(data.email)) {
      fraudScore += 20
      reasons.push('Suspicious email pattern detected')
    }

    // Check 5: Missing payment card for Pro plan trial
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: data.planId }
    })

    if (plan?.tier === 'PREMIUM' && !data.paymentCardLast4) {
      fraudScore += 40
      reasons.push('Payment card required for Pro plan trial')
    }

    // Check 6: Recent account creation
    const user = await prisma.user.findUnique({
      where: { id: data.userId }
    })

    if (user) {
      const accountAge = Date.now() - user.createdAt.getTime()
      const hoursSinceCreation = accountAge / (1000 * 60 * 60)
      
      if (hoursSinceCreation < 1) {
        fraudScore += 15
        reasons.push('Very recent account creation')
      }
    }

    // Determine risk level and eligibility
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
    let isAllowed = true

    if (fraudScore >= 70) {
      riskLevel = 'HIGH'
      isAllowed = false
    } else if (fraudScore >= 40) {
      riskLevel = 'MEDIUM'
      isAllowed = false
    } else if (fraudScore >= 20) {
      riskLevel = 'MEDIUM'
      isAllowed = true
    } else {
      riskLevel = 'LOW'
      isAllowed = true
    }

    return {
      isAllowed,
      fraudScore,
      reasons,
      riskLevel
    }
  }

  /**
   * Record trial usage for fraud tracking
   */
  static async recordTrialUsage(data: TrialSignupData, fraudResult: FraudCheckResult): Promise<void> {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: data.planId }
    })

    if (!plan || plan.trialDays === 0) {
      throw new Error('Plan does not support trials')
    }

    const trialStartDate = new Date()
    const trialEndDate = new Date(trialStartDate.getTime() + plan.trialDays * 24 * 60 * 60 * 1000)

    await prisma.trialUsage.create({
      data: {
        userId: data.userId,
        planId: data.planId,
        email: data.email,
        phoneNumber: data.phoneNumber,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        paymentCardLast4: data.paymentCardLast4,
        stripeCustomerId: data.stripeCustomerId,
        trialStartDate,
        trialEndDate,
        fraudScore: fraudResult.fraudScore,
        isFraudulent: fraudResult.riskLevel === 'HIGH',
        status: 'ACTIVE',
        notes: fraudResult.reasons.join('; ')
      }
    })
  }

  /**
   * Check if email is suspicious
   */
  private static isSuspiciousEmail(email: string): boolean {
    const suspiciousPatterns = [
      /^[a-z0-9]+@(10minutemail|tempmail|guerrillamail|mailinator|throwaway)\./i,
      /^test\d+@/i,
      /^fake\d+@/i,
      /^temp\d+@/i,
      /@(example|test|fake|temp)\.(com|org|net)$/i
    ]

    return suspiciousPatterns.some(pattern => pattern.test(email))
  }

  /**
   * Get trial usage statistics for admin dashboard
   */
  static async getTrialStats() {
    const totalTrials = await prisma.trialUsage.count()
    const activeTrials = await prisma.trialUsage.count({
      where: { status: 'ACTIVE' }
    })
    const convertedTrials = await prisma.trialUsage.count({
      where: { status: 'CONVERTED' }
    })
    const fraudulentTrials = await prisma.trialUsage.count({
      where: { isFraudulent: true }
    })

    const conversionRate = totalTrials > 0 ? (convertedTrials / totalTrials) * 100 : 0
    const fraudRate = totalTrials > 0 ? (fraudulentTrials / totalTrials) * 100 : 0

    return {
      totalTrials,
      activeTrials,
      convertedTrials,
      fraudulentTrials,
      conversionRate: Math.round(conversionRate * 100) / 100,
      fraudRate: Math.round(fraudRate * 100) / 100
    }
  }

  /**
   * Get recent trial usage for monitoring
   */
  static async getRecentTrialUsage(limit: number = 50) {
    return prisma.trialUsage.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, email: true }
        },
        plan: {
          select: { name: true, tier: true }
        }
      }
    })
  }
}

export { TrialFraudPreventionService }
