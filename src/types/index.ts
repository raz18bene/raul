export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  image_url?: string
  created_at: string
  // Lista de filtre (chei de atribute) predefinite pentru aceasta categorie,
  // ex: ['Culoare','Material','Producator'] pentru Filamente 3D.
  filter_keys?: string[]
}

export interface Product {
  id: string
  name: string
  slug: string
  description?: string
  price: number
  sale_price?: number
  stock: number
  sku?: string
  category_id: string
  images: string[]
  is_active: boolean
  featured: boolean
  // Fiecare cheie poate avea una sau mai multe valori (ex: Culoare: ["Roșu","Albastru"])
  attributes?: Record<string, string[]>
  recommended_ids?: string[]
  created_at: string
  categories?: Category
}

export interface Order {
  id: string
  order_number: string
  user_id?: string | null
  customer_name: string
  customer_email: string
  customer_phone: string
  shipping_address: {
    street?: string
    city?: string
    county?: string
    postal_code?: string
  }
  total_amount: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  payment_method: 'card' | 'transfer' | 'ramburs'
  shipping_method?: 'sameday' | 'sediu'
  shipping_cost?: number
  awb_number?: string
  notes?: string
  created_at: string
  order_items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
  created_at: string
}

export interface ContactRequest {
  id: string
  name: string
  email: string
  phone?: string
  material?: string
  message?: string
  type?: string
  file_url?: string
  status: string
  created_at: string
}

export interface CartItem {
  id: string
  name: string
  price: number
  images: string[]
  quantity: number
  stock: number
  sku?: string
}
