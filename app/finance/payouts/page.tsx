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
  Users, 
  Calendar,
  Search,
  Filter,
  Plus,
  Settings,
  Loader2,
  RefreshCw,
  Play,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Banknote
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { AnimatedCounter } from "@/components/ui/animated-counter"
import { StatusBadge } from "@/components/shared/status-badge"
import { ExportDropdown } from "@/components/shared/export-dropdown"
import { AnalyticsExportUtils } from "@/lib/export-service"

interface Payout {
  id: string
  vendorId: string
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
  vendor: {
    id: string
    businessName: string
    user: {
      name: string
      email: string
    }
  }
  commissions: Array<{
    id: string
    amount: number
    order: {
      orderNumber: string
    }
  }>
}

interface PayoutStats {
  PENDING?: { count: number; total: number }
  PROCESSING?: { count: number; total: number }
  COMPLETED?: { count: number; total: number }
  FAILED?: { count: number; total: number }
  CANCELLED?: { count: number; total: number }
}

export default function FinancePayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<PayoutStats>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [vendorFilter, setVendorFilter] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isCreatingPayout, setIsCreatingPayout] = useState(false)
  const { toast } = useToast()

  // Create payout form state
  const [payoutForm, setPayoutForm] = useState({
    vendorId: "",
    amount: "",
    scheduledDate: new Date().toISOString().split('T')[0],
    notes: ""
  })

  useEffect(() => {
    loadPayouts()
  }, [searchTerm, statusFilter, vendorFilter])

  const loadPayouts = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter) params.append('status', statusFilter)
      if (vendorFilter) params.append('vendorId', vendorFilter)
      
      const response = await fetch(`/api/finance/payouts?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      console.log('Finance Payout API - Response status:', response.status)
      const data = await response.json()
      console.log('Finance Payout API - Response data:', data)
      
      if (data.success) {
        setPayouts(data.data)
        setStats(data.stats)
        console.log('Finance Payout API - Data set:', data.data, data.stats)
      } else {
        console.error('Finance Payout API - Error:', data.error)
        toast({
          title: "Error",
          description: data.error || "Failed to load payout data",
          variant: "destructive"
        })
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

  const handleProcessPayout = async (payoutId: string) => {
    try {
      setIsProcessing(true)
      
      const response = await fetch(`/api/finance/payouts/${payoutId}/process`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Payout processed successfully"
        })
        loadPayouts()
      } else {
        throw new Error(data.error || 'Failed to process payout')
      }
    } catch (error) {
      console.error("Failed to process payout:", error)
      toast({
        title: "Error",
        description: "Failed to process payout. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleProcessAllPayouts = async () => {
    try {
      setIsProcessing(true)
      
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/payouts/process-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "Success",
          description: data.message
        })
        loadPayouts()
      } else {
        throw new Error(data.error || 'Failed to process payouts')
      }
    } catch (error) {
      console.error("Failed to process all payouts:", error)
      toast({
        title: "Error",
        description: "Failed to process payouts. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRetryFailedPayouts = async () => {
    try {
      setIsProcessing(true)
      
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/payouts/process-all', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "Success",
          description: data.message
        })
        loadPayouts()
      } else {
        throw new Error(data.error || 'Failed to retry payouts')
      }
    } catch (error) {
      console.error("Failed to retry failed payouts:", error)
      toast({
        title: "Error",
        description: "Failed to retry payouts. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCreatePayout = async () => {
    try {
      setIsCreatingPayout(true)
      
      const response = await fetch('/api/finance/payouts', {
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
          title: "Payout created",
          description: "The payout has been created successfully."
        })
        
        setIsCreateDialogOpen(false)
        setPayoutForm({
          vendorId: "",
          amount: "",
          scheduledDate: new Date().toISOString().split('T')[0],
          notes: ""
        })
        
        loadPayouts()
      } else {
        throw new Error(data.error || 'Failed to create payout')
      }
    } catch (error) {
      console.error("Failed to create payout:", error)
      toast({
        title: "Error",
        description: "Failed to create payout. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsCreatingPayout(false)
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payout Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage vendor payouts and automated payment processing
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadPayouts} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {payouts.length > 0 && (
            <ExportDropdown
              data={AnalyticsExportUtils.transformPayoutData(payouts, stats)}
              filename="finance-payout-management-report"
              className="h-10 w-10 p-0"
            />
          )}
          <Button 
            onClick={handleProcessAllPayouts} 
            disabled={isProcessing}
            variant="outline"
          >
            <Play className="h-4 w-4 mr-2" />
            Process All
          </Button>
          <Button 
            onClick={handleRetryFailedPayouts} 
            disabled={isProcessing}
            variant="outline"
          >
            <AlertCircle className="h-4 w-4 mr-2" />
            Retry Failed
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Payout
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {isLoading ? <Skeleton className="h-8 w-16" /> : <AnimatedCounter value={stats.PENDING?.count || 0} />}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {formatPrice(stats.PENDING?.total || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Processing</CardTitle>
              <Loader2 className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {isLoading ? <Skeleton className="h-8 w-16" /> : <AnimatedCounter value={stats.PROCESSING?.count || 0} />}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {formatPrice(stats.PROCESSING?.total || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {isLoading ? <Skeleton className="h-8 w-16" /> : <AnimatedCounter value={stats.COMPLETED?.count || 0} />}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {formatPrice(stats.COMPLETED?.total || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Failed</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {isLoading ? <Skeleton className="h-8 w-16" /> : <AnimatedCounter value={stats.FAILED?.count || 0} />}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {formatPrice(stats.FAILED?.total || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Processed</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-20" /> : formatPrice(
                (stats.COMPLETED?.total || 0) + 
                (stats.PROCESSING?.total || 0) + 
                (stats.PENDING?.total || 0)
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="search">Search Payouts</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by vendor or payout ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PROCESSING">Processing</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendor">Vendor</Label>
              <Select value={vendorFilter} onValueChange={setVendorFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All vendors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All vendors</SelectItem>
                  {/* This would be populated from API */}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payouts List */}
      <div className="space-y-4">
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
              <h3 className="text-lg font-semibold mb-2">No payouts found</h3>
              <p className="text-muted-foreground">
                No payouts match your current filters.
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
                      {payout.vendor.businessName} • {formatDate(payout.scheduledDate)}
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      {payout.retryCount > 0 && (
                        <span className="text-orange-600">Retries: {payout.retryCount}/{payout.maxRetries}</span>
                      )}
                    </div>
                    {payout.failureReason && (
                      <p className="text-sm text-red-600">Error: {payout.failureReason}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{formatPrice(payout.amount)}</p>
                    <p className="text-sm text-muted-foreground">Payout Amount</p>
                    {payout.status === 'PENDING' && (
                      <Button 
                        size="sm" 
                        className="mt-2"
                        onClick={() => handleProcessPayout(payout.id)}
                        disabled={isProcessing}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Process
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Payout Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Manual Payout</DialogTitle>
            <DialogDescription>
              Create a manual payout for a vendor.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vendorId">Vendor</Label>
              <Select value={payoutForm.vendorId} onValueChange={(value) => setPayoutForm(prev => ({ ...prev, vendorId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  {/* This would be populated from API */}
                  <SelectItem value="no-vendors">No vendors available</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="100.00"
                  value={payoutForm.amount}
                  onChange={(e) => setPayoutForm(prev => ({ ...prev, amount: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduledDate">Scheduled Date</Label>
                <Input
                  id="scheduledDate"
                  type="date"
                  value={payoutForm.scheduledDate}
                  onChange={(e) => setPayoutForm(prev => ({ ...prev, scheduledDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                placeholder="Additional notes for this payout"
                value={payoutForm.notes}
                onChange={(e) => setPayoutForm(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePayout} disabled={isCreatingPayout || !payoutForm.vendorId || !payoutForm.amount}>
              {isCreatingPayout ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Payout'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}