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
import { ExportDropdown } from "@/components/shared/export-dropdown"
import { AnalyticsExportUtils } from "@/lib/export-service"

// Dashboard data interface
interface DashboardData {
  totalRevenue: number
  activeVendors: number
  pendingApprovals: number
  activeShipments: number
  mrr: number
  arr: number
  subscriptionStats: Record<string, { count: number; revenue: number }>
  vendorStats: Record<string, number>
  recentSubscriptions: any[]
  recentVendors: any[]
  summary: {
    totalSubscriptions: number
    totalVendors: number
    activeSubscriptions: number
    activeVendors: number
    monthlyRevenue: number
  }
}

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [isLive, setIsLive] = useState(true)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)

  const fetchDashboardData = async () => {
    try {
      const authToken = localStorage.getItem('auth_token')
      console.log('Admin Dashboard - Auth token:', authToken ? 'Present' : 'Missing')
      
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })
      
      console.log('Admin Dashboard - Response status:', response.status)
      
      if (response.ok) {
        const result = await response.json()
        console.log('Admin Dashboard - API result:', result)
        if (result.success) {
          setDashboardData(result.data)
          console.log('Admin Dashboard - Data set:', result.data)
        }
      } else {
        const errorText = await response.text()
        console.error('Admin Dashboard - API error:', response.status, errorText)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setIsLoading(false)
      setLastUpdated(new Date())
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  useEffect(() => {
    if (!isLive) return

    const interval = setInterval(() => {
      fetchDashboardData()
    }, 45000) // 45 seconds

    return () => clearInterval(interval)
  }, [isLive])


  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      {/* Header - Mobile responsive */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 md:gap-3">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">Admin Dashboard</h1>
            {isLive && <LiveIndicator />}
          </div>
          <p className="text-sm md:text-base text-muted-foreground">
            Overview of platform performance and pending actions
            {lastUpdated && (
              <span className="text-caption ml-2 hidden sm:inline">
                • Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {dashboardData && (
            <ExportDropdown
              data={AnalyticsExportUtils.transformAdminDashboardData(dashboardData)}
              filename="admin-dashboard-report"
              className="h-10 w-10 p-0"
            />
          )}
          <Button className="hover:scale-105 transition-transform duration-200 text-sm md:text-base">
            <TrendingUp className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Generate Report</span>
            <span className="sm:hidden">Report</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards - Mobile responsive grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-2 md:pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs md:text-sm text-caption">Total Revenue</CardTitle>
              <DollarSign className="h-3 w-3 md:h-4 md:w-4 text-green-500 flex-shrink-0" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1 md:space-y-2">
            <div className="text-xl md:text-2xl lg:text-3xl text-title text-green-600 font-bold">
              {isLoading ? (
                <Skeleton className="h-6 md:h-8 w-16 md:w-24" />
              ) : (
                <AnimatedCounter 
                  value={dashboardData?.totalRevenue || 0} 
                  prefix="$" 
                  suffix="/month"
                />
              )}
            </div>
            <p className="text-xs md:text-sm text-body line-clamp-2">
              {dashboardData?.summary.totalSubscriptions || 0} active subscriptions
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-2 md:pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs md:text-sm text-caption">Active Vendors</CardTitle>
              <Users className="h-3 w-3 md:h-4 md:w-4 text-blue-500 flex-shrink-0" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1 md:space-y-2">
            <div className="text-xl md:text-2xl lg:text-3xl text-title text-blue-600 font-bold">
              {isLoading ? (
                <Skeleton className="h-6 md:h-8 w-12 md:w-16" />
              ) : (
                <AnimatedCounter value={dashboardData?.activeVendors || 0} />
              )}
            </div>
            <p className="text-xs md:text-sm text-body line-clamp-2">
              {dashboardData?.vendorStats.ACTIVE || 0} verified vendors
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-2 md:pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs md:text-sm text-caption">Pending Approvals</CardTitle>
              <Clock className="h-3 w-3 md:h-4 md:w-4 text-yellow-500 flex-shrink-0" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1 md:space-y-2">
            <div className="text-xl md:text-2xl lg:text-3xl text-title text-yellow-600 font-bold">
              {isLoading ? (
                <Skeleton className="h-6 md:h-8 w-8 md:w-12" />
              ) : (
                <AnimatedCounter value={dashboardData?.pendingApprovals || 0} />
              )}
            </div>
            <p className="text-xs md:text-sm text-body line-clamp-2">
              {dashboardData?.pendingApprovals || 0} pending approvals
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-2 md:pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs md:text-sm text-caption">Active Shipments</CardTitle>
              <Package className="h-3 w-3 md:h-4 md:w-4 text-purple-500 flex-shrink-0" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1 md:space-y-2">
            <div className="text-xl md:text-2xl lg:text-3xl text-title text-purple-600 font-bold">
              {isLoading ? (
                <Skeleton className="h-6 md:h-8 w-12 md:w-16" />
              ) : (
                <AnimatedCounter value={dashboardData?.activeShipments || 0} />
              )}
            </div>
            <p className="text-xs md:text-sm text-body line-clamp-2">
              {dashboardData?.activeShipments || 0} in transit
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section - Mobile responsive */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <AdvancedChart
          title="Revenue & Orders Trends"
          description="Monthly performance over the last 6 months"
          data={dashboardData ? [
            { month: "Sep", revenue: dashboardData.mrr, orders: dashboardData.activeVendors },
            { month: "Oct", revenue: dashboardData.totalRevenue, orders: dashboardData.activeVendors }
          ] : []}
          type="area"
          multiSeries={[
            { dataKey: "revenue", name: "Revenue ($)", color: "hsl(var(--chart-1))" },
            { dataKey: "orders", name: "Orders", color: "hsl(var(--chart-2))" },
          ]}
        />
        <AdvancedChart
          title="Sales by Category"
          description="Revenue distribution across product categories"
          data={dashboardData ? [
            { name: "Subscriptions", value: dashboardData.mrr },
            { name: "Commissions", value: dashboardData.totalRevenue - dashboardData.mrr }
          ] : []}
          type="pie"
          dataKey="value"
          nameKey="name"
        />
      </div>

      {/* Bottom Section - Mobile responsive */}
      <div className="grid gap-4 lg:gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AdvancedChart
            title="Top Vendor Performance"
            description="Vendor performance by revenue"
            data={dashboardData?.recentVendors.map((vendor, index) => ({
              name: vendor.businessName,
              sales: dashboardData.totalRevenue / dashboardData.activeVendors, // Distribute revenue among vendors
              revenue: dashboardData.totalRevenue / dashboardData.activeVendors
            })) || []}
            type="bar"
            dataKey="sales"
            nameKey="name"
          />
        </div>
        
        <div className="lg:col-span-1">
          <Card className="lg:sticky lg:top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm md:text-base">
                <Shield className="h-4 w-4 md:h-5 md:w-5" />
                Admin Activity
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">Real-time platform monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              <ActivityFeed maxItems={6} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity - Mobile responsive tabs */}
      <Tabs defaultValue="approvals" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="approvals" className="text-xs md:text-sm">Pending Approvals</TabsTrigger>
          <TabsTrigger value="violations" className="text-xs md:text-sm">Policy Violations</TabsTrigger>
          <TabsTrigger value="activity" className="text-xs md:text-sm">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="approvals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm md:text-base">Pending Approvals</CardTitle>
              <CardDescription className="text-xs md:text-sm">Items requiring your review and approval</CardDescription>
            </CardHeader>
            <CardContent>
              <DataList
                items={dashboardData?.recentVendors.map((vendor) => ({
                  id: vendor.id,
                  title: vendor.businessName,
                  description: `${vendor.user.name} • ${vendor.user.email}`,
                  metadata: new Date(vendor.createdAt).toLocaleDateString(),
                  actions: <StatusBadge status={vendor.status as any} />,
                })) || []}
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
                items={dashboardData?.recentSubscriptions.map((subscription) => ({
                  id: subscription.id,
                  title: `${subscription.vendor.businessName} - ${subscription.plan?.name || 'Unknown Plan'}`,
                  description: `${subscription.vendor.user.name} • ${subscription.tier} • $${subscription.price}/month`,
                  metadata: new Date(subscription.createdAt).toLocaleDateString(),
                  actions: <StatusBadge status={subscription.status as any} />,
                })) || []}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
