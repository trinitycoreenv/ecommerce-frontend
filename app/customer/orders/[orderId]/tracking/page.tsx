'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { 
  Package, 
  Truck, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ArrowLeft,
  ExternalLink,
  RefreshCw
} from 'lucide-react'
import { format } from 'date-fns'

interface TrackingEvent {
  timestamp: Date
  status: string
  location?: string
  description: string
}

interface ShipmentInfo {
  id: string
  orderId: string
  orderNumber: string
  carrier: string
  trackingNumber: string
  status: string
  estimatedDelivery?: Date
  actualDelivery?: Date
  shippingCost: number
  createdAt: Date
  trackingEvents: TrackingEvent[]
}

export default function CustomerTrackingPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [shipment, setShipment] = useState<ShipmentInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchTrackingInfo = async () => {
    try {
      setRefreshing(true)
      const token = localStorage.getItem('auth_token')

      const response = await fetch(`/api/customer/orders/${params.orderId}/tracking`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()

      if (data.success) {
        setShipment(data.data)
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to load tracking information',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error fetching tracking info:', error)
      toast({
        title: 'Error',
        description: 'Failed to load tracking information',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchTrackingInfo()
  }, [params.orderId])

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case 'DELIVERED':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'IN_TRANSIT':
        return <Truck className="h-5 w-5 text-blue-500" />
      case 'EXCEPTION':
      case 'FAILED_DELIVERY':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Package className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'DELIVERED':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'IN_TRANSIT':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'EXCEPTION':
      case 'FAILED_DELIVERY':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getCarrierTrackingUrl = (carrier: string, trackingNumber: string) => {
    const baseUrls: Record<string, string> = {
      'UPS': 'https://www.ups.com/track?track=yes&trackNums=',
      'FedEx': 'https://www.fedex.com/fedextrack/?trknbr=',
      'USPS': 'https://tools.usps.com/go/TrackConfirmAction?qtc_tLabels1=',
      'DHL': 'https://www.dhl.com/en/express/tracking.html?AWB='
    }
    
    const baseUrl = baseUrls[carrier] || `https://www.google.com/search?q=track+${carrier}+`
    return `${baseUrl}${trackingNumber}`
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!shipment) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Tracking Information Not Available</h3>
            <p className="text-muted-foreground mb-4">
              We couldn't find tracking information for this order.
            </p>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" onClick={() => router.back()} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
          <h1 className="text-3xl font-bold">Track Your Package</h1>
          <p className="text-muted-foreground">Order #{shipment.orderNumber}</p>
        </div>
        <Button onClick={fetchTrackingInfo} disabled={refreshing} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Shipment Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(shipment.status)}
              <div>
                <CardTitle>Shipment Status</CardTitle>
                <CardDescription>
                  Tracking Number: <span className="font-mono font-semibold">{shipment.trackingNumber}</span>
                </CardDescription>
              </div>
            </div>
            <Badge className={getStatusColor(shipment.status)}>
              {shipment.status.replace('_', ' ')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <Truck className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Carrier</p>
                <p className="font-semibold">{shipment.carrier}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Estimated Delivery</p>
                <p className="font-semibold">
                  {shipment.estimatedDelivery 
                    ? format(new Date(shipment.estimatedDelivery), 'MMM dd, yyyy')
                    : 'Not available'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Shipping Cost</p>
                <p className="font-semibold">${shipment.shippingCost.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex gap-2">
            <Button 
              onClick={() => window.open(getCarrierTrackingUrl(shipment.carrier, shipment.trackingNumber), '_blank')}
              className="flex-1"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Track on {shipment.carrier} Website
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tracking Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Tracking History</CardTitle>
          <CardDescription>Detailed tracking events for your package</CardDescription>
        </CardHeader>
        <CardContent>
          {shipment.trackingEvents && shipment.trackingEvents.length > 0 ? (
            <div className="space-y-4">
              {shipment.trackingEvents.map((event, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${
                      index === 0 ? 'bg-primary' : 'bg-muted-foreground'
                    }`} />
                    {index < shipment.trackingEvents.length - 1 && (
                      <div className="w-0.5 h-full bg-muted-foreground/30 my-1" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{event.status}</p>
                        <p className="text-sm text-muted-foreground">{event.description}</p>
                        {event.location && (
                          <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {event.location}
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-nowrap">
                        {format(new Date(event.timestamp), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No tracking events available yet</p>
              <p className="text-sm">Check back later for updates</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

