import { NextRequest, NextResponse } from 'next/server'
import { withAdmin, AuthenticatedRequest } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/middleware'
import { ProductStatus } from '@prisma/client'

interface ApproveProductRequest {
  productId: string
  action: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES'
  notes?: string
  changes?: string[]
}

async function approveProduct(request: AuthenticatedRequest) {
  try {
    const body: ApproveProductRequest = await request.json()
    const { productId, action, notes, changes } = body

    if (!request.user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Get the product with vendor information
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        vendor: {
          include: {
            user: {
              select: {
                email: true,
                name: true
              }
            }
          }
        },
        category: {
          select: {
            name: true
          }
        }
      }
    })

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    // Determine new status based on action
    let newStatus: ProductStatus
    switch (action) {
      case 'APPROVE':
        newStatus = ProductStatus.APPROVED
        break
      case 'REJECT':
        newStatus = ProductStatus.REJECTED
        break
      case 'REQUEST_CHANGES':
        newStatus = ProductStatus.DRAFT
        break
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }

    // Update product status
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        status: newStatus,
        metadata: {
          ...(product.metadata as any || {}),
          approvalNotes: notes,
          requestedChanges: changes,
          approvedBy: request.user.userId,
          approvedAt: new Date().toISOString()
        }
      },
      include: {
        vendor: {
          include: {
            user: {
              select: {
                email: true,
                name: true
              }
            }
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

    // Log the approval action
    await prisma.auditLog.create({
      data: {
        userId: request.user.userId,
        action: `PRODUCT_${action}`,
        resource: 'PRODUCT',
        resourceId: productId,
        details: {
          productName: product.name,
          vendorName: product.vendor.businessName,
          previousStatus: product.status,
          newStatus: newStatus,
          notes: notes,
          changes: changes
        }
      }
    })

    // Send notification email to vendor
    try {
      const { EmailService } = await import('@/lib/email')
      
      let subject = ''
      let statusMessage = ''
      
      switch (action) {
        case 'APPROVE':
          subject = `Product Approved: ${product.name}`
          statusMessage = 'Your product has been approved and is now live on the platform!'
          break
        case 'REJECT':
          subject = `Product Rejected: ${product.name}`
          statusMessage = 'Your product has been rejected and will not be published.'
          break
        case 'REQUEST_CHANGES':
          subject = `Product Changes Required: ${product.name}`
          statusMessage = 'Your product requires changes before it can be approved.'
          break
      }

      await EmailService.sendEmail({
        to: product.vendor.user.email,
        subject: subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Product Review Update</h2>
            <p>Hello ${product.vendor.user.name},</p>
            <p>${statusMessage}</p>
            
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3>Product Details:</h3>
              <p><strong>Name:</strong> ${product.name}</p>
              <p><strong>Category:</strong> ${product.category.name}</p>
              <p><strong>Price:</strong> $${product.price}</p>
            </div>
            
            ${notes ? `
              <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3>Admin Notes:</h3>
                <p>${notes}</p>
              </div>
            ` : ''}
            
            ${changes && changes.length > 0 ? `
              <div style="background: #d1ecf1; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3>Requested Changes:</h3>
                <ul>
                  ${changes.map(change => `<li>${change}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
            
            <p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/vendor/products" 
                 style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                View Your Products
              </a>
            </p>
            
            <p>Best regards,<br>The E-commerce Platform Team</p>
          </div>
        `,
        text: `
          Product Review Update
          
          Hello ${product.vendor.user.name},
          
          ${statusMessage}
          
          Product Details:
          - Name: ${product.name}
          - Category: ${product.category.name}
          - Price: $${product.price}
          
          ${notes ? `Admin Notes: ${notes}` : ''}
          
          ${changes && changes.length > 0 ? `Requested Changes: ${changes.join(', ')}` : ''}
          
          View your products: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/vendor/products
          
          Best regards,
          The E-commerce Platform Team
        `
      })
    } catch (emailError) {
      console.error('Failed to send approval email:', emailError)
      // Don't fail the approval if email fails
    }

    return NextResponse.json({
      success: true,
      data: updatedProduct,
      message: `Product ${action.toLowerCase()}d successfully`
    })

  } catch (error) {
    console.error('Product approval error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return handleApiError(error)
  }
}

export const POST = withAdmin(approveProduct)
