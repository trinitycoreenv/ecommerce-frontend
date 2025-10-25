import { prisma } from '@/lib/prisma'
import { getShippo, toShippoAddress, toShippoParcel, handleShippoRequest } from '@/lib/clients/shippo'
import { ShipmentStatus } from '@prisma/client'

export interface ShippingAddress {
  name: string
  company?: string
  address1: string
  address2?: string
  city: string
  state: string
  zip: string
  country: string
  phone?: string
  email?: string
}

export interface PackageDimensions {
  length: number
  width: number
  height: number
  weight: number
  unit: 'in' | 'cm' | 'lb' | 'kg'
}

export interface ShippingRate {
  service: string
  serviceCode: string
  carrier: string
  cost: number
  currency: string
  estimatedDays: number
  estimatedDelivery?: Date
  description?: string
}

export interface ShippingLabel {
  id: string
  trackingNumber: string
  labelUrl: string
  trackingUrl: string
  cost: number
  currency: string
  service: string
  carrier: string
  status: ShipmentStatus
  createdAt: Date
}

export interface TrackingInfo {
  trackingNumber: string
  status: string
  description: string
  location?: string
  timestamp: Date
  carrier: string
  service: string
}

export interface ShippingProvider {
  name: string
  code: string
  isActive: boolean
  apiKey?: string
  apiSecret?: string
  webhookUrl?: string
  supportedServices: string[]
  supportedCountries: string[]
}

export class ShippingService {
  private static providers: Map<string, ShippingProvider> = new Map([
    ['ups', {
      name: 'UPS',
      code: 'ups',
      isActive: true,
      supportedServices: ['UPS Ground', 'UPS 2nd Day Air', 'UPS Next Day Air'],
      supportedCountries: ['US', 'CA', 'MX']
    }],
    ['fedex', {
      name: 'FedEx',
      code: 'fedex',
      isActive: true,
      supportedServices: ['FedEx Ground', 'FedEx 2Day', 'FedEx Standard Overnight'],
      supportedCountries: ['US', 'CA', 'MX']
    }],
    ['usps', {
      name: 'USPS',
      code: 'usps',
      isActive: true,
      supportedServices: ['USPS Ground Advantage', 'USPS Priority Mail', 'USPS Priority Mail Express'],
      supportedCountries: ['US']
    }],
    ['dhl', {
      name: 'DHL',
      code: 'dhl',
      isActive: false,
      supportedServices: ['DHL Express', 'DHL Ground'],
      supportedCountries: ['US', 'CA', 'MX', 'GB', 'DE', 'FR']
    }]
  ])

  /**
   * Get available shipping providers
   */
  static getProviders(): ShippingProvider[] {
    return Array.from(this.providers.values()).filter(provider => provider.isActive)
  }

  /**
   * Get shipping rates for a package
   */
  static async getShippingRates(
    fromAddress: ShippingAddress,
    toAddress: ShippingAddress,
    packageInfo: PackageDimensions,
    services?: string[]
  ): Promise<ShippingRate[]> {
    // If Shippo is configured, fetch real-time rates via Shippo
    if (process.env.SHIPPO_API_KEY) {
      const shippoRates = await this.getShippoRates(fromAddress, toAddress, packageInfo, services)
      return shippoRates.sort((a, b) => a.cost - b.cost)
    }

    // Fallback to mock provider rates
    const rates: ShippingRate[] = []
    const activeProviders = this.getProviders()

    for (const provider of activeProviders) {
      try {
        const providerRates = await this.getProviderRates(
          provider.code,
          fromAddress,
          toAddress,
          packageInfo,
          services
        )
        rates.push(...providerRates)
      } catch (error) {
        console.error(`Error getting rates from ${provider.name}:`, error)
        // Continue with other providers even if one fails
      }
    }

    // Sort by cost (ascending)
    return rates.sort((a, b) => a.cost - b.cost)
  }

