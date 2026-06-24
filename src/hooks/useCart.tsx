'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { CartItem } from '@/types'

interface CartContextType {
  cart: CartItem[]
  addToCart: (item: Omit<CartItem, 'quantity'>, qty?: number) => void
  removeFromCart: (id: string) => void
  updateQty: (id: string, qty: number) => void
  clearCart: () => void
  total: number
  count: number
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])

  useEffect(() => {
    try {
      const saved = localStorage.getItem('tn_cart')
      if (saved) setCart(JSON.parse(saved))
    } catch {}
  }, [])

  useEffect(() => {
    localStorage.setItem('tn_cart', JSON.stringify(cart))
  }, [cart])

  function addToCart(item: Omit<CartItem, 'quantity'>, qty = 1) {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id)
      if (existing) {
        const newQty = Math.min(existing.quantity + qty, item.stock)
        return prev.map(i => i.id === item.id ? { ...i, quantity: newQty } : i)
      }
      return [...prev, { ...item, quantity: Math.min(qty, item.stock) }]
    })
  }

  function removeFromCart(id: string) {
    setCart(prev => prev.filter(i => i.id !== id))
  }

  function updateQty(id: string, qty: number) {
    setCart(prev => {
      const item = prev.find(i => i.id === id)
      if (!item) return prev
      if (qty <= 0) return prev.filter(i => i.id !== id)
      return prev.map(i => i.id === id ? { ...i, quantity: Math.min(qty, i.stock) } : i)
    })
  }

  function clearCart() {
    setCart([])
  }

  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const count = cart.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQty, clearCart, total, count }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
