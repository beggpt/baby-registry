import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  withCredentials: true,
})

// Dodaj JWT token na svaki zahtjev
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Redirect na login ako token istekne
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/prijava'
    }
    return Promise.reject(err)
  }
)

export default api

// ─── Auth ────────────────────────────────────────────
export const authApi = {
  register: (data: { email: string; password: string; name: string; dueDate?: string; babyGender?: string }) =>
    api.post('/auth/register', data),
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
  updateProfile: (data: any) => api.patch('/auth/profile', data),
}

// ─── Liste ───────────────────────────────────────────
export const listsApi = {
  getAll: () => api.get('/lists'),
  getOne: (id: string) => api.get(`/lists/${id}`),
  create: (data: { name: string; description?: string; isPublic?: boolean }) =>
    api.post('/lists', data),
  update: (id: string, data: any) => api.patch(`/lists/${id}`, data),
  delete: (id: string) => api.delete(`/lists/${id}`),

  addItem: (listId: string, productId: string, priority = 'MEDIUM', note?: string) =>
    api.post(`/lists/${listId}/items`, { productId, priority, note }),
  updateItem: (listId: string, itemId: string, data: any) =>
    api.patch(`/lists/${listId}/items/${itemId}`, data),
  removeItem: (listId: string, itemId: string) =>
    api.delete(`/lists/${listId}/items/${itemId}`),
}

// ─── Proizvodi ───────────────────────────────────────
export const productsApi = {
  getAll: (params?: {
    q?: string
    categoryId?: string
    categorySlug?: string
    shopSlug?: string
    minPrice?: number
    maxPrice?: number
    inStock?: boolean
    page?: number
    limit?: number
    sortBy?: string
  }) => api.get('/products', { params }),

  getOne: (id: string) => api.get(`/products/${id}`),
  getCategories: () => api.get('/products/categories'),
}

// ─── Javna lista ─────────────────────────────────────
export const publicApi = {
  getList: (slug: string) => api.get(`/public/lista/${slug}`),
  reserve: (slug: string, itemId: string, reservedBy: string, note?: string) =>
    api.post(`/public/lista/${slug}/rezerviraj/${itemId}`, { reservedBy, note }),
  cancelReservation: (slug: string, itemId: string, reservedBy: string) =>
    api.delete(`/public/lista/${slug}/rezerviraj/${itemId}`, { data: { reservedBy } }),
}

// ─── Admin ───────────────────────────────────────────
export const adminApi = {
  getShops: () => api.get('/admin/shops'),
  triggerScrape: (slug: string) => api.post(`/admin/shops/${slug}/scrape`),
  getStats: () => api.get('/admin/stats'),
}
