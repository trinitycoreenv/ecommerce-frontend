'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { PlanSelection } from '@/components/subscription/plan-selection'
import { useToast } from '@/hooks/use-toast'

interface SubscriptionPlan {
  id: string
  name: string
  tier: 'BASIC' | 'PREMIUM' | 'ENTERPRISE'
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

export default function VendorPlanSelection() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [plansLoading, setPlansLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      setPlansLoading(true)
      const response = await fetch('/api/subscription-plans')
      if (response.ok) {
        const data = await response.json()
        setPlans(data.data)
      } else {
        toast({
          title: "Error",
          description: "Failed to load subscription plans",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error fetching plans:', error)
      toast({
        title: "Error",
        description: "Failed to load subscription plans",
        variant: "destructive"
      })
    } finally {
      setPlansLoading(false)
    }
  }

  const handlePlanSelect = (planId: string) => {
    setSelectedPlanId(planId)
  }

  const handleContinue = async () => {
    if (!selectedPlanId) {
      toast({
        title: "Selection Required",
        description: "Please select a subscription plan to continue",
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)
      
      // Store the selected plan in session storage for the next step
      sessionStorage.setItem('selectedPlanId', selectedPlanId)
      
      // Navigate to completion step
      router.push('/register/vendor/complete')
    } catch (error) {
      console.error('Error continuing:', error)
      toast({
        title: "Error",
        description: "Failed to continue with plan selection",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    router.push('/register/vendor')
  }

  if (plansLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading subscription plans...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Registration
          </Button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Choose Your Subscription Plan
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Select the perfect plan for your business. You can upgrade or downgrade at any time.
          </p>
        </div>

        {/* Plan Selection */}
        <Card className="max-w-6xl mx-auto">
          <CardContent className="p-8">
            <PlanSelection
              plans={plans}
              selectedPlanId={selectedPlanId}
              onPlanSelect={handlePlanSelect}
              onContinue={handleContinue}
              loading={loading}
            />
          </CardContent>
        </Card>

        {/* Additional Information */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Free Trial</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Start with a free trial on any plan. No credit card required to begin.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Flexible Billing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Choose monthly or yearly billing. Save 20% with annual plans.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Easy Upgrades</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Upgrade or downgrade your plan anytime as your business grows.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="mt-12">
          <h3 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h3>
          <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I change my plan later?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What happens after the trial?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  After your trial period, you'll be automatically charged for your selected plan unless you cancel.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Are there any setup fees?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  No setup fees. You only pay the monthly or yearly subscription fee for your chosen plan.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What payment methods do you accept?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  We accept all major credit cards, PayPal, and bank transfers for annual plans.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
