"use client"

import { useState, useEffect } from "react"
import { KPICard } from "@/components/shared/kpi-card"
import { AdvancedChart } from "@/components/shared/advanced-chart"
import { DataList } from "@/components/shared/data-list"
import { StatusBadge } from "@/components/shared/status-badge"
import { DollarSign, TrendingUp, Calendar, CreditCard, PieChart, BarChart3, Activity, Calculator, Settings, Plus, CheckCircle, XCircle, Clock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { AnimatedCounter } from "@/components/ui/animated-counter"
import { LiveIndicator } from "@/components/ui/live-indicator"
import { ActivityFeed } from "@/components/ui/activity-feed"
import { ExportDropdown } from "@/components/shared/export-dropdown"
import { AnalyticsExportUtils } from "@/lib/export-service"

// Real data will be fetched from API endpoints

interface FinanceData {
  totalPlatformRevenue: number
  subscriptionRevenue: {
    mrr: number
    arr: number
    activeSubscriptions: number
  }
  transactionRevenue: {
    total: number
    commissions: number
    orders: number
  }
  pendingPayoutsSummary: {
    total: number
    count: number
  }
  subscriptionStats: {
    byTier: Record<string, number | { count: number; revenue: number }>
    totalActive: number
  }
  recentSubscriptions: Array<{
    id: string
    vendor: string
    plan: string
    tier: string
    price: number
    status: string
    startDate: string
    isTrial: boolean
  }>
  pendingPayouts: Array<{
    id: string
    vendor: string
    amount: number
    status: string
    scheduledDate: string
  }>
}

export default function FinanceDashboard() {
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [isLive, setIsLive] = useState(true)
  const [financeData, setFinanceData] = useState<FinanceData | null>(null)

  const fetchFinanceData = async () => {
    try {
      setIsLoading(true)
      // Use the same API as Admin Main Dashboard for consistency
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          // Use exact same data as Admin Main Dashboard
          const dashboardData = result.data
          const financeData = {
            totalPlatformRevenue: dashboardData.totalRevenue || 0,
            subscriptionRevenue: {
              mrr: dashboardData.mrr || 0,
              arr: dashboardData.arr || 0,
              activeSubscriptions: dashboardData.summary?.activeSubscriptions || 0
            },
            transactionRevenue: {
              total: dashboardData.totalRevenue || 0,
              commissions: dashboardData.commissionRevenue || 0, // Use actual commission data from API
              orders: 0 // Orders count not available in current API
            },
            pendingPayoutsSummary: {
              total: dashboardData.pendingPayoutsTotal || 0, // Use actual pending payouts data
              count: dashboardData.pendingPayoutsCount || 0
            },
            subscriptionStats: {
              byTier: dashboardData.subscriptionStats || {},
              totalActive: dashboardData.summary?.activeSubscriptions || 0
            },
            recentSubscriptions: dashboardData.recentSubscriptions || [],
            pendingPayouts: []
          }
          setFinanceData(financeData)
        }
      }
    } catch (error) {
      console.error('Failed to fetch finance data:', error)
    } finally {
      setIsLoading(false)
      setLastUpdated(new Date())
    }
  }


  useEffect(() => {
    fetchFinanceData()
  }, [])

  // Auto-refresh data every 40 seconds
  useEffect(() => {
    if (!isLive) return

    const interval = setInterval(() => {
      fetchFinanceData()
    }, 40000) // 40 seconds

    return () => clearInterval(interval)
  }, [isLive])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 md:gap-3">
          <h1 className="text-hero text-2xl md:text-3xl lg:text-4xl">Finance Analytics</h1>
            {isLive && <LiveIndicator />}
          </div>
          <p className="text-subtitle mt-2 text-sm md:text-base">
            Monitor transactions, commissions, and payout schedules
            {lastUpdated && (
              <span className="text-caption ml-2 hidden sm:inline">
                • Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        {financeData && (
          <ExportDropdown
            data={AnalyticsExportUtils.transformFinanceDashboardData(financeData)}
            filename="finance-dashboard-report"
            className="h-8 w-8 md:h-10 md:w-10 p-0"
          />
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-caption">Total Platform Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-title text-green-600">
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <AnimatedCounter 
                  value={financeData?.totalPlatformRevenue || 0} 
                  prefix="$" 
                />
              )}
            </div>
            <p className="text-body mt-1">
              {financeData ? 
                `Subscriptions: $${financeData.subscriptionRevenue.mrr.toLocaleString()}/month` : 
                'Loading...'
              }
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-caption">Transaction Commissions</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-title text-blue-600">
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <AnimatedCounter 
                  value={financeData?.transactionRevenue.commissions || 0} 
                  prefix="$" 
                />
              )}
            </div>
            <p className="text-body mt-1">
              {financeData ? 
                `${financeData.transactionRevenue.orders} orders` : 
                'Loading...'
              }
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-caption">Pending Payouts</CardTitle>
              <CreditCard className="h-4 w-4 text-yellow-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-title text-yellow-600">
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <AnimatedCounter 
                  value={financeData?.pendingPayoutsSummary.total || 0} 
                  prefix="$" 
                />
              )}
            </div>
            <p className="text-body mt-1">
              {financeData ? 
                `${financeData.pendingPayoutsSummary.count} payouts pending` : 
                'Loading...'
              }
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-caption">Active Subscriptions</CardTitle>
              <BarChart3 className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-title text-purple-600">
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <AnimatedCounter 
                  value={financeData?.subscriptionRevenue.activeSubscriptions || 0} 
                />
              )}
            </div>
            <p className="text-body mt-1">
              {financeData ? 
                `MRR: $${financeData.subscriptionRevenue.mrr.toLocaleString()}` : 
                'Loading...'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Subscription Revenue Overview</CardTitle>
            <CardDescription>Monthly recurring revenue and subscription metrics</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : financeData ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Monthly Recurring Revenue</span>
                  <span className="text-2xl font-bold text-green-600">
                    ${financeData.subscriptionRevenue.mrr.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Annual Recurring Revenue</span>
                  <span className="text-xl font-semibold">
                    ${financeData.subscriptionRevenue.arr.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Active Subscriptions</span>
                  <span className="text-lg font-medium">
                    {financeData.subscriptionRevenue.activeSubscriptions}
                  </span>
      </div>
        </div>
            ) : (
              <p className="text-muted-foreground">No data available</p>
            )}
          </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
            <CardTitle>Subscription Tiers</CardTitle>
            <CardDescription>Distribution of subscriptions by tier</CardDescription>
            </CardHeader>
            <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : financeData ? (
              <div className="space-y-3">
                {Object.entries(financeData.subscriptionStats.byTier).map(([tier, data]) => {
                  // Handle both object format {count, revenue} and number format
                  const count = typeof data === 'object' ? data.count : data;
                  return (
                    <div key={tier} className="flex justify-between items-center">
                      <span className="text-sm font-medium capitalize">{tier.toLowerCase()}</span>
                      <span className="text-sm text-muted-foreground">{count} subscriptions</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground">No data available</p>
            )}
            </CardContent>
          </Card>
      </div>

      {/* Combined Tables and Finance Activity - 70/30 split */}
      <div className="grid gap-4 lg:grid-cols-10">
        <div className="lg:col-span-7">
          <Tabs defaultValue="subscriptions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="subscriptions">Recent Subscriptions</TabsTrigger>
          <TabsTrigger value="payouts">Pending Payouts</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-heading">Recent Subscriptions</CardTitle>
              <CardDescription className="text-body">Latest vendor subscription activity</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : financeData && financeData.recentSubscriptions.length > 0 ? (
              <DataList
                  items={financeData.recentSubscriptions.map((sub) => ({
                    id: sub.id,
                    title: `${sub.vendor?.businessName || 'Unknown Vendor'} - ${sub.plan?.name || 'Unknown Plan'}`,
                    description: `${sub.tier || 'Unknown Tier'} • $${(parseFloat(sub.price) || 0).toLocaleString()}/month`,
                    metadata: new Date(sub.startDate || sub.createdAt || new Date()).toLocaleDateString(),
                  actions: (
                    <div className="flex items-center gap-3">
                        <span className="text-caption">
                          {sub.trialEndDate ? 'Trial' : 'Active'}
                        </span>
                        <StatusBadge status={(sub.status || 'active').toLowerCase() as any} />
                    </div>
                  ),
                }))}
              />
              ) : (
                <p className="text-muted-foreground">No recent subscriptions</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-heading">Pending Payouts</CardTitle>
              <CardDescription className="text-body">Scheduled vendor payouts</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : financeData && financeData.pendingPayouts.length > 0 ? (
              <DataList
                  items={financeData.pendingPayouts.map((payout) => ({
                  id: payout.id,
                  title: payout.vendor,
                    description: `$${payout.amount.toLocaleString()}`,
                    metadata: new Date(payout.scheduledDate).toLocaleDateString(),
                    actions: <StatusBadge status={payout.status.toLowerCase() as any} />,
                }))}
              />
              ) : (
                <p className="text-muted-foreground">No pending payouts</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle className="text-heading">Financial Analytics</CardTitle>
              <CardDescription className="text-body">Detailed financial metrics and insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                  <div className="rounded-lg border bg-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div className="text-caption">Monthly Recurring Revenue</div>
                    </div>
                    <div className="text-title text-2xl">
                      ${financeData?.subscriptionRevenue.mrr.toLocaleString() || '0'}
                    </div>
                    <div className="text-xs text-success mt-1">From active subscriptions</div>
                  </div>
                  <div className="rounded-lg border bg-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <PieChart className="h-4 w-4 text-muted-foreground" />
                      <div className="text-caption">Active Subscriptions</div>
                    </div>
                    <div className="text-title text-2xl">
                      {financeData?.subscriptionRevenue.activeSubscriptions || 0}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Vendor subscriptions</div>
                  </div>
                  <div className="rounded-lg border bg-card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div className="text-caption">Pending Payouts</div>
                    </div>
                    <div className="text-title text-2xl">
                      ${financeData?.pendingPayoutsSummary.total.toLocaleString() || '0'}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {financeData?.pendingPayoutsSummary.count || 0} payouts
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
        </div>
        
        <div className="lg:col-span-3">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-heading flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Finance Activity
              </CardTitle>
              <CardDescription className="text-body">Real-time financial updates</CardDescription>
            </CardHeader>
            <CardContent>
              <ActivityFeed maxItems={6} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

