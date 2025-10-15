"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { CreditCard, Lock, Loader2, AlertCircle, Shield } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'

interface StripeSubscriptionFormProps {
  planId: string
  planName: string
  amount: number
  currency?: string
  hasFreeTrial?: boolean
  trialDays?: number
  onSubscriptionSuccess: (subscriptionId: string) => void
  onSubscriptionError: (error: string) => void
  disabled?: boolean
}

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// Subscription form component that uses Stripe Elements
function SubscriptionForm({
  planId,
  planName,
  amount,
  currency = 'usd',
  hasFreeTrial = false,
  trialDays = 14,
  onSubscriptionSuccess,
  onSubscriptionError,
  disabled = false
}: StripeSubscriptionFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isLoading, setIsLoading] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (planId && amount > 0) {
      createSubscriptionSetupIntent()
    }
  }, [planId, amount])

  const createSubscriptionSetupIntent = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/subscriptions/create-setup-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          planId,
          planName,
          amount,
          currency,
          hasFreeTrial,
          trialDays
        })
      })

      const data = await response.json()

      console.log('Setup intent response:', data)

      if (data.success) {
        setClientSecret(data.data.clientSecret)
        setCustomerId(data.data.customerId)
      } else {
        console.error('Setup intent failed:', data.error)
        throw new Error(data.error || 'Failed to create setup intent')
      }
    } catch (error) {
      console.error('Failed to create setup intent:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create setup intent'
      setError(errorMessage)
      onSubscriptionError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubscription = async () => {
    if (!stripe || !elements || !clientSecret) {
      setError('Payment system not ready')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const cardElement = elements.getElement(CardElement)
      if (!cardElement) {
        throw new Error('Card element not found')
      }

      // Confirm setup intent with Stripe Elements
      const { error: stripeError, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: cardElement,
        }
      })

      console.log('Setup intent confirmation result:', { stripeError, setupIntent })

      if (stripeError) {
        console.error('Stripe setup intent error:', stripeError)
        throw new Error(stripeError.message || 'Payment method setup failed')
      }

      if (setupIntent?.status === 'succeeded') {
        // Create subscription with the payment method
        const subscriptionResponse = await fetch('/api/subscriptions/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          },
          body: JSON.stringify({
            planId,
            planName,
            amount,
            currency,
            hasFreeTrial,
            trialDays,
            paymentMethodId: setupIntent.payment_method,
            customerId: customerId
          })
        })

        const subscriptionData = await subscriptionResponse.json()

        console.log('Subscription response:', subscriptionData)

        if (subscriptionData.success) {
          onSubscriptionSuccess(subscriptionData.data.subscriptionId)
          toast({
            title: "Subscription created!",
            description: hasFreeTrial 
              ? `Your ${trialDays}-day free trial has started!`
              : "Your subscription is now active."
          })
        } else {
          console.error('Subscription failed:', subscriptionData.error)
          throw new Error(subscriptionData.error || 'Failed to create subscription')
        }
      } else {
        throw new Error('Payment method setup not successful')
      }
    } catch (error) {
      console.error('Subscription failed:', error)
      let errorMessage = 'Subscription failed'
      
      if (error instanceof Error) {
        errorMessage = error.message
        // Handle specific Stripe errors
        if (error.message.includes('payment_method_already_attached')) {
          errorMessage = 'This payment method is already in use. Please try a different card.'
        } else if (error.message.includes('card_declined')) {
          errorMessage = 'Your card was declined. Please try a different payment method.'
        } else if (error.message.includes('expired_card')) {
          errorMessage = 'Your card has expired. Please use a different card.'
        } else if (error.message.includes('incorrect_cvc')) {
          errorMessage = 'Your card\'s security code is incorrect. Please try again.'
        }
      }
      
      setError(errorMessage)
      onSubscriptionError(errorMessage)
      toast({
        title: "Subscription failed",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    if (currency.toLowerCase() === 'php') {
      return `₱${price.toLocaleString('en-PH')}`
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(price)
  }

  if (!stripe || !elements) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Loading payment system...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
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
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Card Information</label>
            <div className="p-3 border border-gray-200 rounded-lg bg-white">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#424770',
                      '::placeholder': {
                        color: '#aab7c4',
                      },
                    },
                    invalid: {
                      color: '#9e2146',
                    },
                  },
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="h-4 w-4" />
            <span>Your payment information is secure and encrypted with Stripe</span>
          </div>

          <Button
            onClick={handleSubscription}
            disabled={disabled || isLoading || !clientSecret || !stripe}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {hasFreeTrial ? 'Starting Free Trial...' : 'Creating Subscription...'}
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                {hasFreeTrial ? `Start ${trialDays}-Day Free Trial` : `Subscribe for ${formatPrice(amount)}/month`}
              </>
            )}
          </Button>
        </div>

        {!clientSecret && !isLoading && (
          <div className="text-center text-sm text-muted-foreground mt-4">
            <p>Preparing secure payment...</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Main wrapper component with Stripe Elements provider
export function StripeSubscriptionForm(props: StripeSubscriptionFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <SubscriptionForm {...props} />
    </Elements>
  )
}
