"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable } from "@/components/shared/data-table"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const shippingZones = [
  { id: "1", name: "Metro Manila", countries: "NCR, Rizal, Cavite, Laguna, Bulacan", carriers: "LBC, J&T Express, Grab Express", sla: "1-2 days" },
  { id: "2", name: "Luzon", countries: "Central Luzon, CALABARZON, MIMAROPA, Bicol", carriers: "LBC, J&T Express, 2GO", sla: "2-3 days" },
  {
    id: "3",
    name: "Visayas & Mindanao",
    countries: "Cebu, Davao, Iloilo, Cagayan de Oro, +15 provinces",
    carriers: "LBC, J&T Express, 2GO, Air21",
    sla: "3-5 days",
  },
]

const carriers = [
  { id: "1", name: "LBC Express", type: "Express", coverage: "Philippines", status: "active" as const },
  { id: "2", name: "J&T Express", type: "Standard", coverage: "Philippines", status: "active" as const },
  { id: "3", name: "2GO Express", type: "Express", coverage: "Philippines", status: "active" as const },
  { id: "4", name: "Grab Express", type: "Same Day", coverage: "Metro Manila", status: "active" as const },
]

const slaMetrics = [
  { zone: "Metro Manila", target: "1-2 days", actual: "1.3 days", compliance: "98%" },
  { zone: "Luzon", target: "2-3 days", actual: "2.1 days", compliance: "96%" },
  { zone: "Visayas & Mindanao", target: "3-5 days", actual: "3.8 days", compliance: "94%" },
]

export default function LogisticsPage() {
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)

  const handleSave = () => {
    toast({
      title: "Configuration saved",
      description: "Logistics settings have been updated successfully.",
    })
    setIsEditing(false)
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
                    <SelectItem value="lbc">LBC Express</SelectItem>
                    <SelectItem value="jnt">J&T Express</SelectItem>
                    <SelectItem value="gogo">2GO Express</SelectItem>
                    <SelectItem value="grab">Grab Express</SelectItem>
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
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Asia Pacific - Below Target</p>
                    <p className="text-sm text-muted-foreground">Compliance dropped to 92% this week</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Investigate
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
