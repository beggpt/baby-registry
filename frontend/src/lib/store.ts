import { create } from 'zustand'

interface User {
  id: string
  email: string
  name: string
  dueDate?: string
  babyGender?: string
}

interface AuthStore {
  user: User | null
  token: string | null
  isLoading: boolean
  setAuth: (user: User, token: string) => void
  logout: () => void
  loadFromStorage: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isLoading: true,

  setAuth: (user, token) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    set({ user, token, isLoading: false })
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ user: null, token: null, isLoading: false })
  },

  loadFromStorage: () => {
    try {
      const token = localStorage.getItem('token')
      const userStr = localStorage.getItem('user')
      if (token && userStr) {
        set({ token, user: JSON.parse(userStr), isLoading: false })
      } else {
        set({ isLoading: false })
      }
    } catch {
      set({ isLoading: false })
    }
  },
}))
