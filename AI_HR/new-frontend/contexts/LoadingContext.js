import { createContext, useContext, useState } from 'react'

const LoadingContext = createContext()

export const useLoading = () => {
  const context = useContext(LoadingContext)
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider')
  }
  return context
}

export const LoadingProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingText, setLoadingText] = useState('Loading...')

  const showLoading = (text = 'Loading...') => {
    setLoadingText(text)
    setIsLoading(true)
  }

  const hideLoading = () => {
    setIsLoading(false)
    setLoadingText('Loading...')
  }

  return (
    <LoadingContext.Provider
      value={{
        isLoading,
        loadingText,
        setIsLoading,
        setLoadingText,
        showLoading,
        hideLoading,
      }}
    >
      {children}
    </LoadingContext.Provider>
  )
}