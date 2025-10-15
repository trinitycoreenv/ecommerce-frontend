import { prisma } from '@/lib/prisma'

export interface SubscriptionPlan {
  id: string
  name: string
  tier: 'STARTER' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE'
  description?: string
  price: number
  billingCycle: 'MONTHLY' | 'YEARLY'
  commissionRate: number
  maxProducts?: number
  maxOrders?: number
  features: string[]
  isActive: boolean
  isPopular: boolean
  trialDays: number
}

export interface Subscription {
  id: string
  vendorId: string
  planId: string
  tier: 'STARTER' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE'
  startDate: Date
  endDate?: Date
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'CANCELLED'
  price: number
  billingCycle: 'MONTHLY' | 'YEARLY'
  nextBillingDate?: Date
  trialEndDate?: Date
  stripeSubscriptionId?: string
  stripeCustomerId?: string
  autoRenew: boolean
}

export interface SubscriptionCreateInput {
  vendorId: string
  planId: string
  billingCycle: 'MONTHLY' | 'YEARLY'
  stripeCustomerId?: string
  startTrial?: boolean
}

export interface SubscriptionUpdateInput {
  planId?: string
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'CANCELLED'
  autoRenew?: boolean
  stripeSubscriptionId?: string
}

export class SubscriptionService {
  /**
   * Get all available subscription plans
   */
  static async getAvailablePlans(): Promise<SubscriptionPlan[]> {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: [
        { tier: 'asc' },
        { price: 'asc' }
      ]
    })

    return plans.map(plan => ({
      id: plan.id,
      name: plan.name,
      tier: plan.tier as any,
      description: plan.description || undefined,
      price: Number(plan.price),
      billingCycle: plan.billingCycle as any,
      commissionRate: Number(plan.commissionRate),
      maxProducts: plan.maxProducts || undefined,
      maxOrders: plan.maxOrders || undefined,
      features: plan.features as string[],
      isActive: plan.isActive,
      isPopular: plan.isPopular,
      trialDays: plan.trialDays
    }))
  }

  /**
   * Get subscription plan by ID
   */
  static async getPlanById(planId: string): Promise<SubscriptionPlan | null> {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId }
    })

    if (!plan) return null

    return {
      id: plan.id,
      name: plan.name,
      tier: plan.tier as any,
      description: plan.description || undefined,
      price: Number(plan.price),
      billingCycle: plan.billingCycle as any,
      commissionRate: Number(plan.commissionRate),
      maxProducts: plan.maxProducts || undefined,
      maxOrders: plan.maxOrders || undefined,
      features: plan.features as string[],
      isActive: plan.isActive,
      isPopular: plan.isPopular,
      trialDays: plan.trialDays
    }
  }

  /**
   * Create a new subscription
   */
  static async createSubscription(input: SubscriptionCreateInput): Promise<Subscription> {
    const plan = await this.getPlanById(input.planId)
    if (!plan) {
      throw new Error('Subscription plan not found')
    }

    const startDate = new Date()
    const trialEndDate = input.startTrial ? new Date(Date.now() + plan.trialDays * 24 * 60 * 60 * 1000) : undefined
    const nextBillingDate = input.startTrial ? trialEndDate : this.calculateNextBillingDate(startDate, input.billingCycle)

    const subscription = await prisma.subscription.create({
      data: {
        vendorId: input.vendorId,
        planId: input.planId,
        tier: plan.tier,
        startDate,
        endDate: input.billingCycle === 'YEARLY' ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : undefined,
        status: input.startTrial ? 'ACTIVE' : 'ACTIVE',
        price: plan.price,
        billingCycle: input.billingCycle,
        nextBillingDate,
        trialEndDate,
        stripeCustomerId: input.stripeCustomerId,
        autoRenew: true
      },
      include: {
        plan: true
      }
    })

    // Update vendor's subscription tier and commission rate
    await prisma.vendor.update({
      where: { id: input.vendorId },
      data: {
        subscriptionTier: plan.tier,
        commissionRate: plan.commissionRate
      }
    })

    return {
      id: subscription.id,
      vendorId: subscription.vendorId,
      planId: subscription.planId,
      tier: subscription.tier as any,
      startDate: subscription.startDate,
      endDate: subscription.endDate || undefined,
      status: subscription.status as any,
      price: Number(subscription.price),
      billingCycle: subscription.billingCycle as any,
      nextBillingDate: subscription.nextBillingDate || undefined,
      trialEndDate: subscription.trialEndDate || undefined,
      stripeSubscriptionId: subscription.stripeSubscriptionId || undefined,
      stripeCustomerId: subscription.stripeCustomerId || undefined,
      autoRenew: subscription.autoRenew
    }
  }

  /**
   * Get vendor's current subscription
   */
  static async getVendorSubscription(vendorId: string): Promise<Subscription | null> {
    const subscription = await prisma.subscription.findFirst({
      where: {
        vendorId,
        status: 'ACTIVE'
      },
      include: {
        plan: true
      },
      orderBy: { createdAt: 'desc' }
    })

    if (!subscription) return null

    return {
      id: subscription.id,
      vendorId: subscription.vendorId,
      planId: subscription.planId,
      tier: subscription.tier as any,
      startDate: subscription.startDate,
      endDate: subscription.endDate || undefined,
      status: subscription.status as any,
      price: Number(subscription.price),
      billingCycle: subscription.billingCycle as any,
      nextBillingDate: subscription.nextBillingDate || undefined,
      trialEndDate: subscription.trialEndDate || undefined,
      stripeSubscriptionId: subscription.stripeSubscriptionId || undefined,
      stripeCustomerId: subscription.stripeCustomerId || undefined,
      autoRenew: subscription.autoRenew
    }
  }

  /**
   * Update subscription
   */
  static async updateSubscription(subscriptionId: string, input: SubscriptionUpdateInput): Promise<Subscription> {
    const subscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        planId: input.planId,
        status: input.status,
        autoRenew: input.autoRenew,
        stripeSubscriptionId: input.stripeSubscriptionId
      },
      include: {
        plan: true
      }
    })

    // Update vendor's subscription tier and commission rate if plan changed
    if (input.planId) {
      const plan = await this.getPlanById(input.planId)
      if (plan) {
        await prisma.vendor.update({
          where: { id: subscription.vendorId },
          data: {
            subscriptionTier: plan.tier,
            commissionRate: plan.commissionRate
          }
        })
      }
    }

    return {
      id: subscription.id,
      vendorId: subscription.vendorId,
      planId: subscription.planId,
      tier: subscription.tier as any,
      startDate: subscription.startDate,
      endDate: subscription.endDate || undefined,
      status: subscription.status as any,
      price: Number(subscription.price),
      billingCycle: subscription.billingCycle as any,
      nextBillingDate: subscription.nextBillingDate || undefined,
      trialEndDate: subscription.trialEndDate || undefined,
      stripeSubscriptionId: subscription.stripeSubscriptionId || undefined,
      stripeCustomerId: subscription.stripeCustomerId || undefined,
      autoRenew: subscription.autoRenew
    }
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(subscriptionId: string): Promise<void> {
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'CANCELLED',
        autoRenew: false,
        endDate: new Date()
      }
    })

    // Update vendor's subscription tier to BASIC
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId }
    })

    if (subscription) {
      await prisma.vendor.update({
        where: { id: subscription.vendorId },
        data: {
          subscriptionTier: 'BASIC',
          commissionRate: 0.15 // Default commission rate
        }
      })
    }
  }

  /**
   * Upgrade subscription plan
   */
  static async upgradeSubscription(subscriptionId: string, newPlanId: string): Promise<Subscription> {
    const newPlan = await this.getPlanById(newPlanId)
    if (!newPlan) {
      throw new Error('New subscription plan not found')
    }

    const currentSubscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId }
    })

    if (!currentSubscription) {
      throw new Error('Subscription not found')
    }

    // Calculate prorated amount for upgrade
    const proratedAmount = this.calculateProratedAmount(
      currentSubscription,
      newPlan,
      currentSubscription.billingCycle
    )

    // Update subscription
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        planId: newPlanId,
        tier: newPlan.tier,
        price: newPlan.price,
        commissionRate: newPlan.commissionRate,
        nextBillingDate: this.calculateNextBillingDate(new Date(), currentSubscription.billingCycle)
      },
      include: {
        plan: true
      }
    })

    // Update vendor's subscription tier and commission rate
    await prisma.vendor.update({
      where: { id: currentSubscription.vendorId },
      data: {
        subscriptionTier: newPlan.tier,
        commissionRate: newPlan.commissionRate
      }
    })

    return {
      id: updatedSubscription.id,
      vendorId: updatedSubscription.vendorId,
      planId: updatedSubscription.planId,
      tier: updatedSubscription.tier as any,
      startDate: updatedSubscription.startDate,
      endDate: updatedSubscription.endDate || undefined,
      status: updatedSubscription.status as any,
      price: Number(updatedSubscription.price),
      billingCycle: updatedSubscription.billingCycle as any,
      nextBillingDate: updatedSubscription.nextBillingDate || undefined,
      trialEndDate: updatedSubscription.trialEndDate || undefined,
      stripeSubscriptionId: updatedSubscription.stripeSubscriptionId || undefined,
      stripeCustomerId: updatedSubscription.stripeCustomerId || undefined,
      autoRenew: updatedSubscription.autoRenew
    }
  }

  /**
   * Get subscription statistics
   */
  static async getSubscriptionStats(): Promise<{
    totalSubscriptions: number
    activeSubscriptions: number
    trialSubscriptions: number
    cancelledSubscriptions: number
    planBreakdown: Array<{
      tier: string
      count: number
      percentage: number
    }>
    monthlyRevenue: number
    yearlyRevenue: number
  }> {
    const subscriptions = await prisma.subscription.findMany({
      include: {
        plan: true
      }
    })

    const totalSubscriptions = subscriptions.length
    const activeSubscriptions = subscriptions.filter(s => s.status === 'ACTIVE').length
    const trialSubscriptions = subscriptions.filter(s => s.trialEndDate && s.trialEndDate > new Date()).length
    const cancelledSubscriptions = subscriptions.filter(s => s.status === 'CANCELLED').length

    // Plan breakdown
    const planCounts = subscriptions.reduce((acc, subscription) => {
      const tier = subscription.tier
      acc[tier] = (acc[tier] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const planBreakdown = Object.entries(planCounts).map(([tier, count]) => ({
      tier,
      count,
      percentage: Math.round((count / totalSubscriptions) * 100)
    }))

    // Revenue calculation
    const monthlyRevenue = subscriptions
      .filter(s => s.status === 'ACTIVE' && s.billingCycle === 'MONTHLY')
      .reduce((sum, s) => sum + Number(s.price), 0)

    const yearlyRevenue = subscriptions
      .filter(s => s.status === 'ACTIVE' && s.billingCycle === 'YEARLY')
      .reduce((sum, s) => sum + Number(s.price), 0)

    return {
      totalSubscriptions,
      activeSubscriptions,
      trialSubscriptions,
      cancelledSubscriptions,
      planBreakdown,
      monthlyRevenue,
      yearlyRevenue
    }
  }

  /**
   * Check if vendor can add more products based on their plan
   */
  static async canAddProduct(vendorId: string): Promise<boolean> {
    const subscription = await this.getVendorSubscription(vendorId)
    if (!subscription) return false

    const plan = await this.getPlanById(subscription.planId)
    if (!plan || !plan.maxProducts) return true

    const productCount = await prisma.product.count({
      where: { vendorId }
    })

    return productCount < plan.maxProducts
  }

  /**
   * Check if vendor can process more orders based on their plan
   */
  static async canProcessOrder(vendorId: string): Promise<boolean> {
    const subscription = await this.getVendorSubscription(vendorId)
    if (!subscription) return false

    const plan = await this.getPlanById(subscription.planId)
    if (!plan || !plan.maxOrders) return true

    const orderCount = await prisma.order.count({
      where: {
        vendorId,
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) // Current month
        }
      }
    })

    return orderCount < plan.maxOrders
  }

  /**
   * Calculate next billing date
   */
  private static calculateNextBillingDate(startDate: Date, billingCycle: string): Date {
    const nextDate = new Date(startDate)
    
    if (billingCycle === 'MONTHLY') {
      nextDate.setMonth(nextDate.getMonth() + 1)
    } else if (billingCycle === 'YEARLY') {
      nextDate.setFullYear(nextDate.getFullYear() + 1)
    }
    
    return nextDate
  }

  /**
   * Calculate prorated amount for plan changes
   */
  private static calculateProratedAmount(
    currentSubscription: any,
    newPlan: SubscriptionPlan,
    billingCycle: string
  ): number {
    const now = new Date()
    const nextBillingDate = currentSubscription.nextBillingDate || new Date()
    const daysRemaining = Math.ceil((nextBillingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    const totalDays = billingCycle === 'MONTHLY' ? 30 : 365
    const proratedRatio = daysRemaining / totalDays
    
    return newPlan.price * proratedRatio
  }

  /**
   * Initialize default subscription plans
   */
  static async initializeDefaultPlans(): Promise<void> {
    const existingPlans = await prisma.subscriptionPlan.count()
    if (existingPlans > 0) return

    const defaultPlans = [
      {
        name: 'Starter Plan',
        tier: 'STARTER' as const,
        description: 'Perfect for getting started',
        price: 1000,
        billingCycle: 'MONTHLY' as const,
        commissionRate: 15.0,
        maxProducts: 10,
        maxOrders: 25,
        features: [
          'Up to 10 products',
          'Up to 25 orders/month',
          'Basic analytics',
          'Email support',
          '15% commission rate'
        ],
        isActive: true,
        isPopular: false,
        trialDays: 7
      },
      {
        name: 'Basic Plan',
        tier: 'BASIC' as const,
        description: 'For growing businesses',
        price: 2000,
        billingCycle: 'MONTHLY' as const,
        commissionRate: 12.0,
        maxProducts: 50,
        maxOrders: 100,
        features: [
          'Up to 50 products',
          'Up to 100 orders/month',
          'Basic analytics',
          'Email support',
          '12% commission rate'
        ],
        isActive: true,
        isPopular: false,
        trialDays: 14
      },
      {
        name: 'Pro Plan',
        tier: 'PREMIUM' as const,
        description: 'For established sellers',
        price: 5000,
        billingCycle: 'MONTHLY' as const,
        commissionRate: 8.0,
        maxProducts: 200,
        maxOrders: 500,
        features: [
          'Up to 200 products',
          'Up to 500 orders/month',
          'Advanced analytics',
          'Priority support',
          '8% commission rate',
          'Custom branding',
          'API access',
          '14-day free trial'
        ],
        isActive: true,
        isPopular: true,
        trialDays: 14
      },
      {
        name: 'Enterprise Plan',
        tier: 'ENTERPRISE' as const,
        description: 'For large operations',
        price: 10000,
        billingCycle: 'MONTHLY' as const,
        commissionRate: 5.0,
        maxProducts: null,
        maxOrders: null,
        features: [
          'Unlimited products',
          'Unlimited orders',
          'Premium analytics',
          'Dedicated support',
          '5% commission rate',
          'White-label solution',
          'Custom integrations',
          'SLA guarantee'
        ],
        isActive: true,
        isPopular: false,
        trialDays: 30
      }
    ]

    for (const plan of defaultPlans) {
      await prisma.subscriptionPlan.create({
        data: plan
      })
    }
  }
}