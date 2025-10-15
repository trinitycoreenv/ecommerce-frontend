"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { apiClient, type User } from "./api-client"

export type UserRole = "ADMIN" | "VENDOR" | "CUSTOMER" | "FINANCE_ANALYST" | "OPERATIONS_MANAGER"

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<{ user: User; token: string }>
  register: (userData: {
    email: string
    password: string
    name: string
    role: string
    businessName?: string
    businessAddress?: string
    taxId?: string
    businessLicense?: string
    businessLicenseExpiry?: string
    website?: string
    businessDescription?: string
    businessType?: string
  }) => Promise<{ user: User; token: string }>
  logout: () => Promise<void>
  isAuthenticated: boolean
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for stored user and token on mount
    const initializeAuth = async () => {
      try {
        const storedUser = localStorage.getItem("user")
        const storedToken = localStorage.getItem("auth_token")
        
        if (storedUser && storedToken) {
          const userData = JSON.parse(storedUser)
          apiClient.setToken(storedToken)
          setUser(userData)
        }
      } catch (error) {
        console.error("Error initializing auth:", error)
        // Clear invalid data
        localStorage.removeItem("user")
        localStorage.removeItem("auth_token")
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.login({ email, password })
      setUser(response.user)
      return response // Return the response so we can access user data
    } catch (error) {
      console.error("Login failed:", error)
      throw error
    }
  }

  const register = async (userData: {
    email: string
    password: string
    name: string
    role: string
    businessName?: string
    businessAddress?: string
    taxId?: string
    businessLicense?: string
    businessLicenseExpiry?: string
    website?: string
    businessDescription?: string
    businessType?: string
  }) => {
    try {
      const response = await apiClient.register(userData)
      setUser(response.user)
      return response
    } catch (error) {
      console.error("Registration failed:", error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await apiClient.logout()
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
