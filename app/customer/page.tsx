"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Star, ShoppingCart, Filter, Grid, List, Loader2, Package } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"

interface Product {
  id: string
  name: string
  price: number
  vendor: {
    businessName: string
  }
  category: {
    name: string
  }
  images?: string[]
  status: string
}

interface Category {
  id: string
  name: string
  description?: string
  imageUrl?: string
}

// Product Image Component with fallback
function ProductImage({ product }: { product: Product }) {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const hasValidImage = product.images && product.images.length > 0 && product.images[0] && !imageError

  return (
    <div className="aspect-video bg-muted rounded-t-lg flex items-center justify-center overflow-hidden relative">
      {hasValidImage ? (
        <>
          <img 
            src={product.images[0]} 
            alt={product.name}
            className="h-full w-full object-cover rounded-t-lg"
            onError={() => setImageError(true)}
            onLoad={() => setImageLoaded(true)}
            style={{ display: imageLoaded ? 'block' : 'none' }}
          />
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </>
      ) : null}
      
      {/* Fallback when no image or image failed to load */}
      {!hasValidImage && (
        <div className="text-muted-foreground text-center p-4">
          <Package className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
          <div className="text-sm font-medium">{product.name}</div>
          <div className="text-xs text-muted-foreground/70">No Image</div>
        </div>
      )}
    </div>
  )
}

