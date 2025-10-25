"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Shield, 
  Plus, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Clock,
  FileText,
  TrendingUp,
  AlertTriangle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Policy {
  id: string
  name: string
  description: string
  type: string
  severity: string
  rules: any[]
  isActive: boolean
  autoEnforce: boolean
  createdAt: string
  _count?: {
    violations: number
  }
}

interface Violation {
  id: string
  status: string
  reason: string
  createdAt: string
  policy: {
    id: string
    name: string
    type: string
    severity: string
  }
  product: {
    id: string
    name: string
    images: string[]
    price: number
  }
  vendor: {
    id: string
    businessName: string
    user: {
      email: string
      name: string
    }
  }
  appealMessage?: string
}

interface ViolationStats {
  total: number
  pending: number
  underReview: number
  resolved: number
  appealed: number
  rejected: number
}

export default function AdminPoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([])
  const [violations, setViolations] = useState<Violation[]>([])
  const [stats, setStats] = useState<ViolationStats>({
    total: 0,
    pending: 0,
    underReview: 0,
    resolved: 0,
    appealed: 0,
    rejected: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedViolation, setSelectedViolation] = useState<Violation | null>(null)
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadPolicies()
    loadViolations()
  }, [])

  const loadPolicies = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      console.log('🔍 Loading policies with token:', token ? 'Token exists' : 'No token')

      const response = await fetch('/api/admin/policies', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      console.log('📡 Response status:', response.status)
      const data = await response.json()
      console.log('📋 Response data:', data)

      if (data.success) {
        console.log('✅ Setting policies:', data.data.length, 'policies')
        setPolicies(data.data)
      } else {
        console.error('❌ API returned error:', data.error)
        toast({
          title: "Error",
          description: data.error || "Failed to load policies",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('❌ Failed to load policies:', error)
      toast({
        title: "Error",
        description: "Failed to load policies",
        variant: "destructive"
      })
    }
  }

  const loadViolations = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/admin/violations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.success) {
        setViolations(data.data)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to load violations:', error)
      toast({
        title: "Error",
        description: "Failed to load violations",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResolveViolation = async (violationId: string, approved: boolean, adminNotes: string) => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/admin/violations/${violationId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          approved,
          adminNotes
        })
      })

      const data = await response.json()
      if (data.success) {
        toast({
          title: "Success",
          description: data.message
        })
        setIsReviewDialogOpen(false)
        setSelectedViolation(null)
        loadViolations()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to resolve violation",
        variant: "destructive"
      })
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'destructive'
      case 'HIGH': return 'destructive'
      case 'MEDIUM': return 'default'
      case 'LOW': return 'secondary'
      default: return 'default'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'default'
      case 'UNDER_REVIEW': return 'default'
      case 'RESOLVED': return 'default'
      case 'APPEALED': return 'default'
      case 'REJECTED': return 'destructive'
      default: return 'default'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Policy Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage platform policies and review violations
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Policy
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Violations</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All time violations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending + stats.underReview}</div>
            <p className="text-xs text-muted-foreground">Awaiting action</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Appeals</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.appealed}</div>
            <p className="text-xs text-muted-foreground">Vendor appeals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.resolved}</div>
            <p className="text-xs text-muted-foreground">Successfully resolved</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Policies and Violations */}
      <Tabs defaultValue="violations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="violations">Violations</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
        </TabsList>

        <TabsContent value="violations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Policy Violations</CardTitle>
              <CardDescription>Review and manage policy violations</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading violations...</p>
                </div>
              ) : violations.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No policy violations found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {violations.map((violation) => (
                    <Card key={violation.id} className="border-l-4" style={{
                      borderLeftColor: violation.policy.severity === 'CRITICAL' ? '#ef4444' :
                                      violation.policy.severity === 'HIGH' ? '#f97316' :
                                      violation.policy.severity === 'MEDIUM' ? '#eab308' : '#84cc16'
                    }}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{violation.product.name}</h3>
                              <Badge variant={getStatusColor(violation.status)}>
                                {violation.status.replace('_', ' ')}
                              </Badge>
                              <Badge variant={getSeverityColor(violation.policy.severity)}>
                                {violation.policy.severity}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              <strong>Policy:</strong> {violation.policy.name}
                            </p>
                            <p className="text-sm text-muted-foreground mb-2">
                              <strong>Vendor:</strong> {violation.vendor.businessName}
                            </p>
                            <p className="text-sm mb-2">
                              <strong>Reason:</strong> {violation.reason}
                            </p>
                            {violation.appealMessage && (
                              <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mt-2">
                                <p className="text-sm font-semibold text-yellow-800 mb-1">
                                  <FileText className="h-4 w-4 inline mr-1" />
                                  Vendor Appeal:
                                </p>
                                <p className="text-sm text-yellow-700">{violation.appealMessage}</p>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {(violation.status === 'PENDING' || violation.status === 'APPEALED') && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedViolation(violation)
                                  setIsReviewDialogOpen(true)
                                }}
                              >
                                Review
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Policies</CardTitle>
              <CardDescription>Platform compliance policies</CardDescription>
            </CardHeader>
            <CardContent>
              {policies.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No policies created yet</p>
                  <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Policy
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {policies.map((policy) => (
                    <Card key={policy.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{policy.name}</h3>
                              <Badge variant={getSeverityColor(policy.severity)}>
                                {policy.severity}
                              </Badge>
                              <Badge variant={policy.isActive ? 'default' : 'secondary'}>
                                {policy.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                              {policy.autoEnforce && (
                                <Badge variant="outline">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Auto-Enforce
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {policy.description}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              <strong>Type:</strong> {policy.type.replace('_', ' ')} •
                              <strong> Violations:</strong> {policy._count?.violations || 0}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Review Violation Dialog */}
      <ReviewViolationDialog
        violation={selectedViolation}
        isOpen={isReviewDialogOpen}
        onClose={() => {
          setIsReviewDialogOpen(false)
          setSelectedViolation(null)
        }}
        onResolve={handleResolveViolation}
      />

      {/* Create Policy Dialog */}
      <CreatePolicyDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={() => {
          setIsCreateDialogOpen(false)
          loadPolicies()
        }}
      />
    </div>
  )
}

// Review Violation Dialog Component
function ReviewViolationDialog({
  violation,
  isOpen,
  onClose,
  onResolve
}: {
  violation: Violation | null
  isOpen: boolean
  onClose: () => void
  onResolve: (violationId: string, approved: boolean, adminNotes: string) => void
}) {
  const [adminNotes, setAdminNotes] = useState("")

  if (!violation) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Review Violation</DialogTitle>
          <DialogDescription>
            Review and resolve this policy violation
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Product</Label>
            <p className="text-sm font-medium">{violation.product.name}</p>
          </div>
          <div>
            <Label>Vendor</Label>
            <p className="text-sm font-medium">{violation.vendor.businessName}</p>
          </div>
          <div>
            <Label>Policy</Label>
            <p className="text-sm font-medium">{violation.policy.name}</p>
          </div>
          <div>
            <Label>Reason</Label>
            <p className="text-sm">{violation.reason}</p>
          </div>
          {violation.appealMessage && (
            <div>
              <Label>Vendor Appeal</Label>
              <p className="text-sm bg-yellow-50 border border-yellow-200 rounded p-3">
                {violation.appealMessage}
              </p>
            </div>
          )}
          <div>
            <Label htmlFor="adminNotes">Admin Notes</Label>
            <Textarea
              id="adminNotes"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add notes about your decision..."
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => onResolve(violation.id, false, adminNotes)}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Reject
          </Button>
          <Button
            onClick={() => onResolve(violation.id, true, adminNotes)}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Create Policy Dialog Component (simplified - can be expanded)
function CreatePolicyDialog({
  isOpen,
  onClose,
  onSuccess
}: {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Policy</DialogTitle>
          <DialogDescription>
            Policy creation feature coming soon. For now, policies can be created via API.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

