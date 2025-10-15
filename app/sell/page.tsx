import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, TrendingUp, Users, DollarSign, BarChart3, Shield, Clock, CheckCircle, Star, Globe, Zap } from "lucide-react"
import { PublicHeader } from "@/components/layout/public-header"
import { PublicFooter } from "@/components/layout/public-footer"

export default function SellPage() {
  // Real success stories will be added when available
  const successStories: any[] = []

  const benefits = [
    { icon: <Zap className="h-6 w-6" />, title: "Easy Setup", description: "Get started in minutes with our simple registration process" },
    { icon: <Globe className="h-6 w-6" />, title: "Reach Customers", description: "Access to thousands of buyers worldwide" },
    { icon: <DollarSign className="h-6 w-6" />, title: "Get Paid Fast", description: "Automated payments with reliable payout system" },
    { icon: <TrendingUp className="h-6 w-6" />, title: "Grow Your Business", description: "Analytics and insights to scale your operations" },
    { icon: <Shield className="h-6 w-6" />, title: "Secure Platform", description: "Enterprise-grade security and data protection" },
    { icon: <Users className="h-6 w-6" />, title: "Dedicated Support", description: "Access priority support for all your needs" },
  ]

  const plans = [
    { 
      name: "Starter", 
      price: "₱0", 
      period: "/month", 
      description: "Perfect for getting started",
      features: ["Up to 10 products", "25 orders/month", "15% commission", "Email support"],
      popular: false,
      trial: "Forever Free"
    },
    { 
      name: "Basic", 
      price: "₱2,000", 
      period: "/month", 
      description: "For growing businesses",
      features: ["Up to 50 products", "100 orders/month", "12% commission", "Email support"],
      popular: false,
      trial: "No Trial"
    },
    { 
      name: "Pro", 
      price: "₱5,000", 
      period: "/month", 
      description: "For established sellers",
      features: ["Up to 200 products", "500 orders/month", "8% commission", "Priority support", "Custom branding", "API access"],
      popular: true,
      trial: "14-day free trial"
    },
    { 
      name: "Enterprise", 
      price: "₱10,000", 
      period: "/month", 
      description: "For large operations",
      features: ["Unlimited products", "Unlimited orders", "5% commission", "Dedicated support", "White-label solution", "Custom integrations", "SLA guarantee"],
      popular: false,
      trial: "No Trial"
    },
  ]

  const steps = [
    { number: 1, title: "Register & Verify", description: "Sign up, choose your plan, and complete business verification.", icon: <Users className="h-8 w-8" /> },
    { number: 2, title: "List Your Products", description: "Easily add products, manage inventory, and set pricing.", icon: <BarChart3 className="h-8 w-8" /> },
    { number: 3, title: "Sell & Grow", description: "Process orders, manage shipping, and get paid securely.", icon: <TrendingUp className="h-8 w-8" /> },
  ]

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      
      <main>
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h1 className="text-hero text-4xl md:text-6xl tracking-tight">
              Grow Your Business <span className="text-primary">With Us</span>
            </h1>
            <p className="text-subtitle text-xl text-muted-foreground max-w-2xl mx-auto">
              Reach millions of customers and streamline your sales with our powerful e-commerce platform
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="text-lg h-12 px-8">
                <Link href="/register/vendor">
                  Start Selling Today <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-lg h-12 px-8">
                <Link href="#learn-more">Learn More</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Key Benefits Carousel */}
        <section className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-title text-3xl md:text-4xl mb-4">Why Sell With Us?</h2>
            <p className="text-subtitle text-lg text-muted-foreground">Everything you need to succeed in e-commerce</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index} className="text-center border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                    {benefit.icon}
                  </div>
                  <h3 className="text-xl text-heading mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Success Stories */}
        <section className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-title text-3xl md:text-4xl mb-4">Success Stories</h2>
            <p className="text-subtitle text-lg text-muted-foreground">See how vendors are growing their businesses with us</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {successStories.map((story) => (
              <Card key={story.id} className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                      <div className="text-muted-foreground">Photo</div>
                    </div>
                    <div>
                      <h3 className="text-heading">{story.name}</h3>
                      <p className="text-body text-sm text-muted-foreground">{story.business}</p>
                    </div>
                  </div>
                  <blockquote className="text-lg italic mb-4">"{story.quote}"</blockquote>
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <span className="text-muted-foreground">Sales: </span>
                      <span className="text-heading text-primary">{story.sales}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Growth: </span>
                      <span className="text-heading text-green-600 dark:text-green-400">{story.growth}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section id="learn-more" className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-title text-3xl md:text-4xl mb-4">How It Works</h2>
            <p className="text-subtitle text-lg text-muted-foreground">Start selling in three simple steps</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                  {step.icon}
                </div>
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-primary-foreground text-title">
                  {step.number}
                </div>
                <h3 className="text-xl text-heading mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Subscription Plans */}
        <section className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-title text-3xl md:text-4xl mb-4">Choose Your Plan</h2>
            <p className="text-subtitle text-lg text-muted-foreground">Flexible pricing for businesses of all sizes</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <Card key={plan.name} className={`border-2 hover:border-primary/50 transition-all duration-300 relative ${plan.popular ? 'border-primary' : ''}`}>
                {plan.popular && (
                  <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2">Popular</Badge>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <div className="text-3xl text-title text-primary">
                    {plan.price}<span className="text-body text-sm text-muted-foreground">{plan.period}</span>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                  {plan.trial && (
                    <Badge variant="outline" className="mt-2">
                      {plan.trial}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <span>{feature}</span>
                    </div>
                  ))}
                  <Button className="w-full mt-6" variant={plan.popular ? "default" : "outline"}>
                    {plan.name === "Starter" ? "Start Free" : "Get Started"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <Button size="lg" asChild>
              <Link href="/register/vendor/plan-selection">View All Plans</Link>
            </Button>
          </div>
        </section>

        {/* Vendor Support */}
        <section className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-title text-3xl md:text-4xl mb-4">Vendor Support</h2>
            <p className="text-subtitle text-lg text-muted-foreground">We're here to help you succeed</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="text-center border-2 hover:border-primary/50 transition-all duration-300">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📚</span>
                </div>
                <h3 className="text-xl text-heading mb-2">Resources</h3>
                <p className="text-muted-foreground mb-4">Guides, tutorials, and best practices to help you grow</p>
                <Button variant="outline">Browse Resources</Button>
              </CardContent>
            </Card>
            
            <Card className="text-center border-2 hover:border-primary/50 transition-all duration-300">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">👥</span>
                </div>
                <h3 className="text-xl text-heading mb-2">Community</h3>
                <p className="text-muted-foreground mb-4">Connect with other sellers and share experiences</p>
                <Button variant="outline">Join Community</Button>
              </CardContent>
            </Card>
            
            <Card className="text-center border-2 hover:border-primary/50 transition-all duration-300">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🎧</span>
                </div>
                <h3 className="text-xl text-heading mb-2">Support</h3>
                <p className="text-muted-foreground mb-4">24/7 help available for all your questions</p>
                <Button variant="outline">Get Support</Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Call to Action */}
        <section className="container mx-auto px-4 py-16">
          <Card className="relative overflow-hidden border-2">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
            <CardHeader className="relative text-center space-y-6 py-16">
              <CardTitle className="text-title text-3xl md:text-4xl">
                Ready to Start Your E-commerce Journey?
              </CardTitle>
              <CardDescription className="text-lg max-w-2xl mx-auto">
                Join thousands of successful vendors and start growing your business today. 
                Choose your plan and begin selling in minutes.
              </CardDescription>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild className="text-lg h-12 px-8">
                  <Link href="/register/vendor">Start Selling Now</Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="text-lg h-12 px-8">
                  <Link href="/contact">Contact Sales</Link>
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
