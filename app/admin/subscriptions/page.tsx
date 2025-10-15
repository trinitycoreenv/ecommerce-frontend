"use client"

import { useState, useEffect } from "react"
import { DataTable } from "@/components/shared/data-table"
import { StatusBadge } from "@/components/shared/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Plus, Edit } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ExportDropdown } from "@/components/shared/export-dropdown"
import { AnalyticsExportUtils } from "@/lib/export-service"

interface SubscriptionData {
  id: string
  vendor: {
    businessName: string
    user: {
      name: string
      email: string
    }
  }
  plan: {
    name: string
    tier: string
    price: number
  }
  status: string
  tier: string
  price: number
  createdAt: string
}

export default function SubscriptionsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null)
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const { toast } = useToast()

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch('/api/admin/subscriptions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      console.log('Subscriptions API response status:', response.status)
      
      if (response.ok) {
        const result = await response.json()
        console.log('Subscriptions API result:', result)
        if (result.success) {
          console.log('Setting subscriptions data:', result.data)
          console.log('Setting stats:', result.stats)
          console.log('Subscriptions array length:', result.data?.length)
          console.log('Subscriptions array content:', JSON.stringify(result.data, null, 2))
          setSubscriptions(result.data)
          setStats(result.stats)
        }
      } else {
        const errorText = await response.text()
        console.error('Subscriptions API error:', response.status, errorText)
      }
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  // Debug effect to track subscriptions state changes
  useEffect(() => {
    console.log('Subscriptions state changed:', subscriptions)
    console.log('Subscriptions length in effect:', subscriptions.length)
  }, [subscriptions])

  const handleEdit = (subscription: any) => {
    setSelectedSubscription(subscription)
    setIsDialogOpen(true)
  }

  const handleSave = () => {
    toast({
      title: "Subscription updated",
      description: "The subscription tier has been successfully updated.",
    })
    setIsDialogOpen(false)
    setSelectedSubscription(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">Vendor Subscriptions</h1>
          <p className="text-muted-foreground mt-2 text-sm md:text-base">Manage vendor subscription tiers and billing</p>
        </div>
        <div className="flex gap-2">
          {subscriptions.length > 0 && (
            <ExportDropdown
              data={AnalyticsExportUtils.transformSubscriptionData(subscriptions, stats)}
              filename="vendor-subscriptions-report"
              className="h-8 w-8 md:h-10 md:w-10 p-0"
            />
          )}
          <Button size="sm" className="text-xs md:text-sm">
            <Plus className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Add Subscription</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.subscriptions?.ACTIVE || 0}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {stats?.subscriptions?.ACTIVE || 0} active subscriptions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">₱{stats?.totalRevenue || 0}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Monthly recurring revenue
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Renewals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.subscriptions?.INACTIVE || 0}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {stats?.subscriptions?.INACTIVE || 0} inactive subscriptions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Subscriptions</CardTitle>
          <CardDescription>View and manage vendor subscription details</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading subscriptions...</p>
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="text-center py-8">
              <Plus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No subscription data available</p>
              <p className="text-sm text-muted-foreground mt-2">Real subscription data will appear here when available</p>
            </div>
          ) : (
            <DataTable
              key={`subscriptions-${subscriptions.length}`}
              data={subscriptions}
              columns={[
                {
                  key: "vendor.businessName",
                  label: "Vendor",
                  render: (subscription) => subscription.vendor?.businessName || 'N/A',
                },
                {
                  key: "plan.name",
                  label: "Plan",
                  render: (subscription) => subscription.plan?.name || 'N/A',
                },
                {
                  key: "tier",
                  label: "Tier",
                  render: (subscription) => subscription.tier,
                },
                {
                  key: "price",
                  label: "Price",
                  render: (subscription) => `₱${subscription.price}/month`,
                },
                {
                  key: "status",
                  label: "Status",
                  render: (subscription) => <StatusBadge status={subscription.status} />,
                },
                {
                  key: "createdAt",
                  label: "Created",
                  render: (subscription) => new Date(subscription.createdAt).toLocaleDateString(),
                },
                {
                  key: "actions",
                  label: "Actions",
                  render: (subscription) => (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(subscription)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  ),
                },
              ]}
            />
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Subscription</DialogTitle>
            <DialogDescription>Update subscription tier and billing information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="vendor">Vendor</Label>
              <Input id="vendor" value={selectedSubscription?.vendor || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tier">Subscription Tier</Label>
              <Select defaultValue={selectedSubscription?.tier || "Basic"}>
                <SelectTrigger id="tier">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Starter">Starter - ₱0/mo</SelectItem>
                  <SelectItem value="Basic">Basic - ₱0/mo</SelectItem>
                  <SelectItem value="Pro">Pro - ₱0/mo</SelectItem>
                  <SelectItem value="Enterprise">Enterprise - ₱0/mo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select defaultValue={selectedSubscription?.status || "active"}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
