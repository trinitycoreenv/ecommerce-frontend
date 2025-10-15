'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertTriangle, Package, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react'
import { AnimatedCounter } from '@/components/ui/animated-counter'
import { LiveIndicator } from '@/components/ui/live-indicator'
import { DataTable } from '@/components/shared/data-table'
import { EmptyState } from '@/components/shared/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { ExportDropdown } from '@/components/shared/export-dropdown'
import { AnalyticsExportUtils } from '@/lib/export-service'

interface InventoryReport {
  totalProducts: number
  totalValue: number
  lowStockProducts: number
  outOfStockProducts: number
  reorderNeeded: number
  topSellingProducts: Array<{
    productId: string
    productName: string
    quantitySold: number
    revenue: number
  }>
  slowMovingProducts: Array<{
    productId: string
    productName: string
    currentStock: number
    daysInStock: number
  }>
  categoryBreakdown: Array<{
    categoryId: string
    categoryName: string
    productCount: number
    totalValue: number
  }>
}

interface StockAlert {
  id: string
  productId: string
  productName: string
  currentStock: number
  threshold: number
  alertType: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'REORDER_POINT'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  vendorId: string
  vendorName: string
  isActive: boolean
}

export default function InventoryDashboard() {
  const [report, setReport] = useState<InventoryReport | null>(null)
  const [alerts, setAlerts] = useState<StockAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = async () => {
    try {
      setRefreshing(true)
      const [reportResponse, alertsResponse] = await Promise.all([
        fetch('/api/inventory', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        }),
        fetch('/api/inventory/alerts', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        })
      ])

      if (reportResponse.ok) {
        const reportData = await reportResponse.json()
        setReport(reportData.data)
      }

      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json()
        setAlerts(alertsData.data.alerts)
      }
    } catch (error) {
      console.error('Error fetching inventory data:', error)
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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'destructive'
      case 'HIGH': return 'destructive'
      case 'MEDIUM': return 'default'
      case 'LOW': return 'secondary'
      default: return 'secondary'
    }
  }

  const getAlertTypeIcon = (alertType: string) => {
    switch (alertType) {
      case 'OUT_OF_STOCK': return '🚨'
      case 'LOW_STOCK': return '⚠️'
      case 'REORDER_POINT': return '📦'
      default: return '📊'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">Inventory Dashboard</h1>
            <p className="text-muted-foreground text-sm md:text-base">Monitor stock levels and manage inventory</p>
          </div>
        </div>
        
        <div className="grid gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">Inventory Dashboard</h1>
          <p className="text-muted-foreground text-sm md:text-base">Monitor stock levels and manage inventory</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} disabled={refreshing} variant="outline" size="sm" className="text-xs md:text-sm">
            <RefreshCw className={`h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          {report && (
            <ExportDropdown
              data={AnalyticsExportUtils.transformInventoryData(report, alerts)}
              filename="inventory-management-report"
              className="h-8 w-8 md:h-10 md:w-10 p-0"
            />
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <AnimatedCounter value={report?.totalProducts || 0} />
            </div>
            <p className="text-xs text-muted-foreground">
              Active products in inventory
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${report?.totalValue.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Total inventory value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              <AnimatedCounter value={report?.lowStockProducts || 0} />
            </div>
            <p className="text-xs text-muted-foreground">
              Products below threshold
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              <AnimatedCounter value={report?.outOfStockProducts || 0} />
            </div>
            <p className="text-xs text-muted-foreground">
              Products with zero stock
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="alerts">
            Stock Alerts
            {alerts.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {alerts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Top Selling Products */}
            <Card>
              <CardHeader>
                <CardTitle>Top Selling Products</CardTitle>
                <CardDescription>Products with highest sales volume</CardDescription>
              </CardHeader>
              <CardContent>
                {report?.topSellingProducts.length ? (
                  <div className="space-y-3">
                    {report.topSellingProducts.slice(0, 5).map((product, index) => (
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
                    icon={<TrendingUp className="h-8 w-8" />}
                    title="No sales data"
                    description="No products have been sold yet"
                  />
                )}
              </CardContent>
            </Card>

            {/* Category Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Category Breakdown</CardTitle>
                <CardDescription>Inventory distribution by category</CardDescription>
              </CardHeader>
              <CardContent>
                {report?.categoryBreakdown.length ? (
                  <div className="space-y-3">
                    {report.categoryBreakdown.map((category) => (
                      <div key={category.categoryId} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{category.categoryName}</p>
                          <p className="text-xs text-muted-foreground">
                            {category.productCount} products
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">${category.totalValue.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<Package className="h-8 w-8" />}
                    title="No categories"
                    description="No products have been categorized yet"
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Stock Alerts
                <LiveIndicator />
              </CardTitle>
              <CardDescription>
                Products that need attention for stock management
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length > 0 ? (
                <div className="space-y-4">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getAlertTypeIcon(alert.alertType)}</span>
                        <div>
                          <p className="font-medium">{alert.productName}</p>
                          <p className="text-sm text-muted-foreground">
                            {alert.vendorName} • Stock: {alert.currentStock}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getSeverityColor(alert.severity) as any}>
                          {alert.severity}
                        </Badge>
                        <Badge variant="outline">
                          {alert.alertType.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<Package className="h-8 w-8" />}
                  title="No stock alerts"
                  description="All products have adequate stock levels"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Slow Moving Products */}
            <Card>
              <CardHeader>
                <CardTitle>Slow Moving Products</CardTitle>
                <CardDescription>Products that have been in stock for a long time</CardDescription>
              </CardHeader>
              <CardContent>
                {report?.slowMovingProducts.length ? (
                  <div className="space-y-3">
                    {report.slowMovingProducts.slice(0, 5).map((product) => (
                      <div key={product.productId} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{product.productName}</p>
                          <p className="text-xs text-muted-foreground">
                            {product.currentStock} units in stock
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{product.daysInStock} days</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<TrendingDown className="h-8 w-8" />}
                    title="No slow moving products"
                    description="All products are moving well"
                  />
                )}
              </CardContent>
            </Card>

            {/* Inventory Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Inventory Summary</CardTitle>
                <CardDescription>Key inventory metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Products</span>
                    <span className="text-sm">{report?.totalProducts || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Value</span>
                    <span className="text-sm">${report?.totalValue.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Low Stock</span>
                    <span className="text-sm text-orange-600">{report?.lowStockProducts || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Out of Stock</span>
                    <span className="text-sm text-red-600">{report?.outOfStockProducts || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Reorder Needed</span>
                    <span className="text-sm text-blue-600">{report?.reorderNeeded || 0}</span>
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
