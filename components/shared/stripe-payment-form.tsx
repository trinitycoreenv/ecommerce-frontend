"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { CreditCard, Lock, Loader2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'

interface StripePaymentFormProps {
  orderId: string
  amount: number
  currency?: string
  onPaymentSuccess: (paymentIntentId: string) => void
  onPaymentError: (error: string) => void
  disabled?: boolean
}

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// Payment form component that uses Stripe Elements
function PaymentForm({
  orderId,
  amount,
  currency = 'php',
  onPaymentSuccess,
  onPaymentError,
  disabled = false
}: StripePaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isLoading, setIsLoading] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (orderId && amount > 0) {
      createPaymentIntent()
    }
  }, [orderId, amount])

  const createPaymentIntent = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId,
          amount,
          currency
        })
      })

      const data = await response.json()

      if (data.success) {
        setClientSecret(data.data.clientSecret)
      } else {
        throw new Error(data.error || 'Failed to create payment intent')
      }
    } catch (error) {
      console.error('Failed to create payment intent:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create payment intent'
      setError(errorMessage)
      onPaymentError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePayment = async () => {
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

      // Confirm payment with Stripe Elements
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        }
      })

      if (stripeError) {
        throw new Error(stripeError.message || 'Payment failed')
      }

      if (paymentIntent?.status === 'succeeded') {
        onPaymentSuccess(paymentIntent.id)
        toast({
          title: "Payment successful!",
          description: "Your payment has been processed successfully."
        })
      } else {
        throw new Error('Payment not successful')
      }
    } catch (error) {
      console.error('Payment failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Payment failed'
      setError(errorMessage)
      onPaymentError(errorMessage)
      toast({
        title: "Payment failed",
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Details
        </CardTitle>
        <CardDescription>
          Complete your payment to confirm your order
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Card Information</label>
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
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">Total Amount</span>
            <span className="text-2xl font-bold">{formatPrice(amount)}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="h-4 w-4" />
            <span>Your payment information is secure and encrypted with Stripe</span>
          </div>

          <Button
            onClick={handlePayment}
            disabled={disabled || isLoading || !clientSecret || !stripe}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing Payment...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Pay {formatPrice(amount)}
              </>
            )}
          </Button>
        </div>

        {!clientSecret && !isLoading && (
          <div className="text-center text-sm text-muted-foreground">
            <p>Preparing secure payment...</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Main wrapper component with Stripe Elements provider
export function StripePaymentForm(props: StripePaymentFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm {...props} />
    </Elements>
  )
}