"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable } from "@/components/shared/data-table"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ShippingZone {
  id: string
  name: string
  countries: string
  carriers: string
  sla: string
}

interface Carrier {
  id: string
  name: string
  type: string
  coverage: string
  status: "active" | "inactive"
}

interface SLAMetric {
  zone: string
  target: string
  actual: string
  compliance: string
}

export default function LogisticsPage() {
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [shippingZones, setShippingZones] = useState<ShippingZone[]>([])
  const [carriers, setCarriers] = useState<Carrier[]>([])
  const [slaMetrics, setSlaMetrics] = useState<SLAMetric[]>([])

  // Fetch real data from Shippo and database
  useEffect(() => {
    fetchLogisticsData()
  }, [])

  const fetchLogisticsData = async () => {
    try {
      setIsLoading(true)

      // Fetch shipping stats from API
      const statsResponse = await fetch('/api/shipping/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        if (statsData.success) {
          // Map carrier breakdown to carriers list
          const carrierData = statsData.data.carrierBreakdown.map((c: any, index: number) => ({
            id: String(index + 1),
            name: c.carrier,
            type: c.carrier.includes('Express') ? 'Express' : 'Standard',
            coverage: 'United States',
            status: 'active' as const
          }))
          setCarriers(carrierData)

          // Create SLA metrics from real data
          const slaData: SLAMetric[] = [
            {
              zone: 'United States',
              target: '3-5 days',
              actual: `${statsData.data.averageDeliveryTime || 0} days`,
              compliance: statsData.data.totalShipments > 0
                ? `${Math.round((statsData.data.deliveredShipments / statsData.data.totalShipments) * 100)}%`
                : '0%'
            }
          ]
          setSlaMetrics(slaData)
        }
      }

      // Set default shipping zones (can be made dynamic later)
      setShippingZones([
        {
          id: "1",
          name: "United States",
          countries: "US",
          carriers: "USPS, UPS, FedEx",
          sla: "3-5 days"
        },
        {
          id: "2",
          name: "North America",
          countries: "CA, MX",
          carriers: "USPS, UPS, FedEx",
          sla: "5-7 days"
        },
        {
          id: "3",
          name: "International",
          countries: "GB, DE, FR, Other",
          carriers: "USPS, FedEx, DHL",
          sla: "7-14 days",
        },
      ])

    } catch (error) {
      console.error('Error fetching logistics data:', error)
      toast({
        title: "Error",
        description: "Failed to load logistics data. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = () => {
    toast({
      title: "Configuration saved",
      description: "Logistics settings have been updated successfully.",
    })
    setIsEditing(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading logistics data...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Logistics Management</h1>
        <p className="text-muted-foreground mt-2">Configure shipping zones, carriers, and SLA compliance</p>
      </div>

      <Tabs defaultValue="zones" className="space-y-4">
        <TabsList>
          <TabsTrigger value="zones">Shipping Zones</TabsTrigger>
          <TabsTrigger value="carriers">Carriers</TabsTrigger>
          <TabsTrigger value="sla">SLA Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="zones" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Shipping Zones</CardTitle>
                  <CardDescription>Define shipping zones and delivery timeframes</CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Zone
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                data={shippingZones}
                columns={[
                  { key: "name", label: "Zone Name" },
                  { key: "countries", label: "Countries" },
                  { key: "carriers", label: "Available Carriers" },
                  { key: "sla", label: "Delivery SLA" },
                  {
                    key: "actions",
                    label: "Actions",
                    render: () => (
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ),
                  },
                ]}
              />
            </CardContent>
          </Card>

          {/* Zone Configuration Form */}
          <Card>
            <CardHeader>
              <CardTitle>Zone Configuration</CardTitle>
              <CardDescription>Add or edit shipping zone details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="zoneName">Zone Name</Label>
                  <Input id="zoneName" placeholder="e.g., Metro Manila" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sla">Delivery SLA</Label>
                  <Input id="sla" placeholder="e.g., 3-5 days" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="countries">Countries (comma-separated)</Label>
                <Input id="countries" placeholder="e.g., USA, Canada, Mexico" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="carriers">Available Carriers</Label>
                <Select>
                  <SelectTrigger id="carriers">
                    <SelectValue placeholder="Select carriers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usps">USPS</SelectItem>
                    <SelectItem value="ups">UPS</SelectItem>
                    <SelectItem value="fedex">FedEx</SelectItem>
                    <SelectItem value="dhl">DHL Express</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSave}>Save Configuration</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="carriers" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Carrier Management</CardTitle>
                  <CardDescription>Manage shipping carriers and their configurations</CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Carrier
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                data={carriers}
                columns={[
                  { key: "name", label: "Carrier Name" },
                  { key: "type", label: "Service Type" },
                  { key: "coverage", label: "Coverage" },
                  {
                    key: "status",
                    label: "Status",
                    render: (item) => (
                      <Badge variant={item.status === "active" ? "default" : "secondary"} className="capitalize">
                        {item.status}
                      </Badge>
                    ),
                  },
                  {
                    key: "actions",
                    label: "Actions",
                    render: () => (
                      <Button variant="outline" size="sm">
                        Configure
                      </Button>
                    ),
                  },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sla" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SLA Compliance Dashboard</CardTitle>
              <CardDescription>Monitor delivery performance against SLA targets</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={slaMetrics}
                columns={[
                  { key: "zone", label: "Shipping Zone" },
                  { key: "target", label: "Target SLA" },
                  { key: "actual", label: "Actual Average" },
                  {
                    key: "compliance",
                    label: "Compliance Rate",
                    render: (item) => {
                      const rate = Number.parseInt(item.compliance)
                      return (
                        <Badge
                          variant={rate >= 95 ? "default" : rate >= 90 ? "secondary" : "destructive"}
                          className={rate >= 95 ? "bg-success/10 text-success hover:bg-success/20" : ""}
                        >
                          {item.compliance}
                        </Badge>
                      )
                    },
                  },
                ]}
              />
            </CardContent>
          </Card>

          {/* SLA Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>SLA Alerts</CardTitle>
              <CardDescription>Zones requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {slaMetrics.filter(m => Number.parseInt(m.compliance) < 95).length > 0 ? (
                  slaMetrics
                    .filter(m => Number.parseInt(m.compliance) < 95)
                    .map((metric, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{metric.zone} - Below Target</p>
                          <p className="text-sm text-muted-foreground">
                            Compliance at {metric.compliance} (Target: 95%+)
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          Investigate
                        </Button>
                      </div>
                    ))
                ) : (
                  <div className="text-center p-8 text-muted-foreground">
                    <p>No SLA alerts at this time. All zones meeting targets.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
