import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FiUsers, FiTool, FiCalendar, FiDollarSign, FiShield, FiToggleLeft, FiToggleRight } from 'react-icons/fi'
import api from '../services/api'
import toast from 'react-hot-toast'

interface Stats {
  totalUsers: number
  totalTools: number
  totalBookings: number
  totalRevenue: number
  activeBookings: number
  pendingClaims: number
  newUsersThisMonth: number
  revenueThisMonth: number
}

interface AdminUser {
  _id: string
  firstName: string
  lastName: string
  email: string
  role: string
  isActive: boolean
  lenderRating: number
  renterRating: number
  createdAt: string
  totalTools?: number
}

interface AdminBooking {
  _id: string
  tool: { title: string }
  renter: { firstName: string; lastName: string }
  lender: { firstName: string; lastName: string }
  startDate: string
  endDate: string
  totalCharged: number
  platformFee: number
  status: string
  paymentStatus: string
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

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color: string
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-xl font-bold text-gray-900">{value}</p>
          {sub && <p className="text-xs text-gray-400">{sub}</p>}
        </div>
      </div>
    </div>
  )
}

export default function AdminPage() {
  const [tab, setTab] = useState<'overview' | 'users' | 'bookings'>('overview')
  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [bookings, setBookings] = useState<AdminBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, usersRes, bookingsRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/users'),
          api.get('/admin/bookings'),
        ])
        setStats(statsRes.data.stats)
        setUsers(usersRes.data.users || [])
        setBookings(bookingsRes.data.bookings || [])
      } catch {
        toast.error('Failed to load admin data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const toggleUserActive = async (user: AdminUser) => {
    try {
      await api.put(`/admin/users/${user._id}/deactivate`)
      setUsers(prev => prev.map(u => u._id === user._id ? { ...u, isActive: !u.isActive } : u))
      toast.success(`${user.firstName} ${user.isActive ? 'deactivated' : 'reactivated'}`)
    } catch {
      toast.error('Failed to update user')
    }
  }

  const filteredUsers = users.filter(u =>
    !search ||
    `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  )

  const filteredBookings = bookings.filter(b =>
    !search ||
    `${b.tool?.title} ${b.renter?.firstName} ${b.renter?.lastName} ${b.lender?.firstName}`.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-10 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-40 mb-6" />
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
      </div>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <FiShield className="w-7 h-7 text-brand-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-sm text-gray-500">Platform management</p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={FiUsers} label="Total Users" value={stats.totalUsers} sub={`+${stats.newUsersThisMonth} this month`} color="bg-blue-100 text-blue-600" />
          <StatCard icon={FiTool} label="Total Tools" value={stats.totalTools} color="bg-brand-100 text-brand-600" />
          <StatCard icon={FiCalendar} label="Bookings" value={stats.totalBookings} sub={`${stats.activeBookings} active`} color="bg-green-100 text-green-600" />
          <StatCard icon={FiDollarSign} label="Platform Revenue" value={`$${(stats.totalRevenue || 0).toFixed(0)}`} sub={`$${(stats.revenueThisMonth || 0).toFixed(0)} this month`} color="bg-yellow-100 text-yellow-600" />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {(['overview', 'users', 'bookings'] as const).map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setSearch('') }}
            className={`px-4 py-2.5 text-sm font-medium capitalize border-b-2 transition-colors ${tab === t ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {t === 'users' ? `Users (${users.length})` : t === 'bookings' ? `Bookings (${bookings.length})` : 'Overview'}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Quick Stats</h2>
            <div className="space-y-3 text-sm">
              {[
                ['Active bookings', stats.activeBookings],
                ['Pending claims', stats.pendingClaims],
                ['Total users', stats.totalUsers],
                ['Total tools listed', stats.totalTools],
                ['Total bookings', stats.totalBookings],
                ['Total platform revenue', `$${(stats.totalRevenue || 0).toFixed(2)}`],
              ].map(([label, value]) => (
                <div key={label as string} className="flex justify-between">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-medium text-gray-900">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Recent Bookings</h2>
            {bookings.slice(0, 5).map(b => (
              <div key={b._id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{b.tool?.title}</p>
                  <p className="text-xs text-gray-500">{b.renter?.firstName} → {b.lender?.firstName}</p>
                </div>
                <div className="text-right ml-3">
                  <p className="text-sm font-semibold">${b.totalCharged?.toFixed(2)}</p>
                  <span className={`badge text-xs capitalize ${STATUS_COLORS[b.status] || 'bg-gray-100 text-gray-600'}`}>{b.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users tab */}
      {tab === 'users' && (
        <div>
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field mb-4 max-w-sm"
          />
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">User</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Role</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Ratings</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Joined</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map(user => (
                    <tr key={user._id} className={`hover:bg-gray-50 ${!user.isActive ? 'opacity-60' : ''}`}>
                      <td className="px-4 py-3">
                        <Link to={`/profile/${user._id}`} className="font-medium text-gray-900 hover:text-brand-600">
                          {user.firstName} {user.lastName}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{user.email}</td>
                      <td className="px-4 py-3">
                        <span className={`badge capitalize ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <div className="text-xs">
                          {user.lenderRating > 0 && <div>Lender: <span className="text-orange-500">★</span> {user.lenderRating.toFixed(1)}</div>}
                          {user.renterRating > 0 && <div>Renter: <span className="text-orange-500">★</span> {user.renterRating.toFixed(1)}</div>}
                          {!user.lenderRating && !user.renterRating && '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <span className={`badge text-xs ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {user.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {user.role !== 'admin' && (
                          <button
                            onClick={() => toggleUserActive(user)}
                            title={user.isActive ? 'Deactivate' : 'Reactivate'}
                            className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors"
                          >
                            {user.isActive ? <FiToggleRight className="w-5 h-5 text-green-500" /> : <FiToggleLeft className="w-5 h-5" />}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 && (
                <div className="text-center py-12 text-gray-500">No users found</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bookings tab */}
      {tab === 'bookings' && (
        <div>
          <input
            type="text"
            placeholder="Search bookings by tool or user..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field mb-4 max-w-sm"
          />
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Tool</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Renter → Lender</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Dates</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Total</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Platform Fee</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredBookings.map(b => (
                    <tr key={b._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 max-w-xs truncate">{b.tool?.title}</p>
                        <p className="text-xs text-gray-400">{b._id.slice(-6).toUpperCase()}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        <p>{b.renter?.firstName} {b.renter?.lastName}</p>
                        <p className="text-gray-400">→ {b.lender?.firstName} {b.lender?.lastName}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        <p>{new Date(b.startDate).toLocaleDateString()}</p>
                        <p>{new Date(b.endDate).toLocaleDateString()}</p>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900">${b.totalCharged?.toFixed(2)}</td>
                      <td className="px-4 py-3 text-green-600 font-medium">${b.platformFee?.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={`badge text-xs capitalize ${STATUS_COLORS[b.status] || 'bg-gray-100 text-gray-600'}`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge text-xs capitalize ${b.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {b.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredBookings.length === 0 && (
                <div className="text-center py-12 text-gray-500">No bookings found</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
