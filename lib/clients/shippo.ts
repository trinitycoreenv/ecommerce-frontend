import { Shippo } from 'shippo'

let shippoClient: Shippo | null = null

/**
 * Get a singleton Shippo SDK client using SHIPPO_API_KEY
 */
/**
 * Get a singleton Shippo SDK client using SHIPPO_API_KEY with enhanced error handling
 */
export function getShippo(): Shippo {
  if (shippoClient) return shippoClient

  const apiKey = process.env.SHIPPO_API_KEY
  if (!apiKey) {
    throw new Error('Missing SHIPPO_API_KEY environment variable')
  }

  try {
    const apiHost = process.env.SHIPPO_API_URL || 'api.goshippo.com'
    shippoClient = new Shippo({ apiKeyHeader: apiKey })
    return shippoClient
  } catch (error) {
    console.error('Failed to initialize Shippo client:', error)
    throw new Error('Failed to initialize Shippo client')
  }
}

/**
 * Error handler for Shippo API calls
 */
export async function handleShippoRequest<T>(request: Promise<T>): Promise<T> {
  try {
    const response = await request
    return response
  } catch (error: any) {
    console.error('Shippo API error:', {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      data: error.data
    })
    
    // Map Shippo errors to more user-friendly messages
    if (error.statusCode === 401) {
      throw new Error('Invalid Shippo API credentials')
    } else if (error.statusCode === 429) {
      throw new Error('Rate limit exceeded. Please try again later.')
    } else if (error.statusCode >= 500) {
      throw new Error('Shippo service is currently unavailable')
    }
    
    throw error
  }
}

/**
 * Convert internal address shape to Shippo address request
 */
export function toShippoAddress(addr: {
  name?: string
  company?: string
  address1: string
  address2?: string
  city: string
  state: string
  zip: string
  country: string
  phone?: string
  email?: string
}) {
  return {
    name: addr.name || '',
    company: addr.company || undefined,
    street1: addr.address1,
    street2: addr.address2 || undefined,
    city: addr.city,
    state: addr.state,
    zip: addr.zip,
    country: addr.country,
    phone: addr.phone || undefined,
    email: addr.email || undefined
  }
}

/**
 * Convert internal parcel shape to Shippo parcel request
 */
export function toShippoParcel(parcel: {
  length: number
  width: number
  height: number
  weight: number
  unit: 'in' | 'cm' | 'lb' | 'kg'
}) {
  // Derive units. Our schema conflates dimensional and mass units into one field.
  const distanceUnit = parcel.unit === 'cm' ? 'cm' : 'in'
  const massUnit = parcel.unit === 'kg' ? 'kg' : 'lb'

  return {
    length: String(parcel.length),
    width: String(parcel.width),
    height: String(parcel.height),
    weight: String(parcel.weight),
    distanceUnit: distanceUnit as 'cm' | 'in',
    massUnit: massUnit as 'kg' | 'lb'
  }
}