"use client"

import React, { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Store, ShoppingCart, BarChart3, Settings, Users } from "lucide-react"

export default function OnboardingPage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    } else if (!isLoading && isAuthenticated && user) {
      // Redirect authenticated users directly to their dashboard
      const redirectMap: Record<string, string> = {
        ADMIN: "/admin",
        VENDOR: "/vendor", 
        CUSTOMER: "/shop",
        FINANCE_ANALYST: "/finance",
        OPERATIONS_MANAGER: "/operations",
      }
      
      const redirectPath = redirectMap[user.role] || "/"
      router.push(redirectPath)
    }
  }, [isAuthenticated, isLoading, router, user])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const getOnboardingContent = () => {
    switch (user.role) {
      case 'VENDOR':
        return {
          title: "Welcome to Your Vendor Dashboard!",
          description: "Let's get your business set up and ready to sell.",
          icon: <Store className="w-12 h-12 text-primary" />,
          steps: [
            {
              title: "Complete Your Profile",
              description: "Add your business details and contact information",
              completed: false,
              action: () => router.push('/vendor/profile')
            },
            {
              title: "Add Your First Product",
              description: "Start by listing your products to attract customers",
              completed: false,
              action: () => router.push('/vendor/products')
            },
            {
              title: "Set Up Payment Methods",
              description: "Configure how you'll receive payments from sales",
              completed: false,
              action: () => router.push('/vendor/payouts')
            },
            {
              title: "Review Your Dashboard",
              description: "Explore your analytics and order management tools",
              completed: false,
              action: () => router.push('/vendor')
            }
          ]
        }

      case 'CUSTOMER':
        return {
          title: "Welcome to Our Marketplace!",
          description: "Discover amazing products from verified vendors.",
          icon: <ShoppingCart className="w-12 h-12 text-primary" />,
          steps: [
            {
              title: "Complete Your Profile",
              description: "Add your shipping address and preferences",
              completed: false,
              action: () => router.push('/settings')
            },
            {
              title: "Browse Products",
              description: "Explore our marketplace and find what you need",
              completed: false,
              action: () => router.push('/shop')
            },
            {
              title: "Make Your First Purchase",
              description: "Experience our secure checkout process",
              completed: false,
              action: () => router.push('/shop')
            },
            {
              title: "Track Your Orders",
              description: "Monitor your purchases and delivery status",
              completed: false,
              action: () => router.push('/shop/orders')
            }
          ]
        }

      case 'ADMIN':
        return {
          title: "Welcome to Admin Dashboard!",
          description: "Manage the platform and oversee operations.",
          icon: <Settings className="w-12 h-12 text-primary" />,
          steps: [
            {
              title: "Review Product Applications",
              description: "Approve new product listings from vendors",
              completed: false,
              action: () => router.push('/admin/product-approval')
            },
            {
              title: "Monitor Platform Analytics",
              description: "Check system performance and user activity",
              completed: false,
              action: () => router.push('/admin/analytics')
            },
            {
              title: "Manage Categories",
              description: "Organize product categories and catalog structure",
              completed: false,
              action: () => router.push('/admin/catalogue')
            },
            {
              title: "Review Transactions",
              description: "Monitor financial transactions and payouts",
              completed: false,
              action: () => router.push('/admin/transactions')
            }
          ]
        }

      case 'FINANCE_ANALYST':
        return {
          title: "Welcome to Finance Dashboard!",
          description: "Manage financial operations and reporting.",
          icon: <BarChart3 className="w-12 h-12 text-primary" />,
          steps: [
            {
              title: "Review Commission Reports",
              description: "Analyze vendor commission structures and earnings",
              completed: false,
              action: () => router.push('/finance/commissions')
            },
            {
              title: "Process Payouts",
              description: "Manage vendor payouts and payment schedules",
              completed: false,
              action: () => router.push('/finance/payouts')
            },
            {
              title: "Monitor Transactions",
              description: "Track all financial transactions and revenue",
              completed: false,
              action: () => router.push('/finance/transactions')
            },
            {
              title: "Generate Reports",
              description: "Create financial reports and analytics",
              completed: false,
              action: () => router.push('/finance')
            }
          ]
        }

      case 'OPERATIONS_MANAGER':
        return {
          title: "Welcome to Operations Dashboard!",
          description: "Oversee logistics and operational efficiency.",
          icon: <Users className="w-12 h-12 text-primary" />,
          steps: [
            {
              title: "Monitor Shipments",
              description: "Track order fulfillment and delivery status",
              completed: false,
              action: () => router.push('/operations/shipments')
            },
            {
              title: "Review Logistics Performance",
              description: "Analyze shipping times and carrier performance",
              completed: false,
              action: () => router.push('/operations/logistics')
            },
            {
              title: "Check System Performance",
              description: "Monitor platform performance and user experience",
              completed: false,
              action: () => router.push('/operations/performance')
            },
            {
              title: "Manage Operations",
              description: "Oversee daily operations and process improvements",
              completed: false,
              action: () => router.push('/operations')
            }
          ]
        }

      default:
        return {
          title: "Welcome!",
          description: "Let's get you started.",
          icon: <CheckCircle className="w-12 h-12 text-primary" />,
          steps: []
        }
    }
  }

  const content = getOnboardingContent()

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-fit">
              {content.icon}
            </div>
            <CardTitle className="text-hero">{content.title}</CardTitle>
            <CardDescription className="text-subtitle">
              {content.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              {content.steps.map((step, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                          step.completed 
                            ? 'bg-green-500 text-white' 
                            : 'bg-primary text-primary-foreground'
                        }`}>
                          {step.completed ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : (
                            <span className="text-sm font-semibold">{index + 1}</span>
                          )}
                        </div>
                        <div>
                          <h3 className="text-heading">{step.title}</h3>
                          <p className="text-body">
                            {step.description}
                          </p>
                        </div>
                      </div>
                      <Button 
                        onClick={step.action}
                        variant={step.completed ? "outline" : "default"}
                        size="sm"
                      >
                        {step.completed ? "Completed" : "Start"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-center pt-6">
              <Button 
                onClick={() => {
                  // Redirect to appropriate dashboard
                  switch (user.role) {
                    case 'VENDOR':
                      router.push('/vendor')
                      break
                    case 'CUSTOMER':
                      router.push('/shop')
                      break
                    case 'ADMIN':
                      router.push('/admin')
                      break
                    case 'FINANCE_ANALYST':
                      router.push('/finance')
                      break
                    case 'OPERATIONS_MANAGER':
                      router.push('/operations')
                      break
                    default:
                      router.push('/')
                  }
                }}
                size="lg"
                className="px-8"
              >
                Skip Onboarding & Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
