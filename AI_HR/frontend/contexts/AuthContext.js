import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'
import Cookies from 'js-cookie'
import { useRouter } from 'next/router'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    initializeAuth()
  }, [])

  const initializeAuth = async () => {
    try {
      setLoading(true)
      const token = Cookies.get('token')

      if (token) {
        // Verify token and get user data
        const userData = await authAPI.getProfile()
        setUser(userData.user)
      }
    } catch (error) {
      console.error('Auth initialization failed:', error)
      // Clear invalid token
      Cookies.remove('token')
      setUser(null)
    } finally {
      setLoading(false)
      setIsInitialized(true)
    }
  }

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials)
      const { token, user: userData } = response

      // Store token in secure cookie
      Cookies.set('token', token, { 
        expires: 7, // 7 days
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      })

      setUser(userData)

      return { success: true, user: userData }
    } catch (error) {
      console.error('Login failed:', error)
      throw new Error(error.message || 'Login failed')
    }
  }

  const signup = async (userData) => {
    try {
      const response = await authAPI.signup(userData)
      return { success: true, message: response.message }
    } catch (error) {
      console.error('Signup failed:', error)
      throw new Error(error.message || 'Signup failed')
    }
  }

  const logout = async () => {
    try {
      // Call logout API if available
      if (authAPI.logout) {
        await authAPI.logout()
      }
    } catch (error) {
      console.error('Logout API failed:', error)
    } finally {
      // Always clear local state
      Cookies.remove('token')
      setUser(null)

      // Redirect to login page
      window.location.href = '/'
    }
  }

  const updateProfile = async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData)
      setUser(response.user)
      return { success: true, user: response.user }
    } catch (error) {
      console.error('Profile update failed:', error)
      throw new Error(error.message || 'Profile update failed')
    }
  }

  const changePassword = async (passwordData) => {
    try {
      await authAPI.changePassword(passwordData)
      return { success: true }
    } catch (error) {
      console.error('Password change failed:', error)
      throw new Error(error.message || 'Password change failed')
    }
  }

  const refreshUser = async () => {
    try {
      const userData = await authAPI.getProfile()
      setUser(userData.user)
      return userData.user
    } catch (error) {
      console.error('User refresh failed:', error)
      // If refresh fails, user might be logged out
      if (error.status === 401) {
        logout()
      }
      throw error
    }
  }

  const value = {
    user,
    loading,
    isInitialized,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    updateProfile,
    changePassword,
    refreshUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext