'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Star, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SubscriptionPlan {
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

interface PlanSelectionProps {
  plans: SubscriptionPlan[]
  selectedPlanId?: string
  onPlanSelect: (planId: string) => void
  onContinue: () => void
  loading?: boolean
}

export function PlanSelection({ plans, selectedPlanId, onPlanSelect, onContinue, loading }: PlanSelectionProps) {
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY')

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'STARTER':
        return <Zap className="h-5 w-5 text-green-600 dark:text-green-400" />
      case 'BASIC':
        return <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
      case 'PREMIUM':
        return <Star className="h-5 w-5 text-purple-600 dark:text-purple-400" />
      case 'ENTERPRISE':
        return <Star className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
      default:
        return <Zap className="h-5 w-5 text-gray-600 dark:text-gray-400" />
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'STARTER':
        return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
      case 'BASIC':
        return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950'
      case 'PREMIUM':
        return 'border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950'
      case 'ENTERPRISE':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950'
      default:
        return 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900'
    }
  }

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'STARTER':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'BASIC':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'PREMIUM':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'ENTERPRISE':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  const calculatePrice = (plan: SubscriptionPlan) => {
    if (plan.price === 0) return 0 // Free plan
    if (billingCycle === 'YEARLY') {
      return Math.round(plan.price * 12 * 0.8) // 20% discount for yearly
    }
    return plan.price
  }

  const getBillingText = (plan: SubscriptionPlan) => {
    if (plan.price === 0) return 'Free Forever'
    if (billingCycle === 'YEARLY') {
      return `₱${Math.round(plan.price * 0.8)}/month billed yearly`
    }
    return `₱${plan.price}/month`
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold">Choose Your Plan</h2>
        <p className="text-muted-foreground text-lg">
          Select the perfect plan for your business needs
        </p>
        
        {/* Billing Toggle */}
        <div className="flex items-center justify-center space-x-4">
          <span className={cn("text-sm", billingCycle === 'MONTHLY' ? 'font-medium' : 'text-muted-foreground')}>
            Monthly
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBillingCycle(billingCycle === 'MONTHLY' ? 'YEARLY' : 'MONTHLY')}
            className="relative"
          >
            <div className={cn(
              "absolute left-1 top-1 h-4 w-4 rounded-full bg-primary transition-transform",
              billingCycle === 'YEARLY' ? 'translate-x-4' : 'translate-x-0'
            )} />
          </Button>
          <span className={cn("text-sm", billingCycle === 'YEARLY' ? 'font-medium' : 'text-muted-foreground')}>
            Yearly
          </span>
          {billingCycle === 'YEARLY' && (
            <Badge variant="secondary" className="ml-2">
              Save 20%
            </Badge>
          )}
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={cn(
              "relative cursor-pointer transition-all hover:shadow-lg",
              selectedPlanId === plan.id ? "ring-2 ring-primary" : "",
              getTierColor(plan.tier),
              plan.isPopular ? "scale-105" : ""
            )}
            onClick={() => onPlanSelect(plan.id)}
          >
            {plan.isPopular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">
                  Most Popular
                </Badge>
              </div>
            )}
            
            <CardHeader className="text-center pb-4">
              <div className="flex items-center justify-center mb-2">
                {getTierIcon(plan.tier)}
              </div>
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              
              <div className="mt-4">
                <div className="text-3xl font-bold">
                  ₱{calculatePrice(plan).toLocaleString('en-PH')}
                </div>
                <div className="text-sm text-muted-foreground">
                  {getBillingText(plan)}
                </div>
                {billingCycle === 'YEARLY' && (
                  <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Save ₱{Math.round(plan.price * 12 * 0.2).toLocaleString('en-PH')}/year
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Commission Rate */}
              <div className="text-center">
                <Badge className={getTierBadgeColor(plan.tier)}>
                  {plan.commissionRate}% Commission Rate
                </Badge>
              </div>

              {/* Features */}
              <div className="space-y-2">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Limits */}
              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Max Products:</span>
                  <span className="font-medium">{plan.maxProducts === -1 ? 'Unlimited' : plan.maxProducts}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Max Orders/Month:</span>
                  <span className="font-medium">{plan.maxOrders === -1 ? 'Unlimited' : plan.maxOrders}</span>
                </div>
                {plan.trialDays > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Trial Period:</span>
                    <span className="font-medium text-green-600 dark:text-green-400">{plan.trialDays} days</span>
                  </div>
                )}
                {plan.price === 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Plan Type:</span>
                    <span className="font-medium text-green-600 dark:text-green-400">Forever Free</span>
                  </div>
                )}
              </div>

              {/* Select Button */}
              <Button
                className="w-full"
                variant={selectedPlanId === plan.id ? "default" : "outline"}
                onClick={(e) => {
                  e.stopPropagation()
                  onPlanSelect(plan.id)
                }}
              >
                {selectedPlanId === plan.id 
                  ? 'Selected' 
                  : plan.price === 0 
                    ? 'Start Free' 
                    : 'Select Plan'
                }
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Continue Button */}
      <div className="text-center">
        <Button
          onClick={onContinue}
          disabled={!selectedPlanId || loading}
          size="lg"
          className="px-8"
        >
          {loading ? 'Processing...' : 'Continue with Selected Plan'}
        </Button>
        {!selectedPlanId && (
          <p className="text-sm text-muted-foreground mt-2">
            Please select a plan to continue
          </p>
        )}
      </div>

      {/* Trial Information */}
      <div className="text-center text-sm text-muted-foreground">
        <p>
          {plans.some(p => p.price === 0) 
            ? "Start with our free plan or try the Pro plan with a 14-day free trial (payment card required). You can upgrade anytime."
            : "Only the Pro plan includes a 14-day free trial with payment card verification. Other plans require immediate payment for access."
          }
        </p>
      </div>
    </div>
  )
}
