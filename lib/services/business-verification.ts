import { prisma } from '@/lib/prisma'

export interface BusinessVerification {
  id: string
  vendorId: string
  businessLicense?: string
  taxId?: string
  businessAddress?: any
  phoneNumber?: string
  website?: string
  businessType?: string
  documents: any[]
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW'
  rejectionReason?: string
  verifiedBy?: string
  verifiedAt?: Date
  notes?: string
}

export interface BusinessVerificationCreateInput {
  vendorId: string
  businessLicense?: string
  taxId?: string
  businessAddress?: any
  phoneNumber?: string
  website?: string
  businessType?: string
  documents: any[]
}

export interface BusinessVerificationUpdateInput {
  businessLicense?: string
  taxId?: string
  businessAddress?: any
  phoneNumber?: string
  website?: string
  businessType?: string
  documents?: any[]
  verificationStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW'
  rejectionReason?: string
  notes?: string
}

export class BusinessVerificationService {
  /**
   * Create business verification record
   */
  static async createVerification(input: BusinessVerificationCreateInput): Promise<BusinessVerification> {
    const verification = await prisma.businessVerification.create({
      data: {
        vendorId: input.vendorId,
        businessLicense: input.businessLicense,
        taxId: input.taxId,
        businessAddress: input.businessAddress,
        phoneNumber: input.phoneNumber,
        website: input.website,
        businessType: input.businessType,
        documents: input.documents,
        verificationStatus: 'PENDING'
      }
    })

    return {
      id: verification.id,
      vendorId: verification.vendorId,
      businessLicense: verification.businessLicense || undefined,
      taxId: verification.taxId || undefined,
      businessAddress: verification.businessAddress || undefined,
      phoneNumber: verification.phoneNumber || undefined,
      website: verification.website || undefined,
      businessType: verification.businessType || undefined,
      documents: verification.documents as any[],
      verificationStatus: verification.verificationStatus as any,
      rejectionReason: verification.rejectionReason || undefined,
      verifiedBy: verification.verifiedBy || undefined,
      verifiedAt: verification.verifiedAt || undefined,
      notes: verification.notes || undefined
    }
  }

