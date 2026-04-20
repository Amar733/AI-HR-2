import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/ui/LoadingSpinner'

const withAuth = (WrappedComponent, options = {}) => {
  return function AuthenticatedComponent(props) {
    const { user, loading, isInitialized } = useAuth()
    const router = useRouter()

    const {
      redirectTo = '/',
      allowedRoles = null,
      requireEmailVerification = false
    } = options

    useEffect(() => {
      // Wait for auth to initialize
      if (!isInitialized) return

      // If not loading and no user, redirect to login
      if (!loading && !user) {
        router.push(redirectTo)
        return
      }

      // Check role-based access
      if (user && allowedRoles && !allowedRoles.includes(user.role)) {
        router.push('/unauthorized')
        return
      }

      // Check email verification if required
      if (user && requireEmailVerification && !user.isEmailVerified) {
        router.push('/verify-email')
        return
      }
    }, [user, loading, isInitialized, router])

    // Show loading spinner while auth is initializing or checking
    if (!isInitialized || loading) {
      return <LoadingSpinner text="Authenticating..." />
    }

    // Don't render if no user (will redirect)
    if (!user) {
      return <LoadingSpinner text="Redirecting..." />
    }

    // Check role access
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return <LoadingSpinner text="Checking permissions..." />
    }

    // Check email verification
    if (requireEmailVerification && !user.isEmailVerified) {
      return <LoadingSpinner text="Checking account status..." />
    }

    // Render the protected component
    return <WrappedComponent {...props} />
  }
}

export default withAuth

// Higher-order component for admin-only access
export const withAdminAuth = (WrappedComponent) => {
  return withAuth(WrappedComponent, {
    allowedRoles: ['admin'],
    redirectTo: '/unauthorized'
  })
}

// Higher-order component for manager-level access
export const withManagerAuth = (WrappedComponent) => {
  return withAuth(WrappedComponent, {
    allowedRoles: ['admin', 'hr_manager'],
    redirectTo: '/unauthorized'
  })
}

// Higher-order component that requires email verification
export const withVerifiedAuth = (WrappedComponent) => {
  return withAuth(WrappedComponent, {
    requireEmailVerification: true,
    redirectTo: '/verify-email'
  })
}