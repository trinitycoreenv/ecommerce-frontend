"use client"

import React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Store, CheckCircle, AlertCircle, Eye, EyeOff, Mail, Lock, User, Building, MapPin, FileText, Calendar, Globe, Phone } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function VendorRegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    businessName: "",
    businessAddress: "",
    taxId: "",
    businessLicense: "",
    businessLicenseExpiry: "",
    website: "",
    businessDescription: "",
    businessType: "",
    phone: ""
  })
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { register, user, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  // Redirect authenticated users to their appropriate dashboard
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      const redirectMap: Record<string, string> = {
        ADMIN: "/admin",
        VENDOR: "/vendor", 
        CUSTOMER: "/shop",
        FINANCE_ANALYST: "/finance",
        OPERATIONS_MANAGER: "/operations",
      }
      
      const redirectPath = redirectMap[user.role] || "/"
      router.push(redirectPath)
    }
  }, [authLoading, isAuthenticated, user, router])

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render the form if user is authenticated (will redirect)
  if (isAuthenticated && user) {
    return null
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const validateField = (field: string, value: string) => {
    const newErrors = { ...errors }
    
    switch (field) {
      case 'name':
        if (!value.trim()) {
          newErrors.name = "Full name is required"
        } else if (value.trim().length < 2) {
          newErrors.name = "Name must be at least 2 characters"
        } else {
          delete newErrors.name
        }
        break
        
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!value.trim()) {
          newErrors.email = "Email address is required"
        } else if (!emailRegex.test(value)) {
          newErrors.email = "Please enter a valid email address"
        } else {
          delete newErrors.email
        }
        break
        
      case 'password':
        if (!value) {
          newErrors.password = "Password is required"
        } else if (value.length < 8) {
          newErrors.password = "Password must be at least 8 characters"
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          newErrors.password = "Password must contain uppercase, lowercase, and number"
        } else {
          delete newErrors.password
        }
        break
        
      case 'confirmPassword':
        if (!value) {
          newErrors.confirmPassword = "Please confirm your password"
        } else if (value !== formData.password) {
          newErrors.confirmPassword = "Passwords do not match"
        } else {
          delete newErrors.confirmPassword
        }
        break
        
      case 'businessName':
        if (!value.trim()) {
          newErrors.businessName = "Business name is required"
        } else {
          delete newErrors.businessName
        }
        break
        
      case 'businessAddress':
        if (!value.trim()) {
          newErrors.businessAddress = "Business address is required"
        } else {
          delete newErrors.businessAddress
        }
        break
        
      case 'taxId':
        if (!value.trim()) {
          newErrors.taxId = "Tax ID is required"
        } else {
          delete newErrors.taxId
        }
        break
        
      case 'businessType':
        if (!value) {
          newErrors.businessType = "Business type is required"
        } else {
          delete newErrors.businessType
        }
        break
    }
    
    setErrors(newErrors)
  }

  const validateStep1 = () => {
    const { name, email, password, confirmPassword } = formData
    let isValid = true
    
    validateField('name', name)
    validateField('email', email)
    validateField('password', password)
    validateField('confirmPassword', confirmPassword)
    
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      isValid = false
    }
    
    if (password.length < 8 || password !== confirmPassword) {
      isValid = false
    }
    
    return isValid
  }

  const validateStep2 = () => {
    const { businessName, businessAddress, taxId, businessType } = formData
    let isValid = true
    
    validateField('businessName', businessName)
    validateField('businessAddress', businessAddress)
    validateField('taxId', taxId)
    validateField('businessType', businessType)
    
    if (!businessName.trim() || !businessAddress.trim() || !taxId.trim() || !businessType) {
      isValid = false
    }
    
    return isValid
  }

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2)
    } else if (step === 2 && validateStep2()) {
      setStep(3)
    }
  }

  const handleSubmit = async () => {
    if (!validateStep1() || !validateStep2()) {
      return
    }

    setIsLoading(true)
    
    try {
      const response = await register({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: "VENDOR",
        businessName: formData.businessName,
        businessAddress: formData.businessAddress,
        taxId: formData.taxId,
        website: formData.website,
        businessDescription: formData.businessDescription,
        businessType: formData.businessType,
        businessLicense: formData.businessLicense,
        businessLicenseExpiry: formData.businessLicenseExpiry
      })

      toast({
        title: "Registration Successful!",
        description: "Welcome to our platform! Redirecting to your dashboard...",
      })
      // Redirect directly to vendor dashboard
      setTimeout(() => {
        router.push("/vendor")
      }, 1000)
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4">
      <div className="container mx-auto max-w-2xl py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/register" className="inline-flex items-center text-muted-foreground hover:text-primary mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to role selection
          </Link>
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full mr-4">
              <Store className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Vendor Registration</h1>
          </div>
          <p className="text-muted-foreground max-w-md mx-auto">
            Join our platform and start selling your products to thousands of customers
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((stepNumber) => (
              <React.Fragment key={stepNumber}>
                <div className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200",
                  step >= stepNumber 
                    ? 'bg-primary text-primary-foreground border-primary' 
                    : 'bg-background text-muted-foreground border-muted'
                )}>
                  {step > stepNumber ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <span className="font-semibold">{stepNumber}</span>
                  )}
            </div>
                {stepNumber < 3 && (
                  <div className={cn(
                    "w-16 h-1 rounded-full transition-all duration-200",
                    step > stepNumber ? 'bg-primary' : 'bg-muted'
                  )} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {step === 1 && "Personal Information"}
              {step === 2 && "Business Information"}
              {step === 3 && "Review & Submit"}
            </CardTitle>
            <CardDescription>
              {step === 1 && "Tell us about yourself"}
              {step === 2 && "Tell us about your business"}
              {step === 3 && "Review your information before submitting"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Personal Information */}
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Full Name *
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    onBlur={() => validateField('name', formData.name)}
                    className={cn(
                      "autofill:bg-background autofill:text-foreground",
                      errors.name && "border-destructive focus-visible:ring-destructive"
                    )}
                  />
                  {errors.name && (
                    <Alert variant="destructive" className="py-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-sm">{errors.name}</AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    onBlur={() => validateField('email', formData.email)}
                    className={cn(
                      "autofill:bg-background autofill:text-foreground",
                      errors.email && "border-destructive focus-visible:ring-destructive"
                    )}
                  />
                  {errors.email && (
                    <Alert variant="destructive" className="py-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-sm">{errors.email}</AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Password *
                  </Label>
                  <div className="relative">
                  <Input
                    id="password"
                      type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                      onBlur={() => validateField('password', formData.password)}
                      className={cn(
                        "autofill:bg-background autofill:text-foreground",
                        errors.password && "border-destructive focus-visible:ring-destructive pr-10"
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {errors.password ? (
                    <Alert variant="destructive" className="py-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-sm">{errors.password}</AlertDescription>
                    </Alert>
                  ) : (
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>Password requirements:</p>
                      <ul className="list-disc list-inside space-y-0.5 ml-2">
                        <li className={cn(formData.password.length >= 8 ? "text-green-600" : "text-muted-foreground")}>
                          At least 8 characters
                        </li>
                        <li className={cn(/(?=.*[a-z])/.test(formData.password) ? "text-green-600" : "text-muted-foreground")}>
                          One lowercase letter
                        </li>
                        <li className={cn(/(?=.*[A-Z])/.test(formData.password) ? "text-green-600" : "text-muted-foreground")}>
                          One uppercase letter
                        </li>
                        <li className={cn(/(?=.*\d)/.test(formData.password) ? "text-green-600" : "text-muted-foreground")}>
                          One number
                        </li>
                      </ul>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Confirm Password *
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                      onBlur={() => validateField('confirmPassword', formData.confirmPassword)}
                      className={cn(
                        "autofill:bg-background autofill:text-foreground",
                        errors.confirmPassword && "border-destructive focus-visible:ring-destructive pr-10"
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {errors.confirmPassword && (
                    <Alert variant="destructive" className="py-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-sm">{errors.confirmPassword}</AlertDescription>
                    </Alert>
                  )}
                </div>
              </>
            )}

            {/* Step 2: Business Information */}
            {step === 2 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="businessName" className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Business Name *
                  </Label>
                  <Input
                    id="businessName"
                    type="text"
                    placeholder="Enter your business name"
                    value={formData.businessName}
                    onChange={(e) => handleInputChange("businessName", e.target.value)}
                    onBlur={() => validateField('businessName', formData.businessName)}
                    className={cn(
                      "autofill:bg-background autofill:text-foreground",
                      errors.businessName && "border-destructive focus-visible:ring-destructive"
                    )}
                  />
                  {errors.businessName && (
                    <Alert variant="destructive" className="py-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-sm">{errors.businessName}</AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessType" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Business Type *
                  </Label>
                  <Select 
                    value={formData.businessType} 
                    onValueChange={(value) => {
                      handleInputChange("businessType", value)
                      validateField('businessType', value)
                    }}
                  >
                    <SelectTrigger className={cn(errors.businessType && "border-destructive focus:ring-destructive")}>
                      <SelectValue placeholder="Select your business type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="retail">Retail Store</SelectItem>
                      <SelectItem value="wholesale">Wholesale</SelectItem>
                      <SelectItem value="manufacturer">Manufacturer</SelectItem>
                      <SelectItem value="distributor">Distributor</SelectItem>
                      <SelectItem value="service">Service Provider</SelectItem>
                      <SelectItem value="restaurant">Restaurant/Food Service</SelectItem>
                      <SelectItem value="fashion">Fashion/Clothing</SelectItem>
                      <SelectItem value="electronics">Electronics</SelectItem>
                      <SelectItem value="home-garden">Home & Garden</SelectItem>
                      <SelectItem value="health-beauty">Health & Beauty</SelectItem>
                      <SelectItem value="sports-outdoors">Sports & Outdoors</SelectItem>
                      <SelectItem value="books-media">Books & Media</SelectItem>
                      <SelectItem value="automotive">Automotive</SelectItem>
                      <SelectItem value="jewelry">Jewelry & Accessories</SelectItem>
                      <SelectItem value="art-crafts">Arts & Crafts</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.businessType && (
                    <Alert variant="destructive" className="py-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-sm">{errors.businessType}</AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessLicense" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Business License Number
                  </Label>
                  <Input
                    id="businessLicense"
                    type="text"
                    placeholder="Enter your business license number (if applicable)"
                    value={formData.businessLicense}
                    onChange={(e) => handleInputChange("businessLicense", e.target.value)}
                    className="autofill:bg-background autofill:text-foreground"
                  />
                  <p className="text-xs text-muted-foreground">Optional - Required for certain business types</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessLicenseExpiry" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Business License Expiry Date
                  </Label>
                  <Input
                    id="businessLicenseExpiry"
                    type="date"
                    value={formData.businessLicenseExpiry}
                    onChange={(e) => handleInputChange("businessLicenseExpiry", e.target.value)}
                    className="autofill:bg-background autofill:text-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Business Website
                  </Label>
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://your-business-website.com"
                    value={formData.website}
                    onChange={(e) => handleInputChange("website", e.target.value)}
                    className="autofill:bg-background autofill:text-foreground"
                  />
                  <p className="text-xs text-muted-foreground">Optional - Help customers find you online</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessAddress" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Business Address *
                  </Label>
                  <Textarea
                    id="businessAddress"
                    placeholder="Enter your complete business address"
                    value={formData.businessAddress}
                    onChange={(e) => handleInputChange("businessAddress", e.target.value)}
                    onBlur={() => validateField('businessAddress', formData.businessAddress)}
                    className={cn(
                      "autofill:bg-background autofill:text-foreground",
                      errors.businessAddress && "border-destructive focus-visible:ring-destructive"
                    )}
                    rows={3}
                  />
                  {errors.businessAddress && (
                    <Alert variant="destructive" className="py-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-sm">{errors.businessAddress}</AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxId" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Tax ID / Business Registration Number *
                  </Label>
                  <Input
                    id="taxId"
                    type="text"
                    placeholder="Enter your tax ID or business registration number"
                    value={formData.taxId}
                    onChange={(e) => handleInputChange("taxId", e.target.value)}
                    onBlur={() => validateField('taxId', formData.taxId)}
                    className={cn(
                      "autofill:bg-background autofill:text-foreground",
                      errors.taxId && "border-destructive focus-visible:ring-destructive"
                    )}
                  />
                  {errors.taxId && (
                    <Alert variant="destructive" className="py-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-sm">{errors.taxId}</AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessDescription" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Business Description *
                  </Label>
                  <Textarea
                    id="businessDescription"
                    placeholder="Tell us about your business, products, and services"
                    value={formData.businessDescription}
                    onChange={(e) => handleInputChange("businessDescription", e.target.value)}
                    className="autofill:bg-background autofill:text-foreground"
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">Help us understand your business better</p>
                </div>
              </>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="p-6 bg-muted/30 rounded-lg border">
                  <div className="flex items-center gap-2 mb-4">
                    <User className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Personal Information</h3>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-medium">{formData.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-medium">{formData.email}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-muted/30 rounded-lg border">
                  <div className="flex items-center gap-2 mb-4">
                    <Building className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Business Information</h3>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Business Name:</span>
                      <span className="font-medium">{formData.businessName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Business Type:</span>
                      <Badge variant="secondary" className="capitalize">{formData.businessType}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax ID:</span>
                      <span className="font-medium">{formData.taxId}</span>
                </div>
                    <div className="space-y-1">
                      <span className="text-muted-foreground">Address:</span>
                      <p className="font-medium text-sm">{formData.businessAddress}</p>
                    </div>
                    {formData.website && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Website:</span>
                        <span className="font-medium text-primary">{formData.website}</span>
                      </div>
                    )}
                  </div>
                </div>

                <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    <strong>Welcome to our platform!</strong> Your vendor account will be created immediately and you can start selling right away.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                disabled={step === 1}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </Button>
              
              {step < 3 ? (
                <Button onClick={handleNext} className="flex items-center gap-2">
                  Next
                  <ArrowLeft className="h-4 w-4 rotate-180" />
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit} 
                  disabled={isLoading}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Create Account
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Terms and Privacy */}
        <div className="text-center mt-6 text-body text-sm text-muted-foreground">
          By creating an account, you agree to our{" "}
          <Link href="/terms" className="text-primary hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  )
}