  /**
   * Get business verification by vendor ID
   */
  static async getVerificationByVendorId(vendorId: string): Promise<BusinessVerification | null> {
    const verification = await prisma.businessVerification.findUnique({
      where: { vendorId },
      include: {
        verifier: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    if (!verification) return null

    return {
      id: verification.id,
      vendorId: verification.vendorId,
      businessLicense: verification.businessLicense || undefined,
      taxId: verification.taxId || undefined,
      businessAddress: verification.businessAddress || undefined,
      phoneNumber: verification.phoneNumber || undefined,
      website: verification.website || undefined,
      businessType: verification.businessType || undefined,
      documents: verification.documents as any[],
      verificationStatus: verification.verificationStatus as any,
      rejectionReason: verification.rejectionReason || undefined,
      verifiedBy: verification.verifiedBy || undefined,
      verifiedAt: verification.verifiedAt || undefined,
      notes: verification.notes || undefined
    }
  }

  /**
   * Update business verification
   */
  static async updateVerification(
    verificationId: string,
    input: BusinessVerificationUpdateInput
  ): Promise<BusinessVerification> {
    const verification = await prisma.businessVerification.update({
      where: { id: verificationId },
      data: {
        businessLicense: input.businessLicense,
        taxId: input.taxId,
        businessAddress: input.businessAddress,
        phoneNumber: input.phoneNumber,
        website: input.website,
        businessType: input.businessType,
        documents: input.documents,
        verificationStatus: input.verificationStatus,
        rejectionReason: input.rejectionReason,
        notes: input.notes
      }
    })

    return {
      id: verification.id,
      vendorId: verification.vendorId,
      businessLicense: verification.businessLicense || undefined,
      taxId: verification.taxId || undefined,
      businessAddress: verification.businessAddress || undefined,
      phoneNumber: verification.phoneNumber || undefined,
      website: verification.website || undefined,
      businessType: verification.businessType || undefined,
      documents: verification.documents as any[],
      verificationStatus: verification.verificationStatus as any,
      rejectionReason: verification.rejectionReason || undefined,
      verifiedBy: verification.verifiedBy || undefined,
      verifiedAt: verification.verifiedAt || undefined,
      notes: verification.notes || undefined
    }
  }

  /**
   * Approve business verification
   */
  static async approveVerification(
    verificationId: string,
    verifiedBy: string,
    notes?: string
  ): Promise<BusinessVerification> {
    const verification = await prisma.businessVerification.update({
      where: { id: verificationId },
      data: {
        verificationStatus: 'APPROVED',
        verifiedBy,
        verifiedAt: new Date(),
        notes
      }
    })

    // Update vendor status to ACTIVE
    await prisma.vendor.update({
      where: { id: verification.vendorId },
      data: {
        status: 'ACTIVE',
        verificationStatus: 'APPROVED',
        verifiedAt: new Date(),
        verifiedBy
      }
    })

    return {
      id: verification.id,
      vendorId: verification.vendorId,
      businessLicense: verification.businessLicense || undefined,
      taxId: verification.taxId || undefined,
      businessAddress: verification.businessAddress || undefined,
      phoneNumber: verification.phoneNumber || undefined,
      website: verification.website || undefined,
      businessType: verification.businessType || undefined,
      documents: verification.documents as any[],
      verificationStatus: verification.verificationStatus as any,
      rejectionReason: verification.rejectionReason || undefined,
      verifiedBy: verification.verifiedBy || undefined,
      verifiedAt: verification.verifiedAt || undefined,
      notes: verification.notes || undefined
    }
  }

  /**
   * Reject business verification
   */
  static async rejectVerification(
    verificationId: string,
    verifiedBy: string,
    rejectionReason: string,
    notes?: string
  ): Promise<BusinessVerification> {
    const verification = await prisma.businessVerification.update({
      where: { id: verificationId },
      data: {
        verificationStatus: 'REJECTED',
        verifiedBy,
        verifiedAt: new Date(),
        rejectionReason,
        notes
      }
    })

    // Update vendor status to REJECTED
    await prisma.vendor.update({
      where: { id: verification.vendorId },
      data: {
        status: 'REJECTED',
        verificationStatus: 'REJECTED',
        verificationNotes: rejectionReason
      }
    })

    return {
      id: verification.id,
      vendorId: verification.vendorId,
      businessLicense: verification.businessLicense || undefined,
      taxId: verification.taxId || undefined,
      businessAddress: verification.businessAddress || undefined,
      phoneNumber: verification.phoneNumber || undefined,
      website: verification.website || undefined,
      businessType: verification.businessType || undefined,
      documents: verification.documents as any[],
      verificationStatus: verification.verificationStatus as any,
      rejectionReason: verification.rejectionReason || undefined,
      verifiedBy: verification.verifiedBy || undefined,
      verifiedAt: verification.verifiedAt || undefined,
      notes: verification.notes || undefined
    }
  }

  /**
   * Get all pending verifications
   */
  static async getPendingVerifications(): Promise<BusinessVerification[]> {
    const verifications = await prisma.businessVerification.findMany({
      where: { verificationStatus: 'PENDING' },
      include: {
        vendor: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    return verifications.map(verification => ({
      id: verification.id,
      vendorId: verification.vendorId,
      businessLicense: verification.businessLicense || undefined,
      taxId: verification.taxId || undefined,
      businessAddress: verification.businessAddress || undefined,
      phoneNumber: verification.phoneNumber || undefined,
      website: verification.website || undefined,
      businessType: verification.businessType || undefined,
      documents: verification.documents as any[],
      verificationStatus: verification.verificationStatus as any,
      rejectionReason: verification.rejectionReason || undefined,
      verifiedBy: verification.verifiedBy || undefined,
      verifiedAt: verification.verifiedAt || undefined,
      notes: verification.notes || undefined
    }))
  }

  /**
   * Get verification statistics
   */
  static async getVerificationStats(): Promise<{
    totalVerifications: number
    pendingVerifications: number
    approvedVerifications: number
    rejectedVerifications: number
    averageProcessingTime: number
  }> {
    const verifications = await prisma.businessVerification.findMany({
      where: {
        verifiedAt: {
          not: null
        }
      }
    })

    const totalVerifications = await prisma.businessVerification.count()
    const pendingVerifications = await prisma.businessVerification.count({
      where: { verificationStatus: 'PENDING' }
    })
    const approvedVerifications = await prisma.businessVerification.count({
      where: { verificationStatus: 'APPROVED' }
    })
    const rejectedVerifications = await prisma.businessVerification.count({
      where: { verificationStatus: 'REJECTED' }
    })

    // Calculate average processing time
    const processedVerifications = verifications.filter(v => v.verifiedAt)
    const averageProcessingTime = processedVerifications.length > 0
      ? processedVerifications.reduce((sum, verification) => {
          const processingTime = verification.verifiedAt!.getTime() - verification.createdAt.getTime()
          return sum + (processingTime / (1000 * 60 * 60 * 24)) // Convert to days
        }, 0) / processedVerifications.length
      : 0

    return {
      totalVerifications,
      pendingVerifications,
      approvedVerifications,
      rejectedVerifications,
      averageProcessingTime: Math.round(averageProcessingTime * 10) / 10
    }
  }

  /**
   * Validate business information
   */
  static validateBusinessInfo(data: {
    businessLicense?: string
    taxId?: string
    phoneNumber?: string
    website?: string
    businessType?: string
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Validate business license format (simplified)
    if (data.businessLicense && !/^[A-Z0-9-]{8,20}$/i.test(data.businessLicense)) {
      errors.push('Business license must be 8-20 characters long and contain only letters, numbers, and hyphens')
    }

    // Validate tax ID format (simplified)
    if (data.taxId && !/^[0-9-]{9,15}$/.test(data.taxId)) {
      errors.push('Tax ID must be 9-15 digits and may contain hyphens')
    }

    // Validate phone number format
    if (data.phoneNumber && !/^\+?[1-9]\d{1,14}$/.test(data.phoneNumber.replace(/[\s()-]/g, ''))) {
      errors.push('Phone number must be a valid international format')
    }

    // Validate website URL
    if (data.website && !/^https?:\/\/.+\..+/.test(data.website)) {
      errors.push('Website must be a valid URL starting with http:// or https://')
    }

    // Validate business type
    const validBusinessTypes = [
      'SOLE_PROPRIETORSHIP',
      'PARTNERSHIP',
      'LLC',
      'CORPORATION',
      'S_CORPORATION',
      'NON_PROFIT',
      'OTHER'
    ]
    if (data.businessType && !validBusinessTypes.includes(data.businessType)) {
      errors.push('Business type must be one of the valid options')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Upload document (mock implementation)
   */
  static async uploadDocument(file: File, vendorId: string): Promise<{
    success: boolean
    documentId?: string
    url?: string
    error?: string
  }> {
    try {
      // In a real implementation, this would upload to a cloud storage service
      // For now, we'll simulate the upload
      const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const url = `https://storage.example.com/documents/${documentId}.${file.name.split('.').pop()}`

      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      return {
        success: true,
        documentId,
        url
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to upload document'
      }
    }
  }
}
