'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, TrendingUp, TrendingDown, Users, DollarSign, Package, Truck, RefreshCw, Download, Filter } from 'lucide-react'
import { AnimatedCounter } from '@/components/ui/animated-counter'
import { LiveIndicator } from '@/components/ui/live-indicator'
import { EmptyState } from '@/components/shared/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { AdvancedChart } from '@/components/shared/advanced-chart'
import { ExportDropdown, QuickExportButton } from '@/components/shared/export-dropdown'
import { ExportService, AnalyticsExportUtils } from '@/lib/export-service'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface ComprehensiveReport {
  period: {
    startDate: string
    endDate: string
    type: string
  }
  revenue: {
    totalRevenue: number
    totalCommissions: number
    netRevenue: number
    averageOrderValue: number
    totalOrders: number
    revenueGrowth: number
    commissionRate: number
  }
  sales: {
    dailySales: Array<{
      date: string
      revenue: number
      orders: number
      averageOrderValue: number
    }>
    monthlySales: Array<{
      month: string
      revenue: number
      orders: number
      growth: number
    }>
    topProducts: Array<{
      productId: string
      productName: string
      revenue: number
      orders: number
      quantitySold: number
    }>
    topVendors: Array<{
      vendorId: string
      vendorName: string
      revenue: number
      orders: number
      commission: number
    }>
  }
  customers: {
    totalCustomers: number
    newCustomers: number
    returningCustomers: number
    customerRetentionRate: number
    averageCustomerValue: number
    customerSegments: Array<{
      segment: string
      count: number
      percentage: number
      averageValue: number
    }>
    customerLifetimeValue: number
  }
  vendors: {
    totalVendors: number
    activeVendors: number
    newVendors: number
    topPerformingVendors: Array<{
      vendorId: string
      vendorName: string
      revenue: number
      orders: number
      products: number
      rating: number
    }>
    vendorGrowth: Array<{
      month: string
      newVendors: number
      activeVendors: number
    }>
  }
  platform: {
    totalProducts: number
    activeProducts: number
    totalCategories: number
    averageProductRating: number
    conversionRate: number
    cartAbandonmentRate: number
    averageSessionDuration: number
    bounceRate: number
  }
  inventory: {
    totalInventoryValue: number
    lowStockProducts: number
    outOfStockProducts: number
    slowMovingProducts: number
    topSellingProducts: Array<{
      productId: string
      productName: string
      quantitySold: number
      revenue: number
      inventoryTurnover: number
    }>
    categoryPerformance: Array<{
      categoryId: string
      categoryName: string
      productCount: number
      revenue: number
      averageRating: number
    }>
  }
  shipping: {
    totalShipments: number
    averageDeliveryTime: number
    onTimeDeliveryRate: number
    shippingCosts: number
    carrierPerformance: Array<{
      carrier: string
      shipments: number
      averageDeliveryTime: number
      onTimeRate: number
      cost: number
    }>
  }
  summary: {
    keyInsights: string[]
    recommendations: string[]
    alerts: string[]
  }
}

