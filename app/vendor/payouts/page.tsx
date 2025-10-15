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
  DollarSign, 
  TrendingUp, 
  Calendar,
  Settings,
  Loader2,
  RefreshCw,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Banknote,
  CreditCard
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { AnimatedCounter } from "@/components/ui/animated-counter"
import { StatusBadge } from "@/components/shared/status-badge"
import { ExportDropdown } from "@/components/shared/export-dropdown"
import { AnalyticsExportUtils } from "@/lib/export-service"
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// Card input component for payout
function PayoutCardInput() {
  return (
    <div className="space-y-2">
      <Label>Card Details</Label>
      <div className="p-3 border border-gray-300 rounded-md bg-white">
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
  )
}

interface Payout {
  id: string
  amount: number
  scheduledDate: string
  status: string
  paymentMethod?: string
  paymentId?: string
  processedAt?: string
  failureReason?: string
  retryCount: number
  maxRetries: number
  notes?: string
  createdAt: string
  updatedAt: string
  commissions: Array<{
    id: string
    amount: number
    order: {
      orderNumber: string
      totalPrice: number
      createdAt: string
    }
  }>
}

interface PayoutSettings {
  id: string
  payoutFrequency: string
  minimumPayout: number
  payoutMethod: string
  stripeAccountId?: string
  bankAccountDetails?: any
  isActive: boolean
  lastPayoutDate?: string
  nextPayoutDate?: string
}

interface WalletData {
  availableBalance: number
  totalEarnings: number
  totalPaidOut: number
  pendingPayouts: number
  recentEarnings: number
  totalCommissions: number
  pendingCommissions: number
  pendingCommissionAmount: number
  recentCommissions: Array<{
    id: string
    amount: number
    orderNumber: string
    orderTotal: number
    rate: number
    createdAt: string
    status: string
  }>
  recentPayouts: Array<{
    id: string
    amount: number
    status: string
    scheduledDate: string
    processedAt?: string
    createdAt: string
  }>
}

