"use client"

import { useState, useEffect } from "react"
import { KPICard } from "@/components/shared/kpi-card"
import { AdvancedChart } from "@/components/shared/advanced-chart"
import { DataList } from "@/components/shared/data-list"
import { StatusBadge } from "@/components/shared/status-badge"
import { DollarSign, Users, Clock, Package, TrendingUp, AlertCircle, Activity, Shield, Zap } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { AnimatedCounter } from "@/components/ui/animated-counter"
import { LiveIndicator } from "@/components/ui/live-indicator"
import { ActivityFeed } from "@/components/ui/activity-feed"

interface AdminDashboardData {
  totalRevenue: number
  activeVendors: number
  pendingApprovals: number
  activeShipments: number
  subscriptions: {
    total: number
    revenue: number
    recent: any[]
  }
  recentOrders: any[]
  recentVendors: any[]
  recentActivity: any[]
  salesData: any[]
  categoryData: any[]
  vendorPerformance: any[]
}

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [isLive, setIsLive] = useState(true)
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null)

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setDashboardData(result.data)
        }
      }
    } catch (error) {
      console.error('Failed to fetch admin dashboard data:', error)
    } finally {
      setIsLoading(false)
      setLastUpdated(new Date())
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  // Auto-refresh data every 45 seconds
  useEffect(() => {
    if (!isLive) return

    const interval = setInterval(() => {
      fetchDashboardData()
    }, 45000) // 45 seconds

    return () => clearInterval(interval)
  }, [isLive])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
          <h1 className="text-hero">Admin Dashboard</h1>
            {isLive && <LiveIndicator />}
          </div>
          <p className="text-subtitle mt-2">
            Overview of platform performance and pending actions
            {lastUpdated && (
              <span className="text-caption ml-2">
                • Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <Button className="hover:scale-105 transition-transform duration-200">
          <TrendingUp className="mr-2 h-4 w-4" />
          Generate Report
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-caption">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-title text-green-600">
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <span>₱0</span>
              )}
            </div>
            <p className="text-body mt-1">No data available</p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-caption">Active Vendors</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
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
              <CardTitle className="text-caption">Pending Approvals</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
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
              <CardTitle className="text-caption">Active Shipments</CardTitle>
              <Package className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-title text-purple-600">
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <span>0</span>
              )}
            </div>
            <p className="text-body mt-1">No data available</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <AdvancedChart
          title="Revenue & Orders Trends"
          description="Monthly performance over the last 6 months"
          data={salesData}
          type="area"
          multiSeries={[
            { dataKey: "revenue", name: "Revenue ($)", color: "hsl(var(--chart-1))" },
            { dataKey: "orders", name: "Orders", color: "hsl(var(--chart-2))" },
          ]}
        />
        <AdvancedChart
          title="Sales by Category"
          description="Revenue distribution across product categories"
          data={categoryData}
          type="pie"
          dataKey="value"
          nameKey="name"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
      <AdvancedChart
        title="Top Vendor Performance"
        description="No vendor data available"
        data={vendorPerformance}
        type="bar"
        dataKey="sales"
        nameKey="name"
      />
        </div>
        
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Admin Activity
              </CardTitle>
              <CardDescription>Real-time platform monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              <ActivityFeed maxItems={6} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <Tabs defaultValue="approvals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="approvals">Pending Approvals</TabsTrigger>
          <TabsTrigger value="violations">Policy Violations</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="approvals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
              <CardDescription>Items requiring your review and approval</CardDescription>
            </CardHeader>
            <CardContent>
              <DataList
                items={recentApprovals.map((item) => ({
                  id: item.item,
                  title: item.item,
                  description: `${item.vendor} • ${item.type}`,
                  metadata: item.date,
                  actions: <StatusBadge status={item.status as any} />,
                }))}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="violations">
          <Card>
            <CardHeader>
              <CardTitle>Policy Violations</CardTitle>
              <CardDescription>Products flagged for policy review</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-body">No policy violations at this time</p>
                <p className="text-caption mt-1">All products are compliant with platform policies</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest platform events and actions</CardDescription>
            </CardHeader>
            <CardContent>
              <DataList
                items={[]}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
