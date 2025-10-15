"use client"

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth, type UserRole } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  LayoutDashboard,
  CreditCard,
  Package,
  Truck,
  DollarSign,
  FileText,
  ShoppingBag,
  ShoppingCart,
  Settings,
  BarChart3,
  Calendar,
  MapPin,
  CheckCircle,
  UserCheck,
  Shield,
  Menu,
} from "lucide-react"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles: UserRole[]
}

const navigationItems: NavItem[] = [
  // Admin navigation - Cleaned up duplicates
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard, roles: ["ADMIN"] },
  { title: "Analytics & Reports", href: "/admin/analytics", icon: BarChart3, roles: ["ADMIN"] },
  { title: "Product Approval", href: "/admin/product-approval", icon: CheckCircle, roles: ["ADMIN"] },
  { title: "Commission Management", href: "/admin/commissions", icon: DollarSign, roles: ["ADMIN"] },
  { title: "Payout Management", href: "/admin/payouts", icon: CreditCard, roles: ["ADMIN"] },
  { title: "Inventory Management", href: "/admin/inventory", icon: Package, roles: ["ADMIN"] },
  { title: "Logistics & Shipping", href: "/admin/logistics", icon: Truck, roles: ["ADMIN"] },
  { title: "Subscriptions", href: "/admin/subscriptions", icon: Shield, roles: ["ADMIN"] },

  // Vendor navigation
  { title: "Dashboard", href: "/vendor", icon: LayoutDashboard, roles: ["VENDOR"] },
  { title: "Product Management", href: "/vendor/products", icon: Package, roles: ["VENDOR"] },
  { title: "Inventory", href: "/vendor/inventory", icon: Package, roles: ["VENDOR"] },
  { title: "Shipping", href: "/vendor/shipping", icon: Truck, roles: ["VENDOR"] },
  { title: "Analytics", href: "/vendor/analytics", icon: BarChart3, roles: ["VENDOR"] },
  { title: "Orders", href: "/vendor/orders", icon: ShoppingBag, roles: ["VENDOR"] },
  { title: "Payouts", href: "/vendor/payouts", icon: DollarSign, roles: ["VENDOR"] },

  // Customer navigation
  { title: "Shop", href: "/customer", icon: ShoppingBag, roles: ["CUSTOMER"] },
  { title: "Cart", href: "/shop/cart", icon: ShoppingCart, roles: ["CUSTOMER"] },
  { title: "Orders", href: "/shop/orders", icon: Package, roles: ["CUSTOMER"] },

  // Finance Analyst navigation - Exact same as Admin finance features
  { title: "Dashboard", href: "/finance", icon: LayoutDashboard, roles: ["FINANCE_ANALYST"] },
  { title: "Payout Management", href: "/finance/payouts", icon: CreditCard, roles: ["FINANCE_ANALYST"] },
  { title: "Commission Management", href: "/finance/commissions", icon: DollarSign, roles: ["FINANCE_ANALYST"] },
  { title: "Transactions & Payouts", href: "/finance/transactions", icon: FileText, roles: ["FINANCE_ANALYST"] },

  // Operations Manager navigation
  { title: "Dashboard", href: "/operations", icon: LayoutDashboard, roles: ["OPERATIONS_MANAGER"] },
  { title: "Logistics Config", href: "/operations/logistics", icon: MapPin, roles: ["OPERATIONS_MANAGER"] },
  { title: "Shipment Monitoring", href: "/operations/shipments", icon: Truck, roles: ["OPERATIONS_MANAGER"] },
  { title: "Performance Reports", href: "/operations/performance", icon: FileText, roles: ["OPERATIONS_MANAGER"] },
]

// Mobile Sidebar Content Component
function SidebarContent({ onLinkClick }: { onLinkClick?: () => void }) {
  const { user } = useAuth()
  const pathname = usePathname()

  if (!user) return null

  const userNavItems = navigationItems.filter((item) => item.roles.includes(user.role as any))

  return (
    <>
      <div className="p-6 border-b border-sidebar-border">
        <Link href="/" className="flex items-center" onClick={onLinkClick}>
          <span className="text-title text-lg text-sidebar-foreground font-bold tracking-tight font-brand">TrinityCore</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {userNavItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onLinkClick}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors min-h-[44px]", // Increased touch target
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className="truncate">{item.title}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <Link
          href="/settings"
          onClick={onLinkClick}
          className="flex items-center gap-3 px-3 py-3 rounded-lg text-caption text-sm text-caption text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors min-h-[44px]"
        >
          <Settings className="h-5 w-5 flex-shrink-0" />
          <span className="truncate">Settings</span>
        </Link>
      </div>
    </>
  )
}

export function Sidebar() {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="h-10 w-10">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <SidebarContent onLinkClick={() => {
            // Close sheet when link is clicked
            const sheetTrigger = document.querySelector('[data-state="open"]')
            if (sheetTrigger) {
              (sheetTrigger as HTMLElement).click()
            }
          }} />
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      <SidebarContent />
    </aside>
  )
}
