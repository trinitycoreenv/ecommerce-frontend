"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Plus, Settings, Truck, RefreshCw } from "lucide-react"
import { getShippo } from "@/lib/clients/shippo"

interface CarrierAccount {
  carrier: string
  status: string
  test: boolean
  active: boolean
}

export default function CarriersPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [carrierAccounts, setCarrierAccounts] = useState<CarrierAccount[]>([])

  // Fetch carrier accounts on load
  useEffect(() => {
    fetchCarrierAccounts()
  }, [])

  const fetchCarrierAccounts = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/carriers')
      const data = await response.json()
      
      if (data.success) {
        setCarrierAccounts(data.carriers)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error fetching carrier accounts:', error)
      toast({
        title: "Error",
        description: "Failed to fetch carrier accounts",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const toggleCarrier = async (carrier: string, active: boolean) => {
    try {
      const response = await fetch('/api/admin/carriers/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carrier, active })
      })

      const data = await response.json()
      
      if (data.success) {
        setCarrierAccounts(current =>
          current.map(acc =>
            acc.carrier === carrier ? { ...acc, active } : acc
          )
        )
        
        toast({
          title: "Success",
          description: `${carrier} has been ${active ? 'enabled' : 'disabled'}`
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error toggling carrier:', error)
      toast({
        title: "Error",
        description: `Failed to ${active ? 'enable' : 'disable'} ${carrier}`,
        variant: "destructive"
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Shipping Carriers</h1>
          <p className="text-muted-foreground mt-2">Manage your shipping carrier accounts</p>
        </div>
        <Button onClick={fetchCarrierAccounts}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {carrierAccounts.map((account) => (
            <Card key={account.carrier}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Truck className="h-5 w-5" />
                    <CardTitle>{account.carrier}</CardTitle>
                  </div>
                  <Switch
                    checked={account.active}
                    onCheckedChange={(checked) => toggleCarrier(account.carrier, checked)}
                  />
                </div>
                <CardDescription>
                  Status: <span className={account.status === 'active' ? 'text-green-600' : 'text-yellow-600'}>
                    {account.status}
                  </span>
                  {account.test && ' (Test Mode)'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" onClick={() => window.open('https://goshippo.com/carriers', '_blank')}>
                  <Settings className="h-4 w-4 mr-2" />
                  Configure
                </Button>
              </CardContent>
            </Card>
          ))}

          {/* Add New Carrier Card */}
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle>Add New Carrier</CardTitle>
              <CardDescription>Connect a new shipping carrier account</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => window.open('https://goshippo.com/carriers/add', '_blank')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Carrier
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}