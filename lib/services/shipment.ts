import { prisma } from "@/lib/prisma"

export interface CreateShipmentData {
  orderId: string
  carrier: string
  trackingNumber: string
  shippingMethod: string
  estimatedDelivery?: Date
  shippingCost: number
}

export interface UpdateShipmentData {
  status?: string
  trackingNumber?: string
  carrier?: string
  estimatedDelivery?: Date
  actualDelivery?: Date
  notes?: string
}

export class ShipmentService {
  static async createShipment(data: CreateShipmentData, createdBy: string) {
    // Verify order exists
    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
      include: { customer: true }
    })

    if (!order) {
      throw new Error("Order not found")
    }

    // Check if shipment already exists for this order
    const existingShipment = await prisma.shipment.findFirst({
      where: { orderId: data.orderId }
    })

    if (existingShipment) {
      throw new Error("Shipment already exists for this order")
    }

    const shipment = await prisma.shipment.create({
      data: {
        orderId: data.orderId,
        carrier: data.carrier,
        trackingNumber: data.trackingNumber,
        estimatedDelivery: data.estimatedDelivery,
        shippingCost: data.shippingCost,
        status: "PENDING"
      },
      include: {
        order: {
          include: {
            customer: true,
            orderItems: { // Using orderItems instead of items
              include: {
                product: {
                  include: {
                    vendor: true
                  }
                }
              }
            }
          }
        }
      }
    })

    // Log the creation
    await this.logShipmentAction("CREATE", shipment.id, createdBy, data)

    return shipment
  }

  static async getShipments(filters?: {
    status?: string
    carrier?: string
    orderId?: string
    vendorId?: string
    customerId?: string
    dateFrom?: Date
    dateTo?: Date
    page?: number
    limit?: number
  }) {
    const where: any = {}

    if (filters?.status) where.status = filters.status
    if (filters?.carrier) where.carrier = filters.carrier
    if (filters?.orderId) where.orderId = filters.orderId

    if (filters?.vendorId) {
      where.order = {
        items: {
          some: {
            product: {
              vendorId: filters.vendorId
            }
          }
        }
      }
    }

    if (filters?.customerId) {
      where.order = {
        customerId: filters.customerId
      }
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {}
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom
      if (filters.dateTo) where.createdAt.lte = filters.dateTo
    }

    const page = filters?.page || 1
    const limit = filters?.limit || 20
    const skip = (page - 1) * limit

    const [shipments, total] = await Promise.all([
      prisma.shipment.findMany({
        where,
        include: {
          order: {
            include: {
              customer: {
                select: {
                  id: true,
                  name: true,
                  // lastName: true, // Field doesn't exist in schema
                  email: true
                }
              },
              orderItems: { // Using orderItems instead of items
                include: {
                  product: {
                    include: {
                      vendor: {
                        select: {
                          id: true,
                          businessName: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      prisma.shipment.count({ where })
    ])

    return {
      shipments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }

  static async getShipmentById(shipmentId: string) {
    return await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: {
        order: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
                // phone: true // Field doesn't exist in schema
              }
            },
            orderItems: { // Using orderItems instead of items
              include: {
                product: {
                  include: {
                    vendor: {
                      select: {
                        id: true,
                        businessName: true
                      }
                    },
                    category: true
                  }
                }
              }
            }
          }
        }
      }
    })
  }

  static async updateShipment(shipmentId: string, data: UpdateShipmentData, updatedBy: string) {
    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId }
    })

    if (!shipment) {
      throw new Error("Shipment not found")
    }

    const updatedShipment = await prisma.shipment.update({
      where: { id: shipmentId },
      data: data as any,
      include: {
        order: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            orderItems: { // Using orderItems instead of items
              include: {
                product: {
                  include: {
                    vendor: {
                      select: {
                        id: true,
                        businessName: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

    // Log the update
    await this.logShipmentAction("UPDATE", shipmentId, updatedBy, data)

    return updatedShipment
  }

  static async trackShipment(trackingNumber: string) {
    const shipment = await prisma.shipment.findFirst({
      where: { trackingNumber },
      include: {
        order: {
          include: {
            customer: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    })

    if (!shipment) {
      throw new Error("Shipment not found")
    }

    // In a real application, you would integrate with carrier APIs here
    // For now, we'll return mock tracking information
    const trackingInfo = {
      trackingNumber: shipment.trackingNumber,
      carrier: shipment.carrier,
      status: shipment.status,
      estimatedDelivery: shipment.estimatedDelivery,
      actualDelivery: shipment.actualDelivery,
      history: [
        {
          status: "PENDING",
          timestamp: shipment.createdAt,
          location: "Warehouse",
          description: "Shipment created"
        },
        {
          status: shipment.status,
          timestamp: shipment.updatedAt,
          location: shipment.status === "IN_TRANSIT" ? "Distribution Center" : "Warehouse",
          description: shipment.status === "IN_TRANSIT" ? "Package in transit" : "Package ready for pickup"
        }
      ]
    }

    return trackingInfo
  }

  static async getShipmentStats() {
    const totalShipments = await prisma.shipment.count()
    
    const shipmentsByStatus = await prisma.shipment.groupBy({
      by: ["status"],
      _count: { status: true }
    })

    const shipmentsByCarrier = await prisma.shipment.groupBy({
      by: ["carrier"],
      _count: { carrier: true }
    })

    const recentShipments = await prisma.shipment.findMany({
      include: {
        order: {
          include: {
            customer: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 5
    })

    return {
      totalShipments,
      shipmentsByStatus: shipmentsByStatus.map((group: any) => ({
        status: group.status,
        count: group._count.status
      })),
      shipmentsByCarrier: shipmentsByCarrier.map((group: any) => ({
        carrier: group.carrier,
        count: group._count.carrier
      })),
      recentShipments: recentShipments.map((shipment: any) => ({
        id: shipment.id,
        trackingNumber: shipment.trackingNumber,
        carrier: shipment.carrier,
        status: shipment.status,
        customerName: `${shipment.order.customer.firstName} ${shipment.order.customer.lastName}`,
        createdAt: shipment.createdAt
      }))
    }
  }

  private static async logShipmentAction(action: string, shipmentId: string, performedBy: string, data: any) {
    await prisma.auditLog.create({
      data: {
        userId: performedBy,
        action: `SHIPMENT_${action}`,
        resource: "Shipment",
        resourceId: shipmentId,
        // entityType: "Shipment", // Field doesn't exist in schema
        // entityId: shipmentId, // Field doesn't exist in schema
        details: data,
        ipAddress: "127.0.0.1"
      }
    })
  }
}
