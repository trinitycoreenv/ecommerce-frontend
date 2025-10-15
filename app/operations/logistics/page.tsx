"use client"
import { Warehouse, MapPin, Package, AlertCircle, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { KPICard } from "@/components/shared/kpi-card"
import { AdvancedChart } from "@/components/shared/advanced-chart"
import { Progress } from "@/components/ui/progress"

export default function LogisticsPage() {
  // Real data will be fetched from API endpoints
  const warehouses: any[] = []

  // Real data will be fetched from API endpoints
  const shippingZones: any[] = []

  // Real data will be fetched from API endpoints
  const performanceData: any[] = []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Logistics Management</h1>
        <p className="text-muted-foreground mt-2">Monitor warehouse operations and shipping zones</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Warehouses" value="0" icon={<Warehouse className="h-5 w-5" />} />
        <KPICard
          title="Total Inventory"
          value="0"
          icon={<Package className="h-5 w-5" />}
        />
        <KPICard
          title="Fulfillment Rate"
          value="0%"
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <KPICard
          title="Stock Alerts"
          value="0"
          icon={<AlertCircle className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AdvancedChart
          title="Fulfillment Performance"
          description="Daily fulfillment rate percentage"
          data={performanceData}
          type="line"
          dataKey="value"
          showGrid={true}
        />

        <Card>
          <CardHeader>
            <CardTitle>Shipping Zones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {shippingZones.map((zone) => (
                <div key={zone.zone} className="border border-border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-foreground">{zone.zone}</h3>
                      <p className="text-sm text-muted-foreground">{zone.states}</p>
                    </div>
                    <Badge variant="outline">{zone.cost}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Avg. Delivery</p>
                      <p className="text-sm font-medium text-foreground">{zone.avgDelivery}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Monthly Volume</p>
                      <p className="text-sm font-medium text-foreground">{zone.volume.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Warehouse Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {warehouses.map((warehouse) => (
              <div key={warehouse.id} className="border border-border rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Warehouse className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-foreground">{warehouse.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">{warehouse.location}</p>
                      </div>
                    </div>
                  </div>
                  <Badge variant={warehouse.status === "operational" ? "default" : "secondary"}>
                    {warehouse.status}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Capacity Utilization</span>
                      <span className="text-sm font-medium text-foreground">
                        {((warehouse.current / warehouse.capacity) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={(warehouse.current / warehouse.capacity) * 100} />
                    <p className="text-xs text-muted-foreground mt-1">
                      {warehouse.current.toLocaleString()} / {warehouse.capacity.toLocaleString()} units
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border">
                    <div>
                      <p className="text-xs text-muted-foreground">Active Orders</p>
                      <p className="text-lg font-semibold text-foreground">{warehouse.orders.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Shipments Today</p>
                      <p className="text-lg font-semibold text-foreground">{warehouse.shipments.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                  <Button variant="outline" size="sm">
                    Manage Inventory
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
