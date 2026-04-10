import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { FiTool, FiSearch, FiUser, FiMenu, FiX, FiLogOut, FiPlusCircle, FiCalendar, FiShield } from 'react-icons/fi'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
    setProfileOpen(false)
  }

  const isActive = (path: string) => location.pathname === path

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-brand-600">
            <FiTool className="w-7 h-7" />
            <span>RentToolLend</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/search" className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${isActive('/search') ? 'text-brand-600' : 'text-gray-600 hover:text-brand-600'}`}>
              <FiSearch className="w-4 h-4" /> Find Tools
            </Link>
            {user && (
              <>
                <Link to="/list-tool" className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${isActive('/list-tool') ? 'text-brand-600' : 'text-gray-600 hover:text-brand-600'}`}>
                  <FiPlusCircle className="w-4 h-4" /> List a Tool
                </Link>
                <Link to="/bookings" className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${isActive('/bookings') ? 'text-brand-600' : 'text-gray-600 hover:text-brand-600'}`}>
                  <FiCalendar className="w-4 h-4" /> Bookings
                </Link>
                <Link to="/claims" className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${isActive('/claims') ? 'text-brand-600' : 'text-gray-600 hover:text-brand-600'}`}>
                  <FiShield className="w-4 h-4" /> Claims
                </Link>
              </>
            )}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 rounded-full px-3 py-1.5 transition-colors"
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold">
                      {user.firstName[0]}{user.lastName[0]}
                    </div>
                  )}
                  <span className="text-sm font-medium">{user.firstName}</span>
                </button>
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                    <Link to="/dashboard" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setProfileOpen(false)}>
                      <FiUser className="w-4 h-4" /> Dashboard
                    </Link>
                    <Link to={`/profile/${user._id}`} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setProfileOpen(false)}>
                      <FiUser className="w-4 h-4" /> My Profile
                    </Link>
                    {user.role === 'admin' && (
                      <Link to="/admin" className="flex items-center gap-2 px-4 py-2 text-sm text-brand-600 hover:bg-brand-50 font-medium" onClick={() => setProfileOpen(false)}>
                        <FiShield className="w-4 h-4" /> Admin Panel
                      </Link>
                    )}
                    <hr className="my-2 border-gray-100" />
                    <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left">
                      <FiLogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-secondary text-sm py-2 px-4">Sign In</Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-4">Get Started</Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3">
          <Link to="/search" className="flex items-center gap-2 text-gray-700 font-medium py-2" onClick={() => setMenuOpen(false)}>
            <FiSearch /> Find Tools
          </Link>
          {user ? (
            <>
              <Link to="/list-tool" className="flex items-center gap-2 text-gray-700 font-medium py-2" onClick={() => setMenuOpen(false)}><FiPlusCircle /> List a Tool</Link>
              <Link to="/bookings" className="flex items-center gap-2 text-gray-700 font-medium py-2" onClick={() => setMenuOpen(false)}><FiCalendar /> Bookings</Link>
              <Link to="/dashboard" className="flex items-center gap-2 text-gray-700 font-medium py-2" onClick={() => setMenuOpen(false)}><FiUser /> Dashboard</Link>
              <Link to="/claims" className="flex items-center gap-2 text-gray-700 font-medium py-2" onClick={() => setMenuOpen(false)}><FiShield /> Claims</Link>
              {user.role === 'admin' && <Link to="/admin" className="flex items-center gap-2 text-brand-600 font-medium py-2" onClick={() => setMenuOpen(false)}><FiShield /> Admin Panel</Link>}
              <button onClick={handleLogout} className="flex items-center gap-2 text-red-600 font-medium py-2"><FiLogOut /> Sign Out</button>
            </>
          ) : (
            <div className="flex gap-3 pt-2">
              <Link to="/login" className="btn-secondary flex-1 text-center" onClick={() => setMenuOpen(false)}>Sign In</Link>
              <Link to="/register" className="btn-primary flex-1 text-center" onClick={() => setMenuOpen(false)}>Get Started</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}
