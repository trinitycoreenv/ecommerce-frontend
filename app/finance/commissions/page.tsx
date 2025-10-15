"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Banknote
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { AnimatedCounter } from "@/components/ui/animated-counter"
import { StatusBadge } from "@/components/shared/status-badge"
import { ExportDropdown } from "@/components/shared/export-dropdown"
import { AnalyticsExportUtils } from "@/lib/export-service"

interface Commission {
  id: string
  orderId: string
  vendorId: string
  amount: number
  rate: number
  status: string
  calculatedAt: string
  paidAt?: string
  breakdown?: any
  order: {
    orderNumber: string
    totalPrice: number
    status: string
    createdAt: string
  }
  vendor: {
    id: string
    businessName: string
    user: {
      name: string
      email: string
    }
  }
}

interface CommissionRate {
  id: string
  vendorId: string
  categoryId?: string
  rate: number
  type: string
  minAmount?: number
  maxAmount?: number
  effectiveFrom: string
  effectiveTo?: string
  isActive: boolean
  vendor: {
    id: string
    businessName: string
  }
  category?: {
    id: string
    name: string
  }
}

interface CommissionStats {
  totalCommissions: number
  totalCount: number
  PENDING?: { count: number; total: number }
  CALCULATED?: { count: number; total: number }
  PAID?: { count: number; total: number }
  CANCELLED?: { count: number; total: number }
}

