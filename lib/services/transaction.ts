import { prisma } from "@/lib/prisma"

export interface CreateTransactionData {
  orderId?: string
  vendorId?: string
  amount: number
  description?: string
  paymentMethod?: string
  referenceId?: string
}

export interface UpdateTransactionData {
  status?: string
  description?: string
  referenceId?: string
}

export class TransactionService {
  static async createTransaction(data: CreateTransactionData, createdBy: string) {
    // Get customer ID from order if orderId is provided
    const customerId = data.orderId ? await this.getCustomerIdFromOrder(data.orderId) : createdBy
    
    const transaction = await prisma.transaction.create({
      data: {
        orderId: data.orderId || '',
        vendorId: data.vendorId || '',
        customerId: customerId,
        amount: data.amount,
        commission: 0, // Will be calculated later
        netPayout: data.amount, // Will be calculated later
        // type: "ORDER", // Field doesn't exist in schema
        paymentMethod: data.paymentMethod,
        status: "PENDING"
      },
      include: {
        order: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        vendor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    // Log the creation
    await this.logTransactionAction("CREATE", transaction.id, createdBy, data)

    return transaction
  }

  static async getTransactions(filters?: {
    status?: string
    vendorId?: string
    orderId?: string
    dateFrom?: Date
    dateTo?: Date
    page?: number
    limit?: number
  }) {
    const where: any = {}

    if (filters?.status) where.status = filters.status
    if (filters?.vendorId) where.vendorId = filters.vendorId
    if (filters?.orderId) where.orderId = filters.orderId

    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {}
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom
      if (filters.dateTo) where.createdAt.lte = filters.dateTo
    }

    const page = filters?.page || 1
    const limit = filters?.limit || 20
    const skip = (page - 1) * limit

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          order: {
            include: {
              customer: {
                select: {
                  id: true,
                name: true,
                  email: true
                }
              }
            }
          },
          vendor: {
            include: {
              user: {
                select: {
                  id: true,
                name: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      prisma.transaction.count({ where })
    ])

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }

  static async getTransactionById(transactionId: string) {
    return await prisma.transaction.findUnique({
      where: { id: transactionId },
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
                    }
                  }
                }
              }
            }
          }
        },
        vendor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                // phone: true // Field doesn't exist in schema
              }
            }
          }
        }
      }
    })
  }

  static async updateTransaction(transactionId: string, data: UpdateTransactionData, updatedBy: string) {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId }
    })

    if (!transaction) {
      throw new Error("Transaction not found")
    }

    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
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
            }
          }
        },
        vendor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    // Log the update
    await this.logTransactionAction("UPDATE", transactionId, updatedBy, data)

    return updatedTransaction
  }

  static async processPayment(transactionId: string, paymentData: {
    paymentMethod: string
    referenceId: string
    gatewayResponse?: any
  }, processedBy: string) {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId }
    })

    if (!transaction) {
      throw new Error("Transaction not found")
    }

    if (transaction.status !== "PENDING") {
      throw new Error("Transaction is not in pending status")
    }

    // In a real application, you would integrate with payment gateways here
    // For now, we'll simulate a successful payment
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: "COMPLETED",
        paymentMethod: paymentData.paymentMethod,
        // referenceId: paymentData.referenceId, // Field doesn't exist in schema
        processedAt: new Date()
      },
      include: {
        order: {
          include: {
            customer: true
          }
        },
        vendor: {
          include: {
            user: true
          }
        }
      }
    })

    // Log the payment processing
    await this.logTransactionAction("PAYMENT_PROCESSED", transactionId, processedBy, paymentData)

    return updatedTransaction
  }

  static async refundTransaction(transactionId: string, refundData: {
    amount?: number
    reason: string
    referenceId?: string
  }, refundedBy: string) {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId }
    })

    if (!transaction) {
      throw new Error("Transaction not found")
    }

    if (transaction.status !== "COMPLETED") {
      throw new Error("Only completed transactions can be refunded")
    }

    const refundAmount = refundData.amount || transaction.amount

    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: "REFUNDED",
        // refundAmount, // Field doesn't exist in schema
        // refundReason: refundData.reason, // Field doesn't exist
        // refundReferenceId: refundData.referenceId, // Field doesn't exist
        // refundedAt: new Date() // Field doesn't exist in schema
      },
      include: {
        order: {
          include: {
            customer: true
          }
        },
        vendor: {
          include: {
            user: true
          }
        }
      }
    })

    // Log the refund
    await this.logTransactionAction("REFUND", transactionId, refundedBy, refundData)

    return updatedTransaction
  }

  static async getTransactionStats() {
    const totalTransactions = await prisma.transaction.count()
    
    const transactionsByStatus = await prisma.transaction.groupBy({
      by: ["status"],
      _count: { status: true },
      _sum: { amount: true }
    })

    // Note: Transaction model doesn't have a 'type' field in the current schema
    // const transactionsByType = await prisma.transaction.groupBy({
    //   by: ["type"],
    //   _count: { type: true },
    //   _sum: { amount: true }
    // })

    const totalRevenue = await prisma.transaction.aggregate({
      where: { status: "COMPLETED" },
      _sum: { amount: true }
    })

    const totalRefunds = await prisma.transaction.aggregate({
      where: { status: "REFUNDED" },
      _sum: { amount: true } // Using amount instead of refundAmount
    })

    const recentTransactions = await prisma.transaction.findMany({
      include: {
        order: {
          include: {
            customer: {
              select: {
                name: true
              }
            }
          }
        },
        vendor: {
          include: {
            user: {
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
      totalTransactions,
      totalRevenue: totalRevenue._sum.amount || 0,
      totalRefunds: totalRefunds._sum.amount || 0,
      transactionsByStatus: transactionsByStatus.map((group: any) => ({
        status: group.status,
        count: group._count.status,
        amount: group._sum.amount || 0
      })),
      // transactionsByType: transactionsByType.map(group => ({
      //   type: group.type,
      //   count: group._count.type,
      //   amount: group._sum.amount || 0
      // })),
      recentTransactions: recentTransactions.map((transaction: any) => ({
        id: transaction.id,
        amount: transaction.amount,
        status: transaction.status,
        customerName: transaction.order ? 
          `${transaction.order.customer.firstName} ${transaction.order.customer.lastName}` : 
          null,
        vendorName: transaction.vendor ? 
          `${transaction.vendor.user.firstName} ${transaction.vendor.user.lastName}` : 
          null,
        createdAt: transaction.createdAt
      }))
    }
  }

  private static async logTransactionAction(action: string, transactionId: string, performedBy: string, data: any) {
    await prisma.auditLog.create({
      data: {
        userId: performedBy,
        action: `TRANSACTION_${action}`,
        resource: "Transaction",
        resourceId: transactionId,
        // entityType: "Transaction", // Field doesn't exist in schema
        // entityId: transactionId, // Field doesn't exist in schema
        details: data,
        ipAddress: "127.0.0.1"
      }
    })
  }

  private static async getCustomerIdFromOrder(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { customerId: true }
    })
    return order?.customerId || ""
  }
}
