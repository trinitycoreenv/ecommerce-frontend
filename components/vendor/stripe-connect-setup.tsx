"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink,
  Loader2,
  Shield,
  DollarSign
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface StripeConnectData {
  hasStripeAccount: boolean
  accountId?: string
  accountStatus?: string
  chargesEnabled?: boolean
  payoutsEnabled?: boolean
  requirements?: any
  businessType?: string
  country?: string
  email?: string
  error?: string
}

interface StripeConnectSetupProps {
  onConnectSuccess?: () => void
}

export function StripeConnectSetup({ onConnectSuccess }: StripeConnectSetupProps) {
  const [stripeData, setStripeData] = useState<StripeConnectData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: 'individual',
    country: 'US',
    email: ''
  })

  const loadStripeStatus = async () => {
    try {
      const response = await fetch('/api/vendor/stripe-connect', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setStripeData(result.data)
        }
      }
    } catch (error) {
      console.error('Failed to load Stripe status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadStripeStatus()
  }, [])

  const handleCreateAccount = async () => {
    try {
      setIsCreating(true)
      
      const response = await fetch('/api/vendor/stripe-connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Stripe Account Created",
          description: "Redirecting to Stripe onboarding..."
        })
        
        // Redirect to Stripe onboarding
        window.location.href = result.data.onboardingUrl
      } else {
        throw new Error(result.error || 'Failed to create Stripe account')
      }
    } catch (error) {
      console.error('Failed to create Stripe account:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create Stripe account",
        variant: "destructive"
      })
    } finally {
      setIsCreating(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'complete':
        return <Badge className="bg-green-100 text-green-800">Complete</Badge>
      case 'incomplete':
        return <Badge className="bg-yellow-100 text-yellow-800">Incomplete</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading Stripe Connect status...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!stripeData?.hasStripeAccount) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Connect Stripe Account
          </CardTitle>
          <CardDescription>
            Connect your Stripe account to receive automated payouts directly to your bank account or card.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Secure & Fast Payouts</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Stripe Connect allows you to receive payouts directly to your bank account or card. 
                  All transactions are secure and processed by Stripe.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  placeholder="Your business name"
                  value={formData.businessName}
                  onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessType">Business Type</Label>
                <Select value={formData.businessType} onValueChange={(value) => setFormData(prev => ({ ...prev, businessType: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                    <SelectItem value="non_profit">Non-profit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select value={formData.country} onValueChange={(value) => setFormData(prev => ({ ...prev, country: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US">United States</SelectItem>
                    <SelectItem value="CA">Canada</SelectItem>
                    <SelectItem value="GB">United Kingdom</SelectItem>
                    <SelectItem value="AU">Australia</SelectItem>
                    <SelectItem value="PH">Philippines</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <Button 
            onClick={handleCreateAccount} 
            disabled={isCreating || !formData.businessName}
            className="w-full"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Connect Stripe Account
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            By connecting your Stripe account, you agree to Stripe's Terms of Service and Privacy Policy.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          Stripe Account Connected
        </CardTitle>
        <CardDescription>
          Your Stripe account is connected and ready to receive payouts.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Account Status</Label>
            <div className="flex items-center gap-2">
              {getStatusBadge(stripeData.accountStatus || 'unknown')}
              {stripeData.accountStatus === 'incomplete' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Re-open onboarding for incomplete accounts
                    window.location.href = `/api/vendor/stripe-connect/onboard?account=${stripeData.accountId}`
                  }}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Complete Setup
                </Button>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Payouts Enabled</Label>
            <div className="flex items-center gap-2">
              {stripeData.payoutsEnabled ? (
                <Badge className="bg-green-100 text-green-800">Enabled</Badge>
              ) : (
                <Badge className="bg-red-100 text-red-800">Disabled</Badge>
              )}
            </div>
          </div>
        </div>

        {stripeData.requirements && stripeData.requirements.currently_due?.length > 0 && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-900">Additional Information Required</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Please complete your Stripe account setup to enable payouts.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    window.location.href = `/api/vendor/stripe-connect/onboard?account=${stripeData.accountId}`
                  }}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Complete Setup
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-900">
              Your payouts will be automatically sent to your connected Stripe account.
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
