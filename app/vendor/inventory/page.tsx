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
import { AlertTriangle, Package, TrendingUp, RefreshCw, Plus, Minus, Edit } from 'lucide-react'
import { AnimatedCounter } from '@/components/ui/animated-counter'
import { LiveIndicator } from '@/components/ui/live-indicator'
import { DataTable } from '@/components/shared/data-table'
import { EmptyState } from '@/components/shared/empty-state'
import { ExportDropdown } from '@/components/shared/export-dropdown'
import { AnalyticsExportUtils } from '@/lib/export-service'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'

interface ProductInventory {
  productId: string
  productName: string
  currentStock: number
  lowStockThreshold: number
  reorderPoint: number
  isLowStock: boolean
  isOutOfStock: boolean
  needsReorder: boolean
  vendor: {
    id: string
    businessName: string
    user: {
      name: string
      email: string
    }
  }
  category: {
    id: string
    name: string
  }
  variants: Array<{
    id: string
    name: string
    inventory: number
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

interface StockMovement {
  id: string
  productId: string
  productName: string
  movementType: 'IN' | 'OUT' | 'ADJUSTMENT' | 'RETURN'
  quantity: number
  previousStock: number
  newStock: number
  reason: string
  referenceId?: string
  referenceType?: 'ORDER' | 'RETURN' | 'ADJUSTMENT' | 'PURCHASE'
  performedBy: string
  performedByName: string
  timestamp: Date
}

export default function VendorInventoryDashboard() {
  const [products, setProducts] = useState<ProductInventory[]>([])
  const [alerts, setAlerts] = useState<StockAlert[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<ProductInventory | null>(null)
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false)
  const [updateForm, setUpdateForm] = useState({
    quantity: '',
    movementType: 'ADJUSTMENT' as 'IN' | 'OUT' | 'ADJUSTMENT',
    reason: ''
  })
  const [updating, setUpdating] = useState(false)
  const { toast } = useToast()

  const fetchData = async () => {
    try {
      setRefreshing(true)
      const [alertsResponse] = await Promise.all([
        fetch('/api/inventory/alerts', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        })
      ])

      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json()
        setAlerts(alertsData.data.alerts)
      }

      // Fetch products with inventory data
      const productsResponse = await fetch('/api/products', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      if (productsResponse.ok) {
        const productsData = await productsResponse.json()
        console.log('Inventory Page - Products API Response:', productsData)
        const productsWithInventory = await Promise.all(
          productsData.data.map(async (product: any) => {
            try {
              const inventoryResponse = await fetch(`/api/inventory/${product.id}`, {
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                }
              })
              if (inventoryResponse.ok) {
                const inventoryData = await inventoryResponse.json()
                console.log(`Inventory Page - Product ${product.name} inventory:`, inventoryData)
                return inventoryData.data
              } else {
                console.log(`Inventory Page - Failed to get inventory for ${product.name}:`, inventoryResponse.status)
              }
            } catch (error) {
              console.error(`Error fetching inventory for product ${product.id}:`, error)
            }
            return null
          })
        )
        console.log('Inventory Page - Products with inventory:', productsWithInventory)
        const filteredProducts = productsWithInventory.filter(Boolean)
        console.log('Inventory Page - Filtered products:', filteredProducts)
        setProducts(filteredProducts)
      } else {
        console.log('Inventory Page - Products API failed:', productsResponse.status)
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

  const handleUpdateInventory = async () => {
    if (!selectedProduct || !updateForm.quantity || !updateForm.reason) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    try {
      setUpdating(true)
      const response = await fetch(`/api/inventory/${selectedProduct.productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          quantity: parseFloat(updateForm.quantity),
          movementType: updateForm.movementType,
          reason: updateForm.reason
        })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Inventory updated successfully"
        })
        setUpdateDialogOpen(false)
        setUpdateForm({ quantity: '', movementType: 'ADJUSTMENT', reason: '' })
        setSelectedProduct(null)
        fetchData()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to update inventory",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update inventory",
        variant: "destructive"
      })
    } finally {
      setUpdating(false)
    }
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

  const getStockStatusColor = (product: ProductInventory) => {
    if (product.isOutOfStock) return 'text-red-600'
    if (product.isLowStock) return 'text-orange-600'
    if (product.needsReorder) return 'text-blue-600'
    return 'text-green-600'
  }

  const getStockStatusText = (product: ProductInventory) => {
    if (product.isOutOfStock) return 'Out of Stock'
    if (product.isLowStock) return 'Low Stock'
    if (product.needsReorder) return 'Reorder Needed'
    return 'In Stock'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Inventory Management</h1>
            <p className="text-muted-foreground">Manage your product inventory and stock levels</p>
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

  const totalProducts = products.length
  const totalValue = products.reduce((sum, product) => sum + (product.currentStock * 0), 0) // Assuming price is not available in inventory data
  const lowStockProducts = products.filter(p => p.isLowStock).length
  const outOfStockProducts = products.filter(p => p.isOutOfStock).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground">Manage your product inventory and stock levels</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {products.length > 0 && (
            <ExportDropdown
              data={AnalyticsExportUtils.transformVendorInventoryData(products, alerts, {
                totalProducts,
                lowStockProducts,
                outOfStockProducts,
                totalValue
              })}
              filename="vendor-inventory-report"
              className="h-10 w-10 p-0"
            />
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <AnimatedCounter value={totalProducts} />
            </div>
            <p className="text-xs text-muted-foreground">
              Products in your inventory
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              <AnimatedCounter value={lowStockProducts} />
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
              <AnimatedCounter value={outOfStockProducts} />
            </div>
            <p className="text-xs text-muted-foreground">
              Products with zero stock
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <AnimatedCounter value={alerts.length} />
            </div>
            <p className="text-xs text-muted-foreground">
              Stock alerts requiring attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="alerts">
            Stock Alerts
            {alerts.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {alerts.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Inventory</CardTitle>
              <CardDescription>
                Manage stock levels for your products
              </CardDescription>
            </CardHeader>
            <CardContent>
              {products.length > 0 ? (
                <div className="space-y-4">
                  {products.map((product) => (
                    <div key={product.productId} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="font-medium">{product.productName}</p>
                          <p className="text-sm text-muted-foreground">
                            {product.category?.name || 'Uncategorized'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className={`font-medium ${getStockStatusColor(product)}`}>
                            {product.currentStock} units
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {getStockStatusText(product)}
                          </p>
                        </div>
                        <Dialog open={updateDialogOpen && selectedProduct?.productId === product.productId} onOpenChange={(open) => {
                          setUpdateDialogOpen(open)
                          if (!open) {
                            setSelectedProduct(null)
                            setUpdateForm({ quantity: '', movementType: 'ADJUSTMENT', reason: '' })
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedProduct(product)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Update
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Update Inventory</DialogTitle>
                              <DialogDescription>
                                Update stock levels for {product.productName}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="movementType">Movement Type</Label>
                                <Select
                                  value={updateForm.movementType}
                                  onValueChange={(value: 'IN' | 'OUT' | 'ADJUSTMENT') => 
                                    setUpdateForm(prev => ({ ...prev, movementType: value }))
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="IN">Stock In (+)</SelectItem>
                                    <SelectItem value="OUT">Stock Out (-)</SelectItem>
                                    <SelectItem value="ADJUSTMENT">Adjustment (=)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label htmlFor="quantity">Quantity</Label>
                                <Input
                                  id="quantity"
                                  type="number"
                                  value={updateForm.quantity}
                                  onChange={(e) => setUpdateForm(prev => ({ ...prev, quantity: e.target.value }))}
                                  placeholder="Enter quantity"
                                />
                              </div>
                              <div>
                                <Label htmlFor="reason">Reason</Label>
                                <Input
                                  id="reason"
                                  value={updateForm.reason}
                                  onChange={(e) => setUpdateForm(prev => ({ ...prev, reason: e.target.value }))}
                                  placeholder="Enter reason for update"
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                onClick={handleUpdateInventory}
                                disabled={updating}
                              >
                                {updating ? 'Updating...' : 'Update Inventory'}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<Package className="h-8 w-8" />}
                  title="No products found"
                  description="You don't have any products in your inventory yet"
                />
              )}
            </CardContent>
          </Card>
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
                            Current Stock: {alert.currentStock} • Threshold: {alert.threshold}
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
                  description="All your products have adequate stock levels"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
