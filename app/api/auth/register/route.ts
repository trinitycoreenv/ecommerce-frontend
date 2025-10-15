import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { RegisterRequest } from '@/lib/types'
import { handleApiError } from '@/lib/middleware'
import { UserRole } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const body: RegisterRequest = await request.json()
    const { email, password, name, role, businessName, businessAddress, taxId, businessLicense, businessLicenseExpiry, website, businessDescription } = body

    // Validate input
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { success: false, error: 'Email, password, name, and role are required' },
        { status: 400 }
      )
    }

    // Validate role - only allow VENDOR and CUSTOMER for public registration
    if (role !== UserRole.VENDOR && role !== UserRole.CUSTOMER) {
      return NextResponse.json(
        { success: false, error: 'Only vendor and customer registration is allowed' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const passwordHash = await AuthService.hashPassword(password)

    // Create user and vendor in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email,
          name,
          passwordHash,
          role,
          emailVerified: true // Set email as verified by default
        }
      })

      // Create vendor if role is VENDOR
      let vendor = null
      if (role === UserRole.VENDOR) {
        if (!businessName) {
          throw new Error('Business name is required for vendors')
        }

        vendor = await tx.vendor.create({
          data: {
            userId: user.id,
            businessName,
            businessAddress,
            taxId,
            businessLicense,
            businessLicenseExpiry: businessLicenseExpiry ? new Date(businessLicenseExpiry) : null,
            website,
            businessDescription,
            verificationStatus: 'APPROVED',
            status: 'ACTIVE'
          }
        })
      }

      return { user, vendor }
    })

    // Generate JWT token
    const token = AuthService.generateToken({
      userId: result.user.id,
      email: result.user.email,
      role: result.user.role
    })

    // Log registration
    await prisma.auditLog.create({
      data: {
        userId: result.user.id,
        action: 'REGISTER',
        resource: 'AUTH',
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    // Email verification is disabled - users are automatically verified

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
          emailVerified: result.user.emailVerified
        },
        token,
        vendor: result.vendor
      }
    }, { status: 201 })

  } catch (error) {
    return handleApiError(error)
  }
}