export default function CustomerShopPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  // Fetch approved products and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // Fetch approved products from public API
        const productsResponse = await fetch('/api/public/products?status=APPROVED&limit=8')
        const productsData = await productsResponse.json()
        
        // Fetch categories
        const categoriesResponse = await fetch('/api/categories')
        const categoriesData = await categoriesResponse.json()
        
        if (productsData.success && productsData.data) {
          console.log('Fetched products:', productsData.data)
          console.log('First product images:', productsData.data[0]?.images)
          console.log('First product full data:', productsData.data[0])
          setProducts(productsData.data)
        }
        
        if (categoriesData.success) {
          setCategories(categoriesData.data)
        }
        
      } catch (error) {
        console.error('Error fetching data:', error)
        toast({
          title: "Error",
          description: "Failed to load products. Please try again.",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [toast])

  // Mock deals with realistic images
  const deals = [
    { 
      id: 1, 
      name: "Summer Sale", 
      discount: "50% OFF", 
      description: "Selected items", 
      image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop&crop=center" 
    },
    { 
      id: 2, 
      name: "New Arrivals", 
      discount: "20% OFF", 
      description: "Latest products", 
      image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&h=600&fit=crop&crop=center" 
    },
    { 
      id: 3, 
      name: "Flash Sale", 
      discount: "70% OFF", 
      description: "Limited time", 
      image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop&crop=center" 
    },
  ]

  const handleSearch = async () => {
    if (!searchTerm.trim()) return
    
    try {
      setIsLoading(true)
      const response = await fetch(`/api/public/products?search=${encodeURIComponent(searchTerm)}&status=APPROVED&limit=8`)
      const data = await response.json()
      
      if (data.success && data.data) {
        setProducts(data.data)
      }
    } catch (error) {
      console.error('Search error:', error)
      toast({
        title: "Search Error",
        description: "Failed to search products. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <main>
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h1 className="text-hero text-4xl md:text-6xl tracking-tight">
              Discover Amazing <span className="text-primary">Products</span>
            </h1>
            <p className="text-subtitle text-subtitle text-xl text-muted-foreground max-w-2xl mx-auto">
              Shop from verified vendors with secure payments and fast shipping
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search for products, brands, or categories..." 
                  className="pl-10 pr-4 py-3 text-lg"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button 
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  onClick={handleSearch}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                </Button>
              </div>
            </div>
            
            <Button size="lg" asChild>
              <Link href="/shop/products">Browse All Products</Link>
            </Button>
          </div>
        </section>

        {/* Featured Categories */}
        <section className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-title text-3xl md:text-4xl mb-4">Shop by Category</h2>
            <p className="text-body text-subtitle text-lg text-muted-foreground">Find exactly what you're looking for</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {isLoading ? (
              // Loading skeleton for categories
              Array.from({ length: 6 }).map((_, index) => (
                <Card key={index} className="border-2">
                  <div className="aspect-square bg-muted rounded-t-lg flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                  <CardContent className="p-4 text-center">
                    <div className="h-4 bg-muted rounded mb-2"></div>
                    <div className="h-3 bg-muted rounded mb-2"></div>
                    <div className="h-8 bg-muted rounded"></div>
                  </CardContent>
                </Card>
              ))
            ) : categories.length > 0 ? (
              categories.slice(0, 6).map((category) => (
                <Card key={category.id} className="group cursor-pointer border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                  <div className="aspect-square bg-muted rounded-t-lg flex items-center justify-center overflow-hidden">
                    {category.imageUrl ? (
                      <img 
                        src={category.imageUrl} 
                        alt={category.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="text-muted-foreground">Category Image</div>
                    )}
                  </div>
                  <CardContent className="p-4 text-center">
                    <h3 className="text-heading text-heading mb-1">{category.name}</h3>
                    <p className="text-body text-body text-sm text-muted-foreground">Browse products</p>
                    <Button size="sm" variant="outline" className="mt-2 w-full" asChild>
                      <Link href={`/shop/products?category=${category.id}`}>Shop Now</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-muted-foreground">No categories available</p>
              </div>
            )}
          </div>
        </section>

        {/* Trending Products */}
        <section className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-title text-3xl md:text-4xl mb-2">Trending Now</h2>
              <p className="text-subtitle text-lg text-muted-foreground">Most popular products this week</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon">
                <Grid className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading ? (
              // Loading skeleton for products
              Array.from({ length: 8 }).map((_, index) => (
                <Card key={index} className="border-2">
                  <div className="aspect-video bg-muted rounded-t-lg flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                  <CardContent className="p-4">
                    <div className="h-4 bg-muted rounded mb-2"></div>
                    <div className="h-3 bg-muted rounded mb-2"></div>
                    <div className="h-3 bg-muted rounded mb-3"></div>
                    <div className="flex justify-between items-center">
                      <div className="h-6 bg-muted rounded w-16"></div>
                      <div className="h-8 bg-muted rounded w-8"></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : products.length > 0 ? (
              products.map((product) => (
                <Card key={product.id} className="group border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                  <ProductImage product={product} />
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500 dark:fill-yellow-400 dark:text-yellow-400" />
                      <span className="text-caption text-sm text-caption">4.5</span>
                      <span className="text-body text-sm text-muted-foreground">(0)</span>
                    </div>
                    <h3 className="text-heading mb-1 line-clamp-2">{product.name}</h3>
                    <p className="text-body text-sm text-muted-foreground mb-3">by {product.vendor.businessName}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-title text-lg text-primary">₱{Number(product.price).toFixed(2)}</span>
                      <Button size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity" asChild>
                        <Link href={`/shop/product/${product.id}`}>
                          <ShoppingCart className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-muted-foreground">No approved products available yet</p>
                <p className="text-sm text-muted-foreground mt-2">Check back later for new products from our vendors!</p>
              </div>
            )}
          </div>
          
          <div className="text-center mt-8">
            <Button size="lg" asChild>
              <Link href="/shop/products">View All Products</Link>
            </Button>
          </div>
        </section>

        {/* Special Offers */}
        <section className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-title text-3xl md:text-4xl mb-4">Special Offers</h2>
            <p className="text-subtitle text-lg text-muted-foreground">Don't miss out on these amazing deals</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {deals.map((deal) => (
              <Card key={deal.id} className="relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden">
                  <img 
                    src={deal.image} 
                    alt={deal.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="absolute top-4 left-4">
                  <Badge className="bg-red-500 text-white">
                    {deal.discount}
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <h3 className="text-heading text-lg mb-1">{deal.name}</h3>
                  <p className="text-muted-foreground mb-3">{deal.description}</p>
                  <Button className="w-full">Shop Now</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
