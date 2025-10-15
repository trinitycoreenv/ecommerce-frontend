"use client"

import { TrendingUp, Clock, Package, Truck, AlertTriangle, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { KPICard } from "@/components/shared/kpi-card"
import { AdvancedChart } from "@/components/shared/advanced-chart"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

export default function PerformancePage() {
  // Real data will be fetched from API endpoints
  const fulfillmentData: any[] = []
  const processingData: any[] = []
  const carriers: any[] = []
  const slaMetrics: any[] = []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Performance Analytics</h1>
        <p className="text-muted-foreground mt-2">Monitor operational efficiency and SLA compliance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Order Fulfillment"
          value="0%"
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <KPICard
          title="Avg. Processing Time"
          value="0 hrs"
          icon={<Clock className="h-5 w-5" />}
        />
        <KPICard
          title="Shipping Accuracy"
          value="0%"
          icon={<Package className="h-5 w-5" />}
        />
        <KPICard
          title="Customer Satisfaction"
          value="0/5"
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AdvancedChart
          title="Fulfillment Rate Trend"
          description="Weekly fulfillment percentage"
          data={fulfillmentData}
          type="area"
          dataKey="value"
          showGrid={true}
        />

        <AdvancedChart
          title="Processing Time Trend"
          description="Average processing time in hours"
          data={processingData}
          type="line"
          dataKey="value"
          showGrid={true}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>SLA Compliance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {slaMetrics.map((metric) => (
              <div key={metric.metric} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{metric.metric}</span>
                    {metric.status === "success" ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">Target: {metric.target}%</span>
                    <span className="text-sm font-semibold text-foreground">Actual: {metric.actual}%</span>
                  </div>
                </div>
                <Progress value={metric.actual} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Carrier Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {carriers.map((carrier) => (
              <div key={carrier.name} className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Truck className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{carrier.name}</h3>
                      <p className="text-sm text-muted-foreground">{carrier.total.toLocaleString()} shipments</p>
                    </div>
                  </div>
                  <Badge variant={carrier.onTime >= 95 ? "default" : "secondary"}>{carrier.onTime}% On-Time</Badge>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-500">{carrier.onTime}%</p>
                    <p className="text-xs text-muted-foreground mt-1">On-Time</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-500">{carrier.delayed}%</p>
                    <p className="text-xs text-muted-foreground mt-1">Delayed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-500">{carrier.failed}%</p>
                    <p className="text-xs text-muted-foreground mt-1">Failed</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
