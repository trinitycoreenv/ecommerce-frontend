import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { AppError } from './types'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

export interface JWTPayload {
  userId: string
  email: string
  role: string
  iat?: number
  exp?: number
}

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12
    return bcrypt.hash(password, saltRounds)
  }

  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword)
  }

  static generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    } as jwt.SignOptions)
  }

  static verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as JWTPayload
    } catch (error) {
      throw new AppError('Invalid or expired token', 401)
    }
  }

  static extractTokenFromHeader(authHeader: string | null): string {
    if (!authHeader) {
      throw new AppError('Authorization header is required', 401)
    }

    const parts = authHeader.split(' ')
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new AppError('Invalid authorization header format', 401)
    }

    return parts[1]
  }
}

export function requireRole(allowedRoles: string[]) {
  return (userRole: string): boolean => {
    return allowedRoles.includes(userRole)
  }
}

export function requireAdmin() {
  return requireRole(["ADMIN"])
}

export function requireVendor() {
  return requireRole(["VENDOR", "ADMIN"])
}

export function requireFinance() {
  return requireRole(["FINANCE_ANALYST", "ADMIN"])
}

export function requireOperations() {
  return requireRole(["OPERATIONS_MANAGER", "ADMIN"])
}

export function requireCustomer() {
  return requireRole(["CUSTOMER", "ADMIN"])
}
