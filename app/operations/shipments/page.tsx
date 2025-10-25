"use client"

import { useState, useEffect } from "react"
import { Package, Search, Download, MapPin, Clock, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable } from "@/components/shared/data-table"
import { KPICard } from "@/components/shared/kpi-card"
import { StatusBadge } from "@/components/shared/status-badge"
import { useToast } from "@/hooks/use-toast"

interface Shipment {
  id: string
  orderId: string
  carrier: string
  trackingNumber: string
  status: string
  estimatedDelivery?: string
  actualDelivery?: string
  shippingCost: number
  createdAt: string
  order: {
    orderNumber: string
    customer: {
      name: string
      email: string
    }
    shippingAddress: any
  }
}

export default function ShipmentsPage() {
  const [statusFilter, setStatusFilter] = useState("all")
  const [carrierFilter, setCarrierFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    active: 0,
    onTime: 0,
    delayed: 0,
    avgTransit: 0
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchShipments()
  }, [])

  const fetchShipments = async () => {
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
        console.log('📦 Shipments data:', data)

        if (data.success && Array.isArray(data.data)) {
          const shipmentsList = data.data || []
          setShipments(shipmentsList)

          // Calculate stats
          const activeShipments = shipmentsList.filter((s: Shipment) =>
            s.status === 'PENDING' || s.status === 'IN_TRANSIT'
          ).length

          const deliveredShipments = shipmentsList.filter((s: Shipment) =>
            s.status === 'DELIVERED'
          ).length

          const delayedShipments = shipmentsList.filter((s: Shipment) => {
            if (!s.estimatedDelivery) return false
            const estimated = new Date(s.estimatedDelivery)
            const now = new Date()
            return s.status !== 'DELIVERED' && now > estimated
          }).length

          const onTimePercentage = shipmentsList.length > 0
            ? Math.round((deliveredShipments / shipmentsList.length) * 100)
            : 0

          setStats({
            active: activeShipments,
            onTime: onTimePercentage,
            delayed: delayedShipments,
            avgTransit: 0 // Will calculate later
          })
        }
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load shipments',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('❌ Error fetching shipments:', error)
      toast({
        title: 'Error',
        description: 'Failed to load shipments',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Filter shipments
  const filteredShipments = shipments.filter(shipment => {
    if (statusFilter !== 'all' && shipment.status !== statusFilter.toUpperCase()) return false
    if (carrierFilter !== 'all' && shipment.carrier !== carrierFilter) return false
    if (searchTerm && !shipment.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !shipment.order.customer.name.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  const columns = [
    {
      key: "id",
      label: "Shipment ID",
      render: (shipment: Shipment) => shipment.id.substring(0, 8)
    },
    {
      key: "orderId",
      label: "Order ID",
      render: (shipment: Shipment) => shipment.order.orderNumber
    },
    {
      key: "customer",
      label: "Customer",
      render: (shipment: Shipment) => shipment.order.customer.name
    },
    {
      key: "route",
      label: "Route",
      render: (shipment: Shipment) => (
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          <div>
            <div>{shipment.order.shippingAddress?.city || 'N/A'}</div>
            <div className="text-xs text-muted-foreground">{shipment.order.shippingAddress?.state || 'N/A'}</div>
          </div>
        </div>
      )
    },
    {
      key: "carrier",
      label: "Carrier",
      render: (shipment: Shipment) => (
        <div>
          <div className="font-medium">{shipment.carrier}</div>
          <div className="text-xs text-muted-foreground">{shipment.trackingNumber}</div>
        </div>
      )
    },
    {
      key: "status",
      label: "Status",
      render: (shipment: Shipment) => <StatusBadge status={shipment.status as any} />
    },
    {
      key: "delivery",
      label: "Delivery",
      render: (shipment: Shipment) => (
        <div>
          <div>
            Est: {shipment.estimatedDelivery ? new Date(shipment.estimatedDelivery).toLocaleDateString() : 'TBD'}
          </div>
          {shipment.actualDelivery && (
            <div className="text-xs text-muted-foreground">
              Act: {new Date(shipment.actualDelivery).toLocaleDateString()}
            </div>
          )}
        </div>
      )
    },
    {
      key: "actions",
      label: "Actions",
      render: () => (
        <Button variant="ghost" size="sm">
          Track
        </Button>
      )
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Shipment Tracking</h1>
        <p className="text-muted-foreground mt-2">Monitor all shipments and delivery status</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Active Shipments"
          value={isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : stats.active.toString()}
          icon={<Package className="h-5 w-5" />}
        />
        <KPICard
          title="On-Time Delivery"
          value={isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : `${stats.onTime}%`}
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <KPICard
          title="Delayed Shipments"
          value={isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : stats.delayed.toString()}
          icon={<AlertTriangle className="h-5 w-5" />}
        />
        <KPICard
          title="Avg. Transit Time"
          value={isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : `${stats.avgTransit} days`}
          icon={<Clock className="h-5 w-5" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Shipments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by tracking number or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={carrierFilter} onValueChange={setCarrierFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Carrier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Carriers</SelectItem>
                <SelectItem value="FedEx">FedEx</SelectItem>
                <SelectItem value="UPS">UPS</SelectItem>
                <SelectItem value="USPS">USPS</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchShipments}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredShipments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No data available
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredShipments}
              emptyMessage="No shipments found"
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
