'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { VerificationForm } from '@/components/business-verification/verification-form'
import { useToast } from '@/hooks/use-toast'

export default function BusinessVerification() {
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'form' | 'submitted' | 'pending'>('form')
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Check if user has selected a plan
    const selectedPlanId = sessionStorage.getItem('selectedPlanId')
    if (!selectedPlanId) {
      router.push('/register/vendor/plan-selection')
    }
  }, [router])

  const handleSubmit = async (data: any) => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/business-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        setStep('submitted')
        toast({
          title: "Verification Submitted",
          description: "Your business verification has been submitted for review"
        })
      } else {
        const error = await response.json()
        toast({
          title: "Submission Failed",
          description: error.error || "Failed to submit verification",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error submitting verification:', error)
      toast({
        title: "Error",
        description: "Failed to submit verification",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    router.push('/register/vendor/plan-selection')
  }

  const handleContinue = () => {
    // Clear the selected plan from session storage
    sessionStorage.removeItem('selectedPlanId')
    router.push('/register/vendor/complete')
  }

  if (step === 'submitted') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card className="text-center">
            <CardContent className="pt-8 pb-8">
              <div className="flex justify-center mb-6">
                <div className="rounded-full bg-green-100 p-4">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Verification Submitted Successfully!
              </h1>
              
              <p className="text-lg text-gray-600 mb-6">
                Your business verification has been submitted for review. Our team will review your documents and get back to you within 1-2 business days.
              </p>

              <div className="bg-blue-50 p-6 rounded-lg mb-6">
                <h3 className="font-semibold text-blue-900 mb-3">What happens next?</h3>
                <div className="space-y-3 text-left">
                  <div className="flex items-start space-x-3">
                    <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900">Review Process</p>
                      <p className="text-sm text-blue-800">Our team will review your documents and business information</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900">Approval Notification</p>
                      <p className="text-sm text-blue-800">You'll receive an email once your verification is approved</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900">Additional Information</p>
                      <p className="text-sm text-blue-800">If needed, we may request additional documents</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Button onClick={handleContinue} size="lg" className="w-full">
                  Complete Registration
                </Button>
                <Button variant="outline" onClick={handleBack} className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Plan Selection
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Plan Selection
          </Button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Business Verification
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Complete your business verification to start selling on our platform. This process helps us ensure the safety and legitimacy of all vendors.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                1
              </div>
              <span className="text-sm font-medium">Plan Selection</span>
            </div>
            <div className="w-8 h-0.5 bg-primary"></div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                2
              </div>
              <span className="text-sm font-medium">Business Verification</span>
            </div>
            <div className="w-8 h-0.5 bg-gray-300"></div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-sm font-medium">
                3
              </div>
              <span className="text-sm text-gray-500">Complete</span>
            </div>
          </div>
        </div>

        {/* Verification Form */}
        <Card>
          <CardContent className="p-8">
            <VerificationForm
              onSubmit={handleSubmit}
              loading={loading}
            />
          </CardContent>
        </Card>

        {/* Information Cards */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Secure & Private</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Your business information is encrypted and stored securely. We never share your data with third parties.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Review</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Our team typically reviews business verifications within 1-2 business days.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">24/7 Support</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Need help? Our support team is available 24/7 to assist with your verification.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
