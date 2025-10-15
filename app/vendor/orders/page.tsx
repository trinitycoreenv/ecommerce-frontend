"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Package, Truck, CheckCircle, Clock, Search, RefreshCw, Loader2, Eye, AlertCircle } from "lucide-react"
import { StatusBadge } from "@/components/shared/status-badge"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { apiClient } from "@/lib/api-client"
import { useRouter, useSearchParams } from "next/navigation"
import { ExportDropdown } from "@/components/shared/export-dropdown"
import { AnalyticsExportUtils } from "@/lib/export-service"

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

export default function VendorOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const { toast } = useToast()
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Handle refresh parameter
  useEffect(() => {
    const refresh = searchParams.get('refresh')
    if (refresh === 'true') {
      fetchOrders()
      const newSearchParams = new URLSearchParams(searchParams.toString())
      newSearchParams.delete('refresh')
      router.replace(`/vendor/orders?${newSearchParams.toString()}`, { shallow: true })
    }
  }, [searchParams, router])

  // Fetch orders when component mounts or filters change
  useEffect(() => {
    if (user) {
      fetchOrders()
    }
  }, [user, statusFilter, searchTerm])

  const fetchOrders = async () => {
    try {
      setIsLoading(true)
      console.log('Fetching orders...')
      
      const response = await fetch('/api/vendor/orders', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      const ordersData = await response.json()
      console.log('API response:', ordersData)
      
      if (ordersData && ordersData.data) {
        console.log('Setting orders:', ordersData.data.length)
        setOrders(ordersData.data)
      } else {
        console.log('No orders data, setting empty array')
        setOrders([])
      }
      
    } catch (error) {
      console.error('Error fetching orders:', error)
      setOrders([])
      if (error instanceof Error && !error.message.includes('Vendor profile not found')) {
        toast({
          title: "Error",
          description: "Failed to load orders",
          variant: "destructive"
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'CONFIRMED':
      case 'PROCESSING':
        return <RefreshCw className="h-4 w-4 text-blue-500" />
      case 'SHIPPED':
        return <Truck className="h-4 w-4 text-indigo-500" />
      case 'DELIVERED':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'CANCELLED':
      case 'REFUNDED':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(price)
  }

  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order)
    setIsModalOpen(true)
  }

  const closeOrderDetails = () => {
    setIsModalOpen(false)
    setSelectedOrder(null)
  }

  // Filter orders based on search and status
  const filteredOrders = orders.filter(order => {
    const matchesSearch = !searchTerm || 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Calculate stats
  const stats = {
    pending: orders.filter(order => ['PENDING', 'CONFIRMED', 'PROCESSING'].includes(order.status)).length,
    inTransit: orders.filter(order => ['SHIPPED'].includes(order.status)).length,
    delivered: orders.filter(order => order.status === 'DELIVERED').length,
    total: orders.length
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-6 w-96" />
        <div className="grid gap-4 md:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-48" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Order Management</h1>
        <p className="text-muted-foreground mt-2">Track and manage customer orders</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Orders</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.pending}</div>
            <p className="text-sm text-muted-foreground mt-1">Awaiting fulfillment</p>
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
            <div className="text-3xl font-bold">{stats.inTransit}</div>
            <p className="text-sm text-muted-foreground mt-1">Currently shipping</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Delivered</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.delivered}</div>
            <p className="text-sm text-muted-foreground mt-1">Successfully delivered</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground mt-1">All time orders</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by order number or customer..."
            className="pl-10 pr-4"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="CONFIRMED">Confirmed</SelectItem>
            <SelectItem value="PROCESSING">Processing</SelectItem>
            <SelectItem value="SHIPPED">Shipped</SelectItem>
            <SelectItem value="DELIVERED">Delivered</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
            <SelectItem value="REFUNDED">Refunded</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          {orders.length > 0 && (
            <ExportDropdown
              data={AnalyticsExportUtils.transformOrderData(orders, stats)}
              filename="order-management-report"
              className="h-10 w-10 p-0"
            />
          )}
          <Button onClick={fetchOrders} variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Orders</CardTitle>
          <CardDescription>View and update order status and tracking information</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="mx-auto h-12 w-12 mb-4" />
              <p className="text-lg font-medium">No orders found</p>
              <p className="text-sm">Your orders will appear here after customers make a purchase.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <Card key={order.id} className="border-2 hover:border-primary/50 transition-all duration-300">
                  <CardContent className="p-4">
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
                    <Separator className="my-3" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Total Amount</p>
                        <p className="font-medium">{formatPrice(order.totalPrice)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Customer</p>
                        <p className="font-medium">{order.customer.name}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Shipping</p>
                        <p className="font-medium">{order.shippingMethod.type} ({formatPrice(order.shippingMethod.cost)})</p>
                      </div>
                      <div className="text-right">
                        <Button variant="outline" size="sm" onClick={() => openOrderDetails(order)}>
                          <Eye className="h-4 w-4 mr-2" /> View Details
                  </Button>
                      </div>
                    </div>

                    {/* Order Items Preview */}
                    <div className="space-y-2 mt-4">
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
                                <div className="flex items-center justify-center h-full w-full text-muted-foreground text-xs">
                                  <Package className="h-4 w-4" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm">{item.product.name}</p>
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
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      {selectedOrder && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
              <DialogTitle>Order Details: {selectedOrder.orderNumber}</DialogTitle>
              <DialogDescription>
                Detailed information about your order.
              </DialogDescription>
          </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-2">
                <p className="text-muted-foreground">Status:</p>
                <StatusBadge status={selectedOrder.status.toLowerCase() as any} />
                <p className="text-muted-foreground">Total Price:</p>
                <p className="font-medium">{formatPrice(selectedOrder.totalPrice)}</p>
                <p className="text-muted-foreground">Placed On:</p>
                <p className="font-medium">{formatDate(selectedOrder.createdAt)}</p>
                <p className="text-muted-foreground">Customer:</p>
                <p className="font-medium">{selectedOrder.customer.name} ({selectedOrder.customer.email})</p>
              </div>
              <Separator />
              <div>
                <h3 className="font-semibold mb-3">Shipping Address</h3>
                <p>{selectedOrder.shippingAddress.firstName} {selectedOrder.shippingAddress.lastName}</p>
                <p>{selectedOrder.shippingAddress.street}</p>
                <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}</p>
                <p>{selectedOrder.shippingAddress.country}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Shipping Method</h3>
                <p>{selectedOrder.shippingMethod.type} - {formatPrice(selectedOrder.shippingMethod.cost)}</p>
                <p className="text-muted-foreground text-sm">Estimated Delivery: {selectedOrder.shippingMethod.estimatedDays} days</p>
              </div>
              <Separator />
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
                          <div className="flex items-center justify-center h-full w-full text-muted-foreground text-xs">
                            <Package className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{item.product.name}</p>
                        {item.variant && (
                          <p className="text-sm text-muted-foreground">{item.variant.name} ({Object.values(item.variant.attributes).join(', ')})</p>
                        )}
                        <p className="text-sm text-muted-foreground">Vendor: {item.product.vendor.businessName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatPrice(item.price)}</p>
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
              {/* Transactions */}
              <div>
                <h3 className="font-semibold mb-3">Transactions</h3>
            <div className="space-y-2">
                  {selectedOrder.transactions.length > 0 ? (
                    selectedOrder.transactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between text-sm p-2 border rounded-lg">
                        <p className="font-medium">{transaction.type}</p>
                        <p>{formatPrice(transaction.amount)}</p>
                        <StatusBadge status={transaction.status.toLowerCase() as any} />
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">No transaction records found.</p>
                  )}
            </div>
            </div>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={closeOrderDetails}>Close</Button>
            </div>
        </DialogContent>
      </Dialog>
      )}
    </div>
  )
}