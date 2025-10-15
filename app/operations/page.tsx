"use client"

import { useState, useEffect } from "react"
import { KPICard } from "@/components/shared/kpi-card"
import { AdvancedChart } from "@/components/shared/advanced-chart"
import { DataList } from "@/components/shared/data-list"
import { StatusBadge } from "@/components/shared/status-badge"
import { Package, Truck, AlertTriangle, CheckCircle2, MapPin, Activity, Gauge } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { AnimatedCounter } from "@/components/ui/animated-counter"
import { LiveIndicator } from "@/components/ui/live-indicator"
import { ActivityFeed } from "@/components/ui/activity-feed"

// Real data will be fetched from API endpoints
const shipmentVolumeData: any[] = []

// Real data will be fetched from API endpoints
const carrierPerformance: any[] = []

// Real data will be fetched from API endpoints
const zoneDistribution: any[] = []

// Real data will be fetched from API endpoints
const activeShipments: any[] = []

// Real data will be fetched from API endpoints
const slaAlerts: any[] = []

export default function OperationsDashboard() {
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [isLive, setIsLive] = useState(true)

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setIsLoading(false)
      setLastUpdated(new Date())
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  // Auto-refresh data every 35 seconds
  useEffect(() => {
    if (!isLive) return

    const interval = setInterval(() => {
      setLastUpdated(new Date())
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
        <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-caption">Active Shipments</CardTitle>
              <Truck className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-title text-blue-600">
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <span>0</span>
              )}
            </div>
            <p className="text-body mt-1">No data available</p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-caption">SLA Compliance</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-title text-green-600">
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <span>0%</span>
              )}
            </div>
            <p className="text-body mt-1">No data available</p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-caption">Delayed Shipments</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-title text-yellow-600">
              {isLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <span>0</span>
              )}
            </div>
            <p className="text-body mt-1">No data available</p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-caption">Avg Delivery Time</CardTitle>
              <Package className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-title text-purple-600">
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <span>0 days</span>
              )}
            </div>
            <p className="text-body mt-1">No data available</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <AdvancedChart
          title="Shipment Volume & Performance"
          description="Daily shipment tracking for the past week"
          data={shipmentVolumeData}
          type="area"
          multiSeries={[
            { dataKey: "volume", name: "Total Shipments", color: "hsl(var(--chart-1))" },
            { dataKey: "onTime", name: "On-Time", color: "hsl(var(--chart-3))" },
            { dataKey: "delayed", name: "Delayed", color: "hsl(var(--chart-5))" },
          ]}
        />
        <AdvancedChart
          title="Shipments by Zone"
          description="Distribution across shipping zones"
          data={zoneDistribution}
          type="pie"
          dataKey="value"
          nameKey="name"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AdvancedChart
            title="Carrier Performance"
            description="On-time delivery rate by carrier"
            data={carrierPerformance}
            type="bar"
            dataKey="value"
            nameKey="name"
          />
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
