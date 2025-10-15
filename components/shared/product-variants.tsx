"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Edit2, Save, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ProductVariant {
  id?: string
  name: string
  sku?: string
  price?: number
  inventory: number
  attributes: Record<string, string>
  images: string[]
  isActive: boolean
}

interface ProductVariantsProps {
  variants: ProductVariant[]
  onVariantsChange: (variants: ProductVariant[]) => void
  className?: string
}

const COMMON_ATTRIBUTES = {
  color: ['Red', 'Blue', 'Green', 'Black', 'White', 'Yellow', 'Purple', 'Orange', 'Pink', 'Gray'],
  size: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
  material: ['Cotton', 'Polyester', 'Wool', 'Silk', 'Leather', 'Denim', 'Linen'],
  style: ['Casual', 'Formal', 'Sport', 'Vintage', 'Modern', 'Classic']
}

export function ProductVariants({ variants, onVariantsChange, className = "" }: ProductVariantsProps) {
  const [isAddingVariant, setIsAddingVariant] = useState(false)
  const [editingVariant, setEditingVariant] = useState<string | null>(null)
  const [newVariant, setNewVariant] = useState<Partial<ProductVariant>>({
    name: '',
    sku: '',
    price: undefined,
    inventory: 0,
    attributes: {},
    images: [],
    isActive: true
  })
  const { toast } = useToast()

  const addVariant = () => {
    if (!newVariant.name || !newVariant.attributes || Object.keys(newVariant.attributes).length === 0) {
      toast({
        title: "Missing information",
        description: "Please provide a variant name and at least one attribute",
        variant: "destructive"
      })
      return
    }

    const variant: ProductVariant = {
      id: `temp-${Date.now()}`,
      name: newVariant.name,
      sku: newVariant.sku || '',
      price: newVariant.price,
      inventory: newVariant.inventory || 0,
      attributes: newVariant.attributes,
      images: newVariant.images || [],
      isActive: newVariant.isActive ?? true
    }

    onVariantsChange([...variants, variant])
    setNewVariant({
      name: '',
      sku: '',
      price: undefined,
      inventory: 0,
      attributes: {},
      images: [],
      isActive: true
    })
    setIsAddingVariant(false)
    
    toast({
      title: "Variant added",
      description: "Product variant has been added successfully"
    })
  }

  const updateVariant = (id: string, updates: Partial<ProductVariant>) => {
    const updatedVariants = variants.map(variant => 
      variant.id === id ? { ...variant, ...updates } : variant
    )
    onVariantsChange(updatedVariants)
    setEditingVariant(null)
    
    toast({
      title: "Variant updated",
      description: "Product variant has been updated successfully"
    })
  }

  const removeVariant = (id: string) => {
    onVariantsChange(variants.filter(variant => variant.id !== id))
    toast({
      title: "Variant removed",
      description: "Product variant has been removed",
      variant: "destructive"
    })
  }

  const addAttribute = (key: string, value: string) => {
    setNewVariant(prev => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        [key]: value
      }
    }))
  }

  const removeAttribute = (key: string) => {
    setNewVariant(prev => {
      const newAttributes = { ...prev.attributes }
      delete newAttributes[key]
      return {
        ...prev,
        attributes: newAttributes
      }
    })
  }

  const generateVariantName = () => {
    const attributes = newVariant.attributes || {}
    const attributeValues = Object.values(attributes)
    if (attributeValues.length > 0) {
      setNewVariant(prev => ({
        ...prev,
        name: attributeValues.join(' - ')
      }))
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Product Variants</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAddingVariant(true)}
          disabled={isAddingVariant}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Variant
        </Button>
      </div>

      {/* Existing Variants */}
      {variants.length > 0 && (
        <div className="space-y-3">
          {variants.map((variant) => (
            <Card key={variant.id}>
              <CardContent className="p-4">
                {editingVariant === variant.id ? (
                  <VariantEditForm
                    variant={variant}
                    onSave={(updates) => updateVariant(variant.id!, updates)}
                    onCancel={() => setEditingVariant(null)}
                  />
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{variant.name}</h4>
                        {!variant.isActive && (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {variant.sku && <span>SKU: {variant.sku}</span>}
                        {variant.price && <span>Price: ${Number(variant.price).toFixed(2)}</span>}
                        <span>Stock: {variant.inventory}</span>
                      </div>
                      <div className="flex gap-2">
                        {Object.entries(variant.attributes).map(([key, value]) => (
                          <Badge key={key} variant="outline" className="text-xs">
                            {key}: {value}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingVariant(variant.id!)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeVariant(variant.id!)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add New Variant Form */}
      {isAddingVariant && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add New Variant</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Attributes */}
            <div className="space-y-3">
              <Label>Attributes</Label>
              <div className="grid gap-3 md:grid-cols-2">
                {Object.entries(COMMON_ATTRIBUTES).map(([attribute, options]) => (
                  <div key={attribute} className="space-y-2">
                    <Label className="text-sm capitalize">{attribute}</Label>
                    <Select
                      value={newVariant.attributes?.[attribute] || ''}
                      onValueChange={(value) => addAttribute(attribute, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${attribute}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {options.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
              
              {/* Selected Attributes */}
              {newVariant.attributes && Object.keys(newVariant.attributes).length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm">Selected Attributes</Label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(newVariant.attributes).map(([key, value]) => (
                      <Badge key={key} variant="secondary" className="flex items-center gap-1">
                        {key}: {value}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => removeAttribute(key)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Variant Details */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="variantName">Variant Name</Label>
                <div className="flex gap-2">
                  <Input
                    id="variantName"
                    value={newVariant.name || ''}
                    onChange={(e) => setNewVariant(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Red - Large"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateVariantName}
                    disabled={!newVariant.attributes || Object.keys(newVariant.attributes).length === 0}
                  >
                    Auto
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="variantSku">SKU (Optional)</Label>
                <Input
                  id="variantSku"
                  value={newVariant.sku || ''}
                  onChange={(e) => setNewVariant(prev => ({ ...prev, sku: e.target.value }))}
                  placeholder="e.g., TSHIRT-RED-L"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="variantPrice">Price Override (Optional)</Label>
                <Input
                  id="variantPrice"
                  type="number"
                  step="0.01"
                  value={newVariant.price || ''}
                  onChange={(e) => setNewVariant(prev => ({ ...prev, price: parseFloat(e.target.value) || undefined }))}
                  placeholder="Leave empty to use base price"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="variantInventory">Initial Stock</Label>
                <Input
                  id="variantInventory"
                  type="number"
                  value={newVariant.inventory || 0}
                  onChange={(e) => setNewVariant(prev => ({ ...prev, inventory: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button onClick={addVariant}>
                <Save className="h-4 w-4 mr-2" />
                Add Variant
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddingVariant(false)
                  setNewVariant({
                    name: '',
                    sku: '',
                    price: undefined,
                    inventory: 0,
                    attributes: {},
                    images: [],
                    isActive: true
                  })
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {variants.length === 0 && !isAddingVariant && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-sm text-muted-foreground mb-4">
              No variants added yet. Add variants to offer different options for your product.
            </p>
            <Button variant="outline" onClick={() => setIsAddingVariant(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Variant
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Variant Edit Form Component
function VariantEditForm({ 
  variant, 
  onSave, 
  onCancel 
}: { 
  variant: ProductVariant
  onSave: (updates: Partial<ProductVariant>) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    name: variant.name,
    sku: variant.sku || '',
    price: variant.price?.toString() || '',
    inventory: variant.inventory.toString(),
    isActive: variant.isActive
  })

  const handleSave = () => {
    onSave({
      name: formData.name,
      sku: formData.sku || undefined,
      price: formData.price ? parseFloat(formData.price) : undefined,
      inventory: parseInt(formData.inventory),
      isActive: formData.isActive
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="editName">Variant Name</Label>
          <Input
            id="editName"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="editSku">SKU</Label>
          <Input
            id="editSku"
            value={formData.sku}
            onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="editPrice">Price Override</Label>
          <Input
            id="editPrice"
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="editInventory">Stock</Label>
          <Input
            id="editInventory"
            type="number"
            value={formData.inventory}
            onChange={(e) => setFormData(prev => ({ ...prev, inventory: e.target.value }))}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
