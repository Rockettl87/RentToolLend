import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiTool, FiCalendar, FiDollarSign, FiStar, FiTrash2, FiPlusCircle, FiToggleLeft, FiToggleRight, FiEye } from 'react-icons/fi'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

interface Tool {
  _id: string
  title: string
  images: string[]
  pricePerDay: number
  category: string
  condition: string
  isAvailable: boolean
  rating: number
  reviewCount: number
  totalRentals: number
  viewCount: number
  location: { city: string; state: string }
}

interface Booking {
  _id: string
  tool: { _id: string; title: string; images: string[] }
  renter?: { firstName: string; lastName: string }
  lender?: { firstName: string; lastName: string }
  startDate: string
  endDate: string
  totalDays: number
  lenderPayout: number
  totalCharged: number
  status: string
  paymentMethod: string
  createdAt: string
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-blue-100 text-blue-700',
  paid: 'bg-blue-100 text-blue-700',
  active: 'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-red-100 text-red-700',
  disputed: 'bg-orange-100 text-orange-700',
}

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tools, setTools] = useState<Tool[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'listings' | 'bookings'>('overview')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [toolsRes, bookingsRes] = await Promise.all([
          api.get('/tools/my-listings'),
          api.get('/bookings/my-lending'),
        ])
        setTools(toolsRes.data.tools || [])
        setBookings(bookingsRes.data.bookings || [])
      } catch {
        toast.error('Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const toggleAvailability = async (tool: Tool) => {
    try {
      await api.put(`/tools/${tool._id}`, { isAvailable: !tool.isAvailable })
      setTools(prev => prev.map(t => t._id === tool._id ? { ...t, isAvailable: !t.isAvailable } : t))
      toast.success(`${tool.title} is now ${!tool.isAvailable ? 'available' : 'unavailable'}`)
    } catch {
      toast.error('Failed to update availability')
    }
  }

  const deleteTool = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    setDeletingId(id)
    try {
      await api.delete(`/tools/${id}`)
      setTools(prev => prev.filter(t => t._id !== id))
      toast.success('Tool listing removed')
    } catch {
      toast.error('Failed to delete tool')
    } finally {
      setDeletingId(null)
    }
  }

  // Stats
  const totalEarnings = bookings
    .filter(b => ['paid', 'active', 'completed'].includes(b.status))
    .reduce((sum, b) => sum + b.lenderPayout, 0)
  const activeBookings = bookings.filter(b => b.status === 'active').length
  const pendingBookings = bookings.filter(b => b.status === 'pending').length
  const avgRating = tools.reduce((sum, t) => sum + t.rating, 0) / (tools.filter(t => t.rating > 0).length || 1)

  if (loading) return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
        </div>
      </div>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage your listings and track your earnings</p>
        </div>
        <Link to="/list-tool" className="btn-primary flex items-center gap-2">
          <FiPlusCircle className="w-4 h-4" /> List a Tool
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <FiDollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Earnings</p>
              <p className="text-xl font-bold text-gray-900">${totalEarnings.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
              <FiTool className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Tools Listed</p>
              <p className="text-xl font-bold text-gray-900">{tools.length}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <FiCalendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Active / Pending</p>
              <p className="text-xl font-bold text-gray-900">{activeBookings} / {pendingBookings}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
              <FiStar className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Avg Rating</p>
              <p className="text-xl font-bold text-gray-900">
                {tools.some(t => t.rating > 0) ? avgRating.toFixed(1) : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {(['overview', 'listings', 'bookings'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium capitalize border-b-2 transition-colors ${activeTab === tab ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {tab === 'listings' ? `My Tools (${tools.length})` : tab === 'bookings' ? `Bookings (${bookings.length})` : 'Overview'}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'My Bookings', icon: FiCalendar, path: '/bookings', color: 'text-blue-600 bg-blue-50' },
              { label: 'Claims', icon: FiTool, path: '/claims', color: 'text-orange-600 bg-orange-50' },
              { label: 'My Profile', icon: FiTool, path: `/profile/${user?._id}`, color: 'text-purple-600 bg-purple-50' },
              { label: 'List a Tool', icon: FiPlusCircle, path: '/list-tool', color: 'text-brand-600 bg-brand-50' },
            ].map(item => (
              <Link key={item.label} to={item.path} className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${item.color}`}>
                  <item.icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-gray-700">{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Recent bookings */}
          {bookings.length > 0 && (
            <div>
              <h2 className="font-semibold text-gray-900 mb-3">Recent Bookings</h2>
              <div className="space-y-2">
                {bookings.slice(0, 5).map(booking => (
                  <Link key={booking._id} to={`/bookings/${booking._id}`} className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
                    <img
                      src={booking.tool.images?.[0] || 'https://via.placeholder.com/60?text=Tool'}
                      alt=""
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/60?text=Tool' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{booking.tool.title}</p>
                      <p className="text-sm text-gray-500">
                        {booking.renter?.firstName} {booking.renter?.lastName} ·{' '}
                        {new Date(booking.startDate).toLocaleDateString()} – {new Date(booking.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-gray-900">${booking.lenderPayout.toFixed(2)}</p>
                      <span className={`badge text-xs ${STATUS_COLORS[booking.status] || 'bg-gray-100 text-gray-600'}`}>
                        {booking.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
              {bookings.length > 5 && (
                <button onClick={() => setActiveTab('bookings')} className="text-sm text-brand-600 mt-2 hover:underline">
                  View all {bookings.length} bookings →
                </button>
              )}
            </div>
          )}

          {tools.length === 0 && bookings.length === 0 && (
            <div className="text-center py-16">
              <FiTool className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">You haven't listed any tools yet.</p>
              <Link to="/list-tool" className="btn-primary mt-4 inline-flex items-center gap-2">
                <FiPlusCircle /> List Your First Tool
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Listings Tab */}
      {activeTab === 'listings' && (
        <div>
          {tools.length === 0 ? (
            <div className="text-center py-16">
              <FiTool className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No tools listed yet.</p>
              <Link to="/list-tool" className="btn-primary mt-4 inline-flex items-center gap-2">
                <FiPlusCircle /> List a Tool
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {tools.map(tool => (
                <div key={tool._id} className="card p-4 flex items-center gap-4">
                  <img
                    src={tool.images?.[0] || 'https://via.placeholder.com/80?text=Tool'}
                    alt=""
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80?text=Tool' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{tool.title}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mt-0.5">
                      <span className="badge bg-gray-100 text-gray-600">{tool.category}</span>
                      <span>{tool.condition}</span>
                      <span>{tool.location.city}, {tool.location.state}</span>
                      <span>{tool.viewCount} views</span>
                      <span>{tool.totalRentals} rentals</span>
                      {tool.rating > 0 && <span>★ {tool.rating.toFixed(1)} ({tool.reviewCount})</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="font-bold text-gray-900">${tool.pricePerDay}/day</p>
                      <span className={`badge text-xs ${tool.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {tool.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button onClick={() => toggleAvailability(tool)} title="Toggle availability" className="p-1.5 text-gray-500 hover:text-brand-600 transition-colors">
                        {tool.isAvailable ? <FiToggleRight className="w-5 h-5 text-green-500" /> : <FiToggleLeft className="w-5 h-5" />}
                      </button>
                      <Link to={`/tools/${tool._id}`} title="View" className="p-1.5 text-gray-500 hover:text-brand-600 transition-colors">
                        <FiEye className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => deleteTool(tool._id, tool.title)}
                        disabled={deletingId === tool._id}
                        title="Delete"
                        className="p-1.5 text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bookings Tab */}
      {activeTab === 'bookings' && (
        <div>
          {bookings.length === 0 ? (
            <div className="text-center py-16 text-gray-500">No bookings yet.</div>
          ) : (
            <div className="space-y-2">
              {bookings.map(booking => (
                <Link key={booking._id} to={`/bookings/${booking._id}`} className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
                  <img
                    src={booking.tool.images?.[0] || 'https://via.placeholder.com/60'}
                    alt=""
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/60?text=Tool' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{booking.tool.title}</p>
                    <p className="text-sm text-gray-500">
                      {booking.renter?.firstName} {booking.renter?.lastName} ·{' '}
                      {new Date(booking.startDate).toLocaleDateString()} – {new Date(booking.endDate).toLocaleDateString()} ({booking.totalDays} days)
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-gray-900">${booking.lenderPayout.toFixed(2)}</p>
                    <span className={`badge text-xs ${STATUS_COLORS[booking.status] || 'bg-gray-100 text-gray-600'}`}>
                      {booking.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
