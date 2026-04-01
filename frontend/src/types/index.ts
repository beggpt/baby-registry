export type Priority = 'HIGH' | 'MEDIUM' | 'LOW'
export type ReservationStatus = 'RESERVED' | 'PURCHASED'
export type BabyGender = 'boy' | 'girl' | 'surprise'

export interface User {
  id: string
  email: string
  name: string
  dueDate?: string
  babyGender?: BabyGender
  createdAt: string
}

export interface Category {
  id: string
  name: string
  slug: string
  parentId?: string
  parent?: Category
  children?: Category[]
  _count?: { products: number }
}

export interface Product {
  id: string
  name: string
  description?: string
  price: number
  currency: string
  imageUrl?: string
  productUrl: string
  sku?: string
  inStock: boolean
  shopName: string
  shopSlug: string
  categoryId?: string
  category?: Category
  lastScraped: string
  createdAt: string
}

export interface Reservation {
  id: string
  listItemId: string
  reservedBy: string
  reservedAt: string
  status: ReservationStatus
  note?: string
}

export interface ListItem {
  id: string
  listId: string
  productId: string
  product: Product
  priority: Priority
  note?: string
  createdAt: string
  reservation?: Reservation
}

export interface BabyList {
  id: string
  userId: string
  user?: Pick<User, 'name' | 'dueDate' | 'babyGender'>
  name: string
  description?: string
  shareSlug: string
  isPublic: boolean
  createdAt: string
  updatedAt: string
  items: ListItem[]
  _count?: { items: number }
}

export interface PaginatedProducts {
  products: Product[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
