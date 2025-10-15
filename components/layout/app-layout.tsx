"use client"

import React, { useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Sidebar } from "./sidebar"
import { Topbar } from "./topbar"
import { usePathname, useRouter } from "next/navigation"

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, isLoading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  // Redirect to appropriate dashboard based on user role
  useEffect(() => {
    if (user) {
      // Redirect from home page
      if (pathname === "/") {
        const redirectMap: Record<string, string> = {
          ADMIN: "/admin",
          VENDOR: "/vendor", 
          CUSTOMER: "/customer",
          FINANCE_ANALYST: "/finance",
          OPERATIONS_MANAGER: "/operations",
        }
        
        const redirectPath = redirectMap[user.role]
        if (redirectPath) {
          router.push(redirectPath)
        }
      }
      
      // Redirect logged-in customers from public shop page to customer shop page
      if (user.role === "CUSTOMER" && pathname === "/shop") {
        router.push("/customer")
      }
    }
  }, [user, pathname, router])

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Don't show layout on login page or home page
  if (!user || pathname === "/" || pathname === "/login") {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
