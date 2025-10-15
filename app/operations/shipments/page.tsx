"use client"

import { useState } from "react"
import { Package, Search, Download, MapPin, Clock, AlertTriangle, CheckCircle2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable } from "@/components/shared/data-table"
import { KPICard } from "@/components/shared/kpi-card"
import { StatusBadge } from "@/components/shared/status-badge"

export default function ShipmentsPage() {
  const [statusFilter, setStatusFilter] = useState("all")
  const [carrierFilter, setCarrierFilter] = useState("all")

  // Real data will be fetched from API endpoints
  const shipments: any[] = []

  const columns = [
    { key: "id", label: "Shipment ID" },
    { key: "orderId", label: "Order ID" },
    { key: "customer", label: "Customer" },
    { key: "route", label: "Route" },
    { key: "carrier", label: "Carrier" },
    { key: "status", label: "Status" },
    { key: "delivery", label: "Delivery" },
    { key: "actions", label: "Actions" },
  ]

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "delivered":
        return "success"
      case "in_transit":
        return "info"
      case "delayed":
        return "warning"
      case "pending":
        return "default"
      default:
        return "default"
    }
  }

  const getStatusLabel = (status: string) => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  const renderRow = (shipment: (typeof shipments)[0]) => (
    <>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{shipment.id}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{shipment.orderId}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{shipment.customer}</td>
      <td className="px-6 py-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          <div>
            <div className="text-foreground">{shipment.origin}</div>
            <div className="text-xs">→ {shipment.destination}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <div>
          <div className="font-medium text-foreground">{shipment.carrier}</div>
          <div className="text-xs text-muted-foreground">{shipment.trackingNumber}</div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <StatusBadge status={shipment.status as any} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <div>
          <div className="text-foreground">Est: {shipment.estimatedDelivery}</div>
          {shipment.actualDelivery && (
            <div className="text-xs text-muted-foreground">Act: {shipment.actualDelivery}</div>
          )}
          <div className="text-xs text-muted-foreground mt-1">{shipment.lastUpdate}</div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <Button variant="ghost" size="sm">
          Track
        </Button>
      </td>
    </>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Shipment Tracking</h1>
        <p className="text-muted-foreground mt-2">Monitor all shipments and delivery status</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Active Shipments"
          value="0"
          icon={<Package className="h-5 w-5" />}
        />
        <KPICard
          title="On-Time Delivery"
          value="0%"
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <KPICard
          title="Delayed Shipments"
          value="0"
          icon={<AlertTriangle className="h-5 w-5" />}
        />
        <KPICard
          title="Avg. Transit Time"
          value="0 days"
          icon={<Clock className="h-5 w-5" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Shipments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="delayed">Delayed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={carrierFilter} onValueChange={setCarrierFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Carrier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Carriers</SelectItem>
                <SelectItem value="fedex">FedEx</SelectItem>
                <SelectItem value="ups">UPS</SelectItem>
                <SelectItem value="usps">USPS</SelectItem>
                <SelectItem value="dhl">DHL</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          <DataTable columns={columns} data={shipments} searchable />
        </CardContent>
      </Card>
    </div>
  )
}