  /**
   * Get rates from a specific provider
   */
  private static async getProviderRates(
    providerCode: string,
    fromAddress: ShippingAddress,
    toAddress: ShippingAddress,
    packageInfo: PackageDimensions,
    services?: string[]
  ): Promise<ShippingRate[]> {
    switch (providerCode) {
      case 'ups':
        return this.getUPSRates(fromAddress, toAddress, packageInfo, services)
      case 'fedex':
        return this.getFedExRates(fromAddress, toAddress, packageInfo, services)
      case 'usps':
        return this.getUSPSRates(fromAddress, toAddress, packageInfo, services)
      case 'dhl':
        return this.getDHLRates(fromAddress, toAddress, packageInfo, services)
      default:
        throw new Error(`Unsupported provider: ${providerCode}`)
    }
  }

  /**
   * UPS Rate Calculation (Mock implementation)
   */
  private static async getUPSRates(
    fromAddress: ShippingAddress,
    toAddress: ShippingAddress,
    packageInfo: PackageDimensions,
    services?: string[]
  ): Promise<ShippingRate[]> {
    // In a real implementation, this would call UPS API
    // For now, we'll return mock rates based on distance and weight
    
    const baseRate = this.calculateBaseRate(fromAddress, toAddress, packageInfo)
    const upsServices = services || ['UPS Ground', 'UPS 2nd Day Air', 'UPS Next Day Air']
    
    return upsServices.map(service => {
      let multiplier = 1
      let estimatedDays = 5
      
      switch (service) {
        case 'UPS Ground':
          multiplier = 1
          estimatedDays = 5
          break
        case 'UPS 2nd Day Air':
          multiplier = 2.5
          estimatedDays = 2
          break
        case 'UPS Next Day Air':
          multiplier = 4
          estimatedDays = 1
          break
      }
      
      const cost = baseRate * multiplier
      const estimatedDelivery = new Date()
      estimatedDelivery.setDate(estimatedDelivery.getDate() + estimatedDays)
      
      return {
        service,
        serviceCode: service.replace(/\s+/g, '_').toUpperCase(),
        carrier: 'UPS',
        cost: Math.round(cost * 100) / 100,
        currency: 'PHP',
        estimatedDays,
        estimatedDelivery,
        description: `${service} - ${estimatedDays} business day${estimatedDays > 1 ? 's' : ''}`
      }
    })
  }

  /**
   * FedEx Rate Calculation (Mock implementation)
   */
  private static async getFedExRates(
    fromAddress: ShippingAddress,
    toAddress: ShippingAddress,
    packageInfo: PackageDimensions,
    services?: string[]
  ): Promise<ShippingRate[]> {
    const baseRate = this.calculateBaseRate(fromAddress, toAddress, packageInfo)
    const fedexServices = services || ['FedEx Ground', 'FedEx 2Day', 'FedEx Standard Overnight']
    
    return fedexServices.map(service => {
      let multiplier = 1
      let estimatedDays = 4
      
      switch (service) {
        case 'FedEx Ground':
          multiplier = 1.1
          estimatedDays = 4
          break
        case 'FedEx 2Day':
          multiplier = 2.8
          estimatedDays = 2
          break
        case 'FedEx Standard Overnight':
          multiplier = 4.2
          estimatedDays = 1
          break
      }
      
      const cost = baseRate * multiplier
      const estimatedDelivery = new Date()
      estimatedDelivery.setDate(estimatedDelivery.getDate() + estimatedDays)
      
      return {
        service,
        serviceCode: service.replace(/\s+/g, '_').toUpperCase(),
        carrier: 'FedEx',
        cost: Math.round(cost * 100) / 100,
        currency: 'PHP',
        estimatedDays,
        estimatedDelivery,
        description: `${service} - ${estimatedDays} business day${estimatedDays > 1 ? 's' : ''}`
      }
    })
  }

