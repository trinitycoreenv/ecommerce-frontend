"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { 
  CheckCircle, 
  Store, 
  Upload, 
  FileText, 
  Globe, 
  MapPin,
  Building,
  ArrowRight,
  ArrowLeft
} from "lucide-react"

export default function VendorOnboardingPage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [profileData, setProfileData] = useState({
    businessDescription: "",
    website: "",
    socialMedia: {
      facebook: "",
      instagram: "",
      twitter: ""
    },
    businessHours: {
      monday: { open: "09:00", close: "17:00", closed: false },
      tuesday: { open: "09:00", close: "17:00", closed: false },
      wednesday: { open: "09:00", close: "17:00", closed: false },
      thursday: { open: "09:00", close: "17:00", closed: false },
      friday: { open: "09:00", close: "17:00", closed: false },
      saturday: { open: "10:00", close: "16:00", closed: false },
      sunday: { open: "", close: "", closed: true }
    },
    shippingPolicy: "",
    returnPolicy: "",
    customerServiceInfo: ""
  })

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'VENDOR')) {
      router.push('/login')
    } else if (!isLoading && isAuthenticated && user?.role === 'VENDOR') {
      // Redirect vendor users directly to their dashboard
      router.push('/vendor')
    }
  }, [isAuthenticated, user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user || user.role !== 'VENDOR') {
    return null
  }

  const steps = [
    { id: 1, title: "Business Profile", description: "Tell us about your business" },
    { id: 2, title: "Business Hours", description: "Set your operating hours" },
    { id: 3, title: "Policies", description: "Define your policies" },
    { id: 4, title: "Complete", description: "Review and finish setup" }
  ]

  const handleInputChange = (field: string, value: any) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSocialMediaChange = (platform: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      socialMedia: {
        ...prev.socialMedia,
        [platform]: value
      }
    }))
  }

  const handleBusinessHoursChange = (day: string, field: string, value: any) => {
    setProfileData(prev => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [day]: {
          ...prev.businessHours[day as keyof typeof prev.businessHours],
          [field]: value
        }
      }
    }))
  }

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      // Here you would typically save the onboarding data to your backend
      // For now, we'll just simulate the process
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Onboarding Complete!",
        description: "Your vendor profile has been set up successfully.",
      })
      
      router.push('/vendor')
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete onboarding. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="businessDescription">Business Description *</Label>
              <Textarea
                id="businessDescription"
                placeholder="Describe your business, products, and what makes you unique..."
                value={profileData.businessDescription}
                onChange={(e) => handleInputChange("businessDescription", e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Business Website</Label>
              <Input
                id="website"
                type="url"
                placeholder="https://your-business-website.com"
                value={profileData.website}
                onChange={(e) => handleInputChange("website", e.target.value)}
              />
            </div>

            <div className="space-y-4">
              <Label>Social Media Links</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="facebook">Facebook</Label>
                  <Input
                    id="facebook"
                    placeholder="https://facebook.com/yourpage"
                    value={profileData.socialMedia.facebook}
                    onChange={(e) => handleSocialMediaChange("facebook", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    placeholder="https://instagram.com/yourpage"
                    value={profileData.socialMedia.instagram}
                    onChange={(e) => handleSocialMediaChange("instagram", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twitter">Twitter</Label>
                  <Input
                    id="twitter"
                    placeholder="https://twitter.com/yourpage"
                    value={profileData.socialMedia.twitter}
                    onChange={(e) => handleSocialMediaChange("twitter", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <Label>Business Hours</Label>
              {Object.entries(profileData.businessHours).map(([day, hours]) => (
                <div key={day} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <div className="w-20">
                    <Label className="capitalize">{day}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={!hours.closed}
                      onChange={(e) => handleBusinessHoursChange(day, "closed", !e.target.checked)}
                      className="rounded"
                    />
                    <Label>Open</Label>
                  </div>
                  {!hours.closed && (
                    <>
                      <Input
                        type="time"
                        value={hours.open}
                        onChange={(e) => handleBusinessHoursChange(day, "open", e.target.value)}
                        className="w-32"
                      />
                      <span>to</span>
                      <Input
                        type="time"
                        value={hours.close}
                        onChange={(e) => handleBusinessHoursChange(day, "close", e.target.value)}
                        className="w-32"
                      />
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="shippingPolicy">Shipping Policy *</Label>
              <Textarea
                id="shippingPolicy"
                placeholder="Describe your shipping methods, costs, and delivery times..."
                value={profileData.shippingPolicy}
                onChange={(e) => handleInputChange("shippingPolicy", e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="returnPolicy">Return Policy *</Label>
              <Textarea
                id="returnPolicy"
                placeholder="Describe your return and refund policy..."
                value={profileData.returnPolicy}
                onChange={(e) => handleInputChange("returnPolicy", e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerServiceInfo">Customer Service Information</Label>
              <Textarea
                id="customerServiceInfo"
                placeholder="How can customers contact you for support?"
                value={profileData.customerServiceInfo}
                onChange={(e) => handleInputChange("customerServiceInfo", e.target.value)}
                rows={3}
              />
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto mb-4 p-4 bg-green-100 rounded-full w-fit">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Ready to Launch!</h3>
              <p className="text-muted-foreground">
                Your vendor profile is complete. You can now start adding products and managing your business.
              </p>
            </div>

            <div className="grid gap-4">
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">Next Steps:</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Add your first products to start selling</li>
                    <li>• Set up your payment methods</li>
                    <li>• Review your vendor dashboard</li>
                    <li>• Start promoting your store</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4 mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Store className="w-8 h-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">Vendor Onboarding</CardTitle>
                <CardDescription>
                  Complete your vendor profile to start selling
                </CardDescription>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    currentStep >= step.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {currentStep > step.id ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-semibold">{step.id}</span>
                    )}
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${
                      currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-1 mx-4 ${
                      currentStep > step.id ? 'bg-primary' : 'bg-muted'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {renderStepContent()}

            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              {currentStep < steps.length ? (
                <Button onClick={nextStep}>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? "Completing..." : "Complete Setup"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
