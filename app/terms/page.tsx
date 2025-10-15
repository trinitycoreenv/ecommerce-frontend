"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, FileText, Shield, Users, CreditCard, Truck } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
          
          <div className="flex items-center gap-3 mb-4">
            <FileText className="h-8 w-8 text-primary" />
            <h1 className="text-hero">Terms of Service</h1>
          </div>
          
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="outline">Last Updated: {new Date().toLocaleDateString()}</Badge>
            <Badge variant="secondary">Version 1.0</Badge>
          </div>
          
          <p className="text-subtitle">
            These Terms of Service govern your use of our ecommerce platform and marketplace services.
          </p>
        </div>

        <div className="space-y-8">
          {/* 1. Acceptance of Terms */}
          <Card>
            <CardHeader>
              <CardTitle className="text-heading flex items-center gap-2">
                <Shield className="h-5 w-5" />
                1. Acceptance of Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-body">
                By accessing or using our ecommerce platform ("Platform"), you agree to be bound by these Terms of Service ("Terms"). 
                If you do not agree to these Terms, you may not use our Platform.
              </p>
              <p className="text-body">
                These Terms apply to all users of the Platform, including customers, vendors, and other service providers.
              </p>
            </CardContent>
          </Card>

          {/* 2. Platform Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-heading flex items-center gap-2">
                <Users className="h-5 w-5" />
                2. Platform Description
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-body">
                Our Platform is a multi-vendor ecommerce marketplace that connects customers with vendors to facilitate the sale 
                and purchase of goods and services. We provide:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Online marketplace for product listings and sales</li>
                <li>Payment processing and transaction management</li>
                <li>Order fulfillment and shipping coordination</li>
                <li>Customer support and dispute resolution</li>
                <li>Analytics and reporting tools for vendors</li>
                <li>Subscription-based vendor services</li>
              </ul>
            </CardContent>
          </Card>

          {/* 3. User Accounts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-heading">3. User Accounts and Registration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-body">
                To use certain features of the Platform, you must create an account. You are responsible for:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Providing accurate and complete information during registration</li>
                <li>Maintaining the security of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized use</li>
              </ul>
              <p className="text-body">
                We reserve the right to suspend or terminate accounts that violate these Terms or engage in fraudulent activity.
              </p>
            </CardContent>
          </Card>

          {/* 4. Vendor Terms */}
          <Card>
            <CardHeader>
              <CardTitle className="text-heading">4. Vendor Terms and Conditions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <h4 className="text-heading">4.1 Vendor Registration</h4>
              <p className="text-body">
                Vendors must complete our verification process and provide valid business documentation. 
                We reserve the right to approve or reject vendor applications at our discretion.
              </p>
              
              <h4 className="text-heading">4.2 Product Listings</h4>
              <p className="text-body">Vendors are responsible for:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Accurate product descriptions and pricing</li>
                <li>Maintaining adequate inventory levels</li>
                <li>Complying with all applicable laws and regulations</li>
                <li>Obtaining necessary licenses and permits</li>
                <li>Product quality and safety standards</li>
              </ul>

              <h4 className="text-heading">4.3 Commission and Fees</h4>
              <p className="text-body">
                Vendors agree to pay commission fees as outlined in their subscription plan. 
                Commission rates vary by subscription tier and are subject to change with 30 days notice.
              </p>

              <h4 className="text-heading">4.4 Prohibited Items</h4>
              <p className="text-body">Vendors may not sell:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Illegal or restricted items</li>
                <li>Counterfeit or unauthorized goods</li>
                <li>Items that infringe on intellectual property rights</li>
                <li>Hazardous materials without proper documentation</li>
                <li>Items that violate our community standards</li>
              </ul>
            </CardContent>
          </Card>

          {/* 5. Customer Terms */}
          <Card>
            <CardHeader>
              <CardTitle>5. Customer Terms and Conditions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <h4 className="font-semibold">5.1 Purchases</h4>
              <p>
                All purchases are subject to availability and vendor acceptance. Prices are set by vendors 
                and may change without notice. We are not responsible for pricing errors.
              </p>

              <h4 className="font-semibold">5.2 Payment</h4>
              <p>
                Payment is processed securely through our payment partners. We accept major credit cards, 
                debit cards, and other approved payment methods.
              </p>

              <h4 className="font-semibold">5.3 Returns and Refunds</h4>
              <p>
                Return and refund policies are set by individual vendors. Customers should review vendor 
                policies before making purchases. We facilitate dispute resolution when necessary.
              </p>
            </CardContent>
          </Card>

          {/* 6. Payment and Billing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                6. Payment and Billing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                We use secure third-party payment processors to handle transactions. By using our Platform, 
                you agree to our payment terms and the terms of our payment processors.
              </p>
              <p>
                For vendors, subscription fees are billed according to your selected plan. 
                Commission fees are deducted from sales proceeds before payout.
              </p>
              <p>
                All prices are displayed in Philippine Peso (₱) unless otherwise specified. 
                Taxes and shipping costs are calculated at checkout.
              </p>
            </CardContent>
          </Card>

          {/* 7. Shipping and Fulfillment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                7. Shipping and Fulfillment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Shipping is handled by vendors or third-party logistics providers. 
                Delivery times and costs vary by vendor and shipping method.
              </p>
              <p>
                We provide tracking information when available. Delays in shipping are the responsibility 
                of the vendor or shipping provider, not the Platform.
              </p>
              <p>
                International shipping may be subject to customs duties and taxes, 
                which are the customer's responsibility.
              </p>
            </CardContent>
          </Card>

          {/* 8. Intellectual Property */}
          <Card>
            <CardHeader>
              <CardTitle>8. Intellectual Property Rights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                The Platform and its content are protected by intellectual property laws. 
                You may not copy, modify, or distribute our content without permission.
              </p>
              <p>
                Vendors retain ownership of their product listings and content, but grant us 
                a license to display and promote their products on our Platform.
              </p>
              <p>
                Users may not infringe on the intellectual property rights of others. 
                We will remove infringing content upon proper notice.
              </p>
            </CardContent>
          </Card>

          {/* 9. Privacy and Data Protection */}
          <Card>
            <CardHeader>
              <CardTitle>9. Privacy and Data Protection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Your privacy is important to us. Our collection and use of personal information 
                is governed by our Privacy Policy, which is incorporated into these Terms.
              </p>
              <p>
                We comply with applicable data protection laws, including the Data Privacy Act of 2012 (Philippines).
              </p>
            </CardContent>
          </Card>

          {/* 10. Prohibited Uses */}
          <Card>
            <CardHeader>
              <CardTitle>10. Prohibited Uses</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>You may not use the Platform to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Violate any applicable laws or regulations</li>
                <li>Engage in fraudulent or deceptive practices</li>
                <li>Infringe on the rights of others</li>
                <li>Distribute malware or harmful code</li>
                <li>Spam or send unsolicited communications</li>
                <li>Interfere with the Platform's operation</li>
                <li>Create multiple accounts to circumvent restrictions</li>
                <li>Engage in price manipulation or collusion</li>
              </ul>
            </CardContent>
          </Card>

          {/* 11. Disclaimers and Limitations */}
          <Card>
            <CardHeader>
              <CardTitle>11. Disclaimers and Limitations of Liability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                THE PLATFORM IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. 
                WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED.
              </p>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY 
                INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES.
              </p>
              <p>
                Our total liability shall not exceed the amount you paid us in the 12 months 
                preceding the claim.
              </p>
            </CardContent>
          </Card>

          {/* 12. Termination */}
          <Card>
            <CardHeader>
              <CardTitle>12. Termination</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Either party may terminate these Terms at any time. We may suspend or terminate 
                your account immediately for violations of these Terms.
              </p>
              <p>
                Upon termination, your right to use the Platform ceases immediately. 
                Provisions that by their nature should survive termination will remain in effect.
              </p>
            </CardContent>
          </Card>

          {/* 13. Governing Law */}
          <Card>
            <CardHeader>
              <CardTitle>13. Governing Law and Dispute Resolution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                These Terms are governed by the laws of the Philippines. 
                Any disputes will be resolved in the courts of the Philippines.
              </p>
              <p>
                We encourage users to resolve disputes through our customer service channels first. 
                For vendor disputes, we provide mediation services.
              </p>
            </CardContent>
          </Card>

          {/* 14. Changes to Terms */}
          <Card>
            <CardHeader>
              <CardTitle>14. Changes to Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                We may update these Terms from time to time. We will notify users of material 
                changes via email or Platform notification.
              </p>
              <p>
                Continued use of the Platform after changes constitutes acceptance of the new Terms. 
                If you do not agree to the changes, you must stop using the Platform.
              </p>
            </CardContent>
          </Card>

          {/* 15. Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>15. Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                If you have questions about these Terms, please contact us:
              </p>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p><strong>Email:</strong> legal@ecommerce-platform.com</p>
                <p><strong>Address:</strong> [Your Business Address], Philippines</p>
                <p><strong>Phone:</strong> [Your Contact Number]</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-8" />
        
        <div className="text-center text-sm text-muted-foreground">
          <p>
            By using our Platform, you acknowledge that you have read, understood, 
            and agree to be bound by these Terms of Service.
          </p>
        </div>
      </div>
    </div>
  )
}