  /**
   * USPS Rate Calculation (Mock implementation)
   */
  private static async getUSPSRates(
    fromAddress: ShippingAddress,
    toAddress: ShippingAddress,
    packageInfo: PackageDimensions,
    services?: string[]
  ): Promise<ShippingRate[]> {
    const baseRate = this.calculateBaseRate(fromAddress, toAddress, packageInfo)
    const uspsServices = services || ['USPS Ground Advantage', 'USPS Priority Mail', 'USPS Priority Mail Express']
    
    return uspsServices.map(service => {
      let multiplier = 1
      let estimatedDays = 6
      
      switch (service) {
        case 'USPS Ground Advantage':
          multiplier = 0.8
          estimatedDays = 6
          break
        case 'USPS Priority Mail':
          multiplier = 1.5
          estimatedDays = 3
          break
        case 'USPS Priority Mail Express':
          multiplier = 3.5
          estimatedDays = 1
          break
      }
      
      const cost = baseRate * multiplier
      const estimatedDelivery = new Date()
      estimatedDelivery.setDate(estimatedDelivery.getDate() + estimatedDays)
      
      return {
        service,
        serviceCode: service.replace(/\s+/g, '_').toUpperCase(),
        carrier: 'USPS',
        cost: Math.round(cost * 100) / 100,
        currency: 'PHP',
        estimatedDays,
        estimatedDelivery,
        description: `${service} - ${estimatedDays} business day${estimatedDays > 1 ? 's' : ''}`
      }
    })
  }

  /**
   * DHL Rate Calculation (Mock implementation)
   */
  private static async getDHLRates(
    fromAddress: ShippingAddress,
    toAddress: ShippingAddress,
    packageInfo: PackageDimensions,
    services?: string[]
  ): Promise<ShippingRate[]> {
    const baseRate = this.calculateBaseRate(fromAddress, toAddress, packageInfo)
    const dhlServices = services || ['DHL Express', 'DHL Ground']
    
    return dhlServices.map(service => {
      let multiplier = 1
      let estimatedDays = 3
      
      switch (service) {
        case 'DHL Express':
          multiplier = 3
          estimatedDays = 1
          break
        case 'DHL Ground':
          multiplier = 1.2
          estimatedDays = 3
          break
      }
      
      const cost = baseRate * multiplier
      const estimatedDelivery = new Date()
      estimatedDelivery.setDate(estimatedDelivery.getDate() + estimatedDays)
      
      return {
        service,
        serviceCode: service.replace(/\s+/g, '_').toUpperCase(),
        carrier: 'DHL',
        cost: Math.round(cost * 100) / 100,
        currency: 'PHP',
        estimatedDays,
        estimatedDelivery,
        description: `${service} - ${estimatedDays} business day${estimatedDays > 1 ? 's' : ''}`
      }
    })
  }

  /**
   * Calculate base shipping rate based on distance and package info
   */
  private static calculateBaseRate(
    fromAddress: ShippingAddress,
    toAddress: ShippingAddress,
    packageInfo: PackageDimensions
  ): number {
    // Simple distance calculation (in a real implementation, use proper geocoding)
    const distance = this.calculateDistance(fromAddress, toAddress)
    
    // Base rate calculation
    let baseRate = 5.00 // Base cost
    
    // Add distance-based cost
    baseRate += distance * 0.15
    
    // Add weight-based cost
    const weight = packageInfo.unit === 'kg' ? packageInfo.weight * 2.205 : packageInfo.weight
    baseRate += weight * 0.5
    
    // Add dimensional weight cost
    const dimensions = packageInfo.unit === 'cm' ? 
      { length: packageInfo.length / 2.54, width: packageInfo.width / 2.54, height: packageInfo.height / 2.54 } :
      packageInfo
    const dimensionalWeight = (dimensions.length * dimensions.width * dimensions.height) / 139
    baseRate += Math.max(0, dimensionalWeight - weight) * 0.3
    
    return Math.max(baseRate, 3.00) // Minimum ₱3.00
  }

