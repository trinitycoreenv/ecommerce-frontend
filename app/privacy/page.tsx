"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Shield, Eye, Database, Lock, Users, Globe, Mail } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function PrivacyPolicyPage() {
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
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-hero">Privacy Policy</h1>
          </div>
          
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="outline">Last Updated: {new Date().toLocaleDateString()}</Badge>
            <Badge variant="secondary">Version 1.0</Badge>
          </div>
          
          <p className="text-subtitle">
            This Privacy Policy explains how we collect, use, and protect your personal information 
            when you use our ecommerce platform.
          </p>
        </div>

        <div className="space-y-8">
          {/* 1. Introduction */}
          <Card>
            <CardHeader>
              <CardTitle className="text-heading flex items-center gap-2">
                <Eye className="h-5 w-5" />
                1. Introduction
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-body">
                We are committed to protecting your privacy and personal information. This Privacy Policy 
                describes how we collect, use, disclose, and safeguard your information when you use our 
                ecommerce platform and marketplace services.
              </p>
              <p className="text-body">
                This policy complies with the Data Privacy Act of 2012 (Republic Act No. 10173) of the Philippines 
                and other applicable data protection laws.
              </p>
              <p className="text-body">
                By using our Platform, you consent to the collection and use of your information as described 
                in this Privacy Policy.
              </p>
            </CardContent>
          </Card>

          {/* 2. Information We Collect */}
          <Card>
            <CardHeader>
              <CardTitle className="text-heading flex items-center gap-2">
                <Database className="h-5 w-5" />
                2. Information We Collect
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <h4 className="text-heading">2.1 Personal Information</h4>
              <p className="text-body">We collect information you provide directly to us, including:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Account Information:</strong> Name, email address, phone number, password</li>
                <li><strong>Profile Information:</strong> Profile picture, preferences, communication settings</li>
                <li><strong>Business Information:</strong> Business name, address, tax ID, license numbers (for vendors)</li>
                <li><strong>Payment Information:</strong> Billing address, payment method details (processed securely)</li>
                <li><strong>Communication:</strong> Messages, feedback, support requests</li>
              </ul>

              <h4 className="text-heading">2.2 Transaction Information</h4>
              <p className="text-body">We collect information about your transactions, including:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Purchase history and order details</li>
                <li>Payment amounts and methods</li>
                <li>Shipping and delivery information</li>
                <li>Returns and refunds</li>
              </ul>

              <h4 className="text-heading">2.3 Usage Information</h4>
              <p className="text-body">We automatically collect certain information when you use our Platform:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Device information (IP address, browser type, operating system)</li>
                <li>Usage patterns and preferences</li>
                <li>Pages visited and time spent on our Platform</li>
                <li>Search queries and product interactions</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>

              <h4 className="text-heading">2.4 Third-Party Information</h4>
              <p className="text-body">We may receive information from third parties, including:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Social media platforms (if you connect your accounts)</li>
                <li>Payment processors and financial institutions</li>
                <li>Shipping and logistics providers</li>
                <li>Marketing and analytics partners</li>
              </ul>
            </CardContent>
          </Card>

          {/* 3. How We Use Your Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-heading flex items-center gap-2">
                <Users className="h-5 w-5" />
                3. How We Use Your Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-body">We use your information for the following purposes:</p>
              
              <h4 className="font-semibold">3.1 Service Provision</h4>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Process and fulfill your orders</li>
                <li>Provide customer support and respond to inquiries</li>
                <li>Manage your account and preferences</li>
                <li>Facilitate communication between customers and vendors</li>
                <li>Process payments and handle billing</li>
              </ul>

              <h4 className="font-semibold">3.2 Platform Improvement</h4>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Analyze usage patterns to improve our services</li>
                <li>Develop new features and functionality</li>
                <li>Conduct research and analytics</li>
                <li>Optimize user experience and performance</li>
              </ul>

              <h4 className="font-semibold">3.3 Communication</h4>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Send order confirmations and shipping updates</li>
                <li>Provide important service notifications</li>
                <li>Send marketing communications (with your consent)</li>
                <li>Respond to your inquiries and support requests</li>
              </ul>

              <h4 className="font-semibold">3.4 Security and Compliance</h4>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Protect against fraud and unauthorized access</li>
                <li>Comply with legal obligations and regulations</li>
                <li>Enforce our Terms of Service</li>
                <li>Investigate and prevent security incidents</li>
              </ul>
            </CardContent>
          </Card>

          {/* 4. Information Sharing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                4. Information Sharing and Disclosure
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>We may share your information in the following circumstances:</p>

              <h4 className="font-semibold">4.1 Service Providers</h4>
              <p>We share information with trusted third-party service providers who assist us in:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Payment processing and financial services</li>
                <li>Shipping and logistics</li>
                <li>Customer support and communication</li>
                <li>Data analytics and marketing</li>
                <li>Technical infrastructure and security</li>
              </ul>

              <h4 className="font-semibold">4.2 Business Partners</h4>
              <p>We may share information with:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Vendors (limited to order fulfillment and customer service)</li>
                <li>Marketing partners (with your consent)</li>
                <li>Business affiliates and subsidiaries</li>
              </ul>

              <h4 className="font-semibold">4.3 Legal Requirements</h4>
              <p>We may disclose information when required by law or to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Comply with legal processes or government requests</li>
                <li>Protect our rights, property, or safety</li>
                <li>Protect the rights, property, or safety of our users</li>
                <li>Investigate or prevent illegal activities</li>
              </ul>

              <h4 className="font-semibold">4.4 Business Transfers</h4>
              <p>
                In the event of a merger, acquisition, or sale of assets, your information may be 
                transferred as part of the transaction.
              </p>
            </CardContent>
          </Card>

          {/* 5. Data Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                5. Data Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                We implement appropriate technical and organizational measures to protect your personal 
                information against unauthorized access, alteration, disclosure, or destruction.
              </p>
              
              <h4 className="font-semibold">5.1 Security Measures</h4>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Encryption of data in transit and at rest</li>
                <li>Secure authentication and access controls</li>
                <li>Regular security assessments and updates</li>
                <li>Employee training on data protection</li>
                <li>Incident response and breach notification procedures</li>
              </ul>

              <h4 className="font-semibold">5.2 Payment Security</h4>
              <p>
                Payment information is processed securely through PCI DSS compliant payment processors. 
                We do not store complete payment card information on our servers.
              </p>

              <p className="text-sm text-muted-foreground">
                While we strive to protect your information, no method of transmission over the internet 
                or electronic storage is 100% secure. We cannot guarantee absolute security.
              </p>
            </CardContent>
          </Card>

          {/* 6. Data Retention */}
          <Card>
            <CardHeader>
              <CardTitle>6. Data Retention</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                We retain your personal information for as long as necessary to fulfill the purposes 
                outlined in this Privacy Policy, unless a longer retention period is required by law.
              </p>
              
              <h4 className="font-semibold">6.1 Retention Periods</h4>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Account Information:</strong> Until account deletion or 3 years of inactivity</li>
                <li><strong>Transaction Records:</strong> 7 years for tax and legal compliance</li>
                <li><strong>Marketing Data:</strong> Until you opt out or 2 years of inactivity</li>
                <li><strong>Support Communications:</strong> 3 years for service improvement</li>
                <li><strong>Analytics Data:</strong> Aggregated and anonymized after 2 years</li>
              </ul>

              <p>
                When we no longer need your information, we will securely delete or anonymize it 
                in accordance with our data retention policies.
              </p>
            </CardContent>
          </Card>

          {/* 7. Your Rights */}
          <Card>
            <CardHeader>
              <CardTitle>7. Your Privacy Rights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Under the Data Privacy Act of 2012, you have the following rights:</p>
              
              <h4 className="font-semibold">7.1 Access and Portability</h4>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Request access to your personal information</li>
                <li>Obtain a copy of your data in a portable format</li>
                <li>Request information about how we process your data</li>
              </ul>

              <h4 className="font-semibold">7.2 Correction and Update</h4>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Correct inaccurate or incomplete information</li>
                <li>Update your account information</li>
                <li>Modify your communication preferences</li>
              </ul>

              <h4 className="font-semibold">7.3 Deletion and Restriction</h4>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Request deletion of your personal information</li>
                <li>Restrict processing of your data</li>
                <li>Object to certain uses of your information</li>
              </ul>

              <h4 className="font-semibold">7.4 Withdrawal of Consent</h4>
              <p>
                You may withdraw your consent for marketing communications at any time by 
                using the unsubscribe link in emails or updating your preferences in your account.
              </p>

              <p>
                To exercise these rights, please contact us using the information provided in the 
                "Contact Us" section below.
              </p>
            </CardContent>
          </Card>

          {/* 8. Cookies and Tracking */}
          <Card>
            <CardHeader>
              <CardTitle>8. Cookies and Tracking Technologies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                We use cookies and similar tracking technologies to enhance your experience on our Platform.
              </p>
              
              <h4 className="font-semibold">8.1 Types of Cookies</h4>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Essential Cookies:</strong> Required for basic platform functionality</li>
                <li><strong>Performance Cookies:</strong> Help us understand how you use our Platform</li>
                <li><strong>Functional Cookies:</strong> Remember your preferences and settings</li>
                <li><strong>Marketing Cookies:</strong> Used for targeted advertising (with consent)</li>
              </ul>

              <h4 className="font-semibold">8.2 Cookie Management</h4>
              <p>
                You can control cookies through your browser settings. However, disabling certain cookies 
                may affect the functionality of our Platform.
              </p>
            </CardContent>
          </Card>

          {/* 9. International Transfers */}
          <Card>
            <CardHeader>
              <CardTitle>9. International Data Transfers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Your information may be transferred to and processed in countries other than the Philippines. 
                We ensure that such transfers comply with applicable data protection laws.
              </p>
              <p>
                When transferring data internationally, we implement appropriate safeguards such as 
                standard contractual clauses or adequacy decisions.
              </p>
            </CardContent>
          </Card>

          {/* 10. Children's Privacy */}
          <Card>
            <CardHeader>
              <CardTitle>10. Children's Privacy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Our Platform is not intended for children under 13 years of age. We do not knowingly 
                collect personal information from children under 13.
              </p>
              <p>
                If we become aware that we have collected information from a child under 13, 
                we will take steps to delete such information promptly.
              </p>
            </CardContent>
          </Card>

          {/* 11. Changes to Privacy Policy */}
          <Card>
            <CardHeader>
              <CardTitle>11. Changes to This Privacy Policy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any material 
                changes by posting the new Privacy Policy on our Platform and updating the "Last Updated" date.
              </p>
              <p>
                We encourage you to review this Privacy Policy periodically for any changes. 
                Your continued use of our Platform after changes constitutes acceptance of the updated policy.
              </p>
            </CardContent>
          </Card>

          {/* 12. Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                12. Contact Us
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                If you have questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p><strong>Data Protection Officer:</strong> [DPO Name]</p>
                <p><strong>Email:</strong> privacy@ecommerce-platform.com</p>
                <p><strong>Address:</strong> [Your Business Address], Philippines</p>
                <p><strong>Phone:</strong> [Your Contact Number]</p>
              </div>
              
              <p className="text-sm text-muted-foreground">
                For data protection concerns or to exercise your privacy rights, please use the 
                email address above with "Privacy Request" in the subject line.
              </p>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-8" />
        
        <div className="text-center text-sm text-muted-foreground">
          <p>
            This Privacy Policy is effective as of the date listed above and governs our collection 
            and use of your personal information.
          </p>
        </div>
      </div>
    </div>
  )
}
