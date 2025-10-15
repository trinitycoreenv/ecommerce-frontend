"use client"

import { DataTable } from "@/components/shared/data-table"
import { StatusBadge } from "@/components/shared/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Real data will be fetched from API endpoints
const pendingProducts: any[] = []

// Real data will be fetched from API endpoints
const violations: any[] = []

export default function CatalogueOversightPage() {
  const { toast } = useToast()

  const handleApprove = (productId: string) => {
    toast({
      title: "Product approved",
      description: "The product has been approved and is now live.",
    })
  }

  const handleReject = (productId: string) => {
    toast({
      title: "Product rejected",
      description: "The vendor has been notified of the rejection.",
      variant: "destructive",
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Catalogue Oversight</h1>
        <p className="text-muted-foreground mt-2">Review and approve product listings</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">23</div>
            <p className="text-sm text-muted-foreground mt-1">Products awaiting review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Policy Violations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">5</div>
            <p className="text-sm text-muted-foreground mt-1">Requires immediate action</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">12,458</div>
            <p className="text-sm text-success mt-1">+156 this week</p>
          </CardContent>
        </Card>
      </div>

      {/* Product Approval Queue */}
      <Card>
        <CardHeader>
          <CardTitle>Product Approval Queue</CardTitle>
          <CardDescription>Review and approve new product listings</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={pendingProducts}
            columns={[
              { key: "product", label: "Product" },
              { key: "vendor", label: "Vendor" },
              { key: "category", label: "Category" },
              { key: "price", label: "Price" },
              {
                key: "status",
                label: "Status",
                render: (item) => <StatusBadge status={item.status} />,
              },
              { key: "submitted", label: "Submitted" },
              {
                key: "actions",
                label: "Actions",
                render: (item) =>
                  item.status === "pending" ? (
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleApprove(item.id)}>
                        <CheckCircle className="h-4 w-4 text-success" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleReject(item.id)}>
                        <XCircle className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Processed</span>
                  ),
              },
            ]}
            searchable
            searchPlaceholder="Search products..."
          />
        </CardContent>
      </Card>

      {/* Policy Violations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Policy Violations
          </CardTitle>
          <CardDescription>Products flagged for policy review</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={violations}
            columns={[
              { key: "product", label: "Product" },
              { key: "vendor", label: "Vendor" },
              { key: "reason", label: "Violation Reason" },
              {
                key: "severity",
                label: "Severity",
                render: (item) => (
                  <Badge variant={item.severity === "high" ? "destructive" : "secondary"} className="capitalize">
                    {item.severity}
                  </Badge>
                ),
              },
              { key: "reported", label: "Reported" },
              {
                key: "actions",
                label: "Actions",
                render: () => (
                  <Button variant="outline" size="sm">
                    Review
                  </Button>
                ),
              },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  )
}
