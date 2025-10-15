"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Star, ShoppingCart, Filter, Grid, List, Loader2, Package } from "lucide-react"
import { PublicHeader } from "@/components/layout/public-header"
import { PublicFooter } from "@/components/layout/public-footer"
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

export default function ShopPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isDataLoading, setIsDataLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    // If user is logged in as a customer, redirect to customer shop page
    if (!isLoading && user && user.role === 'CUSTOMER') {
      router.push('/customer')
      return
    }
  }, [user, isLoading, router])

  // Fetch approved products and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsDataLoading(true)
        
        // Fetch approved products from public API
        const productsResponse = await fetch('/api/public/products?status=APPROVED&limit=8')
        const productsData = await productsResponse.json()
        
        // Fetch categories
        const categoriesResponse = await fetch('/api/categories')
        const categoriesData = await categoriesResponse.json()
        
        if (productsData.success && productsData.data) {
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
        setIsDataLoading(false)
      }
    }

    fetchData()
  }, [toast])

  // Show loading or redirect if user is a customer
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // If user is a customer, don't render the public shop page
  if (user && user.role === 'CUSTOMER') {
    return null
  }
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

  const testimonials = [
    { id: 1, name: "Maria Santos", rating: 5, comment: "Amazing products and fast delivery! Highly recommended.", image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face" },
    { id: 2, name: "John Smith", rating: 5, comment: "Great selection and excellent customer service.", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face" },
    { id: 3, name: "Lisa Chen", rating: 5, comment: "Love the quality and variety of products available.", image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face" },
    { id: 4, name: "David Kim", rating: 5, comment: "Secure checkout and reliable shipping. Will shop again!", image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face" },
  ]

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      
      <main>
        {/* Hero Section - Mobile responsive */}
        <section className="container mx-auto px-4 py-12 md:py-20">
          <div className="max-w-4xl mx-auto text-center space-y-6 md:space-y-8">
            <h1 className="text-hero text-3xl md:text-4xl lg:text-6xl tracking-tight">
              Discover Amazing <span className="text-primary">Products</span>
            </h1>
            <p className="text-subtitle text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              Shop from verified vendors with secure payments and fast shipping
            </p>
            
            {/* Search Bar - Mobile responsive */}
            <div className="max-w-2xl mx-auto px-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search for products, brands, or categories..." 
                  className="pl-10 pr-20 py-3 text-base md:text-lg"
                />
                <Button className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm md:text-base">
                  Search
                </Button>
              </div>
            </div>
            
            <Button size="lg" asChild className="w-full sm:w-auto">
              <Link href="/shop/products">Browse All Products</Link>
            </Button>
          </div>
        </section>

        {/* Featured Categories - Mobile responsive */}
        <section className="container mx-auto px-4 py-12 md:py-16">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-title text-2xl md:text-3xl lg:text-4xl mb-2 md:mb-4">Shop by Category</h2>
            <p className="text-body text-base md:text-lg text-muted-foreground">Find exactly what you're looking for</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
            {isDataLoading ? (
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

        {/* Trending Products - Mobile responsive */}
        <section className="container mx-auto px-4 py-12 md:py-16">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 md:mb-8">
            <div>
              <h2 className="text-title text-2xl md:text-3xl lg:text-4xl mb-1 md:mb-2">Trending Now</h2>
              <p className="text-subtitle text-base md:text-lg text-muted-foreground">Most popular products this week</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-10 w-10">
                <Grid className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-10 w-10">
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {isDataLoading ? (
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

        {/* Deals & Promotions */}
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

        {/* Why Shop With Us */}
        <section className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-title text-3xl md:text-4xl mb-4">Why Shop With Us?</h2>
            <p className="text-subtitle text-lg text-muted-foreground">We make shopping safe, easy, and enjoyable</p>
      </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center border-2 hover:border-primary/50 transition-all duration-300">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔒</span>
        </div>
                <h3 className="text-xl text-heading mb-2">Wide Selection</h3>
                <p className="text-muted-foreground">From trusted vendors worldwide</p>
              </CardContent>
            </Card>
            
            <Card className="text-center border-2 hover:border-primary/50 transition-all duration-300">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⚡</span>
      </div>
                <h3 className="text-xl text-heading mb-2">Secure & Fast</h3>
                <p className="text-muted-foreground">Checkout with confidence</p>
              </CardContent>
            </Card>
            
            <Card className="text-center border-2 hover:border-primary/50 transition-all duration-300">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🚚</span>
                </div>
                <h3 className="text-xl text-heading mb-2">Reliable Shipping</h3>
                <p className="text-muted-foreground">Fast and secure delivery</p>
            </CardContent>
          </Card>
            
            <Card className="text-center border-2 hover:border-primary/50 transition-all duration-300">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💬</span>
                </div>
                <h3 className="text-xl text-heading mb-2">24/7 Support</h3>
                <p className="text-muted-foreground">Always here to help</p>
              </CardContent>
            </Card>
            </div>
        </section>

        {/* Customer Testimonials */}
        <section className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-title text-3xl md:text-4xl mb-4">What Customers Say</h2>
            <p className="text-subtitle text-lg text-muted-foreground">Real reviews from satisfied customers</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.id} className="border-2 hover:border-primary/50 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <blockquote className="text-muted-foreground mb-4 italic">
                    "{testimonial.comment}"
                  </blockquote>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center overflow-hidden">
                      <img 
                        src={testimonial.image} 
                        alt={testimonial.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>
                    <div>
                      <p className="text-heading">{testimonial.name}</p>
                      <p className="text-body text-sm text-muted-foreground">Verified Customer</p>
                  </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Call to Action */}
        <section className="container mx-auto px-4 py-16">
          <Card className="relative overflow-hidden border-2">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
            <CardHeader className="relative text-center space-y-6 py-16">
              <CardTitle className="text-title text-3xl md:text-4xl">
                Ready to find your next favorite item?
              </CardTitle>
              <CardDescription className="text-lg max-w-2xl mx-auto">
                Browse thousands of products from verified vendors and enjoy secure shopping with fast delivery.
              </CardDescription>
              <Button size="lg" asChild className="text-lg h-12 px-8">
                <Link href="/shop/products">Start Shopping Now</Link>
              </Button>
            </CardHeader>
          </Card>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}