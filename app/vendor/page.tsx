"use client"

import { useState, useEffect } from "react"
import { KPICard } from "@/components/shared/kpi-card"
import { AdvancedChart } from "@/components/shared/advanced-chart"
import { DataList } from "@/components/shared/data-list"
import { StatusBadge } from "@/components/shared/status-badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DollarSign, ShoppingBag, Package, CreditCard, Star } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { apiClient } from "@/lib/api-client"
import { useRouter, useSearchParams } from "next/navigation"

interface DashboardData {
  orders: any[]
  products: any[]
  payouts: any[]
  subscription: any | null
  stats: {
    totalOrders: number
    totalRevenue: number
    pendingOrders: number
    completedOrders: number
  }
}

export default function VendorDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  // Check for refresh parameter and force data refresh
  useEffect(() => {
    const refresh = searchParams.get('refresh')
    if (refresh === 'true' && user) {
      console.log('Dashboard refresh triggered from subscription signup')
      fetchDashboardData()
      // Remove the refresh parameter from URL
      router.replace('/vendor')
    }
  }, [searchParams, user, router])

  // Refetch data when page becomes visible (e.g., returning from subscription page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        fetchDashboardData()
      }
    }

    const handleFocus = () => {
      if (user) {
        fetchDashboardData()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [user])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      
      // Initialize with empty data
      let orders: any[] = []
      let products: any[] = []
      let payouts: any[] = []
      let subscription: any = null

      // Try to fetch data, but handle errors gracefully
      try {
        const authToken = localStorage.getItem('auth_token')
        const ordersResponse = await fetch('/api/vendor/orders?limit=5', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        })
        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json()
          orders = ordersData.data || []
        }
      } catch (error) {
        console.warn('Failed to fetch orders:', error)
        // Continue with empty orders array
      }

      try {
        const authToken = localStorage.getItem('auth_token')
        const productsResponse = await fetch('/api/products?limit=10', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        })
        if (productsResponse.ok) {
          const productsData = await productsResponse.json()
          products = productsData.data || []
        }
      } catch (error) {
        console.warn('Failed to fetch products:', error)
        // Continue with empty products array
      }

      try {
        const authToken = localStorage.getItem('auth_token')
        const payoutsResponse = await fetch('/api/vendor/wallet', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        })
        if (payoutsResponse.ok) {
          const payoutsData = await payoutsResponse.json()
          payouts = payoutsData.data?.payouts || []
        }
      } catch (error) {
        console.warn('Failed to fetch payouts:', error)
        // Continue with empty payouts array
      }

      try {
        const authToken = localStorage.getItem('auth_token')
        const subscriptionResponse = await fetch('/api/subscriptions', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        })
        if (subscriptionResponse.ok) {
          const subscriptionData = await subscriptionResponse.json()
          console.log('Dashboard - Subscription API Response:', subscriptionData)
          subscription = subscriptionData.data || null
          console.log('Dashboard - Parsed subscription:', subscription)
        } else {
          console.log('Dashboard - Subscription API failed:', subscriptionResponse.status)
        }
      } catch (error) {
        console.warn('Failed to fetch subscription:', error)
        // Continue with null subscription
      }

      // Calculate stats
      const totalOrders = orders.length
      const totalRevenue = orders.reduce((sum: number, order: any) => 
        sum + Number(order.totalPrice), 0
      )
      const pendingOrders = orders.filter((order: any) => 
        ['PENDING', 'CONFIRMED', 'PROCESSING'].includes(order.status)
      ).length
      const completedOrders = orders.filter((order: any) => 
        order.status === 'DELIVERED'
      ).length

      const dashboardData = {
        orders,
        products,
        payouts,
        subscription,
        stats: {
          totalOrders,
          totalRevenue,
          pendingOrders,
          completedOrders
        }
      }
      
      console.log('Dashboard - Final data object:', dashboardData)
      console.log('Dashboard - Subscription in final data:', dashboardData.subscription)
      
      setData(dashboardData)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      // Set empty data instead of showing error
      setData({
        orders: [],
        products: [],
        payouts: [],
        subscription: null,
        stats: {
          totalOrders: 0,
          totalRevenue: 0,
          pendingOrders: 0,
          completedOrders: 0
        }
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-hero">Vendor Dashboard</h1>
          <p className="text-subtitle mt-2">Loading your store performance overview...</p>
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

  if (!data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-hero">Vendor Dashboard</h1>
          <p className="text-subtitle mt-2">No data available</p>
        </div>
      </div>
    )
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-hero">Vendor Dashboard</h1>
        <p className="text-subtitle mt-2">Welcome back! Here's your store performance overview</p>
      </div>

      {/* KPI Cards - Top Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Subscription</span>
            </div>
            {data.subscription ? (
              <Badge variant="default" className="bg-success/10 text-success hover:bg-success/20 text-xs">
                {data.subscription.status}
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-warning/10 text-warning hover:bg-warning/20 text-xs">
                No Subscription
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            {data.subscription ? (
              <div className="space-y-2">
                <div className="text-2xl font-bold">{data.subscription.tier}</div>
                <p className="text-xs text-muted-foreground">
                  {data.subscription.trialEndDate && new Date(data.subscription.trialEndDate) > new Date()
                    ? 'Free Trial Active'
                    : `$${data.subscription.price?.toFixed(2) || '0.00'}/month`}
                </p>
                {data.subscription.trialEndDate && new Date(data.subscription.trialEndDate) > new Date() && (
                  <p className="text-xs text-green-600">
                    {Math.ceil((new Date(data.subscription.trialEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-2xl font-bold">No Plan</div>
                <p className="text-xs text-muted-foreground">Choose a plan to get started</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push('/vendor/subscription')}
                  className="w-full"
                >
                  Choose Plan
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <KPICard
          title="Total Orders"
          value={data.stats.totalOrders.toString()}
          icon={<ShoppingBag className="h-5 w-5" />}
          description="All time orders"
        />
        <KPICard
          title="Total Revenue"
          value={`$${data.stats.totalRevenue.toLocaleString()}`}
          icon={<DollarSign className="h-5 w-5" />}
          description="Completed orders"
        />
        <KPICard
          title="Pending Orders"
          value={data.stats.pendingOrders.toString()}
          icon={<Package className="h-5 w-5" />}
          description="Awaiting fulfillment"
        />
        <KPICard
          title="Completed Orders"
          value={data.stats.completedOrders.toString()}
          icon={<Star className="h-5 w-5" />}
          description="Successfully delivered"
        />
      </div>

      {/* Recent Orders and Your Products Cards - Bottom Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest customer orders for your products</CardDescription>
          </CardHeader>
          <CardContent>
            {data.orders.length > 0 ? (
              <div className="space-y-3">
                {data.orders.slice(0, 5).map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{order.orderNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.customer?.name || 'Unknown Customer'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${Number(order.totalPrice).toFixed(2)}</p>
                      <StatusBadge status={order.status.toLowerCase() as any} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No orders yet</p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Your Products</CardTitle>
            <CardDescription>Products in your catalog</CardDescription>
          </CardHeader>
          <CardContent>
            {data.products.length > 0 ? (
              <div className="space-y-3">
                {data.products.slice(0, 5).map((product: any) => (
                  <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Stock: {product.inventory} units
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${Number(product.price).toFixed(2)}</p>
                      <StatusBadge status={product.status.toLowerCase() as any} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No products yet</p>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
