import { prisma } from "@/lib/prisma"
import { AuthService } from "@/lib/auth"
import type { UserRole } from "@prisma/client"

export interface CreateUserData {
  email: string
  password: string
  name: string
  role: UserRole
  phone?: string
  address?: any
}

export interface UpdateUserData {
  name?: string
  isActive?: boolean
}

export interface UpdatePasswordData {
  currentPassword: string
  newPassword: string
}

export class UserService {
  static async createUser(data: CreateUserData, createdBy: string) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    })

    if (existingUser) {
      throw new Error("User with this email already exists")
    }

    // Hash password
    const hashedPassword = await AuthService.hashPassword(data.password)

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash: hashedPassword,
        name: data.name,
        role: data.role,
        isActive: true
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    })

    // Log the creation
    await this.logUserAction("CREATE", user.id, createdBy, { role: data.role })

    return user
  }

  static async getUsers(filters?: {
    role?: UserRole
    isActive?: boolean
    search?: string
    page?: number
    limit?: number
  }) {
    const where: any = {}

    if (filters?.role) where.role = filters.role
    if (filters?.isActive !== undefined) where.isActive = filters.isActive

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } }
      ]
    }

    const page = filters?.page || 1
    const limit = filters?.limit || 20
    const skip = (page - 1) * limit

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              orders: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      prisma.user.count({ where })
    ])

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }

  static async getUserById(userId: string) {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            orders: true
          }
        }
      }
    })
  }

  static async updateUser(userId: string, data: UpdateUserData, updatedBy: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      throw new Error("User not found")
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...data
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    })

    // Log the update
    await this.logUserAction("UPDATE", userId, updatedBy, data)

    return updatedUser
  }

  static async updatePassword(userId: string, data: UpdatePasswordData, updatedBy: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      throw new Error("User not found")
    }

    // Verify current password
    const isValidPassword = await AuthService.verifyPassword(data.currentPassword, user.passwordHash)
    
    if (!isValidPassword) {
      throw new Error("Current password is incorrect")
    }

    // Hash new password
    const hashedPassword = await AuthService.hashPassword(data.newPassword)

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword }
    })

    // Log the password update
    await this.logUserAction("PASSWORD_UPDATE", userId, updatedBy, {})

    return { success: true }
  }

  static async deactivateUser(userId: string, deactivatedBy: string, reason?: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      throw new Error("User not found")
    }

    if (!user.isActive) {
      throw new Error("User is already deactivated")
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true
      }
    })

    // Log the deactivation
    await this.logUserAction("DEACTIVATE", userId, deactivatedBy, { reason })

    return updatedUser
  }

  static async activateUser(userId: string, activatedBy: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      throw new Error("User not found")
    }

    if (user.isActive) {
      throw new Error("User is already active")
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true
      }
    })

    // Log the activation
    await this.logUserAction("ACTIVATE", userId, activatedBy, {})

    return updatedUser
  }

  static async getUserStats() {
    const totalUsers = await prisma.user.count()
    const activeUsers = await prisma.user.count({ where: { isActive: true } })
    
    const usersByRole = await prisma.user.groupBy({
      by: ["role"],
      _count: { role: true },
      where: { isActive: true }
    })

    const recentUsers = await prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      },
      orderBy: { createdAt: "desc" },
      take: 5
    })

    return {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      usersByRole: usersByRole.map(group => ({
        role: group.role,
        count: group._count.role
      })),
      recentUsers
    }
  }

  static async getUserActivity(userId: string, days: number = 30) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const [orders, products, subscriptions] = await Promise.all([
      prisma.order.findMany({
        where: {
          customerId: userId,
          createdAt: { gte: startDate }
        },
        select: {
          id: true,
          status: true,
          totalPrice: true,
          createdAt: true
        },
        orderBy: { createdAt: "desc" }
      }),
      prisma.product.findMany({
        where: {
          vendorId: userId,
          createdAt: { gte: startDate }
        },
        select: {
          id: true,
          name: true,
          status: true,
          createdAt: true
        },
        orderBy: { createdAt: "desc" }
      }),
      prisma.subscription.findMany({
        where: {
          vendorId: userId,
          createdAt: { gte: startDate }
        },
        select: {
          id: true,
          tier: true,
          status: true,
          createdAt: true
        },
        orderBy: { createdAt: "desc" }
      })
    ])

    return {
      orders,
      products,
      subscriptions,
      period: `${days} days`
    }
  }

  private static async logUserAction(action: string, userId: string, performedBy: string, data: any) {
    await prisma.auditLog.create({
      data: {
        userId: performedBy,
        action: `USER_${action}`,
        resource: "USER",
        resourceId: userId,
        details: data,
        ipAddress: "127.0.0.1"
      }
    })
  }
}