  /**
   * Calculate distance between two addresses (simplified)
   */
  private static calculateDistance(fromAddress: ShippingAddress, toAddress: ShippingAddress): number {
    // In a real implementation, use a geocoding service like Google Maps API
    // For now, return a mock distance based on state/zip codes
    
    if (fromAddress.state === toAddress.state) {
      // Same state - shorter distance
      return Math.random() * 200 + 50 // 50-250 miles
    } else {
      // Different state - longer distance
      return Math.random() * 1000 + 200 // 200-1200 miles
    }
  }

  /**
   * Create shipping label
   */
  static async createShippingLabel(
    fromAddress: ShippingAddress,
    toAddress: ShippingAddress,
    packageInfo: PackageDimensions,
    service: string,
    carrier: string,
    orderId: string
  ): Promise<ShippingLabel> {
    // Use Shippo when available; otherwise create a mock label
    if (process.env.SHIPPO_API_KEY) {
      return await this.createShippoLabel(fromAddress, toAddress, packageInfo, service, carrier, orderId)
    }

    const trackingNumber = this.generateTrackingNumber(carrier)
    const labelId = `label_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const label: ShippingLabel = {
      id: labelId,
      trackingNumber,
      labelUrl: `https://api.example.com/labels/${labelId}.pdf`,
      trackingUrl: this.getTrackingUrl(carrier, trackingNumber),
      cost: 0,
      currency: 'PHP',
      service,
      carrier,
      status: ShipmentStatus.PENDING,
      createdAt: new Date()
    }

    await prisma.shipment.create({
      data: {
        orderId,
        carrier,
        trackingNumber,
        status: ShipmentStatus.PENDING,
        shippingCost: 0,
        notes: `Label created for ${service} via ${carrier}`
      }
    })

