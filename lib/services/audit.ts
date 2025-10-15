import { prisma } from "@/lib/prisma"

export interface CreateAuditLogData {
  userId: string
  action: string
  resource: string
  resourceId?: string
  details?: any
  ipAddress?: string
}

export class AuditService {
  static async createAuditLog(data: CreateAuditLogData) {
    return await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId,
        details: data.details || null,
        ipAddress: data.ipAddress || "127.0.0.1"
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true
          }
        }
      }
    })
  }

  static async getAuditLogs(filters?: {
    userId?: string
    action?: string
    resource?: string
    resourceId?: string
    dateFrom?: Date
    dateTo?: Date
    page?: number
    limit?: number
  }) {
    const where: any = {}

    if (filters?.userId) where.userId = filters.userId
    if (filters?.action) where.action = filters.action
    if (filters?.resource) where.resource = filters.resource
    if (filters?.resourceId) where.resourceId = filters.resourceId

    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {}
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom
      if (filters.dateTo) where.createdAt.lte = filters.dateTo
    }

    const page = filters?.page || 1
    const limit = filters?.limit || 50
    const skip = (page - 1) * limit

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
                name: true,
              role: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      prisma.auditLog.count({ where })
    ])

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }

  static async getAuditLogById(logId: string) {
    return await prisma.auditLog.findUnique({
      where: { id: logId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true
          }
        }
      }
    })
  }

  static async getAuditStats() {
    const totalLogs = await prisma.auditLog.count()
    
    const logsByAction = await prisma.auditLog.groupBy({
      by: ["action"],
      _count: { action: true }
    })

    const logsByEntityType = await prisma.auditLog.groupBy({
      by: ["resource"],
      _count: { resource: true }
    })

    const logsByUser = await prisma.auditLog.groupBy({
      by: ["userId"],
      _count: { userId: true },
      orderBy: {
        _count: {
          userId: "desc"
        }
      },
      take: 10
    })

    const recentLogs = await prisma.auditLog.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 10
    })

    return {
      totalLogs,
      logsByAction: logsByAction.map(group => ({
        action: group.action,
        count: group._count.action
      })),
      logsByEntityType: logsByEntityType.map(group => ({
        resource: group.resource,
        count: group._count.resource
      })),
      topUsers: logsByUser.map(group => ({
        userId: group.userId,
        count: group._count.userId
      })),
      recentLogs: recentLogs.map(log => ({
        id: log.id,
        action: log.action,
        resource: log.resource,
        resourceId: log.resourceId,
        user: log.user,
        createdAt: log.createdAt
      }))
    }
  }

  static async getUserActivity(userId: string, days: number = 30) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const logs = await prisma.auditLog.findMany({
      where: {
        userId,
        createdAt: { gte: startDate }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return logs
  }

  static async getEntityHistory(resource: string, resourceId: string) {
    const logs = await prisma.auditLog.findMany({
      where: {
        resource: resource,
        resourceId: resourceId
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return logs
  }
}
