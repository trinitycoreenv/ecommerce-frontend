"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Star, ShoppingCart, Truck, Shield, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useParams } from "next/navigation"
import { apiClient } from "@/lib/api-client"
import { useCart } from "@/lib/cart-context"

interface Product {
  id: string
  name: string
  description?: string
  price: number
  categoryId: string
  sku?: string
  inventory: number
  images?: string[]
  status: string
  createdAt: string
  updatedAt: string
  vendor: {
    businessName: string
  }
  category: {
    name: string
  }
  weight?: number
  dimensions?: {
    length?: number
    width?: number
    height?: number
  }
  tags?: string[]
  isDigital?: boolean
  requiresShipping?: boolean
  lowStockThreshold?: number
  variants?: any[]
}

export default function ProductDetailPage() {
  const [quantity, setQuantity] = useState(1)
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const { addItem } = useCart()
  const params = useParams()
  const productId = params.id as string

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsLoading(true)
        const response = await apiClient.getProducts({ limit: 1000 }) // Get all products
        const products = response.data
        
        // Find the specific product by ID
        const foundProduct = products.find((p: Product) => p.id === productId)
        
        if (foundProduct) {
          setProduct(foundProduct)
        } else {
          toast({
            title: "Product not found",
            description: "The product you're looking for doesn't exist.",
            variant: "destructive"
          })
        }
      } catch (error) {
        console.error('Error fetching product:', error)
        toast({
          title: "Error",
          description: "Failed to load product details.",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (productId) {
      fetchProduct()
    }
  }, [productId, toast])

  const handleAddToCart = async () => {
    if (!product) return

    try {
      const cartItem = {
        productId: product.id,
        name: product.name,
        vendor: product.vendor.businessName,
        price: product.price,
        quantity: Math.min(quantity, product.inventory),
        image: product.images && product.images.length > 0 ? product.images[0] : '/placeholder.svg',
        maxQuantity: product.inventory
      }

      await addItem(cartItem)
    } catch (error) {
      console.error('Failed to add to cart:', error)
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive"
      })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" asChild>
          <Link href="/customer">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Shop
          </Link>
        </Button>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading product details...</span>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" asChild>
          <Link href="/customer">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Shop
          </Link>
        </Button>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-2">Product not found</h1>
          <p className="text-muted-foreground">The product you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild>
        <Link href="/customer">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Shop
        </Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Product Image */}
        <div className="space-y-4">
          <div className="aspect-square overflow-hidden rounded-lg border bg-muted">
            {product.images && product.images.length > 0 ? (
              <img 
                src={product.images[0]} 
                alt={product.name} 
                className="h-full w-full object-cover" 
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <div className="text-4xl mb-2">📦</div>
                  <div>No Image</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <Badge variant="secondary" className="mb-2">
              {product.category.name}
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
            <p className="text-muted-foreground mt-2">by {product.vendor.businessName}</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${i < 4 ? "fill-yellow-400 text-yellow-400" : "text-muted"}`}
                />
              ))}
            </div>
            <span className="text-sm font-medium">4.5</span>
            <span className="text-sm text-muted-foreground">(0 reviews)</span>
          </div>

          <Separator />

          <div>
            <p className="text-4xl font-bold">₱{Number(product.price).toFixed(2)}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {product.inventory > 0 ? `${product.inventory} units in stock` : "Out of stock"}
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label htmlFor="quantity" className="text-sm font-medium">
                Quantity:
              </label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  -
                </Button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(Math.min(product.inventory, quantity + 1))}
                  disabled={quantity >= product.inventory}
                >
                  +
                </Button>
              </div>
            </div>

            <Button 
              size="lg" 
              className="w-full" 
              onClick={handleAddToCart} 
              disabled={product.inventory === 0}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Add to Cart
            </Button>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Truck className="h-5 w-5 text-muted-foreground" />
              <span>Free shipping on orders over ₱50</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <span>30-day return policy</span>
            </div>
          </div>
        </div>
      </div>

      {/* Product Details */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              {product.description || "No description available for this product."}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">SKU:</span>
                <span>{product.sku || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category:</span>
                <span>{product.category.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vendor:</span>
                <span>{product.vendor.businessName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="capitalize">{product.status.toLowerCase()}</span>
              </div>
              {product.tags && product.tags.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tags:</span>
                  <div className="flex gap-1">
                    {product.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
