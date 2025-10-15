"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { 
  CheckCircle, 
  XCircle, 
  Edit3, 
  Search, 
  Filter, 
  Package, 
  User, 
  Calendar,
  DollarSign,
  AlertCircle,
  Loader2,
  Eye,
  Clock,
  CheckCircle2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { AnimatedCounter } from "@/components/ui/animated-counter"
import { apiClient, type Product } from "@/lib/api-client"

interface PendingProduct extends Product {
  vendor: {
    id: string
    businessName: string
    user: {
      name: string
      email: string
    }
  }
  category: {
    id: string
    name: string
  }
  variants: Array<{
    id: string
    name: string
    sku?: string
    price?: number
    inventory: number
    attributes: Record<string, string>
  }>
}

interface ApprovalStats {
  pending: number
  approved: number
  rejected: number
  draft: number
}

export default function ProductApprovalPage() {
  const [products, setProducts] = useState<PendingProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<PendingProduct | null>(null)
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [stats, setStats] = useState<ApprovalStats>({ pending: 0, approved: 0, rejected: 0, draft: 0 })
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedVendor, setSelectedVendor] = useState("all")
  const { toast } = useToast()

  // Approval form state
  const [approvalAction, setApprovalAction] = useState<'APPROVE' | 'REJECT' | 'REQUEST_CHANGES'>('APPROVE')
  const [approvalNotes, setApprovalNotes] = useState("")
  const [requestedChanges, setRequestedChanges] = useState<string[]>([])
  const [newChange, setNewChange] = useState("")

  useEffect(() => {
    loadPendingProducts()
  }, [searchTerm, selectedCategory, selectedVendor])

  const loadPendingProducts = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (selectedCategory && selectedCategory !== 'all') params.append('categoryId', selectedCategory)
      if (selectedVendor && selectedVendor !== 'all') params.append('vendorId', selectedVendor)
      
      const response = await fetch(`/api/products/pending-approval?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      const data = await response.json()
      
      if (data.success) {
        setProducts(data.data)
        setStats(data.stats)
      }
    } catch (error) {
      console.error("Failed to load pending products:", error)
      toast({
        title: "Error",
        description: "Failed to load pending products",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleApproveProduct = (product: PendingProduct) => {
    setSelectedProduct(product)
    setApprovalAction('APPROVE')
    setApprovalNotes("")
    setRequestedChanges([])
    setIsApprovalDialogOpen(true)
  }

  const handleRejectProduct = (product: PendingProduct) => {
    setSelectedProduct(product)
    setApprovalAction('REJECT')
    setApprovalNotes("")
    setRequestedChanges([])
    setIsApprovalDialogOpen(true)
  }

  const handleRequestChanges = (product: PendingProduct) => {
    setSelectedProduct(product)
    setApprovalAction('REQUEST_CHANGES')
    setApprovalNotes("")
    setRequestedChanges([])
    setIsApprovalDialogOpen(true)
  }

  const addChange = () => {
    if (newChange.trim() && !requestedChanges.includes(newChange.trim())) {
      setRequestedChanges([...requestedChanges, newChange.trim()])
      setNewChange("")
    }
  }

  const removeChange = (index: number) => {
    setRequestedChanges(requestedChanges.filter((_, i) => i !== index))
  }

  const processApproval = async () => {
    if (!selectedProduct) return

    try {
      setIsProcessing(true)
      
      const response = await fetch('/api/products/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          productId: selectedProduct.id,
          action: approvalAction,
          notes: approvalNotes,
          changes: requestedChanges.length > 0 ? requestedChanges : undefined
        })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Product processed",
          description: `Product has been ${approvalAction.toLowerCase()}d successfully`
        })
        
        setIsApprovalDialogOpen(false)
        setSelectedProduct(null)
        loadPendingProducts() // Reload the list
      } else {
        throw new Error(data.error || 'Failed to process approval')
      }
    } catch (error) {
      console.error("Failed to process approval:", error)
      toast({
        title: "Error",
        description: "Failed to process approval. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Product Approval</h1>
          <p className="text-muted-foreground mt-2">
            Review and approve products submitted by vendors
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {isLoading ? <Skeleton className="h-8 w-16" /> : <AnimatedCounter value={stats.pending} />}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {isLoading ? <Skeleton className="h-8 w-16" /> : <AnimatedCounter value={stats.approved} />}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Live on platform</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {isLoading ? <Skeleton className="h-8 w-16" /> : <AnimatedCounter value={stats.rejected} />}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Not approved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Draft</CardTitle>
              <Edit3 className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {isLoading ? <Skeleton className="h-8 w-16" /> : <AnimatedCounter value={stats.draft} />}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Needs changes</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="search">Search Products</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name, description, or SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  <SelectItem value="electronics">Electronics</SelectItem>
                  <SelectItem value="clothing">Clothing</SelectItem>
                  <SelectItem value="home-garden">Home & Garden</SelectItem>
                  <SelectItem value="books">Books</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendor">Vendor</Label>
              <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                <SelectTrigger>
                  <SelectValue placeholder="All vendors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All vendors</SelectItem>
                  {/* This would be populated from API */}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products List */}
      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-16 w-16 rounded" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : products.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No products pending approval</h3>
              <p className="text-muted-foreground">
                All products have been reviewed or no products are currently pending.
              </p>
            </CardContent>
          </Card>
        ) : (
          products.map((product) => (
            <Card key={product.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex gap-6">
                  {/* Product Image */}
                  <div className="flex-shrink-0">
                    <div className="h-24 w-24 rounded-lg overflow-hidden bg-muted">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Package className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">{product.name}</h3>
                        <p className="text-sm text-muted-foreground">{product.description}</p>
                      </div>
                      <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                        Pending Review
                      </Badge>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 text-sm">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{formatPrice(product.price)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span>{product.inventory} in stock</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{product.vendor.businessName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{formatDate(product.createdAt)}</span>
                      </div>
                    </div>

                    {product.variants && product.variants.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Variants ({product.variants.length})</p>
                        <div className="flex flex-wrap gap-2">
                          {product.variants.slice(0, 3).map((variant) => (
                            <Badge key={variant.id} variant="secondary" className="text-xs">
                              {variant.name}
                            </Badge>
                          ))}
                          {product.variants.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{product.variants.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleApproveProduct(product)}
                      className="text-green-600 border-green-600 hover:bg-green-50"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRequestChanges(product)}
                      className="text-blue-600 border-blue-600 hover:bg-blue-50"
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Request Changes
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRejectProduct(product)}
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Approval Dialog */}
      <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {approvalAction === 'APPROVE' && 'Approve Product'}
              {approvalAction === 'REJECT' && 'Reject Product'}
              {approvalAction === 'REQUEST_CHANGES' && 'Request Changes'}
            </DialogTitle>
            <DialogDescription>
              {selectedProduct && (
                <>
                  Reviewing: <strong>{selectedProduct.name}</strong> by {selectedProduct.vendor.businessName}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder={
                  approvalAction === 'APPROVE' 
                    ? "Optional notes for the vendor..."
                    : approvalAction === 'REJECT'
                    ? "Please explain why this product was rejected..."
                    : "Please explain what changes are needed..."
                }
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                rows={4}
              />
            </div>

            {approvalAction === 'REQUEST_CHANGES' && (
              <div className="space-y-2">
                <Label>Requested Changes</Label>
                <div className="space-y-2">
                  {requestedChanges.map((change, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="flex-1 text-sm bg-muted p-2 rounded">{change}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeChange(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a specific change request..."
                      value={newChange}
                      onChange={(e) => setNewChange(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addChange())}
                    />
                    <Button variant="outline" onClick={addChange}>
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApprovalDialogOpen(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button
              onClick={processApproval}
              disabled={isProcessing || (approvalAction !== 'APPROVE' && !approvalNotes.trim())}
              className={
                approvalAction === 'APPROVE' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : approvalAction === 'REJECT'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {approvalAction === 'APPROVE' && <CheckCircle className="mr-2 h-4 w-4" />}
                  {approvalAction === 'REJECT' && <XCircle className="mr-2 h-4 w-4" />}
                  {approvalAction === 'REQUEST_CHANGES' && <Edit3 className="mr-2 h-4 w-4" />}
                  {approvalAction === 'APPROVE' && 'Approve Product'}
                  {approvalAction === 'REJECT' && 'Reject Product'}
                  {approvalAction === 'REQUEST_CHANGES' && 'Request Changes'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
