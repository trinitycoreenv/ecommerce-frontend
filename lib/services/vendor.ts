import { prisma } from "@/lib/prisma"

export interface CreateVendorData {
  userId: string
  businessName: string
  businessType: string
  taxId?: string
  address: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  bankDetails?: {
    accountNumber: string
    routingNumber: string
    bankName: string
  }
}

export interface UpdateVendorData {
  businessName?: string
  businessType?: string
  taxId?: string
  address?: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  bankDetails?: {
    accountNumber: string
    routingNumber: string
    bankName: string
  }
  isActive?: boolean
}

export class VendorService {
  static async createVendor(data: CreateVendorData, createdBy: string) {
    // Check if user is already a vendor
    const existingVendor = await prisma.vendor.findUnique({
      where: { userId: data.userId }
    })

    if (existingVendor) {
      throw new Error("User is already a vendor")
    }

    const vendor = await prisma.vendor.create({
      data: {
        userId: data.userId,
        businessName: data.businessName,
        // businessType: data.businessType, // Field doesn't exist in schema
        businessAddress: JSON.stringify(data.address),
        taxId: data.taxId,
        // bankDetails: data.bankDetails, // Field doesn't exist in schema
        status: "PENDING_VERIFICATION"
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
                // lastName: true, // Field doesn't exist in schema
            role: true
          }
        }
      }
    })

    // Log the creation
    await this.logVendorAction("CREATE", vendor.id, createdBy, data)

    return vendor
  }

  static async getVendors(filters?: {
    isActive?: boolean
    businessType?: string
    search?: string
    page?: number
    limit?: number
  }) {
    const where: any = {}

    if (filters?.isActive !== undefined) where.isActive = filters.isActive
    if (filters?.businessType) where.businessType = filters.businessType

    if (filters?.search) {
      where.OR = [
        { businessName: { contains: filters.search, mode: "insensitive" } },
        { businessType: { contains: filters.search, mode: "insensitive" } },
        { user: { firstName: { contains: filters.search, mode: "insensitive" } } },
        { user: { lastName: { contains: filters.search, mode: "insensitive" } } }
      ]
    }

    const page = filters?.page || 1
    const limit = filters?.limit || 20
    const skip = (page - 1) * limit

    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
                name: true,
              role: true,
              isActive: true
            }
          },
          _count: {
            select: {
              products: true,
              orders: true,
              subscriptions: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      prisma.vendor.count({ where })
    ])

    return {
      vendors,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }

  static async getVendorById(vendorId: string) {
    return await prisma.vendor.findUnique({
      where: { id: vendorId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
                // lastName: true, // Field doesn't exist in schema
            role: true,
                // phone: true, // Field doesn't exist in schema
            isActive: true
          }
        },
        products: {
          include: {
            category: true
          },
          orderBy: { createdAt: "desc" }
        },
        subscriptions: {
          orderBy: { createdAt: "desc" }
        },
        _count: {
          select: {
            products: true,
            orders: true,
            subscriptions: true
          }
        }
      }
    })
  }

  static async getVendorByUserId(userId: string) {
    return await prisma.vendor.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
                // lastName: true, // Field doesn't exist in schema
            role: true,
                // phone: true, // Field doesn't exist in schema
            isActive: true
          }
        },
        _count: {
          select: {
            products: true,
            orders: true,
            subscriptions: true
          }
        }
      }
    })
  }

  static async updateVendor(vendorId: string, data: UpdateVendorData, updatedBy: string) {
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId }
    })

    if (!vendor) {
      throw new Error("Vendor not found")
    }

    const updatedVendor = await prisma.vendor.update({
      where: { id: vendorId },
      data: {
        ...data,
        // address: data.address ? JSON.stringify(data.address) : vendor.address, // Field doesn't exist
        // bankDetails: data.bankDetails ? JSON.stringify(data.bankDetails) : vendor.bankDetails // Field doesn't exist
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
                // lastName: true, // Field doesn't exist in schema
            role: true
          }
        }
      }
    })

    // Log the update
    await this.logVendorAction("UPDATE", vendorId, updatedBy, data)

    return updatedVendor
  }

  static async deactivateVendor(vendorId: string, deactivatedBy: string, reason?: string) {
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId }
    })

    if (!vendor) {
      throw new Error("Vendor not found")
    }

    if (vendor.status !== 'ACTIVE') { // Using status instead of isActive
      throw new Error("Vendor is already deactivated")
    }

    const updatedVendor = await prisma.vendor.update({
      where: { id: vendorId },
      data: { status: 'INACTIVE' }, // Using status instead of isActive
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
                // lastName: true, // Field doesn't exist in schema
            role: true
          }
        }
      }
    })

    // Log the deactivation
    await this.logVendorAction("DEACTIVATE", vendorId, deactivatedBy, { reason })

    return updatedVendor
  }

  static async activateVendor(vendorId: string, activatedBy: string) {
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId }
    })

    if (!vendor) {
      throw new Error("Vendor not found")
    }

    if (vendor.status === 'ACTIVE') { // Using status instead of isActive
      throw new Error("Vendor is already active")
    }

    const updatedVendor = await prisma.vendor.update({
      where: { id: vendorId },
      data: { status: 'ACTIVE' }, // Using status instead of isActive
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
                // lastName: true, // Field doesn't exist in schema
            role: true
          }
        }
      }
    })

    // Log the activation
    await this.logVendorAction("ACTIVATE", vendorId, activatedBy, {})

    return updatedVendor
  }

  static async getVendorStats() {
    const totalVendors = await prisma.vendor.count()
    const activeVendors = await prisma.vendor.count({ where: { status: 'ACTIVE' } })
    
    const vendorsByType = await prisma.vendor.groupBy({
      by: ["businessName"], // Using businessName instead of businessType
      _count: { businessName: true },
      where: { status: 'ACTIVE' }
    })

    const topVendors = await prisma.vendor.findMany({
      include: {
        user: {
          select: {
                name: true
          }
        },
        _count: {
          select: { products: true }
        }
      },
      orderBy: {
        products: {
          _count: "desc"
        }
      },
      take: 5
    })

    return {
      totalVendors,
      activeVendors,
      inactiveVendors: totalVendors - activeVendors,
      vendorsByType: vendorsByType.map((group: any) => ({
        businessType: group.businessType,
        count: group._count.businessType
      })),
      topVendors: topVendors.map((vendor: any) => ({
        id: vendor.id,
        businessName: vendor.businessName,
        ownerName: `${vendor.user.firstName} ${vendor.user.lastName}`,
        productCount: vendor._count.products
      }))
    }
  }

  private static async logVendorAction(action: string, vendorId: string, performedBy: string, data: any) {
    await prisma.auditLog.create({
      data: {
        userId: performedBy,
        action: `VENDOR_${action}`,
        resource: "Vendor",
        resourceId: vendorId,
        // entityType: "Vendor", // Field doesn't exist in schema
        // entityId: vendorId, // Field doesn't exist in schema
        details: data,
        ipAddress: "127.0.0.1"
      }
    })
  }
}
