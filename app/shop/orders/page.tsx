"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Package, Truck, CheckCircle, Clock, Search, Filter, Eye, RefreshCw, Loader2, MapPin } from "lucide-react"
import { StatusBadge } from "@/components/shared/status-badge"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { Skeleton } from "@/components/ui/skeleton"
import { AnimatedCounter } from "@/components/ui/animated-counter"
import Link from "next/link"

interface OrderItem {
  id: string
  productId: string
  variantId?: string
  quantity: number
  price: number
  product: {
    id: string
    name: string
    images: string[]
    vendor: {
      businessName: string
    }
  }
  variant?: {
    id: string
    name: string
    attributes: Record<string, string>
  }
}

interface Order {
  id: string
  orderNumber: string
  status: string
  totalPrice: number
  subtotal: number
  shippingCost: number
  tax: number
  createdAt: string
  updatedAt: string
  shippingAddress: {
    firstName: string
    lastName: string
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  shippingMethod: {
    type: string
    cost: number
    estimatedDays: number
  }
  metadata?: any
  customer: {
    id: string
    name: string
    email: string
  }
  vendor: {
    id: string
    businessName: string
    user: {
      name: string
      email: string
    }
  }
  items: OrderItem[]
  transactions: Array<{
    id: string
    status: string
    amount: number
    type: string
  }>
}

interface OrderStats {
  total: number
  pending: number
  confirmed: number
  processing: number
  shipped: number
  delivered: number
  cancelled: number
  totalRevenue: number
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [stats, setStats] = useState<OrderStats>({
    total: 0,
    pending: 0,
    confirmed: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    totalRevenue: 0
  })
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    loadOrders()
  }, [searchTerm, statusFilter])

  const loadOrders = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter)
      
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/orders?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      
      if (data.success) {
        setOrders(data.data)
        setStats({
          total: data.stats.total || 0,
          pending: data.stats.PENDING || 0,
          confirmed: data.stats.CONFIRMED || 0,
          processing: data.stats.PROCESSING || 0,
          shipped: data.stats.SHIPPED || 0,
          delivered: data.stats.DELIVERED || 0,
          cancelled: data.stats.CANCELLED || 0,
          totalRevenue: data.stats.totalRevenue || 0
        })
      }
    } catch (error) {
      console.error("Failed to load orders:", error)
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order)
    setIsOrderDialogOpen(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(price)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'CONFIRMED':
        return <CheckCircle className="h-4 w-4 text-blue-500" />
      case 'PROCESSING':
        return <Package className="h-4 w-4 text-orange-500" />
      case 'SHIPPED':
        return <Truck className="h-4 w-4 text-purple-500" />
      case 'DELIVERED':
        return <MapPin className="h-4 w-4 text-green-500" />
      case 'CANCELLED':
        return <Package className="h-4 w-4 text-red-500" />
      default:
        return <Package className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusMessage = (order: Order) => {
    const metadata = order.metadata || {}
    
    switch (order.status) {
      case 'SHIPPED':
        return {
          message: 'On the way',
          description: metadata.trackingNumber 
            ? `Tracking: ${metadata.trackingNumber}` 
            : `Estimated delivery: ${metadata.estimatedDelivery || 'TBD'}`,
          showTrack: true
        }
      case 'DELIVERED':
        return {
          message: 'Delivered',
          description: `Your order was delivered on ${formatDate(order.updatedAt)}`,
          showTrack: false
        }
      case 'PROCESSING':
        return {
          message: 'Processing',
          description: 'Your order is being prepared for shipment',
          showTrack: false
        }
      case 'CONFIRMED':
        return {
          message: 'Confirmed',
          description: 'Your order has been confirmed and is being prepared',
          showTrack: false
        }
      case 'PENDING':
        return {
          message: 'Pending',
          description: 'Your order is being reviewed',
          showTrack: false
        }
      case 'CANCELLED':
        return {
          message: 'Cancelled',
          description: metadata.statusNotes || 'Your order has been cancelled',
          showTrack: false
        }
      default:
        return {
          message: order.status,
          description: 'Order status update',
          showTrack: false
        }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Orders</h1>
        <p className="text-muted-foreground mt-2">Track and manage your orders</p>
        </div>
        <Button variant="outline" onClick={loadOrders} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Delivered</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-16" /> : <AnimatedCounter value={stats.delivered} />}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Successfully delivered</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">In Transit</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-16" /> : <AnimatedCounter value={stats.shipped} />}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Currently shipping</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Processing</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-16" /> : <AnimatedCounter value={stats.processing} />}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Being prepared</p>
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
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search Orders</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by order number or product..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                  <SelectItem value="PROCESSING">Processing</SelectItem>
                  <SelectItem value="SHIPPED">Shipped</SelectItem>
                  <SelectItem value="DELIVERED">Delivered</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
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
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No orders found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter 
                  ? "No orders match your current filters." 
                  : "You haven't placed any orders yet."}
              </p>
              <Button asChild>
                <Link href="/shop">Start Shopping</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          orders.map((order) => {
            const statusInfo = getStatusMessage(order)
            
            return (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                      <CardTitle className="text-lg">{order.orderNumber}</CardTitle>
                  <CardDescription>
                        Placed on {formatDate(order.createdAt)} • {order.items?.length || 0} items
                  </CardDescription>
                </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(order.status)}
                      <StatusBadge status={order.status.toLowerCase() as any} />
                    </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Order Total</p>
                      <p className="text-2xl font-bold">{formatPrice(order.totalPrice)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Vendor</p>
                      <p className="text-sm font-medium">{order.vendor.businessName}</p>
                </div>
                  </div>

                  {/* Status-specific information */}
                  <div className={`flex items-start gap-3 p-4 rounded-lg border ${
                    order.status === 'SHIPPED' ? 'bg-primary/5 border-primary/20' :
                    order.status === 'DELIVERED' ? 'bg-green-50 border-green-200' :
                    order.status === 'CANCELLED' ? 'bg-red-50 border-red-200' :
                    'bg-muted'
                  }`}>
                    {getStatusIcon(order.status)}
                    <div className="flex-1">
                      <p className={`font-medium ${
                        order.status === 'DELIVERED' ? 'text-green-700' :
                        order.status === 'CANCELLED' ? 'text-red-700' :
                        ''
                      }`}>{statusInfo.message}</p>
                      <p className="text-sm text-muted-foreground">{statusInfo.description}</p>
                    </div>
                    {statusInfo.showTrack && order.metadata?.trackingNumber && (
                      <Button variant="outline" size="sm">
                        Track Package
                      </Button>
                )}
              </div>

                  {/* Order Items Preview */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Items:</p>
                    <div className="space-y-2">
                      {order.items?.slice(0, 2).map((item) => (
                        <div key={item.id} className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded overflow-hidden bg-muted">
                            {item.product.images.length > 0 ? (
                              <img
                                src={item.product.images[0]}
                                alt={item.product.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center">
                                <Package className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                  <div className="flex-1">
                            <p className="text-sm font-medium">{item.product.name}</p>
                            {item.variant && (
                              <p className="text-xs text-muted-foreground">{item.variant.name}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">Qty: {item.quantity}</p>
                            <p className="text-sm text-muted-foreground">{formatPrice(item.price)}</p>
                          </div>
                        </div>
                      ))}
                      {(order.items?.length || 0) > 2 && (
                        <p className="text-sm text-muted-foreground">
                          +{(order.items?.length || 0) - 2} more items
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleViewOrder(order)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    {order.status === 'SHIPPED' && order.metadata?.trackingNumber && (
                  <Button variant="outline" size="sm">
                        <Truck className="h-4 w-4 mr-2" />
                    Track Package
                  </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Order Details Dialog */}
      <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              {selectedOrder && `Order ${selectedOrder.orderNumber} - ${formatDate(selectedOrder.createdAt)}`}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Status */}
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                {getStatusIcon(selectedOrder.status)}
                <div>
                  <p className="font-medium">{getStatusMessage(selectedOrder).message}</p>
                  <p className="text-sm text-muted-foreground">{getStatusMessage(selectedOrder).description}</p>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold mb-3">Order Items</h3>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-3 border rounded-lg">
                      <div className="h-16 w-16 rounded overflow-hidden bg-muted">
                        {item.product.images.length > 0 ? (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Package className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
                      </div>
                  <div className="flex-1">
                        <h4 className="font-medium">{item.product.name}</h4>
                        {item.variant && (
                          <p className="text-sm text-muted-foreground">{item.variant.name}</p>
                        )}
                        <p className="text-sm text-muted-foreground">Vendor: {item.product.vendor.businessName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">Qty: {item.quantity}</p>
                        <p className="text-sm text-muted-foreground">{formatPrice(item.price)} each</p>
                        <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="font-semibold mb-3">Shipping Address</h3>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="font-medium">{selectedOrder.shippingAddress.firstName} {selectedOrder.shippingAddress.lastName}</p>
                    <p>{selectedOrder.shippingAddress.street}</p>
                    <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}</p>
                    <p>{selectedOrder.shippingAddress.country}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-3">Order Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatPrice(selectedOrder.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping:</span>
                      <span>{formatPrice(selectedOrder.shippingCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>{formatPrice(selectedOrder.tax)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total:</span>
                      <span>{formatPrice(selectedOrder.totalPrice)}</span>
                    </div>
                  </div>
                </div>
      </div>
      </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}