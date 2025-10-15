"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Check, Star, Zap, Crown, Rocket, Sparkles, TrendingUp, Shield, ArrowRight, Circle, Hexagon, Square, Triangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"

interface SubscriptionPlan {
  id: string
  name: string
  tier: string
  price: number
  description?: string
  features: string[]
  isPopular?: boolean
  hasFreeTrial?: boolean
  trialDays?: number
  commissionRate: number
  maxProducts?: number
  maxOrders?: number
}

export default function SubscriptionPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentSubscription, setCurrentSubscription] = useState<any>(null)
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([])
  const [plansLoading, setPlansLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    fetchCurrentSubscription()
    fetchSubscriptionPlans()
  }, [])

  const fetchCurrentSubscription = async () => {
    try {
      const subscriptionsData = await apiClient.getSubscriptions()
      setCurrentSubscription(subscriptionsData.data?.[0] || null)
    } catch (error) {
      console.warn('Failed to fetch current subscription:', error)
    }
  }

  const fetchSubscriptionPlans = async () => {
    try {
      setPlansLoading(true)
      const response = await fetch('/api/subscription-plans')
      const data = await response.json()
      
      if (data.success) {
        const plans = data.data.map((plan: any) => ({
          ...plan,
          hasFreeTrial: plan.tier === 'PREMIUM' && plan.trialDays > 0 // Only PRO plan has free trial
        }))
        setSubscriptionPlans(plans)
      }
    } catch (error) {
      console.error('Failed to fetch subscription plans:', error)
      toast({
        title: "Error",
        description: "Failed to load subscription plans",
        variant: "destructive"
      })
    } finally {
      setPlansLoading(false)
    }
  }

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    try {
      setIsLoading(true)
      
      // Redirect to subscription signup page with plan details
      const planData = encodeURIComponent(JSON.stringify({
        id: plan.id,
        name: plan.name,
        tier: plan.tier,
        price: plan.price,
        hasFreeTrial: plan.hasFreeTrial,
        trialDays: plan.trialDays
      }))
      
      router.push(`/vendor/subscription/signup?plan=${planData}`)
    } catch (error) {
      console.error('Error selecting plan:', error)
      toast({
        title: "Error",
        description: "Failed to proceed with plan selection. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getPlanIcon = (tier: string) => {
    switch (tier) {
      case "STARTER":
        return <Circle className="h-4 w-4" />
      case "BASIC":
        return <Square className="h-4 w-4" />
      case "PREMIUM":
        return <Hexagon className="h-4 w-4" />
      case "ENTERPRISE":
        return <Triangle className="h-4 w-4" />
      default:
        return <Circle className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Choose Your Plan</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Select the perfect plan for your business needs. Start with our Pro plan and enjoy a free trial!
        </p>
      </div>

      {/* Current Subscription */}
      {currentSubscription && (
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Shield className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">Current Plan: {currentSubscription.tier}</h3>
                  <p className="text-blue-700 dark:text-blue-300 text-sm">
                    {currentSubscription.endDate 
                      ? `Expires on ${new Date(currentSubscription.endDate).toLocaleDateString()}`
                      : 'Active subscription'
                    }
                  </p>
                </div>
              </div>
              <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">
                {currentSubscription.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscription Plans */}
      {plansLoading ? (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse h-full flex flex-col">
              <CardHeader className="pb-2 flex-shrink-0">
                <div className="h-8 w-8 bg-muted rounded-full mx-auto mb-2"></div>
                <div className="h-3 bg-muted rounded w-3/4 mx-auto"></div>
                <div className="h-2 bg-muted rounded w-1/2 mx-auto"></div>
                <div className="h-5 bg-muted rounded w-1/3 mx-auto mt-2"></div>
              </CardHeader>
              <CardContent className="pt-0 flex-1 flex flex-col">
                <div className="h-px bg-muted mb-3"></div>
                <div className="space-y-1 flex-1">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="h-2 bg-muted rounded"></div>
                  ))}
                </div>
                <div className="h-8 bg-muted rounded mt-auto"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto pt-6">
          {subscriptionPlans.map((plan, index) => (
            <Card 
              key={plan.id} 
              className={cn(
                "relative group subscription-card card-entrance h-full flex flex-col",
                "transform-gpu perspective-1000",
                plan.isPopular 
                  ? "popular-card card-glow scale-105" 
                  : "hover:shadow-xl hover:border-primary/50"
              )}
              style={{
                transformStyle: 'preserve-3d',
                animationDelay: `${index * 100}ms`
              }}
            >
              {/* Popular Badge */}
              {plan.isPopular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                  <Badge className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg animate-pulse px-3 py-1 text-xs font-medium">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-3 flex-shrink-0">
                {/* Icon with 3D effect */}
                <div className={cn(
                  "mx-auto mb-2 h-8 w-8 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-6",
                  plan.isPopular 
                    ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg" 
                    : "bg-primary/10 text-primary group-hover:bg-primary/20"
                )}>
                  {getPlanIcon(plan.tier)}
                </div>
                
                <CardTitle className="text-base font-bold">{plan.name}</CardTitle>
                <CardDescription className="text-xs">{plan.description}</CardDescription>
                
                {/* Price with 3D effect */}
                <div className="mt-2 space-y-1">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-xl font-bold">₱{plan.price.toLocaleString()}</span>
                    <span className="text-muted-foreground text-xs">/month</span>
                  </div>
                  {plan.hasFreeTrial && (
                    <Badge variant="secondary" className="text-xs">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {plan.trialDays}-day free trial
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="pt-0 flex-1 flex flex-col">
                <Separator className="mb-3" />
                
                {/* Features */}
                <ul className="space-y-1 mb-4 flex-1">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-2 text-xs">
                      <Check className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                {/* CTA Button with 3D effect - Always at bottom */}
                <div className="mt-auto">
                  <Button 
                    className={cn(
                      "w-full btn-3d text-xs h-8",
                      plan.isPopular 
                        ? "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg" 
                        : "hover:shadow-md"
                    )}
                    variant={plan.isPopular ? "default" : "outline"}
                    onClick={() => handleSelectPlan(plan)}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-1">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                        Processing...
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        {plan.hasFreeTrial ? "Start Free Trial" : "Choose Plan"}
                        <ArrowRight className="h-3 w-3" />
                      </div>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

    </div>
  )
}
