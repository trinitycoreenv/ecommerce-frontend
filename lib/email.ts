// SendGrid integration
import sgMail from '@sendgrid/mail'

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
}

export interface EmailTemplate {
  to: string
  subject: string
  html: string
  text?: string
}

// Email verification interfaces removed - feature disabled

export interface WelcomeEmailData {
  email: string
  name: string
  role: string
}

export interface VendorApprovalEmailData {
  email: string
  name: string
  businessName: string
  status: 'APPROVED' | 'REJECTED' | 'PENDING_INFO'
  notes?: string
}

export interface BusinessVerificationEmailData {
  email: string
  name: string
  businessName: string
  status: 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW'
  rejectionReason?: string
  notes?: string
}

class EmailService {
  private static readonly FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@yourecommerce.com'
  private static readonly FROM_NAME = process.env.FROM_NAME || 'E-commerce Platform'

  static async sendEmail(template: EmailTemplate): Promise<boolean> {
    try {
      // Check if SendGrid is configured
      if (process.env.SENDGRID_API_KEY) {
        const msg = {
          to: template.to,
          from: {
            email: this.FROM_EMAIL,
            name: this.FROM_NAME
          },
          subject: template.subject,
          html: template.html,
          text: template.text
        }
        await sgMail.send(msg)
        console.log(`✅ Email sent successfully to ${template.to}`)
        return true
      } else {
        // Development mode - log emails to console
        console.log('📧 EMAIL (Development Mode - SendGrid not configured):')
        console.log('To:', template.to)
        console.log('Subject:', template.subject)
        console.log('HTML Preview:', template.html.substring(0, 200) + '...')
        console.log('---')
        console.log('💡 To enable real email sending, add SENDGRID_API_KEY to your .env file')
        return true
      }
    } catch (error) {
      console.error('❌ Failed to send email:', error)
      return false
    }
  }

  // Email verification methods removed - feature disabled

  static async sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
    const dashboardUrl = this.getDashboardUrl(data.role)
    
    const html = this.getWelcomeEmailTemplate(data, dashboardUrl)
    const text = this.getWelcomeEmailText(data, dashboardUrl)

