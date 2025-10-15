import { NextRequest, NextResponse } from 'next/server'
import { withAdmin, AuthenticatedRequest } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/middleware'
import { ProductStatus } from '@prisma/client'

async function getPendingApprovalProducts(request: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const categoryId = searchParams.get('categoryId')
    const vendorId = searchParams.get('vendorId')
    const search = searchParams.get('search')

    const whereClause: any = {
      status: ProductStatus.PENDING_APPROVAL
    }

    if (categoryId) {
      whereClause.categoryId = categoryId
    }

    if (vendorId) {
      whereClause.vendorId = vendorId
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        include: {
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
          category: {
            select: {
              id: true,
              name: true
            }
          },
          variants: {
            where: {
              isActive: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit
      }),
      prisma.product.count({ where: whereClause })
    ])

    // Get statistics
    const stats = await prisma.product.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    })

    const statusStats = stats.reduce((acc, stat) => {
      acc[stat.status] = stat._count.id
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats: {
        pending: statusStats[ProductStatus.PENDING_APPROVAL] || 0,
        approved: statusStats[ProductStatus.APPROVED] || 0,
        rejected: statusStats[ProductStatus.REJECTED] || 0,
        draft: statusStats[ProductStatus.DRAFT] || 0
      }
    })

  } catch (error) {
    return handleApiError(error)
  }
}

export const GET = withAdmin(getPendingApprovalProducts)
