"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Shield, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  FileText,
  MessageSquare
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
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface Policy {
  id: string
  name: string
  description: string
  type: string
  severity: string
  rules: any[]
  createdAt: string
}

interface Violation {
  id: string
  status: string
  reason: string
  createdAt: string
  appealMessage?: string
  adminNotes?: string
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
}

interface ViolationStats {
  total: number
  pending: number
  underReview: number
  resolved: number
  appealed: number
  rejected: number
}

export default function VendorPoliciesPage() {
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
  const [selectedViolation, setSelectedViolation] = useState<Violation | null>(null)
  const [isAppealDialogOpen, setIsAppealDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadPolicies()
    loadViolations()
  }, [])

  const loadPolicies = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      console.log('🔍 [Vendor] Loading policies with token:', token ? 'Token exists' : 'No token')

      const response = await fetch('/api/policies', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      console.log('📡 [Vendor] Response status:', response.status)
      const data = await response.json()
      console.log('📋 [Vendor] Response data:', data)

      if (data.success) {
        console.log('✅ [Vendor] Setting policies:', data.data.length, 'policies')
        setPolicies(data.data)
      } else {
        console.error('❌ [Vendor] API returned error:', data.error)
        toast({
          title: "Error",
          description: data.error || "Failed to load policies",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('❌ [Vendor] Failed to load policies:', error)
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
      const response = await fetch('/api/vendor/violations', {
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

  const handleAppealViolation = async (violationId: string, appealMessage: string) => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/vendor/violations/${violationId}/appeal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          appealMessage
        })
      })

      const data = await response.json()
      if (data.success) {
        toast({
          title: "Success",
          description: "Appeal submitted successfully"
        })
        setIsAppealDialogOpen(false)
        setSelectedViolation(null)
        loadViolations()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit appeal",
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Policy Compliance</h1>
        <p className="text-muted-foreground mt-2">
          View platform policies and manage your product violations
        </p>
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
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Appealed</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.appealed}</div>
            <p className="text-xs text-muted-foreground">Under appeal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
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
          <TabsTrigger value="violations">My Violations</TabsTrigger>
          <TabsTrigger value="policies">Platform Policies</TabsTrigger>
        </TabsList>

        <TabsContent value="violations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Violations</CardTitle>
              <CardDescription>Manage your product policy violations</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading violations...</p>
                </div>
              ) : violations.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-lg font-semibold">No Violations!</p>
                  <p className="text-muted-foreground">All your products are compliant with platform policies</p>
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
                            <p className="text-sm mb-2">
                              <strong>Reason:</strong> {violation.reason}
                            </p>
                            {violation.appealMessage && (
                              <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-2">
                                <p className="text-sm font-semibold text-blue-800 mb-1">Your Appeal:</p>
                                <p className="text-sm text-blue-700">{violation.appealMessage}</p>
                              </div>
                            )}
                            {violation.adminNotes && (
                              <div className="bg-gray-50 border border-gray-200 rounded p-3 mt-2">
                                <p className="text-sm font-semibold text-gray-800 mb-1">Admin Response:</p>
                                <p className="text-sm text-gray-700">{violation.adminNotes}</p>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {violation.status === 'PENDING' && !violation.appealMessage && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedViolation(violation)
                                  setIsAppealDialogOpen(true)
                                }}
                              >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Appeal
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
              <CardTitle>Platform Policies</CardTitle>
              <CardDescription>Review all active platform compliance policies</CardDescription>
            </CardHeader>
            <CardContent>
              {policies.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No policies available</p>
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
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {policy.description}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              <strong>Type:</strong> {policy.type.replace('_', ' ')}
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

      {/* Appeal Dialog */}
      <AppealDialog
        violation={selectedViolation}
        isOpen={isAppealDialogOpen}
        onClose={() => {
          setIsAppealDialogOpen(false)
          setSelectedViolation(null)
        }}
        onSubmit={handleAppealViolation}
      />
    </div>
  )
}

// Appeal Dialog Component
function AppealDialog({
  violation,
  isOpen,
  onClose,
  onSubmit
}: {
  violation: Violation | null
  isOpen: boolean
  onClose: () => void
  onSubmit: (violationId: string, appealMessage: string) => void
}) {
  const [appealMessage, setAppealMessage] = useState("")

  if (!violation) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Appeal Violation</DialogTitle>
          <DialogDescription>
            Explain why you believe this violation should be reconsidered
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Product</Label>
            <p className="text-sm font-medium">{violation.product.name}</p>
          </div>
          <div>
            <Label>Policy</Label>
            <p className="text-sm font-medium">{violation.policy.name}</p>
          </div>
          <div>
            <Label>Violation Reason</Label>
            <p className="text-sm">{violation.reason}</p>
          </div>
          <div>
            <Label htmlFor="appealMessage">Your Appeal</Label>
            <Textarea
              id="appealMessage"
              value={appealMessage}
              onChange={(e) => setAppealMessage(e.target.value)}
              placeholder="Explain why this violation should be reconsidered. Provide any relevant details or documentation..."
              rows={6}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (appealMessage.trim()) {
                onSubmit(violation.id, appealMessage)
                setAppealMessage("")
              }
            }}
            disabled={!appealMessage.trim()}
          >
            Submit Appeal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

