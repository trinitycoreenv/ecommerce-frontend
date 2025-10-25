"use client"
import { useState, useEffect } from "react"
import { Warehouse, MapPin, Package, AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { KPICard } from "@/components/shared/kpi-card"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts"

export default function LogisticsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    warehouses: 0,
    totalInventory: 0,
    fulfillmentRate: 0,
    stockAlerts: 0
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('auth_token')

      // Fetch orders to calculate fulfillment rate
      const ordersResponse = await fetch('/api/orders?limit=1000', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json()
        const orders = ordersData.data || []

        // Calculate fulfillment rate
        const deliveredOrders = orders.filter((o: any) => o.status === 'DELIVERED').length
        const fulfillmentRate = orders.length > 0
          ? Math.round((deliveredOrders / orders.length) * 100)
          : 0

        // For now, use placeholder values for warehouses and inventory
        // In a real system, these would come from dedicated warehouse/inventory APIs
        setStats({
          warehouses: 1, // Placeholder - would come from warehouse API
          totalInventory: orders.length * 10, // Rough estimate based on orders
          fulfillmentRate,
          stockAlerts: 0 // Placeholder - would come from inventory API
        })
      }
    } catch (error) {
      console.error('❌ Error fetching logistics data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load logistics data',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Placeholder data for shipping zones
  const shippingZones = [
    {
      zone: "Zone 1 - Local",
      states: "Same state delivery",
      cost: "$5.99",
      avgDelivery: "1-2 days",
      volume: 450
    },
    {
      zone: "Zone 2 - Regional",
      states: "Neighboring states",
      cost: "$8.99",
      avgDelivery: "2-3 days",
      volume: 320
    },
    {
      zone: "Zone 3 - National",
      states: "Nationwide",
      cost: "$12.99",
      avgDelivery: "3-5 days",
      volume: 180
    }
  ]

  // Placeholder data for performance chart
  const performanceData = [
    { name: "Mon", value: 85 },
    { name: "Tue", value: 92 },
    { name: "Wed", value: 88 },
    { name: "Thu", value: 95 },
    { name: "Fri", value: 90 },
    { name: "Sat", value: 78 },
    { name: "Sun", value: 82 }
  ]

  // Placeholder warehouse data
  const warehouses = [
    {
      id: "1",
      name: "Main Distribution Center",
      location: "New York, NY",
      capacity: 10000,
      current: 7500,
      status: "operational",
      orders: 145,
      shipments: 89
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Logistics Management</h1>
        <p className="text-muted-foreground mt-2">Monitor warehouse operations and shipping zones</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Warehouses"
          value={isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : stats.warehouses.toString()}
          icon={<Warehouse className="h-5 w-5" />}
        />
        <KPICard
          title="Total Inventory"
          value={isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : stats.totalInventory.toString()}
          icon={<Package className="h-5 w-5" />}
        />
        <KPICard
          title="Fulfillment Rate"
          value={isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : `${stats.fulfillmentRate}%`}
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <KPICard
          title="Stock Alerts"
          value={isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : stats.stockAlerts.toString()}
          icon={<AlertCircle className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fulfillment Performance - Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Fulfillment Performance</CardTitle>
            <CardDescription>Daily fulfillment rate percentage</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                value: {
                  label: "Fulfillment Rate %",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-[300px]"
            >
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="day" className="text-xs" />
                <YAxis className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="var(--color-value)"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shipping Zones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {shippingZones.map((zone) => (
                <div key={zone.zone} className="border border-border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-foreground">{zone.zone}</h3>
                      <p className="text-sm text-muted-foreground">{zone.states}</p>
                    </div>
                    <Badge variant="outline">{zone.cost}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Avg. Delivery</p>
                      <p className="text-sm font-medium text-foreground">{zone.avgDelivery}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Monthly Volume</p>
                      <p className="text-sm font-medium text-foreground">{zone.volume.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Warehouse Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {warehouses.map((warehouse) => (
              <div key={warehouse.id} className="border border-border rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Warehouse className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-foreground">{warehouse.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">{warehouse.location}</p>
                      </div>
                    </div>
                  </div>
                  <Badge variant={warehouse.status === "operational" ? "default" : "secondary"}>
                    {warehouse.status}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Capacity Utilization</span>
                      <span className="text-sm font-medium text-foreground">
                        {((warehouse.current / warehouse.capacity) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={(warehouse.current / warehouse.capacity) * 100} />
                    <p className="text-xs text-muted-foreground mt-1">
                      {warehouse.current.toLocaleString()} / {warehouse.capacity.toLocaleString()} units
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border">
                    <div>
                      <p className="text-xs text-muted-foreground">Active Orders</p>
                      <p className="text-lg font-semibold text-foreground">{warehouse.orders.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Shipments Today</p>
                      <p className="text-lg font-semibold text-foreground">{warehouse.shipments.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                  <Button variant="outline" size="sm">
                    Manage Inventory
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
