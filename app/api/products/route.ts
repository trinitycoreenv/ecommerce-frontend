import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { CreateProductRequest } from '@/lib/types'
import { handleApiError } from '@/lib/middleware'
import { ProductStatus } from '@prisma/client'

async function getProducts(request: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') as ProductStatus | null
    const categoryId = searchParams.get('categoryId')
    const vendorId = searchParams.get('vendorId')

    const whereClause: any = {}
    
    if (status) {
      whereClause.status = status
    }
    
    if (categoryId) {
      whereClause.categoryId = categoryId
    }
    
    if (vendorId) {
      whereClause.vendorId = vendorId
    }

    // Role-based filtering
    if (request.user?.role === 'VENDOR') {
      // Vendors can only see their own products
      const vendor = await prisma.vendor.findUnique({
        where: { userId: request.user.userId }
      })
      if (vendor) {
        whereClause.vendorId = vendor.id
      }
    } else if (request.user?.role === 'CUSTOMER') {
      // Customers can only see approved products
      whereClause.status = ProductStatus.APPROVED
    } else if (request.user?.role === 'ADMIN') {
      // Admins can see all products
      // No additional filtering needed
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        include: {
          vendor: {
            select: {
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
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit
      }),
      prisma.product.count({ where: whereClause })
    ])

    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    return handleApiError(error)
  }
}

async function createProduct(request: AuthenticatedRequest) {
  try {
    // Only vendors can create products
    if (request.user?.role !== 'VENDOR') {
      return NextResponse.json(
        { success: false, error: 'Only vendors can create products' },
        { status: 403 }
      )
    }

    const body: CreateProductRequest = await request.json()
    console.log('Product creation request body:', body)
    
    const { 
      name, 
      description, 
      price, 
      categoryId, 
      sku, 
      inventory, 
      images, 
      metadata,
      weight,
      dimensions,
      tags,
      isDigital,
      requiresShipping,
      lowStockThreshold,
      variants
    } = body

    console.log('User from request:', request.user)

    if (!request.user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Validate required fields
    if (!name || !price || !categoryId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, price, categoryId' },
        { status: 400 }
      )
    }

    // Validate numeric fields
    const maxInt32 = 2147483647 // Maximum value for 32-bit signed integer
    
    if (inventory && (inventory > maxInt32 || inventory < 0)) {
      return NextResponse.json(
        { success: false, error: `Inventory must be between 0 and ${maxInt32.toLocaleString()}` },
        { status: 400 }
      )
    }

    if (weight && (weight > maxInt32 || weight < 0)) {
      return NextResponse.json(
        { success: false, error: `Weight must be between 0 and ${maxInt32.toLocaleString()}` },
        { status: 400 }
      )
    }

    if (lowStockThreshold && (lowStockThreshold > maxInt32 || lowStockThreshold < 0)) {
      return NextResponse.json(
        { success: false, error: `Low stock threshold must be between 0 and ${maxInt32.toLocaleString()}` },
        { status: 400 }
      )
    }

    // Check for duplicate SKU if provided
    if (sku) {
      const existingProduct = await prisma.product.findUnique({
        where: { sku: sku }
      })
      
      if (existingProduct) {
        return NextResponse.json(
          { success: false, error: `A product with SKU "${sku}" already exists. Please use a different SKU.` },
          { status: 400 }
        )
      }
    }

    // Validate categoryId is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(categoryId)) {
      return NextResponse.json(
        { success: false, error: `Invalid categoryId format: ${categoryId}. Expected a valid UUID.` },
        { status: 400 }
      )
    }

    // Get vendor ID
    console.log('Looking up vendor for user:', request.user.userId)
    const vendor = await prisma.vendor.findUnique({
      where: { userId: request.user.userId }
    })

    console.log('Found vendor:', vendor)

    if (!vendor) {
      return NextResponse.json(
        { success: false, error: 'Vendor profile not found. Please ensure your vendor account is properly set up.' },
        { status: 404 }
      )
    }

    // Validate category exists
    console.log('Looking up category:', categoryId)
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    })

    console.log('Found category:', category)

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found. Please select a valid category.' },
        { status: 404 }
      )
    }

    // Check if SKU is unique
    if (sku) {
      const existingProduct = await prisma.product.findUnique({
        where: { sku }
      })

      if (existingProduct) {
        return NextResponse.json(
          { success: false, error: 'Product with this SKU already exists' },
          { status: 409 }
        )
      }
    }

    console.log('Creating product with data:', {
      vendorId: vendor.id,
      categoryId,
      name,
      price,
      sku,
      inventory: inventory || 0
    })

    const product = await prisma.product.create({
      data: {
        vendorId: vendor.id,
        categoryId,
        name,
        description,
        price: parseFloat(price.toString()),
        sku,
        inventory: inventory || 0,
        images: images || [],
        metadata: metadata || {},
        weight: weight ? parseFloat(weight.toString()) : undefined,
        dimensions: dimensions || undefined,
        tags: tags || [],
        isDigital: isDigital || false,
        requiresShipping: requiresShipping !== false,
        lowStockThreshold: lowStockThreshold || 10,
        status: ProductStatus.PENDING_APPROVAL
      },
      include: {
        vendor: {
          select: {
            businessName: true
          }
        },
        category: {
          select: {
            name: true
          }
        },
        variants: true
      }
    })

    console.log('Product created successfully:', product.id)

    // Create variants if provided
    if (variants && variants.length > 0) {
      await Promise.all(
        variants.map(variant =>
          prisma.productVariant.create({
            data: {
              productId: product.id,
              name: variant.name,
              sku: variant.sku,
              price: variant.price ? parseFloat(variant.price.toString()) : undefined,
              inventory: variant.inventory,
              attributes: variant.attributes,
              images: variant.images || [],
              isActive: variant.isActive !== false
            }
          })
        )
      )
    }

    // Log product creation
    await prisma.auditLog.create({
      data: {
        userId: request.user.userId,
        action: 'CREATE_PRODUCT',
        resource: 'PRODUCT',
        resourceId: product.id,
        details: { productName: product.name, price: product.price }
      }
    })

    return NextResponse.json({
      success: true,
      data: product
    }, { status: 201 })

  } catch (error) {
    console.error('Product creation error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    
    // Handle specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint failed')) {
        if (error.message.includes('sku')) {
          return NextResponse.json(
            { success: false, error: 'A product with this SKU already exists. Please use a different SKU.' },
            { status: 400 }
          )
        }
      }
    }
    
    return handleApiError(error)
  }
}

export const GET = withAuth(getProducts)
export const POST = withAuth(createProduct)
