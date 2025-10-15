'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, TrendingUp, TrendingDown, Users, DollarSign, Package, RefreshCw } from 'lucide-react'
import { AnimatedCounter } from '@/components/ui/animated-counter'
import { LiveIndicator } from '@/components/ui/live-indicator'
import { EmptyState } from '@/components/shared/empty-state'
import { ExportDropdown } from '@/components/shared/export-dropdown'
import { AnalyticsExportUtils } from '@/lib/export-service'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface VendorAnalytics {
  revenue: {
    totalRevenue: number
    totalCommissions: number
    netRevenue: number
    averageOrderValue: number
    totalOrders: number
    revenueGrowth: number
  }
  sales: {
    dailySales: Array<{
      date: string
      revenue: number
      orders: number
      averageOrderValue: number
    }>
    topProducts: Array<{
      productId: string
      productName: string
      revenue: number
      orders: number
      quantitySold: number
    }>
  }
  customers: {
    totalCustomers: number
    newCustomers: number
    returningCustomers: number
    averageCustomerValue: number
  }
  products: {
    totalProducts: number
    activeProducts: number
    lowStockProducts: number
    outOfStockProducts: number
    topSellingProducts: Array<{
      productId: string
      productName: string
      quantitySold: number
      revenue: number
    }>
  }
  performance: {
    conversionRate: number
    averageRating: number
    totalReviews: number
    responseTime: number
  }
}

export default function VendorAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<VendorAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date()
  })
  const [periodType, setPeriodType] = useState('monthly')

  const fetchAnalytics = async () => {
    try {
      setRefreshing(true)
      const params = new URLSearchParams({
        startDate: dateRange.from?.toISOString() || '',
        endDate: dateRange.to?.toISOString() || '',
        type: periodType
      })

      // Fetch vendor-specific analytics
      const response = await fetch(`/api/vendor/analytics?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        setAnalytics(result.data)
      } else {
        console.error('Failed to fetch vendor analytics:', response.statusText)
      }
    } catch (error) {
      console.error('Error fetching vendor analytics:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange, periodType])

  const handleRefresh = () => {
    fetchAnalytics()
  }


  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    )
  }

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? 'text-green-600' : 'text-red-600'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">Analytics Dashboard</h1>
            <p className="text-muted-foreground text-sm md:text-base">Your business performance insights</p>
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(6)].map((_, i) => (
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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground text-sm md:text-base">Your business performance insights</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select value={periodType} onValueChange={setPeriodType}>
            <SelectTrigger className="w-24 md:w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full sm:w-48 md:w-64 justify-start text-left font-normal text-xs md:text-sm">
                <CalendarIcon className="mr-2 h-3 w-3 md:h-4 md:w-4" />
                <span className="truncate">
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd")}
                      </>
                    ) : (
                      format(dateRange.from, "MMM dd, y")
                    )
                  ) : (
                    "Pick date range"
                  )}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          <Button onClick={handleRefresh} disabled={refreshing} variant="outline" size="sm" className="text-xs md:text-sm">
            <RefreshCw className={`h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          {analytics && (
            <ExportDropdown
              data={AnalyticsExportUtils.transformVendorAnalyticsData(analytics)}
              filename="vendor-analytics-report"
              className="h-10 w-10 p-0"
            />
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${analytics?.revenue.totalRevenue.toLocaleString() || 0}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getGrowthIcon(analytics?.revenue.revenueGrowth || 0)}
              <span className={cn("ml-1", getGrowthColor(analytics?.revenue.revenueGrowth || 0))}>
                {Math.abs(analytics?.revenue.revenueGrowth || 0).toFixed(1)}%
              </span>
              <span className="ml-1">from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${analytics?.revenue.netRevenue.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              After platform fees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <AnimatedCounter value={analytics?.revenue.totalOrders || 0} />
            </div>
            <p className="text-xs text-muted-foreground">
              Avg order value: ${analytics?.revenue.averageOrderValue.toFixed(2) || '0.00'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <AnimatedCounter value={analytics?.customers.totalCustomers || 0} />
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics?.customers.newCustomers || 0} new this period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {/* Top Products */}
            <Card>
              <CardHeader>
                <CardTitle>Top Products</CardTitle>
                <CardDescription>Your best performing products by revenue</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics?.sales.topProducts.length ? (
                  <div className="space-y-3">
                    {analytics.sales.topProducts.slice(0, 5).map((product, index) => (
                      <div key={product.productId} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{product.productName}</p>
                            <p className="text-xs text-muted-foreground">
                              {product.quantitySold} units sold
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">${product.revenue.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<Package className="h-8 w-8" />}
                    title="No product data"
                    description="No product sales data available for this period"
                  />
                )}
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Conversion Rate</span>
                    <span className="text-sm">{analytics?.performance.conversionRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Average Rating</span>
                    <span className="text-sm">{analytics?.performance.averageRating.toFixed(1)}/5.0</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Reviews</span>
                    <span className="text-sm">{analytics?.performance.totalReviews}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Response Time</span>
                    <span className="text-sm">{analytics?.performance.responseTime.toFixed(1)} hours</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Platform Fees</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${analytics?.revenue.totalCommissions.toLocaleString() || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Platform commission
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${analytics?.revenue.averageOrderValue.toFixed(2) || '0.00'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Per order
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue Growth</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={cn("text-2xl font-bold", getGrowthColor(analytics?.revenue.revenueGrowth || 0))}>
                  {analytics?.revenue.revenueGrowth.toFixed(1) || 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  vs previous period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Customer Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${analytics?.customers.averageCustomerValue.toFixed(2) || '0.00'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Per customer
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <AnimatedCounter value={analytics?.products.totalProducts || 0} />
                </div>
                <p className="text-xs text-muted-foreground">
                  All products
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <AnimatedCounter value={analytics?.products.activeProducts || 0} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Currently active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
                <Package className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  <AnimatedCounter value={analytics?.products.lowStockProducts || 0} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Need restocking
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
                <Package className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  <AnimatedCounter value={analytics?.products.outOfStockProducts || 0} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Zero inventory
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Customer Metrics</CardTitle>
                <CardDescription>Customer-related performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Customers</span>
                    <span className="text-sm">{analytics?.customers.totalCustomers}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">New Customers</span>
                    <span className="text-sm">{analytics?.customers.newCustomers}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Returning Customers</span>
                    <span className="text-sm">{analytics?.customers.returningCustomers}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Average Customer Value</span>
                    <span className="text-sm">${analytics?.customers.averageCustomerValue.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Business Performance</CardTitle>
                <CardDescription>Overall business performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Conversion Rate</span>
                    <span className="text-sm">{analytics?.performance.conversionRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Average Rating</span>
                    <span className="text-sm">{analytics?.performance.averageRating.toFixed(1)}/5.0</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Reviews</span>
                    <span className="text-sm">{analytics?.performance.totalReviews}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Response Time</span>
                    <span className="text-sm">{analytics?.performance.responseTime.toFixed(1)} hours</span>
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
