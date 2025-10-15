"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { CreditCard, Truck, MapPin, Loader2, CheckCircle, AlertCircle, Lock } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useCart } from "@/lib/cart-context"
import { useAuth } from "@/lib/auth-context"
import { StripePaymentForm } from "@/components/shared/stripe-payment-form"

export default function CheckoutPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { items: cartItems, getTotalPrice, clearCart } = useCart()
  const { user } = useAuth()
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [shippingMethod, setShippingMethod] = useState("standard")
  const [selectedCarrier, setSelectedCarrier] = useState("lbc")
  const [sameAsBilling, setSameAsBilling] = useState(true)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  
  // Form state
  const [shippingAddress, setShippingAddress] = useState({
    firstName: "",
    lastName: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "Philippines"
  })
  
  const [billingAddress, setBillingAddress] = useState({
    firstName: "",
    lastName: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "Philippines"
  })
  
  const [paymentMethod, setPaymentMethod] = useState({
    type: "card" as "card" | "paypal",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    nameOnCard: ""
  })

  // Redirect if not logged in or cart is empty
  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }
    
    if (cartItems.length === 0) {
      router.push("/shop")
      return
    }
  }, [user, cartItems, router])

  // Philippine carriers data
  const carriers = {
    lbc: {
      name: "LBC Express",
      logo: "🚚",
      standard: { cost: 0, days: "2-3", description: "Standard delivery" },
      express: { cost: 500, days: "1-2", description: "Express delivery" },
      economy: { cost: 0, days: "4-5", description: "Economy delivery" }
    },
    jnt: {
      name: "J&T Express",
      logo: "📦",
      standard: { cost: 0, days: "2-3", description: "Standard delivery" },
      express: { cost: 450, days: "1-2", description: "Express delivery" },
      economy: { cost: 0, days: "4-5", description: "Economy delivery" }
    },
    grab: {
      name: "Grab Express",
      logo: "🏍️",
      standard: { cost: 300, days: "1-2", description: "Same day delivery" },
      express: { cost: 500, days: "1", description: "Express delivery" },
      economy: { cost: 200, days: "2-3", description: "Standard delivery" }
    },
    gogo: {
      name: "2GO Express",
      logo: "🚢",
      standard: { cost: 0, days: "3-4", description: "Standard delivery" },
      express: { cost: 400, days: "2-3", description: "Express delivery" },
      economy: { cost: 0, days: "5-7", description: "Economy delivery" }
    }
  }

  const subtotal = getTotalPrice()
  const selectedCarrierData = carriers[selectedCarrier as keyof typeof carriers]
  const shippingMethodData = selectedCarrierData[shippingMethod as keyof typeof selectedCarrierData] as { cost: number; days: string; description: string }
  const shippingCost = shippingMethodData.cost
  const tax = subtotal * 0.08
  const total = subtotal + shippingCost + tax

  const handleCreateOrder = async () => {
    if (!user) return

    // Validate form
    if (!shippingAddress.firstName || !shippingAddress.lastName || !shippingAddress.street || 
        !shippingAddress.city || !shippingAddress.state || !shippingAddress.zipCode) {
      toast({
        title: "Missing information",
        description: "Please fill in all required shipping address fields.",
        variant: "destructive"
      })
      return
    }

    if (!sameAsBilling && (!billingAddress.firstName || !billingAddress.lastName || !billingAddress.street || 
        !billingAddress.city || !billingAddress.state || !billingAddress.zipCode)) {
      toast({
        title: "Missing information",
        description: "Please fill in all required billing address fields.",
        variant: "destructive"
      })
      return
    }

    try {
      setIsProcessing(true)

      // Prepare order data
      const orderData = {
        items: cartItems.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          price: item.price
        })),
        shippingAddress: {
          firstName: shippingAddress.firstName,
          lastName: shippingAddress.lastName,
          street: shippingAddress.street,
          city: shippingAddress.city,
          state: shippingAddress.state,
          zipCode: shippingAddress.zipCode,
          country: shippingAddress.country
        },
        billingAddress: sameAsBilling ? undefined : {
          firstName: billingAddress.firstName,
          lastName: billingAddress.lastName,
          street: billingAddress.street,
          city: billingAddress.city,
          state: billingAddress.state,
          zipCode: billingAddress.zipCode,
          country: billingAddress.country
        },
        shippingMethod: {
          type: shippingMethod,
          cost: shippingCost,
          estimatedDays: shippingMethod === "express" ? 2 : shippingMethod === "standard" ? 5 : 7
        },
        paymentMethod: {
          type: "stripe",
          status: "pending"
        }
      }

      // Create order
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      })

      const result = await response.json()

      if (result.success) {
        setOrderId(result.data.orders[0]?.id)
        toast({
          title: "Order created!",
          description: "Please complete your payment to confirm your order.",
        })
      } else {
        throw new Error(result.error || 'Failed to create order')
      }
    } catch (error) {
      console.error('Failed to create order:', error)
      toast({
        title: "Order creation failed",
        description: error instanceof Error ? error.message : "Failed to create order. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      if (!orderId) {
        throw new Error('Order ID not found')
      }

      // Confirm payment with backend
      const token = localStorage.getItem('auth_token')
      const confirmResponse = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          orderId,
          paymentIntentId
        })
      })

      const confirmResult = await confirmResponse.json()

      if (!confirmResult.success) {
        throw new Error(confirmResult.error || 'Failed to confirm payment')
      }

      // Clear cart
      await clearCart()
      
      toast({
        title: "Payment successful!",
        description: "Your order has been confirmed and payment processed.",
      })
      
      setPaymentSuccess(true)
      
      // Redirect to orders page after a delay
      setTimeout(() => {
        router.push("/shop/orders")
      }, 3000)
    } catch (error) {
      console.error('Error after payment success:', error)
      toast({
        title: "Payment confirmation failed",
        description: error instanceof Error ? error.message : "Failed to confirm payment. Please contact support.",
        variant: "destructive"
      })
    }
  }

  const handlePaymentError = (error: string) => {
    toast({
      title: "Payment failed",
      description: error,
      variant: "destructive"
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
        <p className="text-muted-foreground mt-2">Complete your purchase</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Checkout Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <CardTitle>Shipping Address</CardTitle>
              </div>
              <CardDescription>Enter your delivery address</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input 
                    id="firstName" 
                    placeholder="John" 
                    value={shippingAddress.firstName}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, firstName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input 
                    id="lastName" 
                    placeholder="Doe" 
                    value={shippingAddress.lastName}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, lastName: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Street Address *</Label>
                <Input 
                  id="address" 
                  placeholder="123 Main St" 
                  value={shippingAddress.street}
                  onChange={(e) => setShippingAddress(prev => ({ ...prev, street: e.target.value }))}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input 
                    id="city" 
                    placeholder="Quezon City" 
                    value={shippingAddress.city}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, city: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Select value={shippingAddress.state} onValueChange={(value) => setShippingAddress(prev => ({ ...prev, state: value }))}>
                    <SelectTrigger id="state">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NCR">Metro Manila</SelectItem>
                      <SelectItem value="CALABARZON">CALABARZON</SelectItem>
                      <SelectItem value="Central Luzon">Central Luzon</SelectItem>
                      <SelectItem value="Cebu">Cebu</SelectItem>
                      <SelectItem value="Davao">Davao del Sur</SelectItem>
                      <SelectItem value="Iloilo">Iloilo</SelectItem>
                      <SelectItem value="Cagayan de Oro">Misamis Oriental</SelectItem>
                      <SelectItem value="Bicol">Bicol Region</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP Code *</Label>
                  <Input 
                    id="zip" 
                    placeholder="10001" 
                    value={shippingAddress.zipCode}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, zipCode: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Carrier Selection */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                <CardTitle>Choose Your Carrier</CardTitle>
              </div>
              <CardDescription>Select your preferred delivery service</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Carrier Selection */}
              <RadioGroup value={selectedCarrier} onValueChange={setSelectedCarrier}>
                <div className="grid gap-3">
                  {Object.entries(carriers).map(([key, carrier]) => (
                    <div
                      key={key}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedCarrier === key ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedCarrier(key)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <RadioGroupItem 
                            value={key} 
                            id={key}
                          />
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{carrier.logo}</span>
                            <div>
                              <div className="font-medium">{carrier.name}</div>
                              <div className="text-sm text-muted-foreground">Available nationwide</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </RadioGroup>

              {/* Shipping Method Selection */}
              {selectedCarrier && (
                <div className="mt-6">
                  <h4 className="font-medium mb-3">Delivery Speed</h4>
                  <RadioGroup value={shippingMethod} onValueChange={setShippingMethod}>
                    {Object.entries(selectedCarrierData).map(([method, details]) => {
                      if (method === 'name' || method === 'logo') return null
                      const methodDetails = details as { cost: number; days: string; description: string }
                      return (
                        <div key={method} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <RadioGroupItem value={method} id={method} />
                            <Label htmlFor={method} className="cursor-pointer">
                              <div className="font-medium capitalize">{method} Delivery</div>
                              <div className="text-sm text-muted-foreground">
                                {methodDetails.days} business days • {methodDetails.description}
                              </div>
                            </Label>
                          </div>
                          <span className="font-semibold">
                            {methodDetails.cost === 0 ? "Free" : `₱${methodDetails.cost.toLocaleString('en-PH')}`}
                          </span>
                        </div>
                      )
                    })}
                  </RadioGroup>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Billing Address */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <CardTitle>Billing Address</CardTitle>
              </div>
              <CardDescription>Enter your billing information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="sameAsBilling" 
                  checked={sameAsBilling}
                  onCheckedChange={(checked) => setSameAsBilling(checked as boolean)}
                />
                <Label htmlFor="sameAsBilling">Same as shipping address</Label>
              </div>
              
              {!sameAsBilling && (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="billingFirstName">First Name *</Label>
                      <Input 
                        id="billingFirstName" 
                        placeholder="John" 
                        value={billingAddress.firstName}
                        onChange={(e) => setBillingAddress(prev => ({ ...prev, firstName: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="billingLastName">Last Name *</Label>
                      <Input 
                        id="billingLastName" 
                        placeholder="Doe" 
                        value={billingAddress.lastName}
                        onChange={(e) => setBillingAddress(prev => ({ ...prev, lastName: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billingAddress">Street Address *</Label>
                    <Input 
                      id="billingAddress" 
                      placeholder="123 Main St" 
                      value={billingAddress.street}
                      onChange={(e) => setBillingAddress(prev => ({ ...prev, street: e.target.value }))}
                    />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="billingCity">City *</Label>
                      <Input 
                        id="billingCity" 
                        placeholder="Quezon City" 
                        value={billingAddress.city}
                        onChange={(e) => setBillingAddress(prev => ({ ...prev, city: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="billingState">State *</Label>
                      <Select value={billingAddress.state} onValueChange={(value) => setBillingAddress(prev => ({ ...prev, state: value }))}>
                        <SelectTrigger id="billingState">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NCR">Metro Manila</SelectItem>
                          <SelectItem value="CALABARZON">CALABARZON</SelectItem>
                          <SelectItem value="Central Luzon">Central Luzon</SelectItem>
                          <SelectItem value="Cebu">Cebu</SelectItem>
                          <SelectItem value="Davao">Davao del Sur</SelectItem>
                          <SelectItem value="Iloilo">Iloilo</SelectItem>
                          <SelectItem value="Cagayan de Oro">Misamis Oriental</SelectItem>
                          <SelectItem value="Bicol">Bicol Region</SelectItem>
                        </SelectContent>
                      </Select>
                </div>
                <div className="space-y-2">
                      <Label htmlFor="billingZip">ZIP Code *</Label>
                      <Input 
                        id="billingZip" 
                        placeholder="10001" 
                        value={billingAddress.zipCode}
                        onChange={(e) => setBillingAddress(prev => ({ ...prev, zipCode: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Method */}
          {!orderId ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Ready to Pay
                </CardTitle>
                <CardDescription>
                  Review your order details and proceed to payment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">Total Amount</span>
                    <span className="text-2xl font-bold">₱{total.toLocaleString('en-PH')}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Lock className="h-4 w-4" />
                    <span>Your payment information is secure and encrypted with Stripe</span>
                  </div>

                  <Button
                    onClick={handleCreateOrder}
                    disabled={isProcessing}
                    className="w-full"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Order...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Proceed to Payment
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <StripePaymentForm
              orderId={orderId}
              amount={total}
              currency="php"
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
              disabled={paymentSuccess}
            />
          )}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg overflow-hidden bg-muted">
                      <img 
                        src={item.image || "/placeholder.svg"} 
                        alt={item.name} 
                        className="h-full w-full object-cover" 
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.name}</h4>
                      <p className="text-xs text-muted-foreground">{item.vendor}</p>
                      {item.variant && (
                        <p className="text-xs text-muted-foreground">{item.variant.name}</p>
                      )}
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium text-sm">₱{(item.price * item.quantity).toLocaleString('en-PH')}</p>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">₱{subtotal.toLocaleString('en-PH')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping ({selectedCarrierData.name})</span>
                  <span className="font-medium">{shippingCost === 0 ? "Free" : `₱${shippingCost.toLocaleString('en-PH')}`}</span>
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
              
              {/* Carrier Information */}
              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-2xl">{selectedCarrierData.logo}</span>
                  <div>
                    <div className="font-medium">{selectedCarrierData.name}</div>
                    <div className="text-muted-foreground">
                      {shippingMethodData.days} business days
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardContent>
              <div className="text-center text-sm text-muted-foreground">
                <p>Complete your payment above to place your order</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
