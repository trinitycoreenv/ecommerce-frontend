import { NextRequest, NextResponse } from "next/server"
import { OrderService } from "@/lib/services/order"
import { requireAuth } from "@/lib/middleware"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await requireAuth(request)
    const orderId = params.id

    const order = await OrderService.getOrderById(orderId, user.id, user.role)

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: order
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.status || 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await requireAuth(request)
    const orderId = params.id

    const body = await request.json()
    const updateData = {
      status: body.status,
      trackingNumber: body.trackingNumber,
      notes: body.notes
    }

    const order = await OrderService.updateOrder(orderId, updateData, user.id, user.role)

    return NextResponse.json({
      success: true,
      data: order
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.status || 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await requireAuth(request)
    const orderId = params.id

    const { searchParams } = new URL(request.url)
    const reason = searchParams.get("reason")

    const order = await OrderService.cancelOrder(orderId, user.id, user.role, reason || undefined)

    return NextResponse.json({
      success: true,
      data: order
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.status || 500 }
    )
  }
}