export default function FinanceCommissionsPage() {
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [commissionRates, setCommissionRates] = useState<CommissionRate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<CommissionStats>({
    totalCommissions: 0,
    totalCount: 0
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [vendorFilter, setVendorFilter] = useState("all")
  const [isRateDialogOpen, setIsRateDialogOpen] = useState(false)
  const [isCreatingRate, setIsCreatingRate] = useState(false)
  const { toast } = useToast()

  // Commission rate form state
  const [rateForm, setRateForm] = useState({
    vendorId: "",
    categoryId: "",
    rate: "",
    type: "PERCENTAGE",
    minAmount: "",
    maxAmount: "",
    effectiveFrom: new Date().toISOString().split('T')[0],
    effectiveTo: ""
  })

  useEffect(() => {
    loadCommissions()
    loadCommissionRates()
  }, [searchTerm, statusFilter, vendorFilter])

  const loadCommissions = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter) params.append('status', statusFilter)
      if (vendorFilter) params.append('vendorId', vendorFilter)
      
      const response = await fetch(`/api/finance/commissions/manage?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      console.log('Finance Commission API - Response status:', response.status)
      const data = await response.json()
      console.log('Finance Commission API - Response data:', data)
      
      if (data.success) {
        setCommissions(data.data)
        setStats(data.stats)
        console.log('Finance Commission API - Data set:', data.data, data.stats)
      } else {
        console.error('Finance Commission API - Error:', data.error)
        toast({
          title: "Error",
          description: data.error || "Failed to load commission data",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Failed to load commissions:", error)
      toast({
        title: "Error",
        description: "Failed to load commissions",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadCommissionRates = async () => {
    try {
      const response = await fetch('/api/commission-rates', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      const data = await response.json()
      
      if (data.success) {
        setCommissionRates(data.data)
      }
    } catch (error) {
      console.error("Failed to load commission rates:", error)
    }
  }

  const handleCreateRate = async () => {
    try {
      setIsCreatingRate(true)
      
      const response = await fetch('/api/commission-rates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(rateForm)
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Commission rate created",
          description: "The commission rate has been created successfully."
        })
        
        setIsRateDialogOpen(false)
        setRateForm({
          vendorId: "",
          categoryId: "",
          rate: "",
          type: "PERCENTAGE",
          minAmount: "",
          maxAmount: "",
          effectiveFrom: new Date().toISOString().split('T')[0],
          effectiveTo: ""
        })
        
        loadCommissionRates()
      } else {
        throw new Error(data.error || 'Failed to create commission rate')
      }
    } catch (error) {
      console.error("Failed to create commission rate:", error)
      toast({
        title: "Error",
        description: "Failed to create commission rate. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsCreatingRate(false)
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Commission Management</h1>
          <p className="text-muted-foreground mt-2">
            Track and manage platform commissions and vendor payouts
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadCommissions} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {commissions.length > 0 && (
            <ExportDropdown
              data={AnalyticsExportUtils.transformCommissionData(commissions, stats)}
              filename="finance-commission-management-report"
              className="h-10 w-10 p-0"
            />
          )}
          <Button onClick={() => setIsRateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Set Commission Rate
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Commissions</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-20" /> : formatPrice(stats.totalCommissions)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
              <Calendar className="h-4 w-4 text-yellow-500" />
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
              <CardTitle className="text-sm font-medium text-muted-foreground">Calculated</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {isLoading ? <Skeleton className="h-8 w-16" /> : <AnimatedCounter value={stats.CALCULATED?.count || 0} />}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {formatPrice(stats.CALCULATED?.total || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Paid</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {isLoading ? <Skeleton className="h-8 w-16" /> : <AnimatedCounter value={stats.PAID?.count || 0} />}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {formatPrice(stats.PAID?.total || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="commissions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
          <TabsTrigger value="rates">Commission Rates</TabsTrigger>
        </TabsList>

        <TabsContent value="commissions" className="space-y-4">
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
                  <Label htmlFor="search">Search Commissions</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search by order number or vendor..."
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
                      <SelectItem value="CALCULATED">Calculated</SelectItem>
                      <SelectItem value="PAID">Paid</SelectItem>
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

          {/* Commissions List */}
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
            ) : commissions.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Banknote className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No commissions found</h3>
                  <p className="text-muted-foreground">
                    No commissions match your current filters.
                  </p>
                </CardContent>
              </Card>
            ) : (
              commissions.map((commission) => (
                <Card key={commission.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold">{commission.order.orderNumber}</h3>
                          <StatusBadge status={commission.status.toLowerCase() as any} />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {commission.vendor.businessName} • {formatDate(commission.calculatedAt)}
                        </p>
                        <div className="flex items-center gap-4 text-sm">
                          <span>Order Total: {formatPrice(commission.order.totalPrice)}</span>
                          <span>Rate: {commission.rate}%</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{formatPrice(commission.amount)}</p>
                        <p className="text-sm text-muted-foreground">Commission</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="rates" className="space-y-4">
          {/* Commission Rates List */}
          <div className="space-y-4">
            {commissionRates.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No commission rates set</h3>
                  <p className="text-muted-foreground mb-4">
                    Create commission rates to start earning from vendor sales.
                  </p>
                  <Button onClick={() => setIsRateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Set Commission Rate
                  </Button>
                </CardContent>
              </Card>
            ) : (
              commissionRates.map((rate) => (
                <Card key={rate.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold">{rate.vendor.businessName}</h3>
                          <Badge variant="outline">{rate.rate}%</Badge>
                          {rate.category && (
                            <Badge variant="secondary">{rate.category.name}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Effective from {formatDate(rate.effectiveFrom)}
                          {rate.effectiveTo && ` to ${formatDate(rate.effectiveTo)}`}
                        </p>
                        <div className="flex items-center gap-4 text-sm">
                          <span>Type: {rate.type}</span>
                          {rate.minAmount && <span>Min: {formatPrice(rate.minAmount)}</span>}
                          {rate.maxAmount && <span>Max: {formatPrice(rate.maxAmount)}</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={rate.isActive ? "default" : "secondary"}>
                          {rate.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Commission Rate Dialog */}
      <Dialog open={isRateDialogOpen} onOpenChange={setIsRateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Set Commission Rate</DialogTitle>
            <DialogDescription>
              Create a new commission rate for a vendor and category combination.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="vendorId">Vendor</Label>
                <Select value={rateForm.vendorId} onValueChange={(value) => setRateForm(prev => ({ ...prev, vendorId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* This would be populated from API */}
                    <SelectItem value="no-vendors">No vendors available</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoryId">Category (Optional)</Label>
                <Select value={rateForm.categoryId} onValueChange={(value) => setRateForm(prev => ({ ...prev, categoryId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="clothing">Clothing</SelectItem>
                    <SelectItem value="home-garden">Home & Garden</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="rate">Commission Rate (%)</Label>
                <Input
                  id="rate"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="8.5"
                  value={rateForm.rate}
                  onChange={(e) => setRateForm(prev => ({ ...prev, rate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select value={rateForm.type} onValueChange={(value) => setRateForm(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                    <SelectItem value="FIXED">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="minAmount">Minimum Amount (Optional)</Label>
                <Input
                  id="minAmount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={rateForm.minAmount}
                  onChange={(e) => setRateForm(prev => ({ ...prev, minAmount: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxAmount">Maximum Amount (Optional)</Label>
                <Input
                  id="maxAmount"
                  type="number"
                  step="0.01"
                  placeholder="1000.00"
                  value={rateForm.maxAmount}
                  onChange={(e) => setRateForm(prev => ({ ...prev, maxAmount: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="effectiveFrom">Effective From</Label>
                <Input
                  id="effectiveFrom"
                  type="date"
                  value={rateForm.effectiveFrom}
                  onChange={(e) => setRateForm(prev => ({ ...prev, effectiveFrom: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="effectiveTo">Effective To (Optional)</Label>
                <Input
                  id="effectiveTo"
                  type="date"
                  value={rateForm.effectiveTo}
                  onChange={(e) => setRateForm(prev => ({ ...prev, effectiveTo: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsRateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRate} disabled={isCreatingRate || !rateForm.vendorId || !rateForm.rate}>
              {isCreatingRate ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Rate'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}