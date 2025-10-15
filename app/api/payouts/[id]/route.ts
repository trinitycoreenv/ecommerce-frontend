import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/middleware'
import { PayoutService } from '@/lib/services/payout'

async function getPayout(request: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    const payoutId = params.id

    if (!request.user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
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
        commissions: {
          include: {
            order: {
              select: {
                orderNumber: true,
                totalPrice: true,
                createdAt: true
              }
            }
          }
        }
      }
    })

    if (!payout) {
      return NextResponse.json(
        { success: false, error: 'Payout not found' },
        { status: 404 }
      )
    }

    // Check permissions
    if (request.user.role === 'VENDOR') {
      const vendor = await prisma.vendor.findUnique({
        where: { userId: request.user.userId }
      })
      
      if (!vendor || vendor.id !== payout.vendorId) {
        return NextResponse.json(
          { success: false, error: 'Access denied' },
          { status: 403 }
        )
      }
    } else if (request.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: payout
    })

  } catch (error) {
    return handleApiError(error)
  }
}

async function updatePayout(request: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    const payoutId = params.id
    const body = await request.json()
    const { status, notes } = body

    if (!request.user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    if (request.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Only admins can update payouts' },
        { status: 403 }
      )
    }

    const payout = await prisma.payout.findUnique({
      where: { id: payoutId }
    })

    if (!payout) {
      return NextResponse.json(
        { success: false, error: 'Payout not found' },
        { status: 404 }
      )
    }

    const updatedPayout = await prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: status || payout.status,
        notes: notes || payout.notes,
        metadata: {
          ...(payout.metadata as any || {}),
          updatedBy: request.user.userId,
          updatedAt: new Date().toISOString()
        }
      },
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
        }
      }
    })

    // Log payout update
    await prisma.auditLog.create({
      data: {
        userId: request.user.userId,
        action: 'UPDATE_PAYOUT',
        resource: 'PAYOUT',
        resourceId: payoutId,
        details: {
          status: status || payout.status,
          notes: notes || payout.notes
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedPayout,
      message: 'Payout updated successfully'
    })

  } catch (error) {
    return handleApiError(error)
  }
}

async function deletePayout(request: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    const payoutId = params.id

    if (!request.user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    if (request.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Only admins can delete payouts' },
        { status: 403 }
      )
    }

    const payout = await prisma.payout.findUnique({
      where: { id: payoutId }
    })

    if (!payout) {
      return NextResponse.json(
        { success: false, error: 'Payout not found' },
        { status: 404 }
      )
    }

    if (payout.status === 'COMPLETED' || payout.status === 'PROCESSING') {
      return NextResponse.json(
        { success: false, error: 'Cannot delete completed or processing payouts' },
        { status: 400 }
      )
    }

    // Unlink commissions from payout
    await prisma.commission.updateMany({
      where: { payoutId: payoutId },
      data: { payoutId: null }
    })

    // Delete payout
    await prisma.payout.delete({
      where: { id: payoutId }
    })

    // Log payout deletion
    await prisma.auditLog.create({
      data: {
        userId: request.user.userId,
        action: 'DELETE_PAYOUT',
        resource: 'PAYOUT',
        resourceId: payoutId,
        details: {
          vendorId: payout.vendorId,
          amount: Number(payout.amount)
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Payout deleted successfully'
    })

  } catch (error) {
    return handleApiError(error)
  }
}

export const GET = withAuth(getPayout)
export const PUT = withAuth(updatePayout)
export const DELETE = withAuth(deletePayout)