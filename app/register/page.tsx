"use client"

import React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { 
  Store, 
  ShoppingCart, 
  CheckCircle, 
  ArrowRight,
  Users,
  TrendingUp
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function RegisterPage() {
  const [selectedRole, setSelectedRole] = useState<'vendor' | 'customer' | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  const handleRoleSelection = (role: 'vendor' | 'customer') => {
    setSelectedRole(role)
  }

  const handleContinue = () => {
    if (selectedRole) {
      router.push(`/register/${selectedRole}`)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            Join Our Platform
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm">
            Choose your role and start your journey
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid md:grid-cols-2 gap-4 mb-8 max-w-2xl mx-auto">
          {/* Vendor Card */}
          <Card 
            className={cn(
              "cursor-pointer transition-all duration-200 hover:shadow-lg",
              selectedRole === 'vendor' 
                ? 'ring-2 ring-primary shadow-lg' 
                : 'hover:shadow-md'
            )}
            onClick={() => handleRoleSelection('vendor')}
          >
            <CardHeader className="text-center pb-3">
              <div className="mx-auto mb-3 p-2 bg-primary/10 rounded-full w-fit">
                <Store className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Vendor</CardTitle>
              <CardDescription className="text-sm">
                Sell your products and grow your business
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="space-y-2">
                {[
                  "Easy product management",
                  "Automated commission tracking", 
                  "Real-time analytics",
                  "Flexible subscription plans",
                  "Automated payouts"
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <span className="text-xs text-foreground">{feature}</span>
                  </div>
                ))}
              </div>
              
              <Separator className="my-3" />
              
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium">Starter</span>
                  <Badge variant="secondary" className="text-xs">Free</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium">Pro</span>
                  <Badge variant="default" className="text-xs">₱5,000/mo</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Card */}
          <Card 
            className={cn(
              "cursor-pointer transition-all duration-200 hover:shadow-lg",
              selectedRole === 'customer' 
                ? 'ring-2 ring-primary shadow-lg' 
                : 'hover:shadow-md'
            )}
            onClick={() => handleRoleSelection('customer')}
          >
            <CardHeader className="text-center pb-3">
              <div className="mx-auto mb-3 p-2 bg-primary/10 rounded-full w-fit">
                <ShoppingCart className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Customer</CardTitle>
              <CardDescription className="text-sm">
                Shop from verified vendors with confidence
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="space-y-2">
                {[
                  "Wide product selection",
                  "Secure payment processing",
                  "Real-time order tracking", 
                  "Easy returns & refunds",
                  "Customer support"
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <span className="text-xs text-foreground">{feature}</span>
                  </div>
                ))}
              </div>
              
              <Separator className="my-3" />
              
              <div className="p-2 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">Free to Join</span>
                  <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-xs text-muted-foreground">
                  No subscription fees. Pay only for what you buy.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Continue Button */}
        <div className="text-center mb-8">
          <Button 
            onClick={handleContinue}
            disabled={!selectedRole}
            size="lg"
            className="px-6"
          >
            Continue as {selectedRole === 'vendor' ? 'Vendor' : selectedRole === 'customer' ? 'Customer' : '...'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {/* Platform Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-2xl mx-auto">
          <div className="text-center">
            <div className="mx-auto mb-2 p-1.5 bg-primary/10 rounded-full w-fit">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <h3 className="text-lg font-bold mb-1">10,000+</h3>
            <p className="text-xs text-muted-foreground">Active Users</p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-2 p-1.5 bg-primary/10 rounded-full w-fit">
              <Store className="h-4 w-4 text-primary" />
            </div>
            <h3 className="text-lg font-bold mb-1">500+</h3>
            <p className="text-xs text-muted-foreground">Verified Vendors</p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-2 p-1.5 bg-primary/10 rounded-full w-fit">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <h3 className="text-lg font-bold mb-1">₱50M+</h3>
            <p className="text-xs text-muted-foreground">Annual Sales</p>
          </div>
        </div>

        {/* Login Link */}
        <div className="text-center">
          <p className="text-muted-foreground">
            Already have an account?{" "}
            <Link 
              href="/login" 
              className="text-primary hover:underline font-medium"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
