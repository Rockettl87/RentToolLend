import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import api from '../services/api'

interface User {
  _id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  role: 'user' | 'admin'
  avatar?: string
  location?: {
    coordinates: [number, number]
    address?: string
    city?: string
    state?: string
  }
  lenderRating: number
  renterRating: number
  lenderReviewCount: number
  renterReviewCount: number
  paypalEmail?: string
  venmoHandle?: string
  zellePhone?: string
  preferredPaymentMethod?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  updateUser: (data: Partial<User>) => void
  updateLocation: (lat: number, lng: number, address: string, city: string, state: string) => Promise<void>
}

interface RegisterData {
  firstName: string
  lastName: string
  email: string
  password: string
  phone?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('rtl_token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('rtl_token')
      if (savedToken) {
        try {
          api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`
          const { data } = await api.get('/auth/me')
          setUser(data.user)
          setToken(savedToken)
        } catch {
          localStorage.removeItem('rtl_token')
          delete api.defaults.headers.common['Authorization']
        }
      }
      setLoading(false)
    }
    initAuth()
  }, [])

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password })
    const { token: newToken, user: newUser } = data
    localStorage.setItem('rtl_token', newToken)
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
    setToken(newToken)
    setUser(newUser)
  }

  const register = async (registerData: RegisterData) => {
    const { data } = await api.post('/auth/register', registerData)
    const { token: newToken, user: newUser } = data
    localStorage.setItem('rtl_token', newToken)
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
    setToken(newToken)
    setUser(newUser)
  }

  const logout = () => {
    localStorage.removeItem('rtl_token')
    delete api.defaults.headers.common['Authorization']
    setToken(null)
    setUser(null)
  }

  const updateUser = (data: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...data } : null)
  }

  const updateLocation = async (lat: number, lng: number, address: string, city: string, state: string) => {
    const { data } = await api.put('/auth/location', { lat, lng, address, city, state })
    setUser(data.user)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser, updateLocation }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
