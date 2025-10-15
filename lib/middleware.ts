import { NextRequest, NextResponse } from 'next/server'
import { AuthService, JWTPayload } from './auth'
import { prisma } from './prisma'
import { AppError } from './types'

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload
}

export function withAuth(handler: (req: AuthenticatedRequest, context?: { params: any }) => Promise<NextResponse>) {
  return async (req: NextRequest, context?: { params: any }): Promise<NextResponse> => {
    try {
      const authHeader = req.headers.get('authorization')
      const token = AuthService.extractTokenFromHeader(authHeader)
      const payload = AuthService.verifyToken(token)

      // Verify user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, email: true, role: true, isActive: true }
      })

      if (!user || !user.isActive) {
        throw new AppError('User not found or inactive', 401)
      }

      // Add user to request
      const authenticatedReq = req as AuthenticatedRequest
      authenticatedReq.user = {
        userId: user.id,
        email: user.email,
        role: user.role
      }

      return handler(authenticatedReq, context)
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: error.statusCode }
        )
      }

      return NextResponse.json(
        { success: false, error: 'Authentication failed' },
        { status: 401 }
      )
    }
  }
}

export function withRole(allowedRoles: string[]) {
  return function(handler: (req: AuthenticatedRequest, context?: { params: any }) => Promise<NextResponse>) {
    return withAuth(async (req: AuthenticatedRequest, context?: { params: any }) => {
      if (!req.user) {
        return NextResponse.json(
          { success: false, error: 'User not authenticated' },
          { status: 401 }
        )
      }

      if (!allowedRoles.includes(req.user.role)) {
        return NextResponse.json(
          { success: false, error: 'Insufficient permissions' },
          { status: 403 }
        )
      }

      return handler(req, context)
    })
  }
}

export function withAdmin(handler: (req: AuthenticatedRequest, context?: { params: any }) => Promise<NextResponse>) {
  return withRole(["ADMIN"])(handler)
}

export function withVendor(handler: (req: AuthenticatedRequest, context?: { params: any }) => Promise<NextResponse>) {
  return withRole(["VENDOR", "ADMIN"])(handler)
}

export function withFinance(handler: (req: AuthenticatedRequest, context?: { params: any }) => Promise<NextResponse>) {
  return withRole(["FINANCE_ANALYST", "ADMIN"])(handler)
}

export function withOperations(handler: (req: AuthenticatedRequest, context?: { params: any }) => Promise<NextResponse>) {
  return withRole(["OPERATIONS_MANAGER", "ADMIN"])(handler)
}

export function withCustomer(handler: (req: AuthenticatedRequest, context?: { params: any }) => Promise<NextResponse>) {
  return withRole(["CUSTOMER", "ADMIN"])(handler)
}

// Utility function to get user from request
export function getUserFromRequest(req: AuthenticatedRequest): JWTPayload {
  if (!req.user) {
    throw new AppError('User not authenticated', 401)
  }
  return req.user
}

// Simple requireAuth function for API routes
export async function requireAuth(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = AuthService.extractTokenFromHeader(authHeader)
    const payload = AuthService.verifyToken(token)

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true, isActive: true }
    })

    if (!user || !user.isActive) {
      throw new AppError('User not found or inactive', 401)
    }

    return { user }
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    throw new AppError('Authentication failed', 401)
  }
}

// Error handler middleware
export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error)

  if (error instanceof AppError) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.statusCode }
    )
  }

  if (error instanceof Error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json(
    { success: false, error: 'Internal server error' },
    { status: 500 }
  )
}

// Validation middleware
export function validateRequestBody<T>(
  schema: (data: any) => T,
  handler: (req: AuthenticatedRequest, data: T) => Promise<NextResponse>
) {
  return async (req: AuthenticatedRequest): Promise<NextResponse> => {
    try {
      const body = await req.json()
      const validatedData = schema(body)
      return handler(req, validatedData)
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      )
    }
  }
}
