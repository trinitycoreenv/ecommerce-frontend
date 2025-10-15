import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/middleware'
import { OrderStatus } from '@prisma/client'

async function getOrders(request: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const vendorId = searchParams.get('vendorId')

    if (!request.user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    const whereClause: any = {}

    // Role-based filtering
    if (request.user.role === 'CUSTOMER') {
      whereClause.customerId = request.user.userId
    } else if (request.user.role === 'VENDOR') {
      // Get vendor ID for the user
      const vendor = await prisma.vendor.findUnique({
        where: { userId: request.user.userId }
      })
      
      if (!vendor) {
        return NextResponse.json(
          { success: false, error: 'Vendor profile not found' },
          { status: 404 }
        )
      }
      
      whereClause.vendorId = vendor.id
    } else if (request.user.role === 'ADMIN') {
      // Admin can see all orders or filter by vendor
      if (vendorId) {
        whereClause.vendorId = vendorId
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Additional filters
    if (status) {
      whereClause.status = status
    }

    if (search) {
      whereClause.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { 
          orderItems: {
            some: {
              product: {
                name: { contains: search, mode: 'insensitive' }
              }
            }
          }
        }
      ]
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: whereClause,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          vendor: {
            select: {
              id: true,
              businessName: true,
              user: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  images: true,
                  vendor: {
                    select: {
                      businessName: true
                    }
                  }
                }
              },
              variant: {
                select: {
                  id: true,
                  name: true,
                  attributes: true
                }
              }
            }
          },
          transactions: {
            select: {
              id: true,
              status: true,
              amount: true,
              type: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit
      }),
      prisma.order.count({ where: whereClause })
    ])


    // Get order statistics
    const stats = await prisma.order.groupBy({
      by: ['status'],
      _count: {
        id: true
      },
      where: whereClause
    })

    const statusStats = stats.reduce((acc, stat) => {
      acc[stat.status] = stat._count.id
      return acc
    }, {} as Record<string, number>)

    // Calculate totals
    const totalRevenue = await prisma.order.aggregate({
      where: {
        ...whereClause,
        status: 'DELIVERED' // Use DELIVERED instead of COMPLETED
      },
      _sum: {
        totalPrice: true
      }
    })

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats: {
        ...statusStats,
        totalRevenue: totalRevenue._sum.totalPrice || 0
      }
    })

  } catch (error) {
    console.error('Orders API Error:', error)
    console.error('User:', request.user)
    return handleApiError(error)
  }
}

export const GET = withAuth(getOrders)