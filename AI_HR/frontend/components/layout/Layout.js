import { useState } from 'react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import { useAuth } from '../../contexts/AuthContext'
import { APP_NAME } from '../../utils/constants'

export default function Layout({ children }) {
  const [showSidebar, setShowSidebar] = useState(false)
  const { user, logout } = useAuth()

  const handleShowSidebar = () => setShowSidebar(true)
  const handleCloseSidebar = () => setShowSidebar(false)

  return (
    <div className="layout">
      <Navbar 
        user={user} 
        onLogout={logout} 
        onMenuClick={handleShowSidebar} 
      />
      <Sidebar 
        show={showSidebar} 
        handleClose={handleCloseSidebar} 
        user={user}
      />

      <main className="main-content">
        <div className="content-wrapper">
          <div className="app-page-shell">
            <div className="app-page-shell-header">
              <h1 className="app-shell-title">{APP_NAME}</h1>
              <span className="app-shell-badge">AI Workspace</span>
            </div>
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
