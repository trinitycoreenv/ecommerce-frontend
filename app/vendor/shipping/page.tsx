'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Truck, Package, Plus, RefreshCw, ExternalLink } from 'lucide-react'
import { AnimatedCounter } from '@/components/ui/animated-counter'
import { LiveIndicator } from '@/components/ui/live-indicator'
import { EmptyState } from '@/components/shared/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { ExportDropdown } from '@/components/shared/export-dropdown'
import { AnalyticsExportUtils } from '@/lib/export-service'

interface ShippingStats {
  totalShipments: number
  deliveredShipments: number
  inTransitShipments: number
  averageDeliveryTime: number
  totalShippingCost: number
  carrierBreakdown: Array<{
    carrier: string
    count: number
    percentage: number
  }>
}

interface Shipment {
  id: string
  orderId: string
  carrier: string
  trackingNumber: string
  status: string
  shippingCost: number
  createdAt: Date
  estimatedDelivery?: Date
  actualDelivery?: Date
  order: {
    id: string
    customer: {
      name: string
      email: string
    }
  }
}

interface ShippingProvider {
  name: string
  code: string
  isActive: boolean
  supportedServices: string[]
  supportedCountries: string[]
}

export default function VendorShippingDashboard() {
  const [stats, setStats] = useState<ShippingStats | null>(null)
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [providers, setProviders] = useState<ShippingProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [createLabelDialogOpen, setCreateLabelDialogOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [labelForm, setLabelForm] = useState({
    carrier: '',
    service: '',
    packageWeight: '',
    packageLength: '',
    packageWidth: '',
    packageHeight: ''
  })
  const [creatingLabel, setCreatingLabel] = useState(false)
  const { toast } = useToast()

  const fetchData = async () => {
    try {
      setRefreshing(true)
      const response = await fetch('/api/vendor/shipping', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setStats({
          totalShipments: data.data.shipments.length,
          deliveredShipments: data.data.stats.DELIVERED,
          inTransitShipments: data.data.stats.IN_TRANSIT,
          averageDeliveryTime: data.data.averageDeliveryTime,
          totalShippingCost: data.data.totalShippingCost,
          carrierBreakdown: data.data.carrierUsage.map((carrier: any) => ({
            carrier: carrier.carrier,
            count: carrier.count,
            percentage: 0 // Calculate percentage if needed
          }))
        })
        setShipments(data.data.shipments)
        setProviders([]) // No providers API yet
      }
    } catch (error) {
      console.error('Error fetching shipping data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleRefresh = () => {
    fetchData()
  }

  const handleCreateLabel = async () => {
    if (!selectedOrder || !labelForm.carrier || !labelForm.service) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    try {
      setCreatingLabel(true)
      
      // Mock package info - in a real implementation, this would come from the order items
      const packageInfo = {
        length: parseFloat(labelForm.packageLength) || 10,
        width: parseFloat(labelForm.packageWidth) || 8,
        height: parseFloat(labelForm.packageHeight) || 6,
        weight: parseFloat(labelForm.packageWeight) || 1,
        unit: 'in' as const
      }

      // Mock addresses - in a real implementation, these would come from the order
      const fromAddress = {
        name: "Your Business",
        address1: "123 Business St",
        city: "Business City",
        state: "BC",
        zip: "12345",
        country: "US"
      }

      const toAddress = {
        name: selectedOrder.customer.name,
        address1: "456 Customer Ave",
        city: "Customer City",
        state: "CC",
        zip: "67890",
        country: "US"
      }

      const response = await fetch('/api/shipping/labels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fromAddress,
          toAddress,
          packageInfo,
          service: labelForm.service,
          carrier: labelForm.carrier,
          orderId: selectedOrder.id
        })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Shipping label created successfully"
        })
        setCreateLabelDialogOpen(false)
        setLabelForm({
          carrier: '',
          service: '',
          packageWeight: '',
          packageLength: '',
          packageWidth: '',
          packageHeight: ''
        })
        setSelectedOrder(null)
        fetchData()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to create shipping label",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create shipping label",
        variant: "destructive"
      })
    } finally {
      setCreatingLabel(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED': return 'bg-green-100 text-green-800'
      case 'IN_TRANSIT': return 'bg-blue-100 text-blue-800'
      case 'CREATED': return 'bg-yellow-100 text-yellow-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTrackingUrl = (carrier: string, trackingNumber: string) => {
    const baseUrls = {
      'UPS': 'https://www.ups.com/track?track=yes&trackNums=',
      'FedEx': 'https://www.fedex.com/fedextrack/?trknbr=',
      'USPS': 'https://tools.usps.com/go/TrackConfirmAction?qtc_tLabels1=',
      'DHL': 'https://www.dhl.com/en/express/tracking.html?AWB='
    }
    
    const baseUrl = baseUrls[carrier] || 'https://example.com/track?number='
    return `${baseUrl}${trackingNumber}`
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Shipping Management</h1>
            <p className="text-muted-foreground">Manage your shipments and shipping labels</p>
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Shipping Management</h1>
          <p className="text-muted-foreground">Manage your shipments and shipping labels</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {shipments.length > 0 && (
            <ExportDropdown
              data={AnalyticsExportUtils.transformShippingData(shipments, stats)}
              filename="shipping-management-report"
              className="h-10 w-10 p-0"
            />
          )}
          <Dialog open={createLabelDialogOpen} onOpenChange={setCreateLabelDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Label
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Shipping Label</DialogTitle>
                <DialogDescription>
                  Create a shipping label for an order
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="order">Order</Label>
                  <Select
                    value={selectedOrder?.id || ''}
                    onValueChange={(value) => {
                      // In a real implementation, you would fetch the order details
                      setSelectedOrder({
                        id: value,
                        customer: { name: 'Customer Name' }
                      })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an order" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="order-1">Order #ORD-001</SelectItem>
                      <SelectItem value="order-2">Order #ORD-002</SelectItem>
                      <SelectItem value="order-3">Order #ORD-003</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="carrier">Carrier</Label>
                  <Select
                    value={labelForm.carrier}
                    onValueChange={(value) => setLabelForm(prev => ({ ...prev, carrier: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select carrier" />
                    </SelectTrigger>
                    <SelectContent>
                      {providers.map((provider) => (
                        <SelectItem key={provider.code} value={provider.code}>
                          {provider.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="service">Service</Label>
                  <Select
                    value={labelForm.service}
                    onValueChange={(value) => setLabelForm(prev => ({ ...prev, service: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select service" />
                    </SelectTrigger>
                    <SelectContent>
                      {providers
                        .find(p => p.code === labelForm.carrier)
                        ?.supportedServices.map((service) => (
                          <SelectItem key={service} value={service}>
                            {service}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="weight">Weight (lbs)</Label>
                    <Input
                      id="weight"
                      type="number"
                      value={labelForm.packageWeight}
                      onChange={(e) => setLabelForm(prev => ({ ...prev, packageWeight: e.target.value }))}
                      placeholder="1.0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="length">Length (in)</Label>
                    <Input
                      id="length"
                      type="number"
                      value={labelForm.packageLength}
                      onChange={(e) => setLabelForm(prev => ({ ...prev, packageLength: e.target.value }))}
                      placeholder="10"
                    />
                  </div>
                  <div>
                    <Label htmlFor="width">Width (in)</Label>
                    <Input
                      id="width"
                      type="number"
                      value={labelForm.packageWidth}
                      onChange={(e) => setLabelForm(prev => ({ ...prev, packageWidth: e.target.value }))}
                      placeholder="8"
                    />
                  </div>
                  <div>
                    <Label htmlFor="height">Height (in)</Label>
                    <Input
                      id="height"
                      type="number"
                      value={labelForm.packageHeight}
                      onChange={(e) => setLabelForm(prev => ({ ...prev, packageHeight: e.target.value }))}
                      placeholder="6"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleCreateLabel}
                  disabled={creatingLabel}
                >
                  {creatingLabel ? 'Creating...' : 'Create Label'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shipments</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <AnimatedCounter value={stats?.totalShipments || 0} />
            </div>
            <p className="text-xs text-muted-foreground">
              Your shipments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <Truck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              <AnimatedCounter value={stats?.deliveredShipments || 0} />
            </div>
            <p className="text-xs text-muted-foreground">
              Successfully delivered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
            <Truck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              <AnimatedCounter value={stats?.inTransitShipments || 0} />
            </div>
            <p className="text-xs text-muted-foreground">
              Currently shipping
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Delivery Time</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.averageDeliveryTime || 0} days
            </div>
            <p className="text-xs text-muted-foreground">
              Average delivery time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="shipments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="shipments">Shipments</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="shipments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Your Shipments
                <LiveIndicator />
              </CardTitle>
              <CardDescription>
                Track and manage your shipments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {shipments.length > 0 ? (
                <div className="space-y-4">
                  {shipments.map((shipment) => (
                    <div key={shipment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="font-medium">{shipment.trackingNumber}</p>
                          <p className="text-sm text-muted-foreground">
                            {shipment.order.customer.name} • Order #{shipment.orderId}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="font-medium">{shipment.carrier}</p>
                          <p className="text-sm text-muted-foreground">
                            ₱{Number(shipment.shippingCost).toFixed(2)}
                          </p>
                        </div>
                        <Badge className={getStatusColor(shipment.status)}>
                          {shipment.status.replace('_', ' ')}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(getTrackingUrl(shipment.carrier, shipment.trackingNumber), '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Track
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<Package className="h-8 w-8" />}
                  title="No shipments found"
                  description="You don't have any shipments yet"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Carrier Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Carrier Usage</CardTitle>
                <CardDescription>Your shipment distribution by carrier</CardDescription>
              </CardHeader>
              <CardContent>
                {stats?.carrierBreakdown.length ? (
                  <div className="space-y-3">
                    {stats.carrierBreakdown.map((carrier) => (
                      <div key={carrier.carrier} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{carrier.carrier}</p>
                          <p className="text-xs text-muted-foreground">
                            {carrier.count} shipments
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{carrier.percentage}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<Truck className="h-8 w-8" />}
                    title="No carrier data"
                    description="No shipments have been processed yet"
                  />
                )}
              </CardContent>
            </Card>

            {/* Shipping Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Shipping Summary</CardTitle>
                <CardDescription>Your shipping performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Shipments</span>
                    <span className="text-sm">{stats?.totalShipments || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Delivered</span>
                    <span className="text-sm text-green-600">{stats?.deliveredShipments || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">In Transit</span>
                    <span className="text-sm text-blue-600">{stats?.inTransitShipments || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Average Delivery Time</span>
                    <span className="text-sm">{stats?.averageDeliveryTime || 0} days</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Shipping Cost</span>
                    <span className="text-sm">₱{stats?.totalShippingCost.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
