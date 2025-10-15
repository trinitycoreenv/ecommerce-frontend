"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Check, ArrowLeft, CreditCard, Shield, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { StripeSubscriptionForm } from "@/components/shared/stripe-subscription-form"

interface PlanData {
  id: string
  name: string
  tier: string
  price: number
  hasFreeTrial: boolean
  trialDays: number
}

export default function SubscriptionSignupPage() {
  const [plan, setPlan] = useState<PlanData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    billingAddress: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US'
  })
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [subscriptionSuccess, setSubscriptionSuccess] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()

  useEffect(() => {
    const planParam = searchParams.get('plan')
    console.log('Plan param from URL:', planParam)
    console.log('User object:', user)
    
    if (planParam) {
      try {
        const planData = JSON.parse(decodeURIComponent(planParam))
        console.log('Parsed plan data:', planData)
        setPlan(planData)
      } catch (error) {
        console.error('Error parsing plan data:', error)
        toast({
          title: "Error",
          description: "Invalid plan data. Please select a plan again.",
          variant: "destructive"
        })
        router.push('/vendor/subscription')
      }
    } else {
      router.push('/vendor/subscription')
    }
  }, [searchParams, router, toast, user])

  const handleInputChange = (field: string, value: string) => {
    setPaymentInfo(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = matches && matches[0] || ''
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    if (parts.length) {
      return parts.join(' ')
    } else {
      return v
    }
  }

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4)
    }
    return v
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!agreedToTerms) {
      toast({
        title: "Terms Required",
        description: "Please agree to the terms and conditions to continue.",
        variant: "destructive"
      })
      return
    }

    console.log('Submit - Plan:', plan)
    console.log('Submit - User:', user)
    console.log('Submit - User vendorId:', user?.vendorId)
    
    if (!plan) {
      toast({
        title: "Error",
        description: "Plan information is missing. Please select a plan again.",
        variant: "destructive"
      })
      return
    }

    if (!user) {
      toast({
        title: "Error",
        description: "User not authenticated. Please log in again.",
        variant: "destructive"
      })
      return
    }

    if (!user.vendorId) {
      // Try to create vendor profile if it doesn't exist
      try {
        const response = await fetch('/api/vendor/ensure-profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        })

        if (!response.ok) {
          throw new Error('Failed to create vendor profile')
        }

        const data = await response.json()
        console.log('Vendor profile created:', data)
        
        // Update user object with vendorId
        user.vendorId = data.data.vendor.id
        
        toast({
          title: "Vendor Profile Created",
          description: "Your vendor profile has been created. You can now proceed with the subscription.",
        })
      } catch (error) {
        console.error('Error creating vendor profile:', error)
        toast({
          title: "Error",
          description: "Failed to create vendor profile. Please contact support.",
          variant: "destructive"
        })
        return
      }
    }

    try {
      setIsLoading(true)

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Ensure we have vendorId after potential creation
      const currentVendorId = user.vendorId
      if (!currentVendorId) {
        throw new Error('Vendor ID is still missing after profile creation attempt')
      }

      // Create subscription in database
      const subscriptionData = {
        planId: plan.id,
        billingCycle: 'MONTHLY',
        startTrial: plan.hasFreeTrial
      }

      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(subscriptionData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create subscription')
      }

      if (plan.hasFreeTrial) {
        toast({
          title: "Free Trial Started!",
          description: `Your ${plan.trialDays}-day free trial for ${plan.name} has begun. You'll be charged ₱${plan.price}/month after the trial ends.`,
        })
      } else {
        toast({
          title: "Subscription Active!",
          description: `Your ${plan.name} subscription is now active. You'll be charged ₱${plan.price}/month.`,
        })
      }

      // Redirect to dashboard with refresh parameter
      setTimeout(() => {
        router.push('/vendor?refresh=true')
      }, 2000)

    } catch (error) {
      console.error('Error processing subscription:', error)
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "There was an error processing your payment. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubscriptionSuccess = async (subscriptionId: string) => {
    try {
      setSubscriptionSuccess(true)
      
      toast({
        title: "Subscription Created!",
        description: plan?.hasFreeTrial 
          ? `Your ${plan.trialDays}-day free trial has started!`
          : "Your subscription is now active."
      })
      
      // Redirect to vendor dashboard after a delay
      setTimeout(() => {
        router.push('/vendor?refresh=true')
      }, 3000)
    } catch (error) {
      console.error('Error after subscription success:', error)
    }
  }

  const handleSubscriptionError = (error: string) => {
    toast({
      title: "Subscription Failed",
      description: error,
      variant: "destructive"
    })
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground/80">Loading plan details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/vendor/subscription')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Plans
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Complete Your Subscription</h1>
          <p className="text-foreground/80 mt-2 font-medium">
            You're subscribing to the {plan.name} plan
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Plan Summary */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Plan Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-medium text-foreground">{plan.name}</span>
                <span className="text-2xl font-bold text-foreground">₱{plan.price}/month</span>
              </div>
              
              {plan.hasFreeTrial && (
                <div className="bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-900 dark:text-green-100">
                    <Clock className="h-4 w-4" />
                    <span className="font-semibold">Free Trial Included</span>
                  </div>
                  <p className="text-green-800 dark:text-green-200 text-sm mt-1 font-medium">
                    Start with a {plan.trialDays}-day free trial. You'll be charged ₱{plan.price}/month after the trial ends.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <h4 className="font-medium text-foreground">What's included:</h4>
                <ul className="space-y-1 text-sm text-foreground/80">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    Access to all platform features
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    Priority customer support
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    Advanced analytics and reporting
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    Cancel anytime
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Stripe Subscription Form */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Payment Information
              </CardTitle>
              <CardDescription className="text-foreground/80 font-medium">
                Your payment information is secure and encrypted
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!subscriptionSuccess ? (
                <StripeSubscriptionForm
                  planId={plan.id}
                  planName={plan.name}
                  amount={plan.price}
                  currency="usd"
                  hasFreeTrial={plan.hasFreeTrial}
                  trialDays={plan.trialDays}
                  onSubscriptionSuccess={handleSubscriptionSuccess}
                  onSubscriptionError={handleSubscriptionError}
                  disabled={isLoading}
                />
              ) : (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Subscription Created!</h3>
                    <p className="text-foreground/80">
                      {plan.hasFreeTrial 
                        ? `Your ${plan.trialDays}-day free trial has started!`
                        : "Your subscription is now active."
                      }
                    </p>
                  </div>
                  <p className="text-sm text-foreground/60">
                    Redirecting to your dashboard...
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
