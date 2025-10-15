"use client"
import { useAuth } from "@/lib/auth-context"
import { useCart } from "@/lib/cart-context"
import { useTheme } from "@/lib/theme-provider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Bell, Moon, Sun, LogOut, User, ShoppingCart, Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useIsMobile } from "@/hooks/use-mobile"
import { Sidebar } from "./sidebar"
import Link from "next/link"

export function Topbar() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { getTotalItems } = useCart()
  const router = useRouter()
  const isMobile = useIsMobile()

  if (!user) return null

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const roleLabels: Record<string, string> = {
    ADMIN: "Administrator",
    VENDOR: "Vendor",
    CUSTOMER: "Customer",
    FINANCE_ANALYST: "Finance Analyst",
    OPERATIONS_MANAGER: "Operations Manager",
  }

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 md:px-6">
      {/* Left side - Mobile menu button and title */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* Mobile menu button */}
        <div className="md:hidden">
          <Sidebar />
        </div>
        
        {/* Title - responsive text sizing */}
        <div className="flex items-center gap-2 md:gap-4">
          <h2 className="text-sm md:text-lg text-heading text-foreground truncate">
            {isMobile ? roleLabels[user.role] : `${roleLabels[user.role]} Dashboard`}
          </h2>
          <Badge variant="secondary" className="capitalize text-xs hidden sm:inline-flex">
            {user.role}
          </Badge>
        </div>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-1 md:gap-2">
        {/* Mobile Search - Only show on mobile */}
        {isMobile && (
          <Button variant="ghost" size="icon" className="h-10 w-10" aria-label="Search">
            <Search className="h-4 w-4" />
          </Button>
        )}

        {/* Cart Icon - Only show for customers */}
        {user.role === 'CUSTOMER' && (
          <Link href="/shop/cart">
            <Button variant="ghost" size="icon" className="relative h-10 w-10" aria-label="Shopping cart">
              <ShoppingCart className="h-4 w-4 md:h-5 md:w-5" />
              {getTotalItems() > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-4 w-4 md:h-5 md:w-5 flex items-center justify-center p-0 text-xs"
                >
                  {getTotalItems()}
                </Badge>
              )}
            </Button>
          </Link>
        )}

        {/* Theme Toggle */}
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-10 w-10" aria-label="Toggle theme">
          {theme === "light" ? <Moon className="h-4 w-4 md:h-5 md:w-5" /> : <Sun className="h-4 w-4 md:h-5 md:w-5" />}
        </Button>

        {/* Notifications - Hidden on mobile to save space */}
        {!isMobile && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-10 w-10" aria-label="Notifications">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="p-4 text-body text-sm text-muted-foreground text-center">No new notifications</div>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 h-10 px-2 md:px-3" aria-label="User menu">
              <Avatar className="h-7 w-7 md:h-8 md:w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs md:text-sm">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="hidden lg:inline-block text-caption text-sm text-caption truncate max-w-24">
                {user.name}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-caption text-sm text-caption">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="min-h-[44px]">
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="min-h-[44px]">
              <Bell className="mr-2 h-4 w-4" />
              Notifications
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive min-h-[44px]">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
