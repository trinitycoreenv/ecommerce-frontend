"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { Search, Users, CreditCard, Star, Calendar, Mail, Building } from "lucide-react"

interface Vendor {
  id: string
  businessName: string
  status: string
  subscriptionTier: string
  commissionRate: number
  createdAt: string
  user: {
    id: string
    name: string
    email: string
    emailVerified: boolean
    createdAt: string
  }
  subscriptions: Array<{
    id: string
    status: string
    tier: string
    startDate: string
    trialEndDate?: string
    price: number
    plan: {
      name: string
      tier: string
      price: number
      trialDays: number
    }
  }>
}

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [stats, setStats] = useState<any>(null)
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchVendors()
    }
  }, [user, search, statusFilter])

  const fetchVendors = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter)

      const response = await fetch(`/api/admin/vendors?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch vendors')
      }

      const data = await response.json()
      setVendors(data.data)
      setStats(data.stats)
    } catch (error) {
      console.error('Error fetching vendors:', error)
      toast({
        title: "Error",
        description: "Failed to load vendors",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'ACTIVE': 'default',
      'PENDING_VERIFICATION': 'secondary',
      'SUSPENDED': 'destructive',
      'INACTIVE': 'outline'
    }
    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  const getTierBadge = (tier: string) => {
    const colors: Record<string, string> = {
      'BASIC': 'bg-blue-100 text-blue-800',
      'PREMIUM': 'bg-purple-100 text-purple-800',
      'ENTERPRISE': 'bg-gold-100 text-gold-800'
    }
    return (
      <Badge className={colors[tier] || 'bg-gray-100 text-gray-800'}>
        {tier}
      </Badge>
    )
  }

  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">You need admin privileges to view this page.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">Vendor Management</h1>
        <p className="text-muted-foreground mt-2 text-sm md:text-base">Manage vendors and their subscriptions</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-muted-foreground">Total Vendors</CardTitle>
                <Users className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.values(stats.vendors).reduce((sum: number, count: any) => sum + count, 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-muted-foreground">Active Vendors</CardTitle>
                <Building className="h-4 w-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.vendors.ACTIVE || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-muted-foreground">Premium Subscriptions</CardTitle>
                <Star className="h-4 w-4 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {stats.subscriptions.PREMIUM || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-muted-foreground">Pending Vendors</CardTitle>
                <Calendar className="h-4 w-4 text-yellow-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.vendors.PENDING || 0}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search vendors..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="PENDING_VERIFICATION">Pending Verification</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Vendors Table */}
      <Card>
        <CardHeader>
          <CardTitle>Vendors ({vendors.length})</CardTitle>
          <CardDescription>All registered vendors and their subscription status</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[160px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Trial Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendors.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{vendor.businessName}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {vendor.user.email}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {vendor.user.name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(vendor.status)}
                    </TableCell>
                    <TableCell>
                      {vendor.subscriptions.length > 0 ? (
                        <div>
                          {getTierBadge(vendor.subscriptions[0].tier)}
                          <div className="text-sm text-muted-foreground">
                            ${vendor.subscriptions[0].price}/month
                          </div>
                        </div>
                      ) : (
                        <Badge variant="outline">No Subscription</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {vendor.subscriptions.length > 0 && vendor.subscriptions[0].trialEndDate ? (
                        new Date(vendor.subscriptions[0].trialEndDate) > new Date() ? (
                          <div>
                            <Badge className="bg-green-100 text-green-800">
                              Trial Active
                            </Badge>
                            <div className="text-sm text-muted-foreground">
                              Ends {new Date(vendor.subscriptions[0].trialEndDate).toLocaleDateString()}
                            </div>
                          </div>
                        ) : (
                          <Badge variant="outline">Trial Ended</Badge>
                        )
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(vendor.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