export default function AnalyticsDashboard() {
  const [report, setReport] = useState<ComprehensiveReport | null>(null)
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

      const response = await fetch(`/api/analytics?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      console.log('Analytics API response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Analytics API result:', data)
        setReport(data.data)
      } else {
        const errorText = await response.text()
        console.error('Analytics API error:', response.status, errorText)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
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

  const handleExport = async (reportType?: string) => {
    if (!report) return
    
    try {
      if (reportType) {
        let exportData
        let filename = `analytics-${reportType.toLowerCase().replace(/\s+/g, '-')}`
        
        switch (reportType) {
          case 'Revenue':
            exportData = AnalyticsExportUtils.transformRevenueData(report)
            break
          case 'Vendor Performance':
            exportData = AnalyticsExportUtils.transformVendorData(report)
            break
          case 'Transaction':
            exportData = AnalyticsExportUtils.transformTransactionData(report)
            break
          default:
            exportData = AnalyticsExportUtils.transformComprehensiveData(report)
        }
        
        // For individual reports, we'll export as Excel by default
        await ExportService.export(exportData, {
          filename,
          format: 'xlsx',
          includeSummary: true
        })
      } else {
        // Export comprehensive report
        const exportData = AnalyticsExportUtils.transformComprehensiveData(report)
        await ExportService.export(exportData, {
          filename: 'comprehensive-analytics-report',
          format: 'xlsx',
          includeSummary: true
        })
      }
    } catch (error) {
      console.error('Export failed:', error)
    }
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
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">Analytics & Reports</h1>
          <p className="text-muted-foreground mt-2 text-sm md:text-base">Comprehensive business intelligence and reporting</p>
        </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
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
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">Analytics & Reports</h1>
          <p className="text-muted-foreground mt-2 text-sm md:text-base">Comprehensive business intelligence and reporting</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex gap-1 sm:gap-2">
            <Select value={periodType} onValueChange={setPeriodType}>
              <SelectTrigger className="w-20 sm:w-24 md:w-32">
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
                <Button variant="outline" className="w-full sm:w-28 md:w-40 justify-start text-left font-normal text-xs md:text-sm">
                  <CalendarIcon className="mr-1 sm:mr-2 h-3 w-3 md:h-4 md:w-4" />
                  <span className="truncate">
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "M/d")}-{format(dateRange.to, "M/d")}
                        </>
                      ) : (
                        format(dateRange.from, "M/d/yy")
                      )
                    ) : (
                      "Pick dates"
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
                  onSelect={(range) => setDateRange({ from: range?.from, to: range?.to || undefined })}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex gap-1 sm:gap-2">
            <Button onClick={handleRefresh} disabled={refreshing} variant="outline" size="sm" className="text-xs md:text-sm">
              <RefreshCw className={`h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            {report && (
              <ExportDropdown
                data={AnalyticsExportUtils.transformComprehensiveData(report)}
                filename="comprehensive-analytics-report"
                className="h-8 w-8 md:h-10 md:w-10 p-0"
              />
            )}
          </div>
        </div>
      </div>

      {/* Quick Export Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:border-primary/50 transition-colors">
          <CardHeader>
            <div className="flex items-center justify-between">
              <DollarSign className="h-8 w-8 text-primary" />
              {report && (
                <ExportDropdown
                  data={AnalyticsExportUtils.transformRevenueData(report)}
                  filename="revenue-report"
                  className="h-8 w-8 p-0"
                />
              )}
            </div>
            <CardTitle className="mt-4">Revenue Report</CardTitle>
            <CardDescription>Monthly revenue breakdown and trends</CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:border-primary/50 transition-colors">
          <CardHeader>
            <div className="flex items-center justify-between">
              <TrendingUp className="h-8 w-8 text-primary" />
              {report && (
                <ExportDropdown
                  data={AnalyticsExportUtils.transformVendorData(report)}
                  filename="vendor-performance-report"
                  className="h-8 w-8 p-0"
                />
              )}
            </div>
            <CardTitle className="mt-4">Vendor Performance</CardTitle>
            <CardDescription>Vendor acquisition and performance metrics</CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:border-primary/50 transition-colors">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Package className="h-8 w-8 text-primary" />
              {report && (
                <ExportDropdown
                  data={AnalyticsExportUtils.transformTransactionData(report)}
                  filename="transaction-report"
                  className="h-8 w-8 p-0"
                />
              )}
            </div>
            <CardTitle className="mt-4">Transaction Report</CardTitle>
            <CardDescription>Detailed transaction logs and analysis</CardDescription>
          </CardHeader>
        </Card>
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
              ${report?.revenue.totalRevenue.toLocaleString() || 0}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getGrowthIcon(report?.revenue.revenueGrowth || 0)}
              <span className={cn("ml-1", getGrowthColor(report?.revenue.revenueGrowth || 0))}>
                {Math.abs(report?.revenue.revenueGrowth || 0).toFixed(1)}%
              </span>
              <span className="ml-1">from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <AnimatedCounter value={report?.revenue.totalOrders || 0} />
            </div>
            <p className="text-xs text-muted-foreground">
              Avg order value: ${report?.revenue.averageOrderValue.toLocaleString('en-US') || '0'}
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
              <AnimatedCounter value={report?.customers.totalCustomers || 0} />
            </div>
            <p className="text-xs text-muted-foreground">
              {report?.customers.newCustomers || 0} new this period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Vendors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <AnimatedCounter value={report?.vendors.activeVendors || 0} />
            </div>
            <p className="text-xs text-muted-foreground">
              {report?.vendors.newVendors || 0} new this period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {report?.summary?.alerts && report.summary.alerts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800">Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {report?.summary?.alerts?.map((alert, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="h-2 w-2 rounded-full bg-orange-500" />
                  <span className="text-sm text-orange-800">{alert}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}


      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="shipping">Shipping</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {/* Key Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Key Insights</CardTitle>
                <CardDescription>Important business insights from your data</CardDescription>
              </CardHeader>
              <CardContent>
                {report?.summary.keyInsights.length ? (
                  <div className="space-y-3">
                    {report.summary.keyInsights.map((insight, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="h-2 w-2 rounded-full bg-blue-500 mt-2" />
                        <p className="text-sm">{insight}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<TrendingUp className="h-8 w-8" />}
                    title="No insights available"
                    description="No key insights generated for this period"
                  />
                )}
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
                <CardDescription>Actionable recommendations to improve performance</CardDescription>
              </CardHeader>
              <CardContent>
                {report?.summary.recommendations.length ? (
                  <div className="space-y-3">
                    {report.summary.recommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="h-2 w-2 rounded-full bg-green-500 mt-2" />
                        <p className="text-sm">{recommendation}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<TrendingUp className="h-8 w-8" />}
                    title="No recommendations"
                    description="No recommendations available for this period"
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Products and Vendors */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Products</CardTitle>
                <CardDescription>Best performing products by revenue</CardDescription>
              </CardHeader>
              <CardContent>
                {report?.sales.topProducts.length ? (
                  <div className="space-y-3">
                    {report.sales.topProducts.slice(0, 5).map((product, index) => (
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

            <Card>
              <CardHeader>
                <CardTitle>Top Vendors</CardTitle>
                <CardDescription>Best performing vendors by revenue</CardDescription>
              </CardHeader>
              <CardContent>
                {report?.sales.topVendors.length ? (
                  <div className="space-y-3">
                    {report.sales.topVendors.slice(0, 5).map((vendor, index) => (
                      <div key={vendor.vendorId} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{vendor.vendorName}</p>
                            <p className="text-xs text-muted-foreground">
                              {vendor.orders} orders
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">${vendor.revenue.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<Users className="h-8 w-8" />}
                    title="No vendor data"
                    description="No vendor performance data available for this period"
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Overview Charts */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <AdvancedChart
              title="Platform Overview"
              description="Key platform metrics at a glance"
              data={[
                { name: 'Total Revenue', value: report?.revenue?.totalRevenue || 0 },
                { name: 'Total Orders', value: report?.revenue?.totalOrders || 0 },
                { name: 'Active Vendors', value: report?.vendors?.activeVendors || 0 },
                { name: 'Total Products', value: report?.platform?.totalProducts || 0 }
              ]}
              type="pie"
              dataKey="value"
              showGrid={true}
            />
            <AdvancedChart
              title="Business Performance"
              description="Overall business performance metrics"
              data={[
                { name: 'Revenue Growth', value: report?.revenue?.revenueGrowth || 0 },
                { name: 'Order Growth', value: 0 },
                { name: 'Vendor Growth', value: report?.vendors?.newVendors || 0 },
                { name: 'Product Growth', value: 0 }
              ]}
              type="bar"
              dataKey="value"
              showGrid={true}
            />
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${report?.revenue.netRevenue.toLocaleString() || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  After commissions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Commissions</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${report?.revenue.totalCommissions.toLocaleString() || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {report?.revenue.commissionRate.toFixed(1) || 0}% of revenue
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
                  ${report?.revenue.averageOrderValue.toLocaleString('en-US') || '0'}
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
                <div className={cn("text-2xl font-bold", getGrowthColor(report?.revenue.revenueGrowth || 0))}>
                  {report?.revenue.revenueGrowth.toFixed(1) || 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  vs previous period
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Charts */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <AdvancedChart
              title="Revenue Trends"
              description="Daily revenue over the selected period"
              data={report?.sales?.dailySales?.map(item => ({
                name: new Date(item.date).toLocaleDateString(),
                value: item.revenue,
                orders: item.orders
              })) || []}
              type="area"
              dataKey="value"
              showGrid={true}
            />
            <AdvancedChart
              title="Revenue vs Commissions"
              description="Platform revenue vs commission earnings"
              data={[
                { name: 'Platform Revenue', value: report?.revenue.totalRevenue || 0 },
                { name: 'Commission Earnings', value: report?.revenue.totalCommissions || 0 }
              ]}
              type="bar"
              dataKey="value"
              showGrid={true}
            />
          </div>
          
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <AdvancedChart
              title="Monthly Sales Growth"
              description="Month-over-month revenue growth"
              data={report?.sales?.monthlySales?.map(month => ({
                name: month.month,
                value: month.revenue,
                growth: month.growth
              })) || []}
              type="line"
              dataKey="value"
              showGrid={true}
            />
            <AdvancedChart
              title="Order Status Distribution"
              description="Breakdown of orders by status"
              data={[]}
              type="pie"
              dataKey="value"
              showGrid={true}
            />
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <AnimatedCounter value={report?.customers.newCustomers || 0} />
                </div>
                <p className="text-xs text-muted-foreground">
                  This period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Retention Rate</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {report?.customers.customerRetentionRate.toFixed(1) || 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Customer retention
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
                  ${report?.customers.averageCustomerValue.toLocaleString('en-US') || '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Per customer
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lifetime Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${report?.customers.customerLifetimeValue.toLocaleString('en-US') || '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Customer LTV
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="vendors" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <AnimatedCounter value={report?.vendors.totalVendors || 0} />
                </div>
                <p className="text-xs text-muted-foreground">
                  All vendors
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Vendors</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <AnimatedCounter value={report?.vendors.activeVendors || 0} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Currently active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Vendors</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <AnimatedCounter value={report?.vendors.newVendors || 0} />
                </div>
                <p className="text-xs text-muted-foreground">
                  This period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {report?.vendors.topPerformingVendors[0]?.vendorName || 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  ${report?.vendors.topPerformingVendors[0]?.revenue.toLocaleString() || '0'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Vendor Charts */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <AdvancedChart
              title="Top Vendors by Revenue"
              description="Top performing vendors"
              data={report?.sales?.topVendors?.map(vendor => ({
                name: vendor.vendorName,
                value: vendor.revenue,
                orders: vendor.orders
              })) || []}
              type="bar"
              dataKey="value"
              showGrid={true}
            />
            <AdvancedChart
              title="Vendor Performance"
              description="Vendor performance metrics"
              data={report?.sales?.topVendors?.map(vendor => ({
                name: vendor.vendorName,
                value: vendor.revenue,
                orders: vendor.orders
              })) || []}
              type="bar"
              dataKey="value"
              showGrid={true}
            />
          </div>
          
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <AdvancedChart
              title="Vendor Growth"
              description="New vendors over time"
              data={report?.vendors?.vendorGrowth?.map(growth => ({
                name: growth.month,
                value: growth.newVendors,
                total: growth.activeVendors
              })) || []}
              type="line"
              dataKey="value"
              showGrid={true}
            />
            <AdvancedChart
              title="Vendor Distribution"
              description="Vendor count by status"
              data={[
                { name: 'Active Vendors', value: report?.vendors?.activeVendors || 0 },
                { name: 'New Vendors', value: report?.vendors?.newVendors || 0 },
                { name: 'Total Vendors', value: report?.vendors?.totalVendors || 0 }
              ]}
              type="pie"
              dataKey="value"
              showGrid={true}
            />
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
                  <AnimatedCounter value={report?.platform.totalProducts || 0} />
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
                  <AnimatedCounter value={report?.platform.activeProducts || 0} />
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
                  <AnimatedCounter value={report?.inventory.lowStockProducts || 0} />
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
                  <AnimatedCounter value={report?.inventory.outOfStockProducts || 0} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Zero inventory
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Product Charts */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <AdvancedChart
              title="Top Selling Products"
              description="Products with highest revenue"
              data={report?.sales?.topProducts?.map(product => ({
                name: product.productName,
                value: product.revenue,
                quantity: product.quantitySold
              })) || []}
              type="bar"
              dataKey="value"
              showGrid={true}
            />
            <AdvancedChart
              title="Product Categories"
              description="Revenue by product category"
              data={report?.inventory?.categoryPerformance?.map(category => ({
                name: category.categoryName,
                value: category.revenue,
                count: category.productCount
              })) || []}
              type="pie"
              dataKey="value"
              showGrid={true}
            />
          </div>
        </TabsContent>

        <TabsContent value="shipping" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Shipments</CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <AnimatedCounter value={report?.shipping.totalShipments || 0} />
                </div>
                <p className="text-xs text-muted-foreground">
                  All shipments
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
                  {report?.shipping.averageDeliveryTime.toFixed(1) || '0.0'} days
                </div>
                <p className="text-xs text-muted-foreground">
                  Average delivery
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">On-Time Rate</CardTitle>
                <Truck className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {report?.shipping.onTimeDeliveryRate.toFixed(1) || '0.0'}%
                </div>
                <p className="text-xs text-muted-foreground">
                  On-time deliveries
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Shipping Costs</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${report?.shipping.shippingCosts.toLocaleString() || '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total costs
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Shipping Charts */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <AdvancedChart
              title="Shipping Status Distribution"
              description="Breakdown of shipments by status"
              data={[]}
              type="pie"
              dataKey="value"
              showGrid={true}
            />
            <AdvancedChart
              title="Average Delivery Times"
              description="Delivery performance by carrier"
              data={report?.shipping?.carrierPerformance?.map(carrier => ({
                name: carrier.carrier,
                value: carrier.averageDeliveryTime,
                shipments: carrier.shipments
              })) || []}
              type="bar"
              dataKey="value"
              showGrid={true}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
