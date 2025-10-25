"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Star, ShoppingCart, Truck, Shield, ArrowLeft, Loader2, ChevronLeft, ChevronRight, ZoomIn, Heart } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useParams } from "next/navigation"
import { apiClient } from "@/lib/api-client"
import { useCart } from "@/lib/cart-context"
import { cn } from "@/lib/utils"

// Using the Product interface from API client
import { Product as ApiProduct } from "@/lib/api-client"

// Extend the API Product interface for local use
interface Product extends ApiProduct {}

export default function ProductDetailPage() {
  const [quantity, setQuantity] = useState(1)
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
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
        const foundProduct = products?.find((p) => p.id === productId)
        
        if (foundProduct) {
          setProduct(foundProduct)
        } else {
          toast({
            title: "Product not found",
            description: "The product you're looking for doesn't exist.",
            variant: "destructive"
          })
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        console.error('Error fetching product:', errorMessage)
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      console.error('Failed to add to cart:', errorMessage)
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <nav className="mb-8">
        <Button variant="ghost" asChild className="group hover:bg-muted transition-colors">
          <Link href="/customer" className="flex items-center text-sm font-medium">
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:transform group-hover:-translate-x-1 transition-transform" />
            Back to Shop
          </Link>
        </Button>
      </nav>

      <div className="grid gap-12 lg:grid-cols-2">
        {/* Product Image - Enhanced with shadow and better spacing */}
        <div className="space-y-6">
          <div className="aspect-square overflow-hidden rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow duration-300 relative">
            {product.images && product.images.length > 0 ? (
              <>
                <img 
                  src={product.images[currentImageIndex] || product.images[0]} 
                  alt={product.name} 
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" 
                />
                {product.images.length > 1 && (
                  <>
                    <button 
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background rounded-full p-2 shadow-md transition-all"
                      onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? product.images!.length - 1 : prev - 1))}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button 
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background rounded-full p-2 shadow-md transition-all"
                      onClick={() => setCurrentImageIndex((prev) => (prev === product.images!.length - 1 ? 0 : prev + 1))}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    <button 
                      className="absolute bottom-2 right-2 bg-background/80 hover:bg-background rounded-full p-2 shadow-md transition-all"
                      onClick={() => window.open(product.images![currentImageIndex], '_blank')}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </button>
                  </>
                )}
              </>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-muted-foreground bg-muted/50 dark:bg-muted/30 dark:text-muted-foreground/80">
                <div className="text-center">
                  <div className="text-5xl mb-3">📦</div>
                  <div className="font-medium text-muted-foreground">No Image Available</div>
                </div>
              </div>
            )}
          </div>
          
          {/* Thumbnail gallery - Responsive */}
          {product.images && product.images.length > 1 && (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-1 sm:gap-2">
              {product.images.map((image, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "aspect-square rounded-md overflow-hidden border-2 cursor-pointer transition-all",
                    currentImageIndex === i ? "border-primary ring-2 ring-primary/20" : "border-transparent hover:border-muted"
                  )}
                  onClick={() => setCurrentImageIndex(i)}
                >
                  <img 
                    src={image} 
                    alt={`${product.name} thumbnail ${i+1}`}
                    className="h-full w-full object-cover" 
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Info - Improved typography and spacing */}
        <div className="space-y-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="px-3 py-1 text-xs font-medium uppercase tracking-wider">
                {product.category.name}
              </Badge>
              {product.inventory > 0 ? (
                <Badge variant="outline" className="bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 px-3 py-1">
                  In Stock
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 px-3 py-1">
                  Out of Stock
                </Badge>
              )}
            </div>
            
            <h1 className="text-4xl font-bold tracking-tight text-foreground">{product.name}</h1>
            <p className="text-muted-foreground">by <span className="font-medium">{product.vendor.businessName}</span></p>
          
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${i < 4 ? "fill-yellow-400 text-yellow-400" : "text-muted dark:text-muted-foreground"}`}
                  />
                ))}
              </div>
              <span className="text-sm font-medium">4.5</span>
              <span className="text-sm text-muted-foreground">(0 reviews)</span>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="space-y-6">
            <div className="flex items-baseline gap-3">
              <p className="text-4xl font-bold text-foreground">${Number(product.price).toFixed(2)}</p>
              {/* Optional: Add a crossed-out original price for sales */}
              {/* <p className="text-xl text-muted-foreground line-through">${(Number(product.price) * 1.2).toFixed(2)}</p> */}
            </div>
            
            <p className="text-sm text-muted-foreground">
              {product.inventory > 0 
                ? <span className="font-medium">{product.inventory} units</span> 
                : <span className="text-red-500 dark:text-red-400 font-medium">Currently unavailable</span>}
            </p>

            <div className="space-y-6 pt-2">
              <div className="flex items-center gap-4">
                <label htmlFor="quantity" className="text-sm font-medium text-muted-foreground">
                  Quantity:
                </label>
                <div className="flex items-center shadow-sm rounded-md overflow-hidden border border-input">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-l-md rounded-r-none hover:bg-muted transition-colors"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1 || product.inventory === 0}
                  >
                    <span className="text-lg font-medium">-</span>
                  </Button>
                  <div className="h-9 px-4 flex items-center justify-center border-x border-input w-12 text-center font-medium">
                    {quantity}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-r-md rounded-l-none hover:bg-muted transition-colors"
                    onClick={() => setQuantity(Math.min(product.inventory, quantity + 1))}
                    disabled={quantity >= product.inventory || product.inventory === 0}
                  >
                    <span className="text-lg font-medium">+</span>
                  </Button>
                </div>
              </div>

              <Button 
                size="lg" 
                className="w-full py-6 text-base font-medium transition-all hover:shadow-lg flex items-center justify-center gap-2"
                onClick={handleAddToCart} 
                disabled={product.inventory === 0}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {product.inventory > 0 ? "Add to Cart" : "Out of Stock"}
              </Button>
              
              <Button
                variant="outline"
                className="w-full mt-3 py-5 text-base font-medium transition-colors duration-300 flex items-center justify-center gap-2"
              >
                <Heart className="h-5 w-5" />
                Add to Wishlist
              </Button>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 dark:bg-muted/20">
              <div className="rounded-full bg-muted p-2">
                <Truck className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-sm">Free Shipping</p>
                <p className="text-xs text-muted-foreground">On orders over $50</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 dark:bg-muted/20">
              <div className="rounded-full bg-muted p-2">
                <Shield className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-sm">30-Day Returns</p>
                <p className="text-xs text-muted-foreground">Hassle-free returns</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Details - Improved cards with better spacing and typography */}
      <div className="grid gap-8 lg:grid-cols-2 mt-16">
        <Card className="border-0 shadow-sm hover:shadow transition-shadow duration-300">
          <CardHeader className="bg-muted/50 dark:bg-muted/20 rounded-t-lg">
            <CardTitle className="text-xl font-semibold text-foreground">Description</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-foreground leading-relaxed">
                {product.description || "No description available for this product."}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow transition-shadow duration-300">
          <CardHeader className="bg-muted/50 dark:bg-muted/20 rounded-t-lg">
            <CardTitle className="text-xl font-semibold text-foreground">Product Details</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground font-medium">SKU</span>
                <span className="font-medium">{product.sku || "N/A"}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground font-medium">Category</span>
                <span className="font-medium">{product.category.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground font-medium">Vendor</span>
                <span className="font-medium">{product.vendor.businessName}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground font-medium">Status</span>
                <span className="font-medium capitalize">{product.status.toLowerCase()}</span>
              </div>
              {product.weight && (
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground font-medium">Weight</span>
                  <span className="font-medium">{product.weight} kg</span>
                </div>
              )}
              {product.dimensions && (
                <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground font-medium">Dimensions</span>
                <span className="font-medium">
                  {product.dimensions.length || 0} × {product.dimensions.width || 0} × {product.dimensions.height || 0} cm
                </span>
              </div>
              )}
              {product.tags && product.tags.length > 0 && (
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground font-medium">Tags</span>
                  <div className="flex flex-wrap gap-2 justify-end">
                    {product.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs px-2 py-1">
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
