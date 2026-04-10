import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FiCalendar, FiTool, FiChevronRight } from 'react-icons/fi'
import api from '../services/api'
import toast from 'react-hot-toast'

interface Booking {
  _id: string
  tool: { _id: string; title: string; images: string[] }
  renter: { _id: string; firstName: string; lastName: string }
  lender: { _id: string; firstName: string; lastName: string }
  startDate: string
  endDate: string
  totalDays: number
  totalCharged: number
  lenderPayout: number
  status: string
  paymentMethod: string
  insurancePlan: string
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

const STATUS_ORDER = ['active', 'pending', 'approved', 'paid', 'completed', 'cancelled', 'disputed']

function BookingCard({ booking, viewAs }: { booking: Booking; viewAs: 'renter' | 'lender' }) {
  const other = viewAs === 'renter' ? booking.lender : booking.renter
  const amount = viewAs === 'renter' ? booking.totalCharged : booking.lenderPayout

  return (
    <Link to={`/bookings/${booking._id}`} className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
      <img
        src={booking.tool.images?.[0] || 'https://via.placeholder.com/60?text=Tool'}
        alt=""
        className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
        onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/60?text=Tool' }}
      />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 truncate">{booking.tool.title}</p>
        <p className="text-sm text-gray-500 mt-0.5">
          {viewAs === 'renter' ? 'From' : 'To'}: {other?.firstName} {other?.lastName}
        </p>
        <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
          <FiCalendar className="w-3 h-3" />
          {new Date(booking.startDate).toLocaleDateString()} – {new Date(booking.endDate).toLocaleDateString()}
          <span>({booking.totalDays} day{booking.totalDays !== 1 ? 's' : ''})</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span className={`badge text-xs capitalize ${STATUS_COLORS[booking.status] || 'bg-gray-100 text-gray-700'}`}>
          {booking.status}
        </span>
        <p className="font-semibold text-gray-900">${amount.toFixed(2)}</p>
        <FiChevronRight className="w-4 h-4 text-gray-400" />
      </div>
    </Link>
  )
}

export default function BookingsPage() {
  const [tab, setTab] = useState<'renting' | 'lending'>('renting')
  const [rentals, setRentals] = useState<Booking[]>([])
  const [lending, setLending] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const [rentalsRes, lendingRes] = await Promise.all([
          api.get('/bookings/my-rentals'),
          api.get('/bookings/my-lending'),
        ])
        setRentals(rentalsRes.data.bookings || [])
        setLending(lendingRes.data.bookings || [])
      } catch {
        toast.error('Failed to load bookings')
      } finally {
        setLoading(false)
      }
    }
    fetchBookings()
  }, [])

  const currentList = tab === 'renting' ? rentals : lending

  const sorted = [...currentList].sort((a, b) => {
    const ai = STATUS_ORDER.indexOf(a.status)
    const bi = STATUS_ORDER.indexOf(b.status)
    if (ai !== bi) return ai - bi
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const filtered = filter === 'all' ? sorted : sorted.filter(b => b.status === filter)
  const statuses = Array.from(new Set(currentList.map(b => b.status)))

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="animate-pulse space-y-3">
        <div className="h-8 bg-gray-200 rounded w-32" />
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
      </div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Bookings</h1>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        <button
          onClick={() => { setTab('renting'); setFilter('all') }}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'renting' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          My Rentals ({rentals.length})
        </button>
        <button
          onClick={() => { setTab('lending'); setFilter('all') }}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'lending' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          My Lending ({lending.length})
        </button>
      </div>

      {/* Status filter chips */}
      {statuses.length > 1 && (
        <div className="flex gap-2 flex-wrap mb-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filter === 'all' ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}
          >
            All ({currentList.length})
          </button>
          {statuses.map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1 rounded-full text-xs font-medium border capitalize transition-colors ${filter === status ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}
            >
              {status} ({currentList.filter(b => b.status === status).length})
            </button>
          ))}
        </div>
      )}

      {/* Bookings list */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <FiTool className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          {currentList.length === 0 ? (
            <>
              <p className="text-gray-500 text-lg">No {tab === 'renting' ? 'rentals' : 'lending activity'} yet</p>
              {tab === 'renting' ? (
                <Link to="/search" className="btn-primary mt-4 inline-block">Browse Tools</Link>
              ) : (
                <Link to="/list-tool" className="btn-primary mt-4 inline-block">List a Tool</Link>
              )}
            </>
          ) : (
            <p className="text-gray-500">No bookings with status "{filter}"</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(booking => (
            <BookingCard key={booking._id} booking={booking} viewAs={tab === 'renting' ? 'renter' : 'lender'} />
          ))}
        </div>
      )}
    </div>
  )
}
