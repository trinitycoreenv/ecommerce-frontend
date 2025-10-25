import { NextRequest, NextResponse } from 'next/server'
import { ShippingService } from '@/lib/services/shipping'
import { prisma } from '@/lib/prisma'
import { ShipmentStatus, OrderStatus } from '@prisma/client'

/**
 * POST /api/webhooks/shipping - Handle shipping provider webhooks
 */
export async function POST(request: NextRequest) {
  try {
    // Log raw request details for debugging
    console.log('Received webhook request:', {
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
    });

    let rawBody;
    try {
      // Clone the request since body can only be read once
      const clone = request.clone();
      // Get raw text first to debug
      const rawText = await clone.text();
      console.log('Raw request body:', rawText);
      
      // If empty body, handle as verification
      if (!rawText.trim()) {
        return NextResponse.json({ success: true }, { status: 200 });
      }

      rawBody = JSON.parse(rawText);
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // Special handling for Shippo webhook verification
    if (rawBody.test === true) {
      console.log('Received Shippo webhook verification request:', {
        headers: Object.fromEntries(request.headers.entries()),
        body: rawBody
      })
      return NextResponse.json({ success: true }, { status: 200 })
    }

    const { provider, event, data } = normalizeShippingWebhook(rawBody)
    console.log(`Received shipping webhook from ${provider}: ${event}`)

    // Verify Shippo webhook signature
    if (provider === 'shippo') {
      const signature = request.headers.get('Shippo-Signature')
      if (!signature) {
        return NextResponse.json({ error: 'Missing Shippo-Signature header' }, { status: 401 })
      }
      
      // Verify HMAC signature using your webhook secret
      const secret = process.env.SHIPPO_WEBHOOK_SECRET
      if (!secret) {
        console.warn('SHIPPO_WEBHOOK_SECRET not configured - skipping signature verification')
      } else {
        const expectedSignature = require('crypto')
          .createHmac('sha256', secret)
          .update(JSON.stringify(rawBody))
          .digest('hex')
        
        if (signature !== expectedSignature) {
          return NextResponse.json({ error: 'Invalid Shippo signature' }, { status: 401 })
        }
      }
    }

    switch (event) {
      case 'shipment.created':
        await handleShipmentCreated(provider, data)
        break
      case 'shipment.in_transit':
        await handleShipmentInTransit(provider, data)
        break
      case 'shipment.delivered':
        await handleShipmentDelivered(provider, data)
        break
      case 'shipment.exception':
        await handleShipmentException(provider, data)
        break
      case 'tracking.updated':
        await handleTrackingUpdated(provider, data)
        break
      default:
        console.log(`Unhandled shipping webhook event: ${event}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error processing shipping webhook:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}

/**
 * Normalize incoming webhook payloads to the internal shape
 * Supports Shippo track updates; returns { provider, event, data }
 */
function normalizeShippingWebhook(body: any): { provider: string; event: string; data: any } {
  // If already in internal format { provider, event, data }, return as-is
  if (body && typeof body === 'object' && body.provider && body.event) {
    return { provider: body.provider, event: body.event, data: body.data ?? {} }
  }

  // Heuristic: Shippo webhook structure (event + tracking fields)
  const isShippo = !!body?.event && (
    !!body?.tracking_number || !!body?.data?.tracking_number || !!body?.data?.tracking?.tracking_number
  )

  if (isShippo) {
    const provider = 'shippo'
    const shippoEvent: string = String(body.event).toLowerCase()

    // Extract tracking info flexibly across Shippo payload variants
    const trackingNumber = body?.tracking_number
      || body?.data?.tracking_number
      || body?.data?.tracking?.tracking_number

    const carrier = body?.carrier
      || body?.data?.carrier
      || body?.data?.tracking?.carrier

    const trackingStatus = body?.tracking_status
      || body?.data?.tracking_status
      || body?.data?.tracking?.tracking_status

    const status = String(trackingStatus?.status || '').toUpperCase()
    const statusDetails = trackingStatus?.status_details || ''
    const statusDate = trackingStatus?.status_date || trackingStatus?.status_date_time || new Date().toISOString()

    const locationObj = trackingStatus?.location
      || body?.data?.tracking?.tracking_status?.location

    const location = locationObj
      ? [locationObj.city, locationObj.state, locationObj.zip, locationObj.country]
          .filter(Boolean)
          .join(', ')
      : (body?.location || 'Unknown location')

    // Build events from tracking history if available
    const history = body?.tracking_history
      || body?.data?.tracking_history
      || body?.data?.tracking?.tracking_history

    const events = Array.isArray(history) && history.length > 0
      ? history.map((h: any) => ({
          description: h?.status_details || h?.status || 'Update',
          location: h?.location
            ? [h.location.city, h.location.state, h.location.zip, h.location.country].filter(Boolean).join(', ')
            : undefined,
          timestamp: h?.status_date || h?.status_date_time || undefined
        }))
      : ([{
          description: statusDetails || status || 'Update',
          location,
          timestamp: statusDate
        }])

    // Map Shippo event/status to internal event names
    let event: string = 'tracking.updated'
    if (shippoEvent === 'track_updated') {
      if (status === 'DELIVERED') {
        event = 'shipment.delivered'
      } else if (status === 'EXCEPTION' || status === 'FAILURE') {
        event = 'shipment.exception'
      } else if (status === 'TRANSIT' || status === 'IN_TRANSIT' || status === 'PRE_TRANSIT') {
        event = 'shipment.in_transit'
      }
    }

    const data = {
      trackingNumber,
      carrier,
      events,
      deliveredAt: status === 'DELIVERED' ? statusDate : undefined,
      location,
      exceptionType: status === 'EXCEPTION' ? (trackingStatus?.substatus || 'EXCEPTION') : undefined,
      description: statusDetails
    }

    return { provider, event, data }
  }

  // Fallback for unknown providers: treat as tracking update if possible
  return {
    provider: body?.provider || 'unknown',
    event: body?.event || 'tracking.updated',
    data: body?.data || {}
  }
}

/**
 * Handle shipment created webhook
 */
async function handleShipmentCreated(provider: string, data: any) {
  const { trackingNumber, orderId, carrier, service, cost } = data
  try {
    await prisma.shipment.updateMany({
      where: {
        trackingNumber,
        carrier: provider
      },
      data: {
        status: ShipmentStatus.PENDING,
        shippingCost: cost || 0,
        notes: `Shipment created via ${provider} webhook`
      }
    })

    // Log the webhook event
    await prisma.auditLog.create({
      data: {
        userId: 'system',
        action: 'SHIPMENT_CREATED',
        resource: 'SHIPMENT',
        resourceId: trackingNumber,
        details: {
          provider,
          trackingNumber,
          orderId,
          carrier,
          service,
          cost
        },
        ipAddress: '127.0.0.1'
      }
    })
  } catch (err) {
    console.error('Error in handleShipmentCreated:', err)
  }
}

/**
 * Handle shipment in transit webhook
 */
async function handleShipmentInTransit(provider: string, data: any) {
  const { trackingNumber, location, timestamp } = data
  try {
    await prisma.shipment.updateMany({
      where: {
        trackingNumber,
        carrier: provider
      },
      data: {
        status: ShipmentStatus.IN_TRANSIT,
        notes: `In transit from ${location} at ${timestamp}`
      }
    })

    // Update order status if it's still in SHIPPED
    await prisma.order.updateMany({
      where: {
        shipments: {
          some: {
            trackingNumber,
            carrier: provider
          }
        },
        status: 'SHIPPED'
      },
      data: {
        status: OrderStatus.SHIPPED
      }
    })
  } catch (err) {
    console.error('Error in handleShipmentInTransit:', err)
  }
}

/**
 * Handle shipment delivered webhook
 */
async function handleShipmentDelivered(provider: string, data: any) {
  const { trackingNumber, deliveredAt, location, signature } = data
  try {
    await prisma.shipment.updateMany({
      where: {
        trackingNumber,
        carrier: provider
      },
      data: {
        status: 'DELIVERED',
        actualDelivery: deliveredAt ? new Date(deliveredAt) : new Date(),
        notes: `Delivered at ${location}${signature ? ` (signed by: ${signature})` : ''}`
      }
    })

    // Update order status to DELIVERED
    await prisma.order.updateMany({
      where: {
        shipments: {
          some: {
            trackingNumber,
            carrier: provider
          }
        }
      },
      data: {
        status: 'DELIVERED'
      }
    })

    // Send delivery confirmation email to customer
    // This would be implemented with your email service
    console.log(`Sending delivery confirmation for tracking number: ${trackingNumber}`)
  } catch (err) {
    console.error('Error in handleShipmentDelivered:', err)
  }
}

/**
 * Handle shipment exception webhook
 */
async function handleShipmentException(provider: string, data: any) {
  const { trackingNumber, exceptionType, description, location } = data
  try {
    await prisma.shipment.updateMany({
      where: {
        trackingNumber,
        carrier: provider
      },
      data: {
        status: ShipmentStatus.FAILED_DELIVERY,
        notes: `Exception: ${exceptionType} - ${description} at ${location}`
      }
    })

    // Log the exception
    await prisma.auditLog.create({
      data: {
        userId: 'system',
        action: 'SHIPMENT_EXCEPTION',
        resource: 'SHIPMENT',
        resourceId: trackingNumber,
        details: {
          provider,
          trackingNumber,
          exceptionType,
          description,
          location
        },
        ipAddress: '127.0.0.1'
      }
    })
  } catch (err) {
    console.error('Error in handleShipmentException:', err)
  }
}

/**
 * Handle tracking updated webhook
 */
async function handleTrackingUpdated(provider: string, data: any) {
  const { trackingNumber, events } = data
  try {
    // Update shipment with latest tracking info
    if (events && events.length > 0) {
      const latestEvent = events[0]
      await prisma.shipment.updateMany({
        where: {
          trackingNumber,
          carrier: provider
        },
        data: {
          notes: `Latest update: ${latestEvent.description} at ${latestEvent.location || 'Unknown location'}`
        }
      })
    }

    // Store tracking events (in a real implementation, you might want a separate table)
    await prisma.auditLog.create({
      data: {
        userId: 'system',
        action: 'TRACKING_UPDATED',
        resource: 'SHIPMENT',
        resourceId: trackingNumber,
        details: {
          provider,
          trackingNumber,
          events
        },
        ipAddress: '127.0.0.1'
      }
    })
  } catch (err) {
    console.error('Error in handleTrackingUpdated:', err)
  }
}

/**
 * Verify webhook signature (placeholder implementation)
 */
function verifyWebhookSignature(body: any, signature: string | null, provider: string): boolean {
  // In a real implementation, you would verify the webhook signature
  // using the provider's webhook secret
  return true // For now, always return true
}