    return this.sendEmail({
      to: data.email,
      subject: 'Welcome to Our Platform!',
      html,
      text
    })
  }

  static async sendVendorApprovalEmail(data: VendorApprovalEmailData): Promise<boolean> {
    const html = this.getVendorApprovalEmailTemplate(data)
    const text = this.getVendorApprovalEmailText(data)

    const subjects = {
      APPROVED: 'Your Vendor Application Has Been Approved!',
      REJECTED: 'Vendor Application Update',
      PENDING_INFO: 'Additional Information Required for Your Vendor Application'
    }

    return this.sendEmail({
      to: data.email,
      subject: subjects[data.status],
      html,
      text
    })
  }

  private static getDashboardUrl(role: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
    const routes = {
      ADMIN: '/admin',
      VENDOR: '/vendor',
      CUSTOMER: '/shop',
      FINANCE_ANALYST: '/finance',
      OPERATIONS_MANAGER: '/operations'
    }
    return `${baseUrl}${routes[role as keyof typeof routes] || '/'}`
  }

  // Email verification template methods removed - feature disabled

  private static getWelcomeEmailTemplate(data: WelcomeEmailData, dashboardUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome!</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Welcome to Our Platform!</h1>
        </div>
        <div class="content">
          <h2>Hi ${data.name}!</h2>
          <p>Your email has been successfully verified! Welcome to our platform as a <strong>${data.role.toLowerCase()}</strong>.</p>
          
          <div style="text-align: center;">
            <a href="${dashboardUrl}" class="button">Go to Dashboard</a>
          </div>
          
          <p>You can now access all the features available to ${data.role.toLowerCase()}s on our platform.</p>
          
          <p>If you have any questions, feel free to contact our support team.</p>
        </div>
        <div class="footer">
          <p>This email was sent from our e-commerce platform. Please do not reply to this email.</p>
        </div>
      </body>
      </html>
    `
  }

  private static getWelcomeEmailText(data: WelcomeEmailData, dashboardUrl: string): string {
    return `
      Welcome to Our Platform!
      
      Hi ${data.name}!
      
      Your email has been successfully verified! Welcome to our platform as a ${data.role.toLowerCase()}.
      
      Go to your dashboard: ${dashboardUrl}
      
      You can now access all the features available to ${data.role.toLowerCase()}s on our platform.
      
      If you have any questions, feel free to contact our support team.
      
      ---
      This email was sent from our e-commerce platform.
    `
  }

  private static getVendorApprovalEmailTemplate(data: VendorApprovalEmailData): string {
    const statusColors = {
      APPROVED: '#10b981',
      REJECTED: '#ef4444',
      PENDING_INFO: '#f59e0b'
    }

    const statusMessages = {
      APPROVED: 'Congratulations! Your vendor application has been approved.',
      REJECTED: 'Unfortunately, your vendor application has been rejected.',
      PENDING_INFO: 'We need additional information to process your vendor application.'
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Vendor Application Update</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .status { background: ${statusColors[data.status]}; color: white; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0; }
          .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Vendor Application Update</h1>
        </div>
        <div class="content">
          <h2>Hi ${data.name}!</h2>
          
          <div class="status">
            <h3>${statusMessages[data.status]}</h3>
          </div>
          
          <p><strong>Business:</strong> ${data.businessName}</p>
          
          ${data.notes ? `<p><strong>Notes:</strong> ${data.notes}</p>` : ''}
          
          ${data.status === 'APPROVED' ? `
            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/vendor" class="button">Access Vendor Dashboard</a>
            </div>
            <p>You can now start adding products and managing your business on our platform.</p>
          ` : ''}
          
          ${data.status === 'PENDING_INFO' ? `
            <p>Please log in to your account and provide the requested additional information.</p>
            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login" class="button">Log In to Update Application</a>
            </div>
          ` : ''}
          
          <p>If you have any questions, please contact our support team.</p>
        </div>
        <div class="footer">
          <p>This email was sent from our e-commerce platform. Please do not reply to this email.</p>
        </div>
      </body>
      </html>
    `
  }

  private static getVendorApprovalEmailText(data: VendorApprovalEmailData): string {
    const statusMessages = {
      APPROVED: 'Congratulations! Your vendor application has been approved.',
      REJECTED: 'Unfortunately, your vendor application has been rejected.',
      PENDING_INFO: 'We need additional information to process your vendor application.'
    }

    return `
      Vendor Application Update
      
      Hi ${data.name}!
      
      ${statusMessages[data.status]}
      
      Business: ${data.businessName}
      
      ${data.notes ? `Notes: ${data.notes}` : ''}
      
      ${data.status === 'APPROVED' ? `
        Access your vendor dashboard: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/vendor
        You can now start adding products and managing your business on our platform.
      ` : ''}
      
      ${data.status === 'PENDING_INFO' ? `
        Please log in to your account and provide the requested additional information.
        Log in: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login
      ` : ''}
      
      If you have any questions, please contact our support team.
      
      ---
      This email was sent from our e-commerce platform.
    `
  }

  // Business Verification Email Methods
  static async sendBusinessVerificationUpdate(data: BusinessVerificationEmailData): Promise<boolean> {
    const subject = `Business Verification ${data.status === 'APPROVED' ? 'Approved' : data.status === 'REJECTED' ? 'Rejected' : 'Under Review'} - ${data.businessName}`
    
    return this.sendEmail({
      to: data.email,
      subject,
      html: this.getBusinessVerificationEmailHtml(data),
      text: this.getBusinessVerificationEmailText(data)
    })
  }

  private static getBusinessVerificationEmailHtml(data: BusinessVerificationEmailData): string {
    const statusMessages = {
      APPROVED: 'Congratulations! Your business verification has been approved.',
      REJECTED: 'Unfortunately, your business verification has been rejected.',
      UNDER_REVIEW: 'Your business verification is currently under review.'
    }

    const statusColors = {
      APPROVED: '#10b981',
      REJECTED: '#ef4444',
      UNDER_REVIEW: '#f59e0b'
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Business Verification Update</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; color: white; font-weight: bold; margin: 10px 0; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Business Verification Update</h1>
        </div>
        <div class="content">
          <h2>Hi ${data.name}!</h2>
          
          <div class="status-badge" style="background-color: ${statusColors[data.status]}">
            ${data.status.replace('_', ' ')}
          </div>
          
          <p>${statusMessages[data.status]}</p>
          
          <p><strong>Business:</strong> ${data.businessName}</p>
          
          ${data.notes ? `<p><strong>Notes:</strong> ${data.notes}</p>` : ''}
          
          ${data.rejectionReason ? `<p><strong>Rejection Reason:</strong> ${data.rejectionReason}</p>` : ''}
          
          ${data.status === 'APPROVED' ? `
            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/vendor" class="button">Access Vendor Dashboard</a>
            </div>
            <p>You can now start adding products and managing your business on our platform.</p>
          ` : ''}
          
          ${data.status === 'REJECTED' ? `
            <p>If you believe this decision was made in error, please contact our support team for assistance.</p>
            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/vendor" class="button">Access Dashboard</a>
            </div>
          ` : ''}
          
          <p>If you have any questions, please contact our support team.</p>
        </div>
        <div class="footer">
          <p>This email was sent from our e-commerce platform. Please do not reply to this email.</p>
        </div>
      </body>
      </html>
    `
  }

  private static getBusinessVerificationEmailText(data: BusinessVerificationEmailData): string {
    const statusMessages = {
      APPROVED: 'Congratulations! Your business verification has been approved.',
      REJECTED: 'Unfortunately, your business verification has been rejected.',
      UNDER_REVIEW: 'Your business verification is currently under review.'
    }

    return `
      Business Verification Update
      
      Hi ${data.name}!
      
      ${statusMessages[data.status]}
      
      Business: ${data.businessName}
      
      ${data.notes ? `Notes: ${data.notes}` : ''}
      
      ${data.rejectionReason ? `Rejection Reason: ${data.rejectionReason}` : ''}
      
      ${data.status === 'APPROVED' ? `
        Access your vendor dashboard: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/vendor
        You can now start adding products and managing your business on our platform.
      ` : ''}
      
      ${data.status === 'REJECTED' ? `
        If you believe this decision was made in error, please contact our support team for assistance.
        Access your dashboard: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/vendor
      ` : ''}
      
      If you have any questions, please contact our support team.
      
      ---
      This email was sent from our e-commerce platform.
    `
  }
}

export { EmailService }
export default EmailService