    return label
  }

  /**
   * Generate tracking number based on carrier
   */
  private static generateTrackingNumber(carrier: string): string {
    const prefixes: Record<string, string> = {
      'UPS': '1Z',
      'FedEx': 'FX',
      'USPS': 'US',
      'DHL': 'DH'
    } as const
    
    const prefix = prefixes[carrier] || 'XX'
    const randomPart = Math.random().toString(36).substr(2, 18).toUpperCase()
    return `${prefix}${randomPart}`
  }

  /**
   * Get tracking URL for a carrier
   */
  private static getTrackingUrl(carrier: string, trackingNumber: string): string {
    const baseUrls: Record<string, string> = {
      'UPS': 'https://www.ups.com/track?track=yes&trackNums=',
      'FedEx': 'https://www.fedex.com/fedextrack/?trknbr=',
      'USPS': 'https://tools.usps.com/go/TrackConfirmAction?qtc_tLabels1=',
      'DHL': 'https://www.dhl.com/en/express/tracking.html?AWB='
    } as const
    
    const baseUrl = baseUrls[carrier] || 'https://example.com/track?number='
    return `${baseUrl}${trackingNumber}`
  }

  /**
   * Get tracking information for a package
   */
  static async getTrackingInfo(trackingNumber: string, carrier: string): Promise<TrackingInfo[]> {
    // Use Shippo when configured; otherwise return mock tracking info
    if (process.env.SHIPPO_API_KEY) {
      return await this.getShippoTrackingInfo(trackingNumber, carrier)
    }

    const mockTrackingEvents = [
      {
        status: 'In Transit',
        description: 'Package is in transit to destination',
        location: 'Distribution Center',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        status: 'Picked Up',
        description: 'Package has been picked up',
        location: 'Origin Facility',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        status: 'Label Created',
        description: 'Shipping label has been created',
        location: 'Origin',
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
      }
    ]

    return mockTrackingEvents.map(event => ({
      trackingNumber,
      status: event.status,
      description: event.description,
      location: event.location,
      timestamp: event.timestamp,
      carrier,
      service: 'Standard'
    }))
  }

  /**
   * Update shipment status
   */
  static async updateShipmentStatus(
    shipmentId: string,
    status: string,
    trackingInfo?: TrackingInfo
  ): Promise<void> {
    await prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        status: status as any,
        notes: trackingInfo ? `${status}: ${trackingInfo.description}` : status
      }
    })
  }

  /**
   * Get shipping statistics
   */
  static async getShippingStats(vendorId?: string): Promise<{
    totalShipments: number
    deliveredShipments: number
    inTransitShipments: number
    averageDeliveryTime: number
    totalShippingCost: number
    carrierBreakdown: Array<{
      carrier: string
      count: number
      percentage: number
    }>
  }> {
    const whereClause = vendorId ? {
      order: {
        vendorId
      }
    } : {}

    const shipments = await prisma.shipment.findMany({
      where: whereClause,
      include: {
        order: true
      }
    })

    const totalShipments = shipments.length
    const deliveredShipments = shipments.filter(s => s.status === 'DELIVERED').length
    const inTransitShipments = shipments.filter(s => s.status === 'IN_TRANSIT').length
    
    const averageDeliveryTime = this.calculateAverageDeliveryTime(shipments)
    const totalShippingCost = shipments.reduce((sum, s) => sum + Number(s.shippingCost || 0), 0)
    
    // Carrier breakdown
    const carrierCounts = shipments.reduce((acc, shipment) => {
      acc[shipment.carrier] = (acc[shipment.carrier] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const carrierBreakdown = Object.entries(carrierCounts).map(([carrier, count]) => ({
      carrier,
      count,
      percentage: Math.round((count / totalShipments) * 100)
    }))

    return {
      totalShipments,
      deliveredShipments,
      inTransitShipments,
      averageDeliveryTime,
      totalShippingCost,
      carrierBreakdown
    }
  }

  /**
   * Calculate average delivery time
   */
  private static calculateAverageDeliveryTime(shipments: any[]): number {
    const deliveredShipments = shipments.filter(s => 
      s.status === 'DELIVERED' && s.actualDelivery && s.createdAt
    )
    
    if (deliveredShipments.length === 0) return 0
    
    const totalDays = deliveredShipments.reduce((sum, shipment) => {
      const deliveryTime = shipment.actualDelivery.getTime() - shipment.createdAt.getTime()
      return sum + (deliveryTime / (1000 * 60 * 60 * 24))
    }, 0)
    
    return Math.round(totalDays / deliveredShipments.length)
  }

  /**
   * Shippo: Get real-time shipping rates
   */
  private static async getShippoRates(
    fromAddress: ShippingAddress,
    toAddress: ShippingAddress,
    packageInfo: PackageDimensions,
    services?: string[]
  ): Promise<ShippingRate[]> {
    const shippo = getShippo()
    const addressFrom = toShippoAddress(fromAddress)
    const addressTo = toShippoAddress(toAddress)
    const parcel = toShippoParcel(packageInfo)

    const shipment = await handleShippoRequest(shippo.shipments.create({
      addressFrom,
      addressTo,
      parcels: [parcel],
      async: false
    }))

    const rawRates = Array.isArray((shipment as any).rates) ? (shipment as any).rates : []

    // Log all available carriers for debugging
    console.log(`Shippo returned ${rawRates.length} rates from carriers:`,
      [...new Set(rawRates.map((r: any) => r?.provider || r?.carrier || 'Unknown'))])

    const mapped: ShippingRate[] = rawRates
      .filter((r: any) => {
        // Filter out invalid rates
        if (!r || !r.amount || r.amount === '0' || r.amount === 0) return false

        // If services filter is provided, apply it
        if (!services || services.length === 0) return true
        const name = r?.servicelevel?.name || r?.servicelevel_name || ''
        const token = r?.servicelevel?.token || r?.servicelevel_token || ''
        return services.some(s =>
          s.toLowerCase() === name.toLowerCase() || s.toLowerCase() === token.toLowerCase()
        )
      })
      .map((r: any) => {
        const estimatedDays = Number(r?.estimated_days || 0)
        const estimatedDelivery = estimatedDays > 0 ? new Date(Date.now() + estimatedDays * 24 * 60 * 60 * 1000) : undefined

        return {
          service: r?.servicelevel?.name || r?.servicelevel_name || 'Unknown',
          serviceCode: r?.servicelevel?.token || r?.servicelevel_token || 'UNKNOWN',
          carrier: r?.provider || r?.carrier || 'Unknown',
          cost: Number(r?.amount || r?.price || 0),
          currency: r?.currency || 'USD',
          estimatedDays,
          estimatedDelivery,
          description: r?.duration_terms || r?.servicelevel?.name || undefined
        } as ShippingRate
      })

    console.log(`Returning ${mapped.length} valid rates after filtering`)
    return mapped
  }

  /**
   * Shippo: Create shipping label via transaction
   */
  private static async createShippoLabel(
    fromAddress: ShippingAddress,
    toAddress: ShippingAddress,
    packageInfo: PackageDimensions,
    service: string,
    carrier: string,
    orderId: string
  ): Promise<ShippingLabel> {
    const shippo = getShippo()
    const addressFrom = toShippoAddress(fromAddress)
    const addressTo = toShippoAddress(toAddress)
    const parcel = toShippoParcel(packageInfo)

    const shipment = await shippo.shipments.create({ addressFrom, addressTo, parcels: [parcel], async: false })

    const rates: any[] = Array.isArray((shipment as any).rates) ? (shipment as any).rates : []

    const match = rates.find(r => {
      const name = r?.servicelevel?.name || r?.servicelevel_name || ''
      const token = r?.servicelevel?.token || r?.servicelevel_token || ''
      const provider = r?.provider || r?.carrier || ''
      return (
        provider.toLowerCase() === carrier.toLowerCase() &&
        (name.toLowerCase() === service.toLowerCase() || token.toLowerCase() === service.toLowerCase())
      )
    }) || rates.sort((a, b) => Number(a.amount || 0) - Number(b.amount || 0))[0]

    if (!match) {
      throw new Error('No Shippo rate available to create label')
    }

    const transaction = await handleShippoRequest(shippo.transactions.create({
      rate: match.object_id || match.objectId,
      labelFileType: 'PDF',
      async: false
    }))

    const label: ShippingLabel = {
      id: (transaction as any).object_id || (transaction as any).objectId || `tx_${Date.now()}`,
      trackingNumber: (transaction as any).tracking_number || '',
      labelUrl: (transaction as any).label_url || '',
      trackingUrl: (transaction as any).tracking_url_provider || '',
      cost: Number((transaction as any).amount || 0),
      currency: (transaction as any).currency || 'USD',
      service: match?.servicelevel?.name || match?.servicelevel_name || service,
      carrier: match?.provider || match?.carrier || carrier,
      status: ((transaction as any).status || 'SUCCESS') === 'SUCCESS' ? ShipmentStatus.IN_TRANSIT : ShipmentStatus.PENDING,
      createdAt: new Date()
    }

    await prisma.shipment.create({
      data: {
        orderId,
        carrier: label.carrier,
        trackingNumber: label.trackingNumber,
        status: label.status === ShipmentStatus.IN_TRANSIT ? ShipmentStatus.IN_TRANSIT : ShipmentStatus.PENDING,
        shippingCost: label.cost,
        notes: `Label created via Shippo for ${label.service}`
      }
    })

    return label
  }

  /**
   * Shippo: Tracking info
   */
  private static async getShippoTrackingInfo(trackingNumber: string, carrier: string): Promise<TrackingInfo[]> {
    const shippo = getShippo()

    const resp = await handleShippoRequest(shippo.trackingStatus.get({
      carrier,
      trackingNumber
    }))

    const history: any[] = Array.isArray((resp as any).tracking_history) ? (resp as any).tracking_history : []
    const events = history.length > 0 ? history : (resp as any).tracking_status ? [(resp as any).tracking_status] : []

    return events.map((e: any) => ({
      trackingNumber,
      status: e?.status || e?.status_details || 'Unknown',
      description: e?.status_details || e?.status || '',
      location: e?.location || e?.location_city || undefined,
      timestamp: e?.status_date ? new Date(e.status_date) : new Date(),
      carrier,
      service: 'Standard'
    }))
  }
}
