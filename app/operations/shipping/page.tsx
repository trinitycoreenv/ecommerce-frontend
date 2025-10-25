"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { 
  Loader2, 
  RefreshCw, 
  Package, 
  Truck, 
  AlertTriangle,
  CheckCircle,
  XCircle 
} from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ShipmentStatus } from "@prisma/client"

// Type definitions
interface Shipment {
  id: string
  orderId: string
  carrier: string
  trackingNumber: string | null
  status: ShipmentStatus
  estimatedDelivery: string | null
  actualDelivery?: string | null
  shippingCost: number | null
  createdAt: string
  notes: string | null
}

interface ShipmentStats {
  total: number
  PENDING: number
  IN_TRANSIT: number
  DELIVERED: number
  EXCEPTION: number
}

export default function OperationsShippingPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [stats, setStats] = useState<ShipmentStats>({
    total: 0,
    PENDING: 0,
    IN_TRANSIT: 0,
    DELIVERED: 0,
    EXCEPTION: 0
  })
  const [selectedTab, setSelectedTab] = useState("PENDING")
  const [filter, setFilter] = useState({
    carrier: "",
    dateRange: "today"
  })

  // Table columns definition
  const columns: ColumnDef<Shipment>[] = [
    {
      accessorKey: "orderId",
      header: "Order ID",
      cell: ({ row }: { row: { original: Shipment } }) => (
        <Button variant="link" onClick={() => window.location.href = `/operations/orders/${row.original.orderId}`}>
          {row.original.orderId.slice(0, 8)}...
        </Button>
      )
    },
    {
      accessorKey: "carrier",
      header: "Carrier"
    },
    {
      accessorKey: "trackingNumber",
      header: "Tracking #",
      cell: ({ row }: { row: { original: Shipment } }) => (
        <Button 
          variant="link" 
          className="font-mono"
          onClick={() => window.open(`/operations/tracking/${row.original.trackingNumber}`, '_blank')}
        >
          {row.original.trackingNumber}
        </Button>
      )
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: { row: { original: Shipment } }) => {
        const status = row.original.status
        let color = ""
        switch (status) {
          case ShipmentStatus.PENDING: color = "yellow"; break
          case ShipmentStatus.IN_TRANSIT: color = "blue"; break
          case ShipmentStatus.DELIVERED: color = "green"; break
          case ShipmentStatus.FAILED_DELIVERY: color = "red"; break
          default: color = "gray"
        }
        return <Badge variant={color as any}>{status}</Badge>
      }
    },
    {
      accessorKey: "estimatedDelivery",
      header: "Est. Delivery",
      cell: ({ row }: { row: { original: Shipment } }) => 
        row.original.estimatedDelivery 
          ? format(new Date(row.original.estimatedDelivery), 'MMM d, yyyy')
          : 'Not set'
    },
    {
      accessorKey: "shippingCost",
      header: "Cost",
      cell: ({ row }: { row: { original: Shipment } }) => 
        row.original.shippingCost 
          ? `$${row.original.shippingCost.toFixed(2)}`
          : 'Pending'
    },
    {
      id: "actions",
      cell: ({ row }: { row: { original: Shipment } }) => (
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handlePrintLabel(row.original.id)}
          >
            Print Label
          </Button>
          {row.original.status === 'PENDING' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleCancelShipment(row.original.id)}
            >
              Cancel
            </Button>
          )}
        </div>
      )
    }
  ]

  // Fetch data
  useEffect(() => {
    fetchShipments()
  }, [selectedTab, filter])

  const fetchShipments = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/operations/shipments?${new URLSearchParams({
        status: selectedTab,
        carrier: filter.carrier,
        dateRange: filter.dateRange
      })}`)
      
      const data = await response.json()
      
      if (data.success) {
        setShipments(data.shipments)
        setStats(data.stats)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error fetching shipments:', error)
      toast({
        title: "Error",
        description: "Failed to fetch shipments",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrintLabel = async (shipmentId: string) => {
    try {
      const response = await fetch(`/api/operations/shipments/${shipmentId}/label`)
      const data = await response.json()
      
      if (data.success) {
        // Open label in new window for printing
        window.open(data.labelUrl, '_blank')
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error printing label:', error)
      toast({
        title: "Error",
        description: "Failed to print shipping label",
        variant: "destructive"
      })
    }
  }

  const handleCancelShipment = async (shipmentId: string) => {
    if (!confirm('Are you sure you want to cancel this shipment?')) return

    try {
      const response = await fetch(`/api/operations/shipments/${shipmentId}/cancel`, {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Shipment cancelled successfully"
        })
        fetchShipments()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error cancelling shipment:', error)
      toast({
        title: "Error",
        description: "Failed to cancel shipment",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Shipment Operations</h1>
          <p className="text-muted-foreground mt-2">Manage and track all shipments</p>
        </div>
        <Button onClick={fetchShipments}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shipments</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.PENDING}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
            <Truck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.IN_TRANSIT}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.DELIVERED}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exceptions</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.EXCEPTION}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Carrier</Label>
            <Select 
              value={filter.carrier} 
              onValueChange={(value) => setFilter(prev => ({ ...prev, carrier: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Carriers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Carriers</SelectItem>
                <SelectItem value="ups">UPS</SelectItem>
                <SelectItem value="fedex">FedEx</SelectItem>
                <SelectItem value="usps">USPS</SelectItem>
                <SelectItem value="dhl">DHL</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Date Range</Label>
            <Select 
              value={filter.dateRange} 
              onValueChange={(value) => setFilter(prev => ({ ...prev, dateRange: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Shipments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Shipments</CardTitle>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList>
              <TabsTrigger value="PENDING">Pending</TabsTrigger>
              <TabsTrigger value="IN_TRANSIT">In Transit</TabsTrigger>
              <TabsTrigger value="DELIVERED">Delivered</TabsTrigger>
              <TabsTrigger value="EXCEPTION">Exceptions</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <DataTable columns={columns} data={shipments} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}