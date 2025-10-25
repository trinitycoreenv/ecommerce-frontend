import { prisma } from "@/lib/prisma"
import { PolicyType, PolicySeverity, ViolationStatus } from "@prisma/client"

export interface PolicyRule {
  type: string
  condition: string
  value: any
  message: string
}

export interface CreatePolicyData {
  name: string
  description: string
  type: PolicyType
  severity: PolicySeverity
  rules: PolicyRule[]
  autoEnforce: boolean
}

export interface CreateViolationData {
  policyId: string
  productId: string
  vendorId: string
  reason: string
  details?: any
  flaggedBy?: string
}

export interface UpdateViolationData {
  status?: ViolationStatus
  reviewedBy?: string
  adminNotes?: string
  resolvedAt?: Date
}

export interface AppealViolationData {
  appealMessage: string
  appealDocuments?: any
}

export class PolicyService {
  /**
   * Create a new policy
   */
  static async createPolicy(data: CreatePolicyData, createdBy: string) {
    const policy = await prisma.policy.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        severity: data.severity,
        rules: data.rules as any,
        autoEnforce: data.autoEnforce,
        isActive: true
      }
    })

    // Log the creation
    await prisma.auditLog.create({
      data: {
        userId: createdBy,
        action: "CREATE",
        resource: "POLICY",
        resourceId: policy.id,
        details: {
          policyName: policy.name,
          policyType: policy.type,
          severity: policy.severity
        },
        ipAddress: "127.0.0.1"
      }
    })

    return policy
  }

  /**
   * Get all policies
   */
  static async getPolicies(filters?: {
    type?: PolicyType
    severity?: PolicySeverity
    isActive?: boolean
  }) {
    const whereClause: any = {}

    if (filters?.type) {
      whereClause.type = filters.type
    }

    if (filters?.severity) {
      whereClause.severity = filters.severity
    }

    if (filters?.isActive !== undefined) {
      whereClause.isActive = filters.isActive
    }

    return await prisma.policy.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            violations: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })
  }

  /**
   * Get policy by ID
   */
  static async getPolicyById(policyId: string) {
    return await prisma.policy.findUnique({
      where: { id: policyId },
      include: {
        violations: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: true
              }
            },
            vendor: {
              select: {
                id: true,
                businessName: true
              }
            }
          },
          orderBy: {
            createdAt: "desc"
          },
          take: 10
        }
      }
    })
  }

  /**
   * Update a policy
   */
  static async updatePolicy(policyId: string, data: Partial<CreatePolicyData>, updatedBy: string) {
    const policy = await prisma.policy.update({
      where: { id: policyId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description && { description: data.description }),
        ...(data.type && { type: data.type }),
        ...(data.severity && { severity: data.severity }),
        ...(data.rules && { rules: data.rules as any }),
        ...(data.autoEnforce !== undefined && { autoEnforce: data.autoEnforce })
      }
    })

    // Log the update
    await prisma.auditLog.create({
      data: {
        userId: updatedBy,
        action: "UPDATE",
        resource: "POLICY",
        resourceId: policy.id,
        details: {
          policyName: policy.name,
          changes: data
        },
        ipAddress: "127.0.0.1"
      }
    })

    return policy
  }

  /**
   * Delete a policy
   */
  static async deletePolicy(policyId: string, deletedBy: string) {
    const policy = await prisma.policy.delete({
      where: { id: policyId }
    })

    // Log the deletion
    await prisma.auditLog.create({
      data: {
        userId: deletedBy,
        action: "DELETE",
        resource: "POLICY",
        resourceId: policy.id,
        details: {
          policyName: policy.name
        },
        ipAddress: "127.0.0.1"
      }
    })

    return policy
  }

  /**
   * Validate a product against all active policies
   */
  static async validateProduct(productId: string, autoFlag: boolean = false) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        vendor: true,
        category: true
      }
    })

    if (!product) {
      throw new Error("Product not found")
    }

    // Get all active policies
    const policies = await prisma.policy.findMany({
      where: { isActive: true }
    })

    const violations: CreateViolationData[] = []

    for (const policy of policies) {
      const rules = policy.rules as any as PolicyRule[]
      
      for (const rule of rules) {
        const isViolation = this.checkRule(product, rule)
        
        if (isViolation) {
          violations.push({
            policyId: policy.id,
            productId: product.id,
            vendorId: product.vendorId,
            reason: rule.message,
            details: {
              rule: rule,
              productData: {
                name: product.name,
                price: product.price,
                description: product.description
              }
            },
            flaggedBy: "system"
          })

          // Auto-flag if policy has auto-enforce enabled
          if (policy.autoEnforce && autoFlag) {
            await this.createViolation({
              policyId: policy.id,
              productId: product.id,
              vendorId: product.vendorId,
              reason: rule.message,
              details: {
                rule: rule,
                autoFlagged: true
              },
              flaggedBy: "system"
            })
          }
        }
      }
    }

    return {
      isCompliant: violations.length === 0,
      violations: violations
    }
  }

  /**
   * Check if a product violates a specific rule
   */
  private static checkRule(product: any, rule: PolicyRule): boolean {
    switch (rule.type) {
      case "PROHIBITED_KEYWORD":
        const text = `${product.name} ${product.description || ""}`.toLowerCase()
        const keywords = rule.value as string[]
        return keywords.some(keyword => text.includes(keyword.toLowerCase()))

      case "PRICE_LIMIT":
        const price = parseFloat(product.price.toString())
        if (rule.condition === "MAX") {
          return price > rule.value
        } else if (rule.condition === "MIN") {
          return price < rule.value
        }
        return false

      case "REQUIRED_FIELD":
        const field = rule.value as string
        return !product[field] || product[field] === ""

      case "IMAGE_REQUIRED":
        return !product.images || product.images.length === 0

      case "DESCRIPTION_LENGTH":
        const descLength = product.description?.length || 0
        if (rule.condition === "MIN") {
          return descLength < rule.value
        } else if (rule.condition === "MAX") {
          return descLength > rule.value
        }
        return false

      default:
        return false
    }
  }

  /**
   * Create a policy violation
   */
  static async createViolation(data: CreateViolationData) {
    const violation = await prisma.policyViolation.create({
      data: {
        policyId: data.policyId,
        productId: data.productId,
        vendorId: data.vendorId,
        reason: data.reason,
        details: data.details as any,
        flaggedBy: data.flaggedBy,
        status: "PENDING"
      },
      include: {
        policy: true,
        product: {
          select: {
            id: true,
            name: true,
            images: true
          }
        },
        vendor: {
          select: {
            id: true,
            businessName: true
          }
        }
      }
    })

    return violation
  }

  /**
   * Get all violations
   */
  static async getViolations(filters?: {
    status?: ViolationStatus
    vendorId?: string
    productId?: string
    policyId?: string
  }) {
    const whereClause: any = {}

    if (filters?.status) {
      whereClause.status = filters.status
    }

    if (filters?.vendorId) {
      whereClause.vendorId = filters.vendorId
    }

    if (filters?.productId) {
      whereClause.productId = filters.productId
    }

    if (filters?.policyId) {
      whereClause.policyId = filters.policyId
    }

    return await prisma.policyViolation.findMany({
      where: whereClause,
      include: {
        policy: {
          select: {
            id: true,
            name: true,
            type: true,
            severity: true
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            images: true,
            price: true
          }
        },
        vendor: {
          select: {
            id: true,
            businessName: true,
            user: {
              select: {
                email: true,
                name: true
              }
            }
          }
        },
        flaggedByUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        reviewedByUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })
  }

  /**
   * Get violation by ID
   */
  static async getViolationById(violationId: string) {
    return await prisma.policyViolation.findUnique({
      where: { id: violationId },
      include: {
        policy: true,
        product: true,
        vendor: {
          include: {
            user: true
          }
        },
        flaggedByUser: true,
        reviewedByUser: true
      }
    })
  }

  /**
   * Update a violation
   */
  static async updateViolation(violationId: string, data: UpdateViolationData, updatedBy: string) {
    const violation = await prisma.policyViolation.update({
      where: { id: violationId },
      data: {
        ...(data.status && { status: data.status }),
        ...(data.reviewedBy && { reviewedBy: data.reviewedBy }),
        ...(data.adminNotes && { adminNotes: data.adminNotes }),
        ...(data.resolvedAt && { resolvedAt: data.resolvedAt })
      },
      include: {
        policy: true,
        product: true,
        vendor: true
      }
    })

    // Log the update
    await prisma.auditLog.create({
      data: {
        userId: updatedBy,
        action: "UPDATE",
        resource: "POLICY_VIOLATION",
        resourceId: violation.id,
        details: {
          violationId: violation.id,
          productId: violation.productId,
          changes: data
        },
        ipAddress: "127.0.0.1"
      }
    })

    return violation
  }

  /**
   * Appeal a violation
   */
  static async appealViolation(violationId: string, data: AppealViolationData, vendorId: string) {
    const violation = await prisma.policyViolation.findUnique({
      where: { id: violationId }
    })

    if (!violation) {
      throw new Error("Violation not found")
    }

    if (violation.vendorId !== vendorId) {
      throw new Error("Unauthorized to appeal this violation")
    }

    const updatedViolation = await prisma.policyViolation.update({
      where: { id: violationId },
      data: {
        status: "APPEALED",
        appealMessage: data.appealMessage,
        appealDocuments: data.appealDocuments as any
      },
      include: {
        policy: true,
        product: true,
        vendor: true
      }
    })

    return updatedViolation
  }

  /**
   * Resolve a violation
   */
  static async resolveViolation(violationId: string, approved: boolean, adminNotes: string, reviewedBy: string) {
    const violation = await prisma.policyViolation.update({
      where: { id: violationId },
      data: {
        status: approved ? "RESOLVED" : "REJECTED",
        reviewedBy: reviewedBy,
        adminNotes: adminNotes,
        resolvedAt: new Date()
      },
      include: {
        policy: true,
        product: true,
        vendor: true
      }
    })

    // If rejected, update product status
    if (!approved) {
      await prisma.product.update({
        where: { id: violation.productId },
        data: {
          status: "REJECTED"
        }
      })
    }

    // Log the resolution
    await prisma.auditLog.create({
      data: {
        userId: reviewedBy,
        action: "RESOLVE",
        resource: "POLICY_VIOLATION",
        resourceId: violation.id,
        details: {
          violationId: violation.id,
          productId: violation.productId,
          approved: approved,
          adminNotes: adminNotes
        },
        ipAddress: "127.0.0.1"
      }
    })

    return violation
  }

  /**
   * Get violation statistics
   */
  static async getViolationStats(vendorId?: string) {
    const whereClause: any = vendorId ? { vendorId } : {}

    const [total, pending, underReview, resolved, appealed, rejected] = await Promise.all([
      prisma.policyViolation.count({ where: whereClause }),
      prisma.policyViolation.count({ where: { ...whereClause, status: "PENDING" } }),
      prisma.policyViolation.count({ where: { ...whereClause, status: "UNDER_REVIEW" } }),
      prisma.policyViolation.count({ where: { ...whereClause, status: "RESOLVED" } }),
      prisma.policyViolation.count({ where: { ...whereClause, status: "APPEALED" } }),
      prisma.policyViolation.count({ where: { ...whereClause, status: "REJECTED" } })
    ])

    return {
      total,
      pending,
      underReview,
      resolved,
      appealed,
      rejected
    }
  }
}
