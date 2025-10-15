'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/shared/data-table'
import { EmptyState } from '@/components/shared/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { CheckCircle, XCircle, Eye, FileText, Building2, Phone, Globe, MapPin } from 'lucide-react'
import { toast } from 'sonner'

interface BusinessVerification {
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
  verifiedAt?: string
  notes?: string
  createdAt: string
  updatedAt: string
  vendor: {
    id: string
    businessName: string
    user: {
      name: string
      email: string
    }
  }
}

const columns = [
  {
    accessorKey: 'vendor.businessName',
    header: 'Business Name',
    cell: ({ row }: any) => (
      <div>
        <div className="font-medium">{row.original.vendor.businessName}</div>
        <div className="text-sm text-muted-foreground">{row.original.vendor.user.email}</div>
      </div>
    ),
  },
  {
    accessorKey: 'businessType',
    header: 'Business Type',
    cell: ({ row }: any) => row.original.businessType || 'N/A',
  },
  {
    accessorKey: 'verificationStatus',
    header: 'Status',
    cell: ({ row }: any) => {
      const status = row.original.verificationStatus
      const variants: any = {
        PENDING: 'secondary',
        UNDER_REVIEW: 'default',
        APPROVED: 'default',
        REJECTED: 'destructive'
      }
      return (
        <Badge variant={variants[status] || 'secondary'}>
          {status.replace('_', ' ')}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Submitted',
    cell: ({ row }: any) => new Date(row.original.createdAt).toLocaleDateString(),
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }: any) => (
      <div className="flex gap-2">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-1" />
              Review
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Business Verification Review</DialogTitle>
              <DialogDescription>
                Review the business verification details for {row.original.vendor.businessName}
              </DialogDescription>
            </DialogHeader>
            <VerificationReviewDialog verification={row.original} />
          </DialogContent>
        </Dialog>
      </div>
    ),
  },
]

function VerificationReviewDialog({ verification }: { verification: BusinessVerification }) {
  const [notes, setNotes] = useState(verification.notes || '')
  const [rejectionReason, setRejectionReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const handleApprove = async () => {
    setIsProcessing(true)
    try {
      const response = await fetch(`/api/business-verification/${verification.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      })

      if (response.ok) {
        toast.success('Business verification approved successfully')
        window.location.reload()
      } else {
        throw new Error('Failed to approve verification')
      }
    } catch (error) {
      toast.error('Failed to approve verification')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch(`/api/business-verification/${verification.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason, notes })
      })

      if (response.ok) {
        toast.success('Business verification rejected')
        window.location.reload()
      } else {
        throw new Error('Failed to reject verification')
      }
    } catch (error) {
      toast.error('Failed to reject verification')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Business Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Business Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-sm font-medium">Business Name</Label>
              <p className="text-sm">{verification.vendor.businessName}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Business Type</Label>
              <p className="text-sm">{verification.businessType || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Business License</Label>
              <p className="text-sm">{verification.businessLicense || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Tax ID</Label>
              <p className="text-sm">{verification.taxId || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-sm font-medium">Phone Number</Label>
              <p className="text-sm">{verification.phoneNumber || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Website</Label>
              <p className="text-sm">
                {verification.website ? (
                  <a href={verification.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {verification.website}
                  </a>
                ) : 'N/A'}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Business Address</Label>
              <p className="text-sm">
                {verification.businessAddress ? (
                  <div>
                    {verification.businessAddress.street && <div>{verification.businessAddress.street}</div>}
                    {verification.businessAddress.city && <div>{verification.businessAddress.city}</div>}
                    {verification.businessAddress.state && <div>{verification.businessAddress.state}</div>}
                    {verification.businessAddress.zipCode && <div>{verification.businessAddress.zipCode}</div>}
                    {verification.businessAddress.country && <div>{verification.businessAddress.country}</div>}
                  </div>
                ) : 'N/A'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Uploaded Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          {verification.documents && verification.documents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {verification.documents.map((doc: any, index: number) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium">{doc.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{doc.type}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(doc.url, '_blank')}
                  >
                    View Document
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No documents uploaded</p>
          )}
        </CardContent>
      </Card>

      {/* Admin Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Admin Notes</Label>
        <Textarea
          id="notes"
          placeholder="Add any notes about this verification..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>

      {/* Rejection Reason (if rejecting) */}
      {verification.verificationStatus === 'PENDING' && (
        <div className="space-y-2">
          <Label htmlFor="rejectionReason">Rejection Reason (if rejecting)</Label>
          <Textarea
            id="rejectionReason"
            placeholder="Provide a clear reason for rejection..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={2}
          />
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4">
        {verification.verificationStatus === 'PENDING' && (
          <>
            <Button
              onClick={handleApprove}
              disabled={isProcessing}
              className="flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Approve
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isProcessing}
              className="flex items-center gap-2"
            >
              <XCircle className="h-4 w-4" />
              Reject
            </Button>
          </>
        )}
        {verification.verificationStatus === 'APPROVED' && (
          <Badge variant="default" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Approved
          </Badge>
        )}
        {verification.verificationStatus === 'REJECTED' && (
          <div>
            <Badge variant="destructive" className="flex items-center gap-1 mb-2">
              <XCircle className="h-3 w-3" />
              Rejected
            </Badge>
            {verification.rejectionReason && (
              <p className="text-sm text-muted-foreground">
                Reason: {verification.rejectionReason}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function BusinessVerificationPage() {
  const [verifications, setVerifications] = useState<BusinessVerification[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  })

  useEffect(() => {
    fetchVerifications()
  }, [])

  const fetchVerifications = async () => {
    try {
      const response = await fetch('/api/business-verification')
      if (response.ok) {
        const data = await response.json()
        setVerifications(data.data || [])
        
        // Calculate stats
        const total = data.data?.length || 0
        const pending = data.data?.filter((v: any) => v.verificationStatus === 'PENDING').length || 0
        const approved = data.data?.filter((v: any) => v.verificationStatus === 'APPROVED').length || 0
        const rejected = data.data?.filter((v: any) => v.verificationStatus === 'REJECTED').length || 0
        
        setStats({ total, pending, approved, rejected })
      }
    } catch (error) {
      console.error('Error fetching verifications:', error)
      toast.error('Failed to load business verifications')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Business Verification</h1>
            <p className="text-muted-foreground">Review and manage business verification requests</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Business Verification</h1>
          <p className="text-muted-foreground">Review and manage business verification requests</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Verifications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Requests</CardTitle>
          <CardDescription>
            Review and approve business verification requests from vendors
          </CardDescription>
        </CardHeader>
        <CardContent>
          {verifications.length > 0 ? (
            <DataTable columns={columns} data={verifications} />
          ) : (
            <EmptyState
              icon={<FileText className="h-8 w-8" />}
              title="No verification requests"
              description="No business verification requests have been submitted yet."
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
