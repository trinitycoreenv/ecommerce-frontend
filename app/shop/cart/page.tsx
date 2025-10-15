"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Trash2, Plus, Minus, ShoppingBag, Loader2 } from "lucide-react"
import Link from "next/link"
import { useCart } from "@/lib/cart-context"
import { EmptyState } from "@/components/shared/empty-state"
import { Badge } from "@/components/ui/badge"

export default function CartPage() {
  const { items: cartItems, updateQuantity, removeItem, isLoading } = useCart()

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shipping = subtotal > 5000 ? 0 : 200
  const tax = subtotal * 0.08
  const total = subtotal + shipping + tax

  if (cartItems.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shopping Cart</h1>
          <p className="text-muted-foreground mt-2">Your cart is currently empty</p>
        </div>
        <EmptyState
          icon={<ShoppingBag className="h-16 w-16" />}
          title="Your cart is empty"
          description="Add some products to your cart to get started"
          action={{
            label: "Continue Shopping",
            onClick: () => (window.location.href = "/shop"),
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Shopping Cart</h1>
        <p className="text-muted-foreground mt-2">{cartItems.length} items in your cart</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div className="h-24 w-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <img
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">{item.vendor}</p>
                        {item.variant && (
                          <div className="mt-1">
                            <Badge variant="outline" className="text-xs">
                              {item.variant.name}
                            </Badge>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="text-destructive hover:text-destructive"
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={isLoading}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-12 text-center font-medium">{item.quantity}</span>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={isLoading || item.quantity >= item.maxQuantity}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-lg font-bold">₱{(item.price * item.quantity).toLocaleString('en-PH')}</p>
                    </div>
                    {item.quantity >= item.maxQuantity && (
                      <p className="text-xs text-muted-foreground">
                        Maximum quantity reached
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">₱{subtotal.toLocaleString('en-PH')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium">{shipping === 0 ? "Free" : `₱${shipping.toLocaleString('en-PH')}`}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax (8%)</span>
                  <span className="font-medium">₱{tax.toLocaleString('en-PH')}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="text-2xl font-bold">₱{total.toLocaleString('en-PH')}</span>
                </div>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-muted-foreground">
                  Add ₱{(5000 - subtotal).toLocaleString('en-PH')} more for free shipping
                </p>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button size="lg" className="w-full" asChild>
                <Link href="/shop/checkout">Proceed to Checkout</Link>
              </Button>
              <Button variant="outline" size="lg" className="w-full bg-transparent" asChild>
                <Link href="/shop">Continue Shopping</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
