"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ShoppingCart, Package, Truck, AlertCircle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useCart } from "@/lib/cart-context"
import { ImageUpload } from "./image-upload"

interface ProductVariant {
  id: string
  name: string
  sku?: string
  price?: number
  inventory: number
  attributes: Record<string, string>
  images: string[]
  isActive: boolean
}

interface Product {
  id: string
  name: string
  description?: string
  price: number
  sku?: string
  inventory: number
  status: string
  images: string[]
  weight?: number
  dimensions?: {
    length?: number
    width?: number
    height?: number
  }
  tags: string[]
  isDigital: boolean
  requiresShipping: boolean
  lowStockThreshold: number
  variants?: ProductVariant[]
  vendor: {
    businessName: string
  }
  category: {
    name: string
  }
}

interface ProductSelectorProps {
  product: Product
  className?: string
}

export function ProductSelector({ product, className = "" }: ProductSelectorProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({})
  const [quantity, setQuantity] = useState(1)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const { addItem } = useCart()
  const { toast } = useToast()

  // Initialize selected variant if product has variants
  useState(() => {
    if (product.variants && product.variants.length > 0) {
      // Find the first available variant
      const availableVariant = product.variants.find(v => v.isActive && v.inventory > 0)
      if (availableVariant) {
        setSelectedVariant(availableVariant)
        setSelectedAttributes(availableVariant.attributes)
      }
    }
  })

  const getAvailableVariants = () => {
    if (!product.variants || product.variants.length === 0) return []
    
    return product.variants.filter(variant => 
      variant.isActive && 
      Object.entries(selectedAttributes).every(([key, value]) => 
        variant.attributes[key] === value
      )
    )
  }

  const getAttributeOptions = (attributeName: string) => {
    if (!product.variants) return []
    
    const options = new Set<string>()
    product.variants.forEach(variant => {
      if (variant.isActive && variant.inventory > 0) {
        // Check if this variant matches other selected attributes
        const matchesOtherAttributes = Object.entries(selectedAttributes).every(([key, value]) => 
          key === attributeName || variant.attributes[key] === value
        )
        
        if (matchesOtherAttributes) {
          options.add(variant.attributes[attributeName])
        }
      }
    })
    
    return Array.from(options)
  }

  const handleAttributeChange = (attributeName: string, value: string) => {
    const newAttributes = { ...selectedAttributes, [attributeName]: value }
    setSelectedAttributes(newAttributes)
    
    // Find matching variant
    const matchingVariant = product.variants?.find(variant =>
      variant.isActive &&
      Object.entries(newAttributes).every(([key, val]) => variant.attributes[key] === val)
    )
    
    setSelectedVariant(matchingVariant || null)
    setQuantity(1) // Reset quantity when variant changes
  }

  const getCurrentPrice = () => {
    if (selectedVariant && selectedVariant.price) {
      return selectedVariant.price
    }
    return product.price
  }

  const getCurrentInventory = () => {
    if (selectedVariant) {
      return selectedVariant.inventory
    }
    return product.inventory
  }

  const getCurrentImages = () => {
    if (selectedVariant && selectedVariant.images.length > 0) {
      return selectedVariant.images
    }
    return product.images
  }

  const getCurrentSku = () => {
    if (selectedVariant && selectedVariant.sku) {
      return selectedVariant.sku
    }
    return product.sku
  }

  const handleAddToCart = async () => {
    if (getCurrentInventory() === 0) {
      toast({
        title: "Out of stock",
        description: "This product is currently out of stock.",
        variant: "destructive"
      })
      return
    }

    if (product.variants && product.variants.length > 0 && !selectedVariant) {
      toast({
        title: "Please select options",
        description: "Please select all required product options.",
        variant: "destructive"
      })
      return
    }

    try {
      setIsAddingToCart(true)
      
      const currentImages = getCurrentImages()
      const cartItem = {
        productId: product.id,
        variantId: selectedVariant?.id,
        name: selectedVariant ? `${product.name} - ${selectedVariant.name}` : product.name,
        vendor: product.vendor.businessName,
        price: getCurrentPrice(),
        quantity: Math.min(quantity, getCurrentInventory()),
        image: currentImages.length > 0 ? currentImages[0] : '/placeholder.svg',
        variant: selectedVariant ? {
          name: selectedVariant.name,
          attributes: selectedVariant.attributes
        } : undefined,
        maxQuantity: getCurrentInventory()
      }

      await addItem(cartItem)
    } catch (error) {
      console.error('Failed to add to cart:', error)
    } finally {
      setIsAddingToCart(false)
    }
  }

  const getAttributeNames = () => {
    if (!product.variants || product.variants.length === 0) return []
    
    const attributeNames = new Set<string>()
    product.variants.forEach(variant => {
      Object.keys(variant.attributes).forEach(key => attributeNames.add(key))
    })
    
    return Array.from(attributeNames)
  }

  const isOutOfStock = getCurrentInventory() === 0
  const isLowStock = getCurrentInventory() <= product.lowStockThreshold && getCurrentInventory() > 0

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Product Images */}
      <div className="space-y-4">
        <div className="aspect-square rounded-lg overflow-hidden bg-muted">
          {getCurrentImages().length > 0 ? (
            <img
              src={getCurrentImages()[0]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
        </div>
        
        {getCurrentImages().length > 1 && (
          <div className="grid grid-cols-4 gap-2">
            {getCurrentImages().slice(1, 5).map((image, index) => (
              <div key={index} className="aspect-square rounded overflow-hidden bg-muted">
                <img
                  src={image}
                  alt={`${product.name} ${index + 2}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="text-muted-foreground mt-2">{product.vendor.businessName}</p>
        </div>

        {product.description && (
          <p className="text-lg text-muted-foreground">{product.description}</p>
        )}

        {/* Price */}
        <div className="text-3xl font-bold">
          ₱{getCurrentPrice().toLocaleString('en-PH')}
          {selectedVariant && selectedVariant.price && selectedVariant.price !== product.price && (
            <span className="text-lg text-muted-foreground line-through ml-2">
              ₱{Number(product.price).toLocaleString('en-PH')}
            </span>
          )}
        </div>

        {/* Stock Status */}
        <div className="space-y-2">
          {isOutOfStock ? (
            <Badge variant="destructive" className="flex items-center gap-2 w-fit">
              <AlertCircle className="h-4 w-4" />
              Out of Stock
            </Badge>
          ) : isLowStock ? (
            <Badge variant="secondary" className="flex items-center gap-2 w-fit">
              <AlertCircle className="h-4 w-4" />
              Only {getCurrentInventory()} left in stock
            </Badge>
          ) : (
            <Badge variant="outline" className="flex items-center gap-2 w-fit">
              <Package className="h-4 w-4" />
              {getCurrentInventory()} in stock
            </Badge>
          )}
        </div>

        {/* Product Attributes */}
        {getAttributeNames().map((attributeName) => (
          <div key={attributeName} className="space-y-2">
            <label className="text-sm font-medium capitalize">
              {attributeName}
            </label>
            <Select
              value={selectedAttributes[attributeName] || ''}
              onValueChange={(value) => handleAttributeChange(attributeName, value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={`Select ${attributeName}`} />
              </SelectTrigger>
              <SelectContent>
                {getAttributeOptions(attributeName).map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}

        {/* Quantity Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Quantity</label>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
            >
              -
            </Button>
            <span className="w-12 text-center font-medium">{quantity}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuantity(Math.min(getCurrentInventory(), quantity + 1))}
              disabled={quantity >= getCurrentInventory()}
            >
              +
            </Button>
          </div>
        </div>

        {/* Add to Cart Button */}
        <Button
          size="lg"
          className="w-full"
          onClick={handleAddToCart}
          disabled={isOutOfStock || isAddingToCart || (product.variants && product.variants.length > 0 && !selectedVariant)}
        >
          {isAddingToCart ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding to Cart...
            </>
          ) : (
            <>
              <ShoppingCart className="mr-2 h-4 w-4" />
              {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
            </>
          )}
        </Button>

        {/* Product Information */}
        <Separator />
        
        <div className="space-y-3 text-sm">
          {getCurrentSku() && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">SKU:</span>
              <span className="font-medium">{getCurrentSku()}</span>
            </div>
          )}
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Category:</span>
            <span className="font-medium">{product.category.name}</span>
          </div>
          
          {product.requiresShipping && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Truck className="h-4 w-4" />
              <span>Requires shipping</span>
            </div>
          )}
          
          {product.isDigital && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Package className="h-4 w-4" />
              <span>Digital product</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {product.tags.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Tags</label>
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
