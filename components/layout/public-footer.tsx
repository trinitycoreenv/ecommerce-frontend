"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Facebook, Twitter, Linkedin, Instagram, Mail, Phone, MapPin } from "lucide-react"

export function PublicFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-muted/50 border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center">
              <span className="font-bold text-xl font-brand">TrinityCore</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Connecting customers with trusted vendors worldwide. Built for scale, designed for performance.
            </p>
            <div className="flex space-x-4">
              <Button variant="ghost" size="icon" asChild>
                <Link href="#" aria-label="Facebook">
                  <Facebook className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <Link href="#" aria-label="Twitter">
                  <Twitter className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <Link href="#" aria-label="LinkedIn">
                  <Linkedin className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <Link href="#" aria-label="Instagram">
                  <Instagram className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* For Customers */}
          <div className="space-y-4">
            <h3 className="font-semibold">For Customers</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/shop" className="text-muted-foreground hover:text-primary transition-colors">
                  Shop
                </Link>
              </li>
              <li>
                <Link href="/shop/categories" className="text-muted-foreground hover:text-primary transition-colors">
                  Browse Categories
                </Link>
              </li>
              <li>
                <Link href="/orders" className="text-muted-foreground hover:text-primary transition-colors">
                  Track Orders
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-muted-foreground hover:text-primary transition-colors">
                  Help Center
                </Link>
              </li>
            </ul>
          </div>

          {/* For Vendors */}
          <div className="space-y-4">
            <h3 className="font-semibold">For Vendors</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/sell" className="text-muted-foreground hover:text-primary transition-colors">
                  Start Selling
                </Link>
              </li>
              <li>
                <Link href="/vendor" className="text-muted-foreground hover:text-primary transition-colors">
                  Vendor Dashboard
                </Link>
              </li>
              <li>
                <Link href="/vendor/resources" className="text-muted-foreground hover:text-primary transition-colors">
                  Seller Resources
                </Link>
              </li>
              <li>
                <Link href="/vendor/support" className="text-muted-foreground hover:text-primary transition-colors">
                  Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Legal */}
          <div className="space-y-4">
            <h3 className="font-semibold">Contact & Legal</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>support@ecommerceplatform.com</span>
              </div>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Global Operations</span>
              </div>
            </div>
            <div className="pt-4 space-y-2 text-sm">
              <Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors block">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors block">
                Terms of Service
              </Link>
              <Link href="/cookies" className="text-muted-foreground hover:text-primary transition-colors block">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-border/40 mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {currentYear} TrinityCore. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
