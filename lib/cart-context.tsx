"use client"

import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'

export interface CartItem {
  id: string
  productId: string
  variantId?: string
  name: string
  vendor: string
  price: number
  quantity: number
  image: string
  variant?: {
    name: string
    attributes: Record<string, string>
  }
  maxQuantity: number
}

interface CartState {
  items: CartItem[]
  isLoading: boolean
  isDirty: boolean
}

type CartAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ITEMS'; payload: CartItem[] }
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_DIRTY'; payload: boolean }

const initialState: CartState = {
  items: [],
  isLoading: false,
  isDirty: false
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    
    case 'SET_ITEMS':
      return { ...state, items: action.payload, isDirty: false }
    
    case 'ADD_ITEM':
      const existingItem = state.items.find(
        item => item.id === action.payload.id
      )
      
      if (existingItem) {
        const newQuantity = Math.min(
          existingItem.quantity + action.payload.quantity,
          existingItem.maxQuantity
        )
        return {
          ...state,
          items: state.items.map(item =>
            item.id === action.payload.id
              ? { ...item, quantity: newQuantity }
              : item
          ),
          isDirty: true
        }
      } else {
        return {
          ...state,
          items: [...state.items, action.payload],
          isDirty: true
        }
      }
    
    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: Math.min(action.payload.quantity, item.maxQuantity) }
            : item
        ),
        isDirty: true
      }
    
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload),
        isDirty: true
      }
    
    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
        isDirty: true
      }
    
    case 'SET_DIRTY':
      return { ...state, isDirty: action.payload }
    
    default:
      return state
  }
}

interface CartContextType {
  items: CartItem[]
  isLoading: boolean
  isDirty: boolean
  addItem: (item: Omit<CartItem, 'id'>) => Promise<void>
  updateQuantity: (id: string, quantity: number) => Promise<void>
  removeItem: (id: string) => Promise<void>
  clearCart: () => Promise<void>
  getTotalItems: () => number
  getTotalPrice: () => number
  getItemCount: () => number
  syncCart: () => Promise<void>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState)
  const { toast } = useToast()

  // Load cart from localStorage on mount
  useEffect(() => {
    loadCartFromStorage()
  }, [])

  // Save cart to localStorage when it changes
  useEffect(() => {
    if (state.isDirty) {
      saveCartToStorage()
    }
  }, [state.items, state.isDirty])

  const loadCartFromStorage = () => {
    try {
      const savedCart = localStorage.getItem('ecommerce_cart')
      if (savedCart) {
        const items = JSON.parse(savedCart)
        dispatch({ type: 'SET_ITEMS', payload: items })
      }
    } catch (error) {
      console.error('Failed to load cart from storage:', error)
    }
  }

  const saveCartToStorage = () => {
    try {
      localStorage.setItem('ecommerce_cart', JSON.stringify(state.items))
    } catch (error) {
      console.error('Failed to save cart to storage:', error)
    }
  }

  const generateCartItemId = (productId: string, variantId?: string) => {
    return variantId ? `${productId}-${variantId}` : productId
  }

  const addItem = async (item: Omit<CartItem, 'id'>) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      
      const cartItemId = generateCartItemId(item.productId, item.variantId)
      const cartItem: CartItem = {
        ...item,
        id: cartItemId
      }
      
      dispatch({ type: 'ADD_ITEM', payload: cartItem })
      
      toast({
        title: "Added to cart",
        description: `${item.name} has been added to your cart.`
      })
    } catch (error) {
      console.error('Failed to add item to cart:', error)
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive"
      })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const updateQuantity = async (id: string, quantity: number) => {
    try {
      if (quantity <= 0) {
        await removeItem(id)
        return
      }
      
      dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } })
    } catch (error) {
      console.error('Failed to update quantity:', error)
      toast({
        title: "Error",
        description: "Failed to update quantity. Please try again.",
        variant: "destructive"
      })
    }
  }

  const removeItem = async (id: string) => {
    try {
      const item = state.items.find(item => item.id === id)
      dispatch({ type: 'REMOVE_ITEM', payload: id })
      
      if (item) {
        toast({
          title: "Item removed",
          description: `${item.name} has been removed from your cart.`
        })
      }
    } catch (error) {
      console.error('Failed to remove item:', error)
      toast({
        title: "Error",
        description: "Failed to remove item. Please try again.",
        variant: "destructive"
      })
    }
  }

  const clearCart = async () => {
    try {
      dispatch({ type: 'CLEAR_CART' })
      toast({
        title: "Cart cleared",
        description: "All items have been removed from your cart."
      })
    } catch (error) {
      console.error('Failed to clear cart:', error)
      toast({
        title: "Error",
        description: "Failed to clear cart. Please try again.",
        variant: "destructive"
      })
    }
  }

  const getTotalItems = () => {
    return state.items.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalPrice = () => {
    return state.items.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const getItemCount = () => {
    return state.items.length
  }

  const syncCart = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      
      // In a real app, you would sync with the server here
      // For now, we'll just ensure localStorage is up to date
      saveCartToStorage()
      
      dispatch({ type: 'SET_DIRTY', payload: false })
    } catch (error) {
      console.error('Failed to sync cart:', error)
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const value: CartContextType = {
    items: state.items,
    isLoading: state.isLoading,
    isDirty: state.isDirty,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    getTotalItems,
    getTotalPrice,
    getItemCount,
    syncCart
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
