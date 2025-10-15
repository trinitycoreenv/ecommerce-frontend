"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, ShoppingBag, Users, TrendingUp, Package, BarChart3, Shield, Zap, Star, CheckCircle, Clock, Globe, Heart, Loader2 } from "lucide-react"
import { PublicHeader } from "@/components/layout/public-header"
import { PublicFooter } from "@/components/layout/public-footer"
import { WorkingCarousel as AnimatedCarousel } from "@/components/ui/working-carousel"
import { AnimatedHeroText } from "@/components/ui/animated-hero-text"
import { PlatformPerformanceChart } from "@/components/shared/platform-performance-chart"
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

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  // Fetch approved products and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // Fetch approved products from public API
        const productsResponse = await fetch('/api/public/products?status=APPROVED&limit=6')
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
        setIsLoading(false)
      }
    }

    fetchData()
  }, [toast])
  const successStories = [
    { 
      id: 1, 
      name: "Lee Min-ho", 
      business: "Fashion Store", 
      sales: "₱2.5M", 
      growth: "300%", 
      quote: "Increased my sales by 300% in just 3 months! The platform's reach is incredible.", 
      image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=100&h=100&fit=crop&crop=center" 
    },
    { 
      id: 2, 
      name: "Park Shin-hye", 
      business: "TechGadgets Korea", 
      sales: "₱1.8M", 
      growth: "250%", 
      quote: "The platform made it so easy to reach customers worldwide. Amazing results!", 
      image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=100&h=100&fit=crop&crop=center" 
    },
    { 
      id: 3, 
      name: "Kim Soo-hyun", 
      business: "Home & Garden Seoul", 
      sales: "₱3.2M", 
      growth: "400%", 
      quote: "Best decision I made for my business growth. The analytics are fantastic!", 
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=100&h=100&fit=crop&crop=center" 
    },
    { 
      id: 4, 
      name: "Song Hye-kyo", 
      business: "Electronics Hub Korea", 
      sales: "₱4.1M", 
      growth: "350%", 
      quote: "Outstanding support and seamless integration. Highly recommended platform!", 
      image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=100&h=100&fit=crop&crop=center" 
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      
      <main>
        {/* 1. Platform Overview Section (Hero) - Mobile responsive */}
        <section className="container mx-auto px-4 py-12 md:py-20 lg:py-32">
          <div className="max-w-5xl mx-auto text-center space-y-8 md:space-y-12">
            <AnimatedHeroText />
            <p className="text-subtitle text-lg md:text-xl lg:text-2xl text-muted-foreground text-balance max-w-3xl mx-auto px-4">
              The smarter way to grow your commerce.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center pt-6 md:pt-8 px-4">
              <Button
                size="lg"
                asChild
                className="group relative h-12 md:h-14 px-6 md:px-10 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border-0 font-semibold text-base md:text-lg rounded-xl overflow-hidden w-full sm:w-auto"
              >
                <Link href="/login">
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    Get Started 
                    <ArrowRight className="h-4 w-4 md:h-5 md:w-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-foreground/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                asChild 
                className="group h-12 md:h-14 px-6 md:px-10 bg-transparent border-2 border-border hover:bg-accent hover:border-accent-foreground/20 text-foreground hover:text-accent-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 font-semibold text-base md:text-lg rounded-xl backdrop-blur-sm w-full sm:w-auto"
              >
                <Link href="/shop">
                  <span className="flex items-center justify-center gap-3">
                    Explore Platform
                    <div className="w-2 h-2 rounded-full bg-current opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </span>
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* 2. Platform Stats Section - Mobile responsive */}
        <section className="container mx-auto px-4 py-12 md:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 lg:gap-6 max-w-6xl mx-auto">
            <div className="text-center p-4 md:p-6 rounded-lg border bg-card/50 backdrop-blur">
              <div className="text-2xl md:text-4xl lg:text-5xl font-bold text-primary mb-1 md:mb-2">98%</div>
              <div className="text-xs md:text-sm text-muted-foreground">Uptime SLA</div>
            </div>
            <div className="text-center p-4 md:p-6 rounded-lg border bg-card/50 backdrop-blur">
              <div className="text-2xl md:text-4xl lg:text-5xl font-bold text-primary mb-1 md:mb-2">10k+</div>
              <div className="text-xs md:text-sm text-muted-foreground">Active Vendors</div>
            </div>
            <div className="text-center p-4 md:p-6 rounded-lg border bg-card/50 backdrop-blur">
              <div className="text-2xl md:text-4xl lg:text-5xl font-bold text-primary mb-1 md:mb-2">5M+</div>
              <div className="text-xs md:text-sm text-muted-foreground">Transactions</div>
            </div>
            <div className="text-center p-4 md:p-6 rounded-lg border bg-card/50 backdrop-blur">
              <div className="text-2xl md:text-4xl lg:text-5xl font-bold text-primary mb-1 md:mb-2">24/7</div>
              <div className="text-xs md:text-sm text-muted-foreground">Support</div>
            </div>
          </div>
        </section>

        {/* 3. Performance & Scale Section - Mobile responsive */}
        <section className="container mx-auto px-4 py-12 md:py-20">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="space-y-4 md:space-y-6">
              <div className="inline-flex items-center gap-2 text-caption text-xs md:text-sm font-medium text-primary">
                <Zap className="h-3 w-3 md:h-4 md:w-4" />
                Performance & Scale
              </div>
              <h2 className="text-title text-2xl md:text-4xl lg:text-5xl text-balance">Built for speed. Designed for growth.</h2>
              <p className="text-body text-base md:text-lg text-muted-foreground">
                Our platform handles millions of transactions with real-time updates, ensuring your business never misses
                a beat. From small startups to enterprise operations, we scale with you.
              </p>
              <ul className="space-y-3 md:space-y-4">
                <li className="flex items-start gap-3">
                  <div className="h-5 w-5 md:h-6 md:w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-primary" />
                  </div>
                  <div>
                    <div className="text-heading font-medium mb-1 text-sm md:text-base">Real-time synchronization</div>
                    <div className="text-body text-xs md:text-sm text-muted-foreground">
                      Instant updates across all dashboards and user roles
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="h-5 w-5 md:h-6 md:w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-primary" />
                  </div>
                  <div>
                    <div className="text-heading font-medium mb-1 text-sm md:text-base">Enterprise-grade security</div>
                    <div className="text-body text-xs md:text-sm text-muted-foreground">Role-based access control and data encryption</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="h-5 w-5 md:h-6 md:w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-primary" />
                  </div>
                  <div>
                    <div className="text-heading font-medium mb-1 text-sm md:text-base">Scalable infrastructure</div>
                    <div className="text-body text-xs md:text-sm text-muted-foreground">Handle growth from 100 to 100,000+ orders</div>
                  </div>
                </li>
              </ul>
                </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent rounded-2xl blur-3xl" />
              <PlatformPerformanceChart />
          </div>
        </div>
      </section>

        {/* 4. Role-Based Features Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-title text-3xl md:text-5xl mb-4 text-balance">
              Built for every role in your organization
            </h2>
            <p className="text-body text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
              Comprehensive dashboards and tools tailored to each team member's needs
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
              <CardHeader className="space-y-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-heading text-xl">Administrator Control</CardTitle>
                <CardDescription className="text-body text-base">
                  Complete platform oversight with subscription management, catalogue control, and comprehensive
                  reporting tools.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
              <CardHeader className="space-y-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ShoppingBag className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-heading text-xl">Vendor Management</CardTitle>
                <CardDescription className="text-body text-base">
                  Powerful product management, order tracking, and payout monitoring for vendors to grow their business.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
              <CardHeader className="space-y-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-heading text-xl">Customer Experience</CardTitle>
                <CardDescription className="text-body text-base">
                  Seamless shopping with advanced search, cart management, and real-time order tracking capabilities.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
              <CardHeader className="space-y-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Finance Analytics</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Deep insights into transactions, commission breakdowns, and payout schedules with exportable reports.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
              <CardHeader className="space-y-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-heading text-xl">Operations Control</CardTitle>
                <CardDescription className="text-body text-base">
                  Real-time shipment monitoring, logistics configuration, and SLA compliance tracking for smooth
                  operations.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
              <CardHeader className="space-y-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-heading text-xl">Advanced Reporting</CardTitle>
                <CardDescription className="text-body text-base">
                  Comprehensive analytics and reporting across all platform activities with customizable dashboards.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* 5. Featured Products Section - Right to Left Motion */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <h2 className="text-title text-3xl md:text-4xl mb-4">Featured Products</h2>
            <p className="text-body text-lg text-muted-foreground">Discover trending products from our trusted vendors</p>
          </div>
          
          <AnimatedCarousel direction="left" speed="medium" className="py-4">
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 6 }).map((_, index) => (
                <Card key={index} className="w-80 flex-shrink-0 border-2">
                  <div className="aspect-video bg-muted rounded-t-lg flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                  <CardContent className="p-4">
                    <div className="h-4 bg-muted rounded mb-2"></div>
                    <div className="h-3 bg-muted rounded mb-2"></div>
                    <div className="h-3 bg-muted rounded mb-3"></div>
                    <div className="flex justify-between items-center">
                      <div className="h-6 bg-muted rounded w-16"></div>
                      <div className="h-8 bg-muted rounded w-20"></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : products.length > 0 ? (
              products.map((product) => (
                <Card key={product.id} className="w-80 flex-shrink-0 border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                  <ProductImage product={product} />
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500 dark:fill-yellow-400 dark:text-yellow-400" />
                      <span className="text-caption text-sm font-medium">4.5</span>
                    </div>
                    <h3 className="text-heading font-semibold mb-1">{product.name}</h3>
                    <p className="text-body text-sm text-muted-foreground mb-2">by {product.vendor.businessName}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-primary">₱{Number(product.price).toFixed(2)}</span>
                      <Button size="sm" asChild>
                        <Link href={`/shop/product/${product.id}`}>Add to Cart</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-muted-foreground">No products available yet</p>
                <p className="text-sm text-muted-foreground mt-2">Check back later for new products from our vendors!</p>
              </div>
            )}
          </AnimatedCarousel>
        </section>

        {/* 6. Product Categories Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Browse by Category</h2>
            <p className="text-lg text-muted-foreground">Find exactly what you're looking for</p>
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
                    <h3 className="font-semibold mb-1">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">Browse products</p>
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

        {/* 7. Social Proof Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-8">Trusted by leading e-commerce businesses</p>
            <div className="flex flex-wrap items-center justify-center gap-12 opacity-60">
              <div className="text-2xl font-bold">SHOPIFY</div>
              <div className="text-2xl font-bold">AMAZON</div>
              <div className="text-2xl font-bold">ETSY</div>
              <div className="text-2xl font-bold">WALMART</div>
          </div>
        </div>
      </section>


        {/* 9. Getting Started Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground">Start selling in three simple steps</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Register & Verify</h3>
              <p className="text-muted-foreground">Sign up, choose your plan, and complete business verification.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">List Your Products</h3>
              <p className="text-muted-foreground">Easily add products, manage inventory, and set pricing.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Sell & Grow</h3>
              <p className="text-muted-foreground">Process orders, manage shipping, and get paid securely.</p>
          </div>
        </div>
      </section>

        {/* 10. Subscription Plans Preview */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Choose Your Plan</h2>
            <p className="text-lg text-muted-foreground">Flexible pricing for businesses of all sizes</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <Card className="border-2 hover:border-primary/50 transition-all duration-300">
              <CardHeader className="text-center">
                <CardTitle className="text-lg">Starter</CardTitle>
                <div className="text-3xl font-bold text-primary">₱0<span className="text-sm text-muted-foreground">/month</span></div>
                <CardDescription>Perfect for getting started</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span>Up to 10 products</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span>25 orders/month</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span>15% commission</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all duration-300">
              <CardHeader className="text-center">
                <CardTitle className="text-lg">Basic</CardTitle>
                <div className="text-3xl font-bold text-primary">₱2,000<span className="text-sm text-muted-foreground">/month</span></div>
                <CardDescription>For growing businesses</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span>Up to 50 products</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span>100 orders/month</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span>12% commission</span>
              </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary hover:border-primary/50 transition-all duration-300 relative">
              <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2">Popular</Badge>
              <CardHeader className="text-center">
                <CardTitle className="text-lg">Pro</CardTitle>
                <div className="text-3xl font-bold text-primary">₱5,000<span className="text-sm text-muted-foreground">/month</span></div>
                <CardDescription>For established sellers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span>Up to 200 products</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span>500 orders/month</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span>8% commission</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span>14-day free trial</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all duration-300">
              <CardHeader className="text-center">
                <CardTitle className="text-lg">Enterprise</CardTitle>
                <div className="text-3xl font-bold text-primary">₱10,000<span className="text-sm text-muted-foreground">/month</span></div>
                <CardDescription>For large operations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span>Unlimited products</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span>Unlimited orders</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span>5% commission</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8">
            <Button size="lg" asChild>
              <Link href="/register/vendor/plan-selection">View All Plans</Link>
            </Button>
        </div>
      </section>

        {/* 11. Our Mission Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Our Mission</h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              We're building the future of e-commerce by connecting customers with trusted vendors worldwide. 
              Our platform empowers businesses to grow while providing customers with secure, seamless shopping experiences.
            </p>
            <div className="grid md:grid-cols-2 gap-8 mt-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Trust & Transparency</h3>
                <p className="text-muted-foreground">Secure transactions for everyone</p>
          </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Globe className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Global Reach</h3>
                <p className="text-muted-foreground">Connecting businesses worldwide</p>
              </div>
            </div>
          </div>
        </section>

        {/* 12. Vendor Success Stories Section - Left to Right Motion */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Success Stories</h2>
            <p className="text-lg text-muted-foreground">See how vendors are growing their businesses with us</p>
          </div>
          
          <AnimatedCarousel direction="right" speed="slow" className="py-4">
            {successStories.map((story) => (
              <Card key={story.id} className="w-96 flex-shrink-0 border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center overflow-hidden">
                      <img 
                        src={story.image} 
                        alt={story.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold">{story.name}</h3>
                      <p className="text-sm text-muted-foreground">{story.business}</p>
                    </div>
                  </div>
                  <blockquote className="text-lg italic mb-4">"{story.quote}"</blockquote>
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <span className="text-muted-foreground">Sales: </span>
                      <span className="font-semibold text-primary">{story.sales}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Growth: </span>
                      <span className="font-semibold text-green-600 dark:text-green-400">{story.growth}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </AnimatedCarousel>
        </section>

        {/* 13. Platform CTA Section */}
        <section className="container mx-auto px-4 py-20">
          <Card className="relative overflow-hidden border-2">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
            <CardHeader className="relative text-center space-y-6 py-16 md:py-24">
              <CardTitle className="text-4xl md:text-5xl font-bold text-balance">
                Ready to transform your e-commerce operations?
              </CardTitle>
              <CardDescription className="text-lg md:text-xl max-w-2xl mx-auto text-balance">
                Join thousands of businesses managing their revenue with our platform. Start your free trial today.
              </CardDescription>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button size="lg" asChild className="text-lg h-12 px-8">
                  <Link href="/login">Start Free Trial</Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="text-lg h-12 px-8 bg-transparent">
                  <Link href="/shop">View Demo</Link>
                </Button>
              </div>
            </CardHeader>
          </Card>
      </section>
      </main>

      <PublicFooter />
    </div>
  )
}