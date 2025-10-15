"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { useTheme } from "@/lib/theme-provider"
import { Moon, Sun, Menu, X, Home, ShoppingBag, Store, Info, Mail, User, LogIn } from "lucide-react"
import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"

export function PublicHeader() {
  const { theme, toggleTheme } = useTheme()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()

  const navigationItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Shop", href: "/shop", icon: ShoppingBag },
    { name: "Sell", href: "/sell", icon: Store },
    { name: "About", href: "/about", icon: Info },
    { name: "Contact", href: "/contact", icon: Mail },
  ]

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/"
    }
    return pathname.startsWith(href)
  }

  const handleShopClick = (e: React.MouseEvent) => {
    if (user && user.role === "CUSTOMER") {
      e.preventDefault()
      router.push("/customer")
    }
  }

  // Mobile Sidebar Content Component
  function MobileSidebarContent({ onLinkClick }: { onLinkClick?: () => void }) {
    return (
      <>
        <div className="p-6 border-b border-sidebar-border">
          <Link href="/" className="flex items-center" onClick={onLinkClick}>
            <span className="text-title text-lg text-sidebar-foreground font-bold tracking-tight font-brand">TrinityCore</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => {
                  if (item.name === "Shop") {
                    handleShopClick(e)
                  }
                  onLinkClick?.()
                }}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors min-h-[44px]",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="truncate">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border space-y-2">
          <Link
            href="/login"
            onClick={onLinkClick}
            className="flex items-center gap-3 px-3 py-3 rounded-lg text-caption text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors min-h-[44px]"
          >
            <LogIn className="h-5 w-5 flex-shrink-0" />
            <span className="truncate">Login</span>
          </Link>
          <Link
            href="/register/vendor"
            onClick={onLinkClick}
            className="flex items-center gap-3 px-3 py-3 rounded-lg text-caption text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors min-h-[44px]"
          >
            <Store className="h-5 w-5 flex-shrink-0" />
            <span className="truncate">Start Selling</span>
          </Link>
        </div>
      </>
    )
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo - Left Side */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-title text-lg md:text-xl font-bold tracking-tight font-brand">TrinityCore</span>
            </Link>
          </div>

          {/* Desktop Navigation - Hidden on mobile */}
          <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={item.name === "Shop" ? handleShopClick : undefined}
                className={cn(
                  "text-body text-sm font-medium transition-colors hover:text-primary",
                  isActive(item.href)
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions - Hidden on mobile */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === "light" ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/register/vendor">Start Selling</Link>
            </Button>
          </div>

          {/* Mobile Actions - Right Side */}
          <div className="flex md:hidden items-center space-x-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-10 w-10">
              {theme === "light" ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </Button>
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10">
                  <Menu className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0 bg-sidebar">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <MobileSidebarContent onLinkClick={() => setIsMenuOpen(false)} />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
