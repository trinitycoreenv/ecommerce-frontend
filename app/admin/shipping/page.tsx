'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Truck, Package, TrendingUp, Clock, DollarSign, RefreshCw } from 'lucide-react'
import { AnimatedCounter } from '@/components/ui/animated-counter'
import { LiveIndicator } from '@/components/ui/live-indicator'
import { DataTable } from '@/components/shared/data-table'
import { EmptyState } from '@/components/shared/empty-state'
import { Skeleton } from '@/components/ui/skeleton'

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
    vendor: {
      businessName: string
    }
  }
}

export default function ShippingDashboard() {
  const [stats, setStats] = useState<ShippingStats | null>(null)
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [providers, setProviders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filters, setFilters] = useState({
    carrier: '',
    status: '',
    search: ''
  })

  const fetchData = async () => {
    try {
      setRefreshing(true)
      const [statsResponse, shipmentsResponse, providersResponse] = await Promise.all([
        fetch('/api/shipping/stats'),
        fetch('/api/shipping/labels'),
        fetch('/api/shipping/providers')
      ])

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData.data)
      }

      if (shipmentsResponse.ok) {
        const shipmentsData = await shipmentsResponse.json()
        setShipments(shipmentsData.data)
      }

      if (providersResponse.ok) {
        const providersData = await providersResponse.json()
        setProviders(providersData.data)
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED': return 'bg-green-100 text-green-800'
      case 'IN_TRANSIT': return 'bg-blue-100 text-blue-800'
      case 'CREATED': return 'bg-yellow-100 text-yellow-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredShipments = shipments.filter(shipment => {
    if (filters.carrier && shipment.carrier !== filters.carrier) return false
    if (filters.status && shipment.status !== filters.status) return false
    if (filters.search && !shipment.trackingNumber.toLowerCase().includes(filters.search.toLowerCase()) &&
        !shipment.order.customer.name.toLowerCase().includes(filters.search.toLowerCase())) return false
    return true
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Shipping Dashboard</h1>
            <p className="text-muted-foreground">Monitor shipments and shipping performance</p>
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
          <h1 className="text-3xl font-bold">Shipping Dashboard</h1>
          <p className="text-muted-foreground">Monitor shipments and shipping performance</p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
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
              All time shipments
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
            <Clock className="h-4 w-4 text-blue-500" />
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
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
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
          <TabsTrigger value="providers">Providers</TabsTrigger>
        </TabsList>

        <TabsContent value="shipments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Shipments
                <LiveIndicator />
              </CardTitle>
              <CardDescription>
                Monitor all shipments across the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex gap-4 mb-6">
                <Input
                  placeholder="Search by tracking number or customer..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="max-w-sm"
                />
                <Select
                  value={filters.carrier}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, carrier: value }))}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Carriers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Carriers</SelectItem>
                    <SelectItem value="LBC">LBC Express</SelectItem>
                    <SelectItem value="J&T">J&T Express</SelectItem>
                    <SelectItem value="2GO">2GO Express</SelectItem>
                    <SelectItem value="Grab">Grab Express</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="CREATED">Created</SelectItem>
                    <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                    <SelectItem value="DELIVERED">Delivered</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {filteredShipments.length > 0 ? (
                <div className="space-y-4">
                  {filteredShipments.map((shipment) => (
                    <div key={shipment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="font-medium">{shipment.trackingNumber}</p>
                          <p className="text-sm text-muted-foreground">
                            {shipment.order.customer.name} • {shipment.order.vendor.businessName}
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
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<Package className="h-8 w-8" />}
                  title="No shipments found"
                  description="No shipments match your current filters"
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
                <CardTitle>Carrier Breakdown</CardTitle>
                <CardDescription>Shipment distribution by carrier</CardDescription>
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
                <CardDescription>Key shipping metrics</CardDescription>
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

        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Shipping Providers</CardTitle>
              <CardDescription>Available shipping providers and their capabilities</CardDescription>
            </CardHeader>
            <CardContent>
              {providers.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {providers.map((provider) => (
                    <div key={provider.code} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{provider.name}</h3>
                        <Badge variant={provider.isActive ? 'default' : 'secondary'}>
                          {provider.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Supported Countries: {provider.supportedCountries.join(', ')}
                      </p>
                      <div>
                        <p className="text-sm font-medium mb-2">Available Services:</p>
                        <div className="flex flex-wrap gap-1">
                          {provider.supportedServices.map((service: string) => (
                            <Badge key={service} variant="outline" className="text-xs">
                              {service}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<Truck className="h-8 w-8" />}
                  title="No providers available"
                  description="No shipping providers are currently configured"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
