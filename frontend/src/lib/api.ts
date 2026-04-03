import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (!window.location.pathname.includes('/prijava')) {
        window.location.href = '/prijava'
      }
    }
    return Promise.reject(err)
  }
)

export default api

// Referral helper
export const REF_PARAM = 'ref=bebinalista'

export function addRefToUrl(url: string): string {
  try {
    const u = new URL(url)
    u.searchParams.set('ref', 'bebinalista')
    u.searchParams.set('utm_source', 'bebinalista')
    u.searchParams.set('utm_medium', 'wishlist')
    return u.toString()
  } catch {
    return url + (url.includes('?') ? '&' : '?') + REF_PARAM
  }
}

export const authApi = {
  register: (data: { email: string; password: string; name: string; dueDate?: string; babyGender?: string }) =>
    api.post('/auth/register', data),
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  googleLogin: (credential: string) =>
    api.post('/auth/google', { credential }),
  me: () => api.get('/auth/me'),
  updateProfile: (data: any) => api.patch('/auth/profile', data),
}

export const listsApi = {
  getAll: () => api.get('/lists'),
  getOne: (id: string) => api.get(`/lists/${id}`),
  create: (data: { name: string; occasion?: string; description?: string; isPublic?: boolean }) =>
    api.post('/lists', data),
  update: (id: string, data: any) => api.patch(`/lists/${id}`, data),
  delete: (id: string) => api.delete(`/lists/${id}`),
  addItem: (listId: string, productId: string, priority = 'MEDIUM', note?: string) =>
    api.post(`/lists/${listId}/items`, { productId, priority, note }),
  addCustomItem: (listId: string, customProduct: { name: string; price?: number; imageUrl?: string; productUrl?: string; description?: string }, priority = 'MEDIUM', note?: string) =>
    api.post(`/lists/${listId}/items`, { customProduct, priority, note }),
  updateItem: (listId: string, itemId: string, data: any) =>
    api.patch(`/lists/${listId}/items/${itemId}`, data),
  removeItem: (listId: string, itemId: string) =>
    api.delete(`/lists/${listId}/items/${itemId}`),
  smartPaste: (url: string) =>
    api.post('/lists/smart-paste', { url }),
}

export const productsApi = {
  getAll: (params?: {
    q?: string; categoryId?: string; categorySlug?: string; shopSlug?: string
    minPrice?: number; maxPrice?: number; inStock?: boolean
    page?: number; limit?: number; sortBy?: string
  }) => api.get('/products', { params }),
  getOne: (id: string) => api.get(`/products/${id}`),
  getCategories: () => api.get('/products/categories'),
  getFeatured: () => api.get('/products/featured'),
}

export const publicApi = {
  getList: (slug: string) => api.get(`/public/lista/${slug}`),
  reserve: (slug: string, itemId: string, reservedBy: string, note?: string) =>
    api.post(`/public/lista/${slug}/rezerviraj/${itemId}`, { reservedBy, note }),
  reserveGroupBuy: (slug: string, itemId: string, data: { reservedBy: string; note?: string; isGroupBuy: true; targetAmount: number; amount: number; role: 'ORDERER' | 'CONTRIBUTOR' }) =>
    api.post(`/public/lista/${slug}/rezerviraj/${itemId}`, data),
  joinGroupBuy: (slug: string, itemId: string, data: { name: string; role: 'ORDERER' | 'CONTRIBUTOR'; amount: number; note?: string }) =>
    api.post(`/public/lista/${slug}/group/${itemId}/join`, data),
  leaveGroupBuy: (slug: string, itemId: string, contributorId: string) =>
    api.delete(`/public/lista/${slug}/group/${itemId}/leave/${contributorId}`),
  cancelReservation: (slug: string, itemId: string, reservedBy: string) =>
    api.delete(`/public/lista/${slug}/rezerviraj/${itemId}`, { data: { reservedBy } }),
}

export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  getShops: () => api.get('/admin/shops'),
  toggleShop: (slug: string) => api.patch(`/admin/shops/${slug}/toggle`),
  triggerScrape: (slug: string) => api.post(`/admin/shops/${slug}/scrape`),
  getUsers: (params?: { page?: number; q?: string }) => api.get('/admin/users', { params }),
  getUser: (id: string) => api.get(`/admin/users/${id}`),
  setUserRole: (id: string, role: string) => api.patch(`/admin/users/${id}/role`, { role }),
  getFeatured: () => api.get('/admin/featured'),
  addFeatured: (productId: string) => api.post('/admin/featured', { productId }),
  removeFeatured: (id: string) => api.delete(`/admin/featured/${id}`),
  getSettings: () => api.get('/admin/settings'),
  setSetting: (key: string, value: string) => api.put(`/admin/settings/${key}`, { value }),
  getProducts: (params?: { page?: number; q?: string; shop?: string }) =>
    api.get('/admin/products', { params }),
  getCategoryMappings: () => api.get('/admin/category-mappings'),
  createCategoryMapping: (data: { externalName: string; shopSlug?: string; categoryId: string }) =>
    api.post('/admin/category-mappings', data),
  deleteCategoryMapping: (id: string) => api.delete(`/admin/category-mappings/${id}`),
  getUnmappedCategories: () => api.get('/admin/unmapped-categories'),
  getCategories: () => api.get('/admin/categories'),
}

// Dodaj search endpoint
export const searchApi = {
  findLists: (q: string) => api.get('/public/pretraga', { params: { q } }),
}
