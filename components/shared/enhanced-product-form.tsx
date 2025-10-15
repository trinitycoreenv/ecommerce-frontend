"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Package, Truck, Tag, Settings } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ImageUpload } from "./image-upload"
import { ProductVariants } from "./product-variants"

interface ProductFormData {
  name: string
  description: string
  price: string
  categoryId: string
  sku: string
  inventory: string
  weight: string
  dimensions: {
    length: string
    width: string
    height: string
  }
  tags: string[]
  isDigital: boolean
  requiresShipping: boolean
  lowStockThreshold: string
  images: string[]
  variants: Array<{
    id?: string
    name: string
    sku?: string
    price?: number
    inventory: number
    attributes: Record<string, string>
    images: string[]
    isActive: boolean
  }>
}

interface EnhancedProductFormProps {
  initialData?: Partial<ProductFormData>
  onSubmit: (data: ProductFormData) => Promise<void>
  isSubmitting?: boolean
  mode: 'create' | 'edit'
}

interface Category {
  id: string
  name: string
  description?: string
}

export function EnhancedProductForm({ 
  initialData, 
  onSubmit, 
  isSubmitting = false, 
  mode 
}: EnhancedProductFormProps) {
  const { toast } = useToast()
  const [categories, setCategories] = useState<Category[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    sku: '',
    inventory: '0',
    weight: '',
    dimensions: {
      length: '',
      width: '',
      height: ''
    },
    tags: [],
    isDigital: false,
    requiresShipping: true,
    lowStockThreshold: '10',
    images: [],
    variants: [],
    ...initialData
  })

  const [newTag, setNewTag] = useState('')

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories')
        const data = await response.json()
        if (data.success) {
          setCategories(data.data)
        } else {
          console.error('Failed to fetch categories:', data.error)
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
      } finally {
        setCategoriesLoading(false)
      }
    }

    fetchCategories()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Product name is required",
        variant: "destructive"
      })
      return
    }

    if (!formData.categoryId) {
      toast({
        title: "Validation Error", 
        description: "Please select a category",
        variant: "destructive"
      })
      return
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid price",
        variant: "destructive"
      })
      return
    }

    // Validate inventory
    const inventory = parseInt(formData.inventory)
    const maxInt32 = 2147483647
    if (inventory > maxInt32 || inventory < 0) {
      toast({
        title: "Validation Error",
        description: `Inventory must be between 0 and ${maxInt32.toLocaleString()}`,
        variant: "destructive"
      })
      return
    }

    if (formData.images.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please upload at least one product image",
        variant: "destructive"
      })
      return
    }

    try {
      // Generate SKU if not provided
      const submitData = {
        ...formData,
        sku: formData.sku || `SKU-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      }
      
      await onSubmit(submitData)
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Basic Info
          </TabsTrigger>
          <TabsTrigger value="media" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Images & Variants
          </TabsTrigger>
          <TabsTrigger value="shipping" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Shipping
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Advanced
          </TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Wireless Bluetooth Headphones"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select 
                    value={formData.categoryId} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriesLoading ? (
                        <SelectItem value="loading" disabled>Loading categories...</SelectItem>
                      ) : categories.length === 0 ? (
                        <SelectItem value="no-categories" disabled>No categories available</SelectItem>
                      ) : (
                        categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your product in detail..."
                  rows={4}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU (Optional)</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                    placeholder="e.g., WH-001 (auto-generated if empty)"
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to auto-generate a unique SKU
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inventory">Initial Stock</Label>
                  <Input
                    id="inventory"
                    type="number"
                    value={formData.inventory}
                    onChange={(e) => setFormData(prev => ({ ...prev, inventory: e.target.value }))}
                    placeholder="0"
                    min="0"
                    max="2147483647"
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum: 2,147,483,647 units
                  </p>
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Add a tag..."
                  />
                  <Button type="button" variant="outline" onClick={addTag}>
                    Add
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Media & Variants Tab */}
        <TabsContent value="media" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Images</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUpload
                images={formData.images}
                onImagesChange={(images) => setFormData(prev => ({ ...prev, images }))}
                maxImages={8}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Product Variants</CardTitle>
            </CardHeader>
            <CardContent>
              <ProductVariants
                variants={formData.variants}
                onVariantsChange={(variants) => setFormData(prev => ({ ...prev, variants }))}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shipping Tab */}
        <TabsContent value="shipping" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Shipping Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Digital Product</Label>
                  <p className="text-sm text-muted-foreground">
                    This product is digital and doesn't require shipping
                  </p>
                </div>
                <Switch
                  checked={formData.isDigital}
                  onCheckedChange={(checked) => setFormData(prev => ({ 
                    ...prev, 
                    isDigital: checked,
                    requiresShipping: !checked 
                  }))}
                />
              </div>

              {!formData.isDigital && (
                <>
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Requires Shipping</Label>
                      <p className="text-sm text-muted-foreground">
                        This product needs to be shipped to customers
                      </p>
                    </div>
                    <Switch
                      checked={formData.requiresShipping}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requiresShipping: checked }))}
                    />
                  </div>

                  {formData.requiresShipping && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="weight">Weight (grams)</Label>
                        <Input
                          id="weight"
                          type="number"
                          value={formData.weight}
                          onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                          placeholder="e.g., 500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Dimensions (cm)</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            placeholder="Length"
                            value={formData.dimensions.length}
                            onChange={(e) => setFormData(prev => ({ 
                              ...prev, 
                              dimensions: { ...prev.dimensions, length: e.target.value }
                            }))}
                          />
                          <Input
                            placeholder="Width"
                            value={formData.dimensions.width}
                            onChange={(e) => setFormData(prev => ({ 
                              ...prev, 
                              dimensions: { ...prev.dimensions, width: e.target.value }
                            }))}
                          />
                          <Input
                            placeholder="Height"
                            value={formData.dimensions.height}
                            onChange={(e) => setFormData(prev => ({ 
                              ...prev, 
                              dimensions: { ...prev.dimensions, height: e.target.value }
                            }))}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="lowStockThreshold">Low Stock Alert Threshold</Label>
                <Input
                  id="lowStockThreshold"
                  type="number"
                  value={formData.lowStockThreshold}
                  onChange={(e) => setFormData(prev => ({ ...prev, lowStockThreshold: e.target.value }))}
                  placeholder="10"
                  min="0"
                  max="2147483647"
                />
                <p className="text-sm text-muted-foreground">
                  You'll be notified when stock falls below this number
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Submit Button */}
      <div className="flex justify-end gap-4 pt-6 border-t">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {mode === 'create' ? 'Creating...' : 'Saving...'}
            </>
          ) : (
            mode === 'create' ? 'Create Product' : 'Save Changes'
          )}
        </Button>
      </div>
    </form>
  )
}
