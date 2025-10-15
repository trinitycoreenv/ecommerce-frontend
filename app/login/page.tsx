"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth, type UserRole } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const searchParams = useSearchParams()

  // Email verification removed - no longer needed

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await login(email, password)
      
      // Email verification removed - users are automatically verified
      
      toast({
        title: "Login successful",
        description: "Welcome back! Redirecting to your dashboard...",
      })

      // Redirect directly to the appropriate dashboard based on user role
      const redirectMap: Record<string, string> = {
        ADMIN: "/admin",
        VENDOR: "/vendor", 
        CUSTOMER: "/shop",
        FINANCE_ANALYST: "/finance",
        OPERATIONS_MANAGER: "/operations",
      }
      
      const redirectPath = redirectMap[response.user.role]
      if (redirectPath) {
        setTimeout(() => {
          router.push(redirectPath)
        }, 1000) // Give time for the toast to show
      }
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Please check your credentials and try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <CardTitle className="text-hero text-center">Welcome Back</CardTitle>
          <CardDescription className="text-subtitle text-center">Sign in to access your dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>


            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>

            <div className="text-center text-body">
              <Link href="/" className="hover:text-primary underline-offset-4 hover:underline">
                Back to home
              </Link>
            </div>

            <div className="text-center text-body">
              <Link href="/forgot-password" className="text-primary hover:underline">
                Forgot your password?
              </Link>
            </div>

            <div className="text-center text-body">
              Don't have an account?{" "}
              <Link href="/register" className="text-primary hover:underline">
                Sign up here
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
