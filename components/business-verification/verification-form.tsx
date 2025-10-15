'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Upload, X, FileText, CheckCircle, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Document {
  id: string
  name: string
  url: string
  type: string
  size: number
}

interface VerificationFormProps {
  onSubmit: (data: any) => void
  loading?: boolean
  initialData?: any
}

export function VerificationForm({ onSubmit, loading, initialData }: VerificationFormProps) {
  const [formData, setFormData] = useState({
    businessLicense: initialData?.businessLicense || '',
    taxId: initialData?.taxId || '',
    phoneNumber: initialData?.phoneNumber || '',
    website: initialData?.website || '',
    businessType: initialData?.businessType || '',
    businessAddress: initialData?.businessAddress || {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US'
    }
  })
  const [documents, setDocuments] = useState<Document[]>(initialData?.documents || [])
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()

  const businessTypes = [
    { value: 'SOLE_PROPRIETORSHIP', label: 'Sole Proprietorship' },
    { value: 'PARTNERSHIP', label: 'Partnership' },
    { value: 'LLC', label: 'Limited Liability Company (LLC)' },
    { value: 'CORPORATION', label: 'Corporation' },
    { value: 'S_CORPORATION', label: 'S Corporation' },
    { value: 'NON_PROFIT', label: 'Non-Profit' },
    { value: 'OTHER', label: 'Other' }
  ]

  const documentTypes = [
    { value: 'BUSINESS_LICENSE', label: 'Business License' },
    { value: 'TAX_CERTIFICATE', label: 'Tax Certificate' },
    { value: 'ARTICLES_OF_INCORPORATION', label: 'Articles of Incorporation' },
    { value: 'OPERATING_AGREEMENT', label: 'Operating Agreement' },
    { value: 'BANK_STATEMENT', label: 'Bank Statement' },
    { value: 'UTILITY_BILL', label: 'Utility Bill' },
    { value: 'OTHER', label: 'Other' }
  ]

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAddressChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      businessAddress: {
        ...prev.businessAddress,
        [field]: value
      }
    }))
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        // Validate file type
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
        if (!allowedTypes.includes(file.type)) {
          toast({
            title: "Invalid File Type",
            description: "Please upload PDF, JPEG, or PNG files only",
            variant: "destructive"
          })
          continue
        }

        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "File Too Large",
            description: "Please upload files smaller than 5MB",
            variant: "destructive"
          })
          continue
        }

        // Simulate file upload
        const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const url = `https://storage.example.com/documents/${documentId}.${file.name.split('.').pop()}`

        const newDocument: Document = {
          id: documentId,
          name: file.name,
          url,
          type: file.type,
          size: file.size
        }

        setDocuments(prev => [...prev, newDocument])
      }
    } catch (error) {
      toast({
        title: "Upload Error",
        description: "Failed to upload documents",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  const removeDocument = (documentId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== documentId))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (documents.length === 0) {
      toast({
        title: "Documents Required",
        description: "Please upload at least one business document",
        variant: "destructive"
      })
      return
    }

    onSubmit({
      ...formData,
      documents
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Business Information */}
      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
          <CardDescription>
            Provide your business details for verification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="businessLicense">Business License Number</Label>
              <Input
                id="businessLicense"
                value={formData.businessLicense}
                onChange={(e) => handleInputChange('businessLicense', e.target.value)}
                placeholder="Enter your business license number"
              />
            </div>
            <div>
              <Label htmlFor="taxId">Tax ID / EIN</Label>
              <Input
                id="taxId"
                value={formData.taxId}
                onChange={(e) => handleInputChange('taxId', e.target.value)}
                placeholder="Enter your tax ID or EIN"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="phoneNumber">Business Phone Number</Label>
              <Input
                id="phoneNumber"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div>
              <Label htmlFor="website">Business Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="https://yourbusiness.com"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="businessType">Business Type</Label>
            <Select
              value={formData.businessType}
              onValueChange={(value) => handleInputChange('businessType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your business type" />
              </SelectTrigger>
              <SelectContent>
                {businessTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Business Address */}
      <Card>
        <CardHeader>
          <CardTitle>Business Address</CardTitle>
          <CardDescription>
            Provide your business address for verification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="street">Street Address</Label>
            <Input
              id="street"
              value={formData.businessAddress.street}
              onChange={(e) => handleAddressChange('street', e.target.value)}
              placeholder="123 Business Street"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.businessAddress.city}
                onChange={(e) => handleAddressChange('city', e.target.value)}
                placeholder="Business City"
              />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={formData.businessAddress.state}
                onChange={(e) => handleAddressChange('state', e.target.value)}
                placeholder="State"
              />
            </div>
            <div>
              <Label htmlFor="zipCode">ZIP Code</Label>
              <Input
                id="zipCode"
                value={formData.businessAddress.zipCode}
                onChange={(e) => handleAddressChange('zipCode', e.target.value)}
                placeholder="12345"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Business Documents</CardTitle>
          <CardDescription>
            Upload supporting documents for your business verification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-600 mb-2">
              Upload business documents (PDF, JPEG, PNG)
            </p>
            <p className="text-xs text-gray-500 mb-4">
              Maximum file size: 5MB per file
            </p>
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
              className="hidden"
              id="document-upload"
              disabled={uploading}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('document-upload')?.click()}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Choose Files'}
            </Button>
          </div>

          {/* Uploaded Documents */}
          {documents.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Uploaded Documents</h4>
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">{doc.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(doc.size)}</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDocument(doc.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Document Requirements */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Required Documents</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4" />
                <span>Business License or Registration Certificate</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4" />
                <span>Tax ID Certificate or EIN Letter</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4" />
                <span>Proof of Business Address (Utility Bill, Lease Agreement)</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={loading || uploading || documents.length === 0}>
          {loading ? 'Submitting...' : 'Submit for Verification'}
        </Button>
      </div>
    </form>
  )
}
