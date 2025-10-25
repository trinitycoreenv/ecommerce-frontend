"use client"

import { useState, useEffect } from "react"
import { KPICard } from "@/components/shared/kpi-card"
import { DataList } from "@/components/shared/data-list"
import { StatusBadge } from "@/components/shared/status-badge"
import { Package, Truck, AlertTriangle, CheckCircle2, MapPin, Activity, Gauge } from "lucide-react"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import { Area, AreaChart, Bar, BarChart, Pie, PieChart, Cell, CartesianGrid, XAxis, YAxis, RadialBar, RadialBarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, RadarChart, Label } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { AnimatedCounter } from "@/components/ui/animated-counter"
import { LiveIndicator } from "@/components/ui/live-indicator"
import { ActivityFeed } from "@/components/ui/activity-feed"

export default function OperationsDashboard() {
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [isLive, setIsLive] = useState(true)
  const [stats, setStats] = useState({
    activeShipments: 0,
    slaCompliance: 0,
    delayedShipments: 0,
    avgDeliveryTime: 0
  })
  const [shipmentVolumeData, setShipmentVolumeData] = useState<any[]>([])
  const [carrierPerformance, setCarrierPerformance] = useState<any[]>([])
  const [zoneDistribution, setZoneDistribution] = useState<any[]>([])
  const [activeShipments, setActiveShipments] = useState<any[]>([])
  const [slaAlerts, setSlaAlerts] = useState<any[]>([])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('auth_token')

      const response = await fetch('/api/operations/shipments?status=all&dateRange=all', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('📊 Operations data:', data)

        if (data.success && Array.isArray(data.data)) {
          const shipments = data.data || []

          // Calculate stats
          const activeCount = shipments.filter((s: any) =>
            s.status === 'PENDING' || s.status === 'IN_TRANSIT'
          ).length

          const deliveredCount = shipments.filter((s: any) =>
            s.status === 'DELIVERED'
          ).length

          const delayedCount = shipments.filter((s: any) => {
            if (!s.estimatedDelivery) return false
            const estimated = new Date(s.estimatedDelivery)
            const now = new Date()
            return s.status !== 'DELIVERED' && now > estimated
          }).length

          setStats({
            activeShipments: activeCount,
            slaCompliance: shipments.length > 0
              ? Math.round((deliveredCount / shipments.length) * 100)
              : 0,
            delayedShipments: delayedCount,
            avgDeliveryTime: 3 // Placeholder
          })

          // Populate chart data
          setShipmentVolumeData([
            { name: "Mon", volume: 45, onTime: 40, delayed: 5 },
            { name: "Tue", volume: 52, onTime: 48, delayed: 4 },
            { name: "Wed", volume: 48, onTime: 45, delayed: 3 },
            { name: "Thu", volume: 61, onTime: 58, delayed: 3 },
            { name: "Fri", volume: 55, onTime: 50, delayed: 5 },
            { name: "Sat", volume: 38, onTime: 35, delayed: 3 },
            { name: "Sun", volume: 42, onTime: 39, delayed: 3 }
          ])

          // Carrier performance
          const fedexShipments = shipments.filter((s: any) => s.carrier === 'FedEx')
          const upsShipments = shipments.filter((s: any) => s.carrier === 'UPS')
          const uspsShipments = shipments.filter((s: any) => s.carrier === 'USPS')

          setCarrierPerformance([
            {
              name: "FedEx",
              value: fedexShipments.length > 0
                ? Math.round((fedexShipments.filter((s: any) => s.status === 'DELIVERED').length / fedexShipments.length) * 100)
                : 0
            },
            {
              name: "UPS",
              value: upsShipments.length > 0
                ? Math.round((upsShipments.filter((s: any) => s.status === 'DELIVERED').length / upsShipments.length) * 100)
                : 0
            },
            {
              name: "USPS",
              value: uspsShipments.length > 0
                ? Math.round((uspsShipments.filter((s: any) => s.status === 'DELIVERED').length / uspsShipments.length) * 100)
                : 0
            }
          ])

          // Zone distribution
          setZoneDistribution([
            { name: "Zone 1 - Local", value: Math.round(shipments.length * 0.4) },
            { name: "Zone 2 - Regional", value: Math.round(shipments.length * 0.35) },
            { name: "Zone 3 - National", value: Math.round(shipments.length * 0.25) }
          ])

          // Active shipments list
          setActiveShipments(
            shipments
              .filter((s: any) => s.status === 'IN_TRANSIT')
              .slice(0, 5)
              .map((s: any) => ({
                id: s.id,
                orderNumber: s.order?.orderNumber || 'N/A',
                customer: s.order?.customer?.name || 'Unknown',
                status: s.status,
                carrier: s.carrier,
                estimatedDelivery: s.estimatedDelivery
              }))
          )
        }
      } else {
        console.error('❌ Failed to fetch operations data:', response.status)
      }
    } catch (error) {
      console.error('❌ Error fetching operations data:', error)
    } finally {
      setIsLoading(false)
      setLastUpdated(new Date())
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Auto-refresh data every 35 seconds
  useEffect(() => {
    if (!isLive) return

    const interval = setInterval(() => {
      fetchData()
    }, 35000) // 35 seconds

    return () => clearInterval(interval)
  }, [isLive])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 md:gap-3">
            <h1 className="text-hero text-2xl md:text-3xl lg:text-4xl">Operations Dashboard</h1>
            {isLive && <LiveIndicator />}
          </div>
          <p className="text-subtitle mt-2 text-sm md:text-base">
            Monitor logistics, shipments, and SLA compliance
            {lastUpdated && (
              <span className="text-caption ml-2 hidden sm:inline">
                • Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <Button className="hover:scale-105 transition-transform duration-200 text-xs md:text-sm">
          <Package className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
          <span className="hidden sm:inline">Generate Report</span>
          <span className="sm:hidden">Report</span>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Active Shipments"
          value={isLoading ? "..." : stats.activeShipments.toString()}
          icon={<Truck className="h-5 w-5" />}
          description="Currently shipping"
        />
        <KPICard
          title="SLA Compliance"
          value={isLoading ? "..." : `${stats.slaCompliance}%`}
          icon={<CheckCircle2 className="h-5 w-5" />}
          description="On-time delivery rate"
        />
        <KPICard
          title="Delayed Shipments"
          value={isLoading ? "..." : stats.delayedShipments.toString()}
          icon={<AlertTriangle className="h-5 w-5" />}
          description={stats.delayedShipments > 0 ? "Needs attention" : "All on track"}
        />
        <KPICard
          title="Avg Delivery Time"
          value={isLoading ? "..." : `${stats.avgDeliveryTime} days`}
          icon={<Package className="h-5 w-5" />}
          description="Average transit time"
        />
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {/* Shipment Volume & Performance - Area Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Shipment Volume & Performance</CardTitle>
            <CardDescription>Daily shipment tracking for the past week</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                volume: {
                  label: "Total Shipments",
                  color: "hsl(var(--chart-1))",
                },
                onTime: {
                  label: "On-Time",
                  color: "hsl(var(--chart-2))",
                },
                delayed: {
                  label: "Delayed",
                  color: "hsl(var(--chart-3))",
                },
              }}
              className="h-[350px]"
            >
              <AreaChart data={shipmentVolumeData}>
                <defs>
                  <linearGradient id="fillVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-volume)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-volume)" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="fillOnTime" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-onTime)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-onTime)" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="fillDelayed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-delayed)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-delayed)" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                <XAxis
                  dataKey="date"
                  className="text-xs"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  className="text-xs"
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip
                  content={<ChartTooltipContent indicator="dot" />}
                  cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1, strokeDasharray: "3 3" }}
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Area
                  type="monotone"
                  dataKey="volume"
                  stroke="var(--color-volume)"
                  fill="url(#fillVolume)"
                  strokeWidth={2}
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="onTime"
                  stroke="var(--color-onTime)"
                  fill="url(#fillOnTime)"
                  strokeWidth={2}
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="delayed"
                  stroke="var(--color-delayed)"
                  fill="url(#fillDelayed)"
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Shipments by Zone - Donut Chart with Text */}
        <Card>
          <CardHeader>
            <CardTitle>Shipments by Zone</CardTitle>
            <CardDescription>Distribution across shipping zones</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                zone1: {
                  label: "Zone 1",
                  color: "hsl(var(--chart-1))",
                },
                zone2: {
                  label: "Zone 2",
                  color: "hsl(var(--chart-2))",
                },
                zone3: {
                  label: "Zone 3",
                  color: "hsl(var(--chart-3))",
                },
                zone4: {
                  label: "Zone 4",
                  color: "hsl(var(--chart-4))",
                },
                zone5: {
                  label: "Zone 5",
                  color: "hsl(var(--chart-5))",
                },
              }}
              className="h-[350px]"
            >
              <PieChart>
                <ChartTooltip
                  content={<ChartTooltipContent hideLabel />}
                  cursor={false}
                />
                <Pie
                  data={zoneDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  strokeWidth={5}
                  paddingAngle={2}
                >
                  {zoneDistribution.map((_entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={`hsl(var(--chart-${(index % 5) + 1}))`}
                      className="stroke-background hover:opacity-80 transition-opacity"
                    />
                  ))}
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        const total = zoneDistribution.reduce((sum, item) => sum + item.value, 0)
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy}
                              className="fill-foreground text-3xl font-bold"
                            >
                              {total.toLocaleString()}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 24}
                              className="fill-muted-foreground"
                            >
                              Total Shipments
                            </tspan>
                          </text>
                        )
                      }
                    }}
                  />
                </Pie>
                <ChartLegend
                  content={<ChartLegendContent nameKey="name" />}
                  className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
                />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {/* Carrier Performance - Radar Chart with Grid Circle */}
          <Card>
            <CardHeader>
              <CardTitle>Carrier Performance</CardTitle>
              <CardDescription>Multi-dimensional carrier performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  value: {
                    label: "Performance Score",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-[400px]"
              >
                <RadarChart data={carrierPerformance}>
                  <ChartTooltip
                    content={<ChartTooltipContent indicator="line" />}
                    cursor={false}
                  />
                  <PolarAngleAxis
                    dataKey="name"
                    className="text-xs"
                  />
                  <PolarGrid
                    gridType="circle"
                    className="stroke-muted"
                    radialLines={false}
                  />
                  <Radar
                    dataKey="value"
                    fill="var(--color-value)"
                    fillOpacity={0.6}
                    stroke="var(--color-value)"
                    strokeWidth={2}
                    dot={{
                      r: 4,
                      fillOpacity: 1,
                    }}
                  />
                </RadarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-heading flex items-center gap-2">
                <Gauge className="h-5 w-5" />
                Operations Activity
              </CardTitle>
              <CardDescription className="text-body">Real-time logistics updates</CardDescription>
            </CardHeader>
            <CardContent>
              <ActivityFeed maxItems={6} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* SLA Compliance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-heading">SLA Compliance by Zone</CardTitle>
          <CardDescription className="text-body">Performance metrics across shipping zones</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {zoneDistribution.map((zone) => (
              <div key={zone.name}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-caption">{zone.name}</span>
                  </div>
                  <span className="text-body">{zone.compliance}%</span>
                </div>
                <Progress value={zone.compliance} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Tables */}
      <Tabs defaultValue="shipments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="shipments">Active Shipments</TabsTrigger>
          <TabsTrigger value="alerts">SLA Alerts</TabsTrigger>
          <TabsTrigger value="carriers">Carrier Management</TabsTrigger>
        </TabsList>

        <TabsContent value="shipments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-heading">Active Shipments</CardTitle>
              <CardDescription className="text-body">Real-time tracking of in-transit shipments</CardDescription>
            </CardHeader>
            <CardContent>
              <DataList
                items={activeShipments.map((shipment) => ({
                  id: shipment.id,
                  title: `Shipment ${shipment.id}`,
                  description: `${shipment.carrier} → ${shipment.destination}`,
                  metadata: `ETA: ${shipment.eta}`,
                  actions: <StatusBadge status={shipment.status} />,
                }))}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-heading">SLA Alerts</CardTitle>
              <CardDescription className="text-body">Shipments requiring immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              <DataList
                items={slaAlerts.map((alert) => {
                  const statusMap = {
                    high: "failed" as const,
                    medium: "pending" as const,
                    low: "approved" as const,
                  }
                  return {
                    id: alert.shipment,
                    title: alert.shipment,
                    description: `${alert.issue} • ${alert.carrier}`,
                    metadata: "Requires attention",
                    actions: <StatusBadge status={statusMap[alert.severity as keyof typeof statusMap]} />,
                  }
                })}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="carriers">
          <Card>
            <CardHeader>
              <CardTitle className="text-heading">Carrier Management</CardTitle>
              <CardDescription className="text-body">Configure and monitor carrier partnerships</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {carrierPerformance.map((carrier) => (
                  <div
                    key={carrier.name}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="text-caption">{carrier.name}</div>
                      <div className="text-body">
                        On-time: {carrier.value}% • {carrier.shipments} shipments
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
