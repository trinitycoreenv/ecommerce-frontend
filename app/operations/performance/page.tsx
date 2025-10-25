"use client"

import { useState, useEffect } from "react"
import { TrendingUp, Clock, Package, Truck, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { KPICard } from "@/components/shared/kpi-card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Area, AreaChart, Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts"

export default function PerformancePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    fulfillmentRate: 0,
    avgProcessingTime: 0,
    shippingAccuracy: 0,
    customerSatisfaction: 0
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('auth_token')

      // Fetch orders and shipments data
      const [ordersResponse, shipmentsResponse] = await Promise.all([
        fetch('/api/orders?limit=1000', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/operations/shipments?status=all&dateRange=all', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      if (ordersResponse.ok && shipmentsResponse.ok) {
        const ordersData = await ordersResponse.json()
        const shipmentsData = await shipmentsResponse.json()

        const orders = ordersData.data || []
        const shipments = shipmentsData.data || []

        // Calculate fulfillment rate
        const deliveredOrders = orders.filter((o: any) => o.status === 'DELIVERED').length
        const fulfillmentRate = orders.length > 0
          ? Math.round((deliveredOrders / orders.length) * 100)
          : 0

        // Calculate shipping accuracy (delivered on time)
        const deliveredShipments = shipments.filter((s: any) => s.status === 'DELIVERED')
        const onTimeDeliveries = deliveredShipments.filter((s: any) => {
          if (!s.estimatedDelivery || !s.actualDelivery) return false
          return new Date(s.actualDelivery) <= new Date(s.estimatedDelivery)
        }).length
        const shippingAccuracy = deliveredShipments.length > 0
          ? Math.round((onTimeDeliveries / deliveredShipments.length) * 100)
          : 0

        // Calculate average processing time (placeholder - would need order processing timestamps)
        const avgProcessingTime = 2 // Placeholder: 2 hours average

        // Customer satisfaction (placeholder - would come from reviews/ratings)
        const customerSatisfaction = 4.2 // Placeholder: 4.2/5 rating

        setStats({
          fulfillmentRate,
          avgProcessingTime,
          shippingAccuracy,
          customerSatisfaction
        })
      }
    } catch (error) {
      console.error('❌ Error fetching performance data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load performance data',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Chart data
  const fulfillmentData = [
    { name: "Week 1", value: 85 },
    { name: "Week 2", value: 88 },
    { name: "Week 3", value: 92 },
    { name: "Week 4", value: stats.fulfillmentRate || 90 }
  ]

  const processingData = [
    { name: "Week 1", value: 2.5 },
    { name: "Week 2", value: 2.3 },
    { name: "Week 3", value: 2.1 },
    { name: "Week 4", value: stats.avgProcessingTime || 2 }
  ]

  const slaMetrics = [
    {
      metric: "Order Fulfillment SLA",
      target: 95,
      actual: stats.fulfillmentRate,
      status: stats.fulfillmentRate >= 95 ? "success" : "warning"
    },
    {
      metric: "Shipping Accuracy SLA",
      target: 98,
      actual: stats.shippingAccuracy,
      status: stats.shippingAccuracy >= 98 ? "success" : "warning"
    },
    {
      metric: "Processing Time SLA",
      target: 90,
      actual: stats.avgProcessingTime <= 3 ? 95 : 85,
      status: stats.avgProcessingTime <= 3 ? "success" : "warning"
    }
  ]

  const carriers = [
    {
      name: "FedEx",
      onTime: 95,
      total: 450,
      rating: 4.5
    },
    {
      name: "UPS",
      onTime: 92,
      total: 380,
      rating: 4.3
    },
    {
      name: "USPS",
      onTime: 88,
      total: 290,
      rating: 4.1
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Performance Analytics</h1>
        <p className="text-muted-foreground mt-2">Monitor operational efficiency and SLA compliance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Order Fulfillment"
          value={isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : `${stats.fulfillmentRate}%`}
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <KPICard
          title="Avg. Processing Time"
          value={isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : `${stats.avgProcessingTime} hrs`}
          icon={<Clock className="h-5 w-5" />}
        />
        <KPICard
          title="Shipping Accuracy"
          value={isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : `${stats.shippingAccuracy}%`}
          icon={<Package className="h-5 w-5" />}
        />
        <KPICard
          title="Customer Satisfaction"
          value={isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : `${stats.customerSatisfaction}/5`}
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fulfillment Rate Trend - Area Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Fulfillment Rate Trend</CardTitle>
            <CardDescription>Weekly fulfillment percentage</CardDescription>
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
              <AreaChart data={fulfillmentData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="week" className="text-xs" />
                <YAxis className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="var(--color-value)"
                  fill="var(--color-value)"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Processing Time Trend - Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Processing Time Trend</CardTitle>
            <CardDescription>Average processing time in hours</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                value: {
                  label: "Processing Time (hrs)",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-[300px]"
            >
              <LineChart data={processingData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="week" className="text-xs" />
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>SLA Compliance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {slaMetrics.map((metric) => (
              <div key={metric.metric} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{metric.metric}</span>
                    {metric.status === "success" ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">Target: {metric.target}%</span>
                    <span className="text-sm font-semibold text-foreground">Actual: {metric.actual}%</span>
                  </div>
                </div>
                <Progress value={metric.actual} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Carrier Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {carriers.map((carrier) => (
              <div key={carrier.name} className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Truck className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{carrier.name}</h3>
                      <p className="text-sm text-muted-foreground">{carrier.total.toLocaleString()} shipments</p>
                    </div>
                  </div>
                  <Badge variant={carrier.onTime >= 95 ? "default" : "secondary"}>{carrier.onTime}% On-Time</Badge>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-500">{carrier.onTime}%</p>
                    <p className="text-xs text-muted-foreground mt-1">On-Time</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-500">{carrier.delayed}%</p>
                    <p className="text-xs text-muted-foreground mt-1">Delayed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-500">{carrier.failed}%</p>
                    <p className="text-xs text-muted-foreground mt-1">Failed</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
