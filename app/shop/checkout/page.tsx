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
import { CreditCard, Truck, MapPin, Loader2, CheckCircle, AlertCircle, Lock, Package, Plane, Box } from "lucide-react"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
  const [selectedRate, setSelectedRate] = useState<any>(null)
  const [shippingRates, setShippingRates] = useState<Array<{
    service: string
    carrier: string
    cost: number
    currency: string
    estimatedDays: number
    description?: string
  }>>([])
  const [selectedCarrierData, setSelectedCarrierData] = useState<{
    name: string
    logo: string
  }>({ name: '', logo: '🚚' })
  const [shippingMethodData, setShippingMethodData] = useState<{
    days: number
  }>({ days: 0 })
  const [sameAsBilling, setSameAsBilling] = useState(true)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [isLoadingRates, setIsLoadingRates] = useState(false)
  
  // Form state
  const [shippingAddress, setShippingAddress] = useState({
    firstName: "",
    lastName: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "US"
  })

  const [billingAddress, setBillingAddress] = useState({
    firstName: "",
    lastName: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "US"
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

  // Modern icons for shipping carriers
  const carrierIcons: { [key: string]: React.ReactNode } = {
    'USPS': <Package className="h-6 w-6 text-primary" />, // Lucide Package
    'UPS': <Box className="h-6 w-6 text-yellow-700" />,   // Lucide Box
    'FEDEX': <Box className="h-6 w-6 text-purple-700" />, // Lucide Box (custom color)
    'DHL': <Plane className="h-6 w-6 text-blue-700" />,   // Lucide Plane
    'DEFAULT': <Truck className="h-6 w-6 text-primary" />  // Lucide Truck
  }

  // Calculate totals
  const subtotal = getTotalPrice()
  const shippingCost = selectedRate?.cost || 0
  const tax = subtotal * 0.08
  const total = subtotal + shippingCost + tax

  // Fetch shipping rates when address is complete
  useEffect(() => {
    const fetchShippingRates = async () => {
      if (!shippingAddress.street || !shippingAddress.city ||
          !shippingAddress.state || !shippingAddress.zipCode || !shippingAddress.country) {
        setShippingRates([])
        setSelectedRate(null)
        return
      }

      setIsLoadingRates(true)
      try {
        // Convert country name to ISO code if needed
        const getCountryCode = (country: string) => {
          const countryMap: { [key: string]: string } = {
            'United States': 'US',
            'Philippines': 'PH',
            'Canada': 'CA',
            'Mexico': 'MX',
            'United Kingdom': 'GB',
            'Germany': 'DE',
            'France': 'FR'
          }
          return countryMap[country] || country
        }

        const response = await fetch('/api/shipping/rates', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          },
          body: JSON.stringify({
            fromAddress: {
              name: 'E-commerce Warehouse',
              company: 'E-commerce Platform',
              street1: '215 Clayton St',
              city: 'San Francisco',
              state: 'CA',
              zip: '94117',
              country: 'US'
            },
            toAddress: {
              name: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
              street1: shippingAddress.street,
              city: shippingAddress.city,
              state: shippingAddress.state,
              zip: shippingAddress.zipCode,
              country: getCountryCode(shippingAddress.country)
            },
            packageInfo: {
              length: 10,
              width: 10,
              height: 5,
              weight: cartItems.reduce((total, item) => total + (0.5 * item.quantity), 0),
              unit: 'in'
            }
          })
        })

        const data = await response.json()
        if (data.success && data.data.rates && data.data.rates.length > 0) {
          setShippingRates(data.data.rates)
          // Select the cheapest rate by default
          setSelectedRate(data.data.cheapestRate || data.data.rates[0])
        } else {
          setShippingRates([])
          setSelectedRate(null)
          toast({
            title: "No shipping options available",
            description: data.error || "No carriers available for this destination. Please check your address.",
            variant: "destructive"
          })
        }
      } catch (error) {
        console.error('Error fetching shipping rates:', error)
        setShippingRates([])
        setSelectedRate(null)
        toast({
          title: "Error",
          description: "Failed to fetch shipping rates. Please try again.",
          variant: "destructive"
        })
      } finally {
        setIsLoadingRates(false)
      }
    }

    fetchShippingRates()
  }, [shippingAddress, cartItems, toast])

  const handleCreateOrder = async () => {
    if (!user) return

    // Validate form
    if (!shippingAddress.firstName || !shippingAddress.lastName || !shippingAddress.street ||
        !shippingAddress.city || !shippingAddress.state || !shippingAddress.zipCode || !shippingAddress.country) {
      toast({
        title: "Missing information",
        description: "Please fill in all required shipping address fields.",
        variant: "destructive"
      })
      return
    }

    if (!sameAsBilling && (!billingAddress.firstName || !billingAddress.lastName || !billingAddress.street ||
        !billingAddress.city || !billingAddress.state || !billingAddress.zipCode || !billingAddress.country)) {
      toast({
        title: "Missing information",
        description: "Please fill in all required billing address fields.",
        variant: "destructive"
      })
      return
    }

    if (!selectedRate) {
      toast({
        title: "Missing shipping method",
        description: "Please select a shipping method before proceeding.",
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
          carrier: selectedRate.carrier,
          service: selectedRate.service,
          cost: selectedRate.cost,
          currency: selectedRate.currency,
          estimatedDays: selectedRate.estimatedDays
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
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    placeholder="San Francisco"
                    value={shippingAddress.city}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, city: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State/Province *</Label>
                  <Input
                    id="state"
                    placeholder="CA"
                    value={shippingAddress.state}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, state: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP/Postal Code *</Label>
                  <Input
                    id="zip"
                    placeholder="94117"
                    value={shippingAddress.zipCode}
                    onChange={(e) => setShippingAddress(prev => ({ ...prev, zipCode: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country *</Label>
                  <Select value={shippingAddress.country} onValueChange={(value) => setShippingAddress(prev => ({ ...prev, country: value }))}>
                    <SelectTrigger id="country">
                      <SelectValue placeholder="Select Country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="CA">Canada</SelectItem>
                      <SelectItem value="MX">Mexico</SelectItem>
                      <SelectItem value="GB">United Kingdom</SelectItem>
                      <SelectItem value="DE">Germany</SelectItem>
                      <SelectItem value="FR">France</SelectItem>
                      <SelectItem value="PH">Philippines</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Options */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                <CardTitle>Shipping Options</CardTitle>
              </div>
              <CardDescription>Select your preferred shipping method</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingRates ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Loading shipping rates...</span>
                </div>
              ) : shippingRates.length > 0 ? (
                <RadioGroup 
                  value={selectedRate ? `${selectedRate.carrier}-${selectedRate.service}` : ''} 
                  onValueChange={(value) => {
                    const [carrier, service] = value.split('-');
                    const rate = shippingRates.find(r => r.carrier === carrier && r.service === service);
                    setSelectedRate(rate);
                  }}
                >
                  <div className="grid gap-3">
                    {shippingRates.map((rate) => (
                      <div
                        key={`${rate.carrier}-${rate.service}`}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedRate?.carrier === rate.carrier && selectedRate?.service === rate.service
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <RadioGroupItem 
                              value={`${rate.carrier}-${rate.service}`} 
                              id={`${rate.carrier}-${rate.service}`}
                            />
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">
                                {carrierIcons[rate.carrier.toUpperCase()] || carrierIcons.DEFAULT}
                              </span>
                              <div>
                                <div className="font-medium">{rate.carrier} - {rate.service}</div>
                                <div className="text-sm text-muted-foreground">
                                  {(rate.estimatedDays && rate.estimatedDays > 0)
                                    ? `${rate.estimatedDays} business day${rate.estimatedDays > 1 ? 's' : ''}`
                                    : '2-5 business days'}
                                  {` • ${rate.description || 'Standard delivery'}`}
                                </div>
                              </div>
                            </div>
                          </div>
                          <span className="font-semibold">
                            ${rate.cost.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              ) : (
                <div className="text-center p-8 border border-dashed rounded-lg">
                  <div className="text-muted-foreground">
                    No shipping rates available. Please check your shipping address.
                  </div>
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
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="billingCity">City *</Label>
                      <Input
                        id="billingCity"
                        placeholder="San Francisco"
                        value={billingAddress.city}
                        onChange={(e) => setBillingAddress(prev => ({ ...prev, city: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="billingState">State/Province *</Label>
                      <Input
                        id="billingState"
                        placeholder="CA"
                        value={billingAddress.state}
                        onChange={(e) => setBillingAddress(prev => ({ ...prev, state: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="billingZip">ZIP/Postal Code *</Label>
                      <Input
                        id="billingZip"
                        placeholder="94117"
                        value={billingAddress.zipCode}
                        onChange={(e) => setBillingAddress(prev => ({ ...prev, zipCode: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="billingCountry">Country *</Label>
                      <Select value={billingAddress.country} onValueChange={(value) => setBillingAddress(prev => ({ ...prev, country: value }))}>
                        <SelectTrigger id="billingCountry">
                          <SelectValue placeholder="Select Country" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="US">United States</SelectItem>
                          <SelectItem value="CA">Canada</SelectItem>
                          <SelectItem value="MX">Mexico</SelectItem>
                          <SelectItem value="GB">United Kingdom</SelectItem>
                          <SelectItem value="DE">Germany</SelectItem>
                          <SelectItem value="FR">France</SelectItem>
                          <SelectItem value="PH">Philippines</SelectItem>
                        </SelectContent>
                      </Select>
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
                    <span className="text-2xl font-bold">${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
              currency="usd"
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
                    <p className="font-medium text-sm">${(item.price * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping ({selectedCarrierData.name})</span>
                  <span className="font-medium">{shippingCost === 0 ? "Free" : `$${shippingCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax (8%)</span>
                  <span className="font-medium">${tax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="text-2xl font-bold">${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
              
              {/* Carrier Information */}
              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-2xl">
                    {carrierIcons[selectedRate?.carrier?.toUpperCase?.()] || carrierIcons.DEFAULT}
                  </span>
                  <div>
                    <div className="font-medium">{selectedCarrierData.name}</div>
                    <div className="text-muted-foreground">
                      {(selectedRate?.estimatedDays && selectedRate.estimatedDays > 0)
                        ? `${selectedRate.estimatedDays} business day${selectedRate.estimatedDays > 1 ? 's' : ''}`
                        : '2-5 business days'}
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