export default function VendorPayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [settings, setSettings] = useState<PayoutSettings | null>(null)
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false)
  const [isPayoutDialogOpen, setIsPayoutDialogOpen] = useState(false)
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false)
  const [isProcessingPayout, setIsProcessingPayout] = useState(false)
  const { toast } = useToast()

  // Settings form state
  const [settingsForm, setSettingsForm] = useState({
    payoutFrequency: 'WEEKLY',
    minimumPayout: '50.00',
    payoutMethod: 'STRIPE',
    isActive: true
  })

  // Manual payout form state
  const [payoutForm, setPayoutForm] = useState({
    amount: '',
    notes: ''
  })

  useEffect(() => {
    loadPayouts()
    loadSettings()
    loadWalletData()
  }, [])

  const loadPayouts = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/payouts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      console.log('Vendor Payout API - Response status:', response.status)
      const data = await response.json()
      console.log('Vendor Payout API - Response data:', data)
      
      if (data.success) {
        setPayouts(data.data)
        console.log('Vendor Payout API - Data set:', data.data)
      } else {
        console.error('Vendor Payout API - Error:', data.error)
      }
    } catch (error) {
      console.error("Failed to load payouts:", error)
      toast({
        title: "Error",
        description: "Failed to load payouts",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/vendor-payout-settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      const data = await response.json()
      
      if (data.success) {
        setSettings(data.data)
        setSettingsForm({
          payoutFrequency: data.data.payoutFrequency,
          minimumPayout: data.data.minimumPayout.toString(),
          payoutMethod: data.data.payoutMethod,
          isActive: data.data.isActive
        })
      }
    } catch (error) {
      console.error("Failed to load settings:", error)
    }
  }

  const loadWalletData = async () => {
    try {
      const response = await fetch('/api/vendor/wallet', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      const data = await response.json()
      
      if (data.success) {
        setWalletData(data.data)
      }
    } catch (error) {
      console.error("Failed to load wallet data:", error)
    }
  }

  const handleUpdateSettings = async () => {
    try {
      setIsUpdatingSettings(true)
      
      const response = await fetch('/api/vendor-payout-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(settingsForm)
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Settings updated",
          description: "Your payout settings have been updated successfully."
        })
        
        setIsSettingsDialogOpen(false)
        loadSettings()
      } else {
        throw new Error(data.error || 'Failed to update settings')
      }
    } catch (error) {
      console.error("Failed to update settings:", error)
    toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsUpdatingSettings(false)
    }
  }

  const handleManualPayout = async () => {
    try {
      setIsProcessingPayout(true)
      
      const response = await fetch('/api/vendor/payout/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(payoutForm)
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Payout Requested",
          description: "Your payout request has been submitted and is being processed."
        })
        
        setIsPayoutDialogOpen(false)
        setPayoutForm({ amount: '', notes: '' })
        loadPayouts()
        loadWalletData()
      } else {
        throw new Error(data.error || 'Failed to process payout request')
      }
    } catch (error) {
      console.error("Failed to request payout:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process payout request. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsProcessingPayout(false)
    }
  }


  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }


  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'PROCESSING':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'CANCELLED':
        return <XCircle className="h-4 w-4 text-gray-500" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  // Calculate pending earnings from wallet data
  const pendingEarnings = walletData?.availableBalance || 0
  const totalEarnings = walletData?.totalEarnings || 0
  const totalPaidOut = walletData?.totalPaidOut || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payouts</h1>
          <p className="text-muted-foreground mt-2">
            Track your earnings and payout history
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadPayouts} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {payouts.length > 0 && (
            <ExportDropdown
              data={AnalyticsExportUtils.transformVendorPayoutData(payouts, walletData, settings)}
              filename="vendor-payout-report"
              className="h-10 w-10 p-0"
            />
          )}
          <Button 
            onClick={() => setIsPayoutDialogOpen(true)}
            className="bg-green-600 hover:bg-green-700"
            disabled={!walletData || walletData.availableBalance <= 0}
          >
            <Banknote className="h-4 w-4 mr-2" />
            Request Payout
          </Button>
          <Button onClick={() => setIsSettingsDialogOpen(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Payout Settings
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Wallet Balance</CardTitle>
              <Banknote className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {isLoading ? <Skeleton className="h-8 w-20" /> : formatPrice(pendingEarnings)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Available for payout</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Earned</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-20" /> : formatPrice(totalEarnings)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">All time earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Paid Out</CardTitle>
              <CheckCircle className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-20" /> : formatPrice(totalPaidOut)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Successfully paid</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Next Payout</CardTitle>
              <Calendar className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-20" /> : settings?.nextPayoutDate ? formatDate(settings.nextPayoutDate) : 'N/A'}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {settings?.payoutFrequency?.toLowerCase()} schedule
            </p>
          </CardContent>
        </Card>
      </div>


      {/* Payout Settings Summary */}
      {settings && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Current Payout Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Frequency</p>
                <p className="font-medium">{settings.payoutFrequency}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Minimum Payout</p>
                <p className="font-medium">{formatPrice(settings.minimumPayout)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payment Method</p>
                <p className="font-medium">{settings.payoutMethod}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={settings.isActive ? "default" : "secondary"}>
                  {settings.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payouts List */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Payout History</h2>
        
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : payouts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Banknote className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No payouts yet</h3>
              <p className="text-muted-foreground">
                Your payouts will appear here once you start earning income.
              </p>
            </CardContent>
          </Card>
        ) : (
          payouts.map((payout) => (
            <Card key={payout.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">Payout #{payout.id.slice(-8)}</h3>
                      {getStatusIcon(payout.status)}
                      <StatusBadge status={payout.status.toLowerCase() as any} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Scheduled: {formatDate(payout.scheduledDate)}
                      {payout.processedAt && ` • Processed: ${formatDate(payout.processedAt)}`}
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      {payout.paymentId && <span>ID: {payout.paymentId}</span>}
                    </div>
                    {payout.failureReason && (
                      <div className="flex items-center gap-2 text-sm text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        <span>Error: {payout.failureReason}</span>
                      </div>
                    )}
                    {payout.notes && (
                      <p className="text-sm text-muted-foreground">Note: {payout.notes}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{formatPrice(payout.amount)}</p>
                    <p className="text-sm text-muted-foreground">Payout Amount</p>
                  </div>
                </div>

              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Payout Settings Dialog */}
      <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payout Settings</DialogTitle>
            <DialogDescription>
              Configure your payout preferences and schedule.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="payoutFrequency">Payout Frequency</Label>
                <Select value={settingsForm.payoutFrequency} onValueChange={(value) => setSettingsForm(prev => ({ ...prev, payoutFrequency: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DAILY">Daily</SelectItem>
                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="minimumPayout">Minimum Payout Amount</Label>
                <Input
                  id="minimumPayout"
                  type="number"
                  step="0.01"
                  min="10"
                  max="10000"
                  placeholder="50.00"
                  value={settingsForm.minimumPayout}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, minimumPayout: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payoutMethod">Payment Method</Label>
              <Select value={settingsForm.payoutMethod} onValueChange={(value) => setSettingsForm(prev => ({ ...prev, payoutMethod: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STRIPE">Stripe (Recommended)</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="PAYPAL">PayPal</SelectItem>
                </SelectContent>
              </Select>
      </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={settingsForm.isActive}
                onChange={(e) => setSettingsForm(prev => ({ ...prev, isActive: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="isActive">Enable automatic payouts</Label>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsSettingsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateSettings} disabled={isUpdatingSettings}>
              {isUpdatingSettings ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Settings'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manual Payout Dialog */}
      <Dialog open={isPayoutDialogOpen} onOpenChange={setIsPayoutDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request Manual Payout</DialogTitle>
            <DialogDescription>
              Request an immediate payout from your available balance.
            </DialogDescription>
          </DialogHeader>

          <Elements stripe={stripePromise}>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-800">Available Balance</span>
                  <span className="text-lg font-bold text-green-600">
                    {formatPrice(walletData?.availableBalance || 0)}
                  </span>
                </div>
                {settings && (
                  <p className="text-xs text-green-600 mt-1">
                    Minimum payout: {formatPrice(settings.minimumPayout)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="payoutAmount">Payout Amount</Label>
                <Input
                  id="payoutAmount"
                  type="number"
                  step="0.01"
                  min={settings?.minimumPayout || 50}
                  max={walletData?.availableBalance || 0}
                  placeholder="Enter amount"
                  value={payoutForm.amount}
                  onChange={(e) => setPayoutForm(prev => ({ ...prev, amount: e.target.value }))}
                />
              </div>

              <PayoutCardInput />

              <div className="space-y-2">
                <Label htmlFor="payoutNotes">Notes (Optional)</Label>
                <Input
                  id="payoutNotes"
                  placeholder="Add a note for this payout"
                  value={payoutForm.notes}
                  onChange={(e) => setPayoutForm(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>
          </Elements>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsPayoutDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleManualPayout} 
              disabled={isProcessingPayout || !payoutForm.amount || parseFloat(payoutForm.amount) < (settings?.minimumPayout || 50)}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessingPayout ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Banknote className="mr-2 h-4 w-4" />
                  Request Payout
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}