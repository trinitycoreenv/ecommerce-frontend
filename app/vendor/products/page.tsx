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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus, Edit, Trash2, AlertCircle, Loader2, TrendingUp, Package, DollarSign, Activity } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AnimatedCounter } from "@/components/ui/animated-counter"
import { LiveIndicator } from "@/components/ui/live-indicator"
import { ActivityFeed } from "@/components/ui/activity-feed"
import { EnhancedProductForm } from "@/components/shared/enhanced-product-form"
import { apiClient, type Product } from "@/lib/api-client"
import { ExportDropdown } from "@/components/shared/export-dropdown"
import { AnalyticsExportUtils } from "@/lib/export-service"

export default function ProductManagementPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isAddMode, setIsAddMode] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  // Form state - now handled by EnhancedProductForm

  // Live data state
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [isLive, setIsLive] = useState(true)

  // Load products on component mount
  useEffect(() => {
    loadProducts()
  }, [])

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    if (!isLive) return

    const interval = setInterval(() => {
      loadProducts()
      setLastUpdated(new Date())
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [isLive])

  const loadProducts = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true)
      const response = await apiClient.getProducts()
      setProducts(response.data || [])
      setLastUpdated(new Date())
    } catch (error) {
      console.error("Failed to load products:", error)
      toast({
        title: "Error",
        description: "Failed to load products. Please try again.",
        variant: "destructive",
      })
    } finally {
      if (showLoading) setIsLoading(false)
    }
  }

  const handleAdd = () => {
    setIsAddMode(true)
    setSelectedProduct(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (product: Product) => {
    setIsAddMode(false)
    setSelectedProduct(product)
    setIsDialogOpen(true)
  }

  const handleSave = async (formData: any) => {
    try {
      setIsSaving(true)
      
      if (isAddMode) {
        await apiClient.createProduct({
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          categoryId: formData.categoryId,
          sku: formData.sku,
          inventory: parseInt(formData.inventory) || 0,
          images: formData.images,
          weight: formData.weight ? parseFloat(formData.weight) : undefined,
          dimensions: formData.dimensions,
          tags: formData.tags,
          isDigital: formData.isDigital,
          requiresShipping: formData.requiresShipping,
          lowStockThreshold: parseInt(formData.lowStockThreshold) || 10,
          variants: formData.variants
        })
        toast({
          title: "Product added",
          description: "Your product has been submitted for approval.",
        })
      } else if (selectedProduct) {
        await apiClient.updateProduct(selectedProduct.id, {
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          categoryId: formData.categoryId,
          sku: formData.sku,
          inventory: parseInt(formData.inventory) || 0,
          images: formData.images,
          weight: formData.weight ? parseFloat(formData.weight) : undefined,
          dimensions: formData.dimensions,
          tags: formData.tags,
          isDigital: formData.isDigital,
          requiresShipping: formData.requiresShipping,
          lowStockThreshold: parseInt(formData.lowStockThreshold) || 10,
          variants: formData.variants
        })
        toast({
          title: "Product updated",
          description: "Product details have been updated successfully.",
        })
      }
      
      setIsDialogOpen(false)
      setSelectedProduct(null)
      loadProducts() // Reload products
    } catch (error) {
      console.error("Failed to save product:", error)
      toast({
        title: "Error",
        description: "Failed to save product. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (productId: string) => {
    try {
      await apiClient.deleteProduct(productId)
      toast({
        title: "Product deleted",
        description: "The product has been removed from your catalogue.",
        variant: "destructive",
      })
      loadProducts() // Reload products
    } catch (error) {
      console.error("Failed to delete product:", error)
      toast({
        title: "Error",
        description: "Failed to delete product. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-hero">Product Management</h1>
            {isLive && <LiveIndicator />}
          </div>
          <p className="text-subtitle mt-2">
            Manage your product catalogue and inventory
            {lastUpdated && (
              <span className="text-caption ml-2">
                • Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {products.length > 0 && (
            <ExportDropdown
              data={AnalyticsExportUtils.transformProductManagementData(products, {
                totalProducts: products.length,
                activeProducts: products.filter(p => p.status === "APPROVED").length,
                pendingProducts: products.filter(p => p.status === "PENDING_APPROVAL").length,
                lowStockProducts: products.filter(p => Number(p.inventory) < 10).length
              })}
              filename="product-management-report"
              className="h-10 w-10 p-0"
            />
          )}
          <Button onClick={handleAdd} className="hover:scale-105 transition-transform duration-200">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-caption">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <AnimatedCounter value={products.length} />
              )}
            </div>
            <p className="text-body mt-1">Active listings</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-caption">Pending Approval</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <AnimatedCounter value={products.filter(p => p.status === "PENDING_APPROVAL").length} />
              )}
            </div>
            <p className="text-body mt-1">Awaiting review</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-caption">Low Stock</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <AnimatedCounter value={products.filter(p => Number(p.inventory) < 10).length} />
              )}
            </div>
            <p className="text-body mt-1">Needs restocking</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-caption">Approved Products</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <AnimatedCounter value={products.filter(p => p.status === "APPROVED").length} />
              )}
            </div>
            <p className="text-body mt-1">Live on platform</p>
          </CardContent>
        </Card>
      </div>

      {/* Policy Validation Alert */}
      <Card className="border-warning/50 bg-warning/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
            <div className="flex-1">
              <h3 className="text-heading">Policy Validation</h3>
              <p className="text-body mt-1">
                All products must comply with platform policies. Products violating policies will be automatically
                flagged and may be removed.
              </p>
            </div>
            <Button variant="outline" size="sm">
              View Policies
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Products Table and Activity Feed */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-heading">Your Products</CardTitle>
              <CardDescription className="text-body">Manage your product listings and inventory</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span className="text-body">Loading products...</span>
                  </div>
                  {/* Skeleton rows */}
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <Skeleton className="h-12 w-12 rounded" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  ))}
                </div>
              ) : (
                <DataTable
                  data={products}
                  columns={[
                    { key: "name", label: "Product Name" },
                    { 
                      key: "category", 
                      label: "Category",
                      render: (item) => item.category.name
                    },
                    { 
                      key: "price", 
                      label: "Price",
                      render: (item) => `$${Number(item.price).toFixed(2)}`
                    },
                    {
                      key: "inventory",
                      label: "Stock",
                      render: (item) => (
                        <Badge variant={Number(item.inventory) === 0 ? "destructive" : Number(item.inventory) < 10 ? "secondary" : "outline"}>
                          {item.inventory} units
                        </Badge>
                      ),
                    },
                    {
                      key: "status",
                      label: "Status",
                      render: (item) => <StatusBadge status={item.status.toLowerCase() as any} />,
                    },
                    {
                      key: "actions",
                      label: "Actions",
                      render: (item) => (
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ),
                    },
                  ]}
                  searchable
                  searchPlaceholder="Search products..."
                />
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-heading flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Live Activity
              </CardTitle>
              <CardDescription className="text-body">Real-time updates from your store</CardDescription>
            </CardHeader>
            <CardContent>
              <ActivityFeed maxItems={8} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add/Edit Product Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isAddMode ? "Add New Product" : "Edit Product"}</DialogTitle>
            <DialogDescription>
              {isAddMode
                ? "Add a new product to your catalogue. It will be submitted for approval."
                : "Update product details and inventory information."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <EnhancedProductForm
              initialData={selectedProduct ? {
                name: selectedProduct.name,
                description: selectedProduct.description || "",
                price: selectedProduct.price.toString(),
                categoryId: selectedProduct.category?.id || "",
                sku: selectedProduct.sku || "",
                inventory: selectedProduct.inventory.toString(),
                images: selectedProduct.images || [],
                weight: selectedProduct.weight?.toString() || "",
                dimensions: selectedProduct.dimensions ? {
                  length: selectedProduct.dimensions.length?.toString() || "",
                  width: selectedProduct.dimensions.width?.toString() || "",
                  height: selectedProduct.dimensions.height?.toString() || ""
                } : { length: "", width: "", height: "" },
                tags: selectedProduct.tags || [],
                isDigital: selectedProduct.isDigital || false,
                requiresShipping: selectedProduct.requiresShipping !== false,
                lowStockThreshold: selectedProduct.lowStockThreshold?.toString() || "10",
                variants: selectedProduct.variants || []
              } : undefined}
              onSubmit={handleSave}
              isSubmitting={isSaving}
              mode={isAddMode ? 'create' : 'edit'}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
