import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { FiCalendar, FiMapPin, FiShield, FiCheck, FiX, FiAlertCircle, FiStar, FiTruck } from 'react-icons/fi'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

interface Booking {
  _id: string
  tool: {
    _id: string
    title: string
    images: string[]
    category: string
    location: { city: string; state: string }
  }
  renter: { _id: string; firstName: string; lastName: string; avatar?: string }
  lender: { _id: string; firstName: string; lastName: string; avatar?: string }
  startDate: string
  endDate: string
  totalDays: number
  rentalRate: number
  rentalSubtotal: number
  insuranceFee: number
  platformFee: number
  deliveryFee: number
  depositAmount: number
  totalCharged: number
  lenderPayout: number
  paymentMethod: string
  paymentStatus: string
  deliveryOption: string
  status: string
  insurancePlan: string
  insuranceCoverageAmount: number
  renterMessage?: string
  lenderNote?: string
  cancellationReason?: string
  renterReviewed: boolean
  lenderReviewed: boolean
  hasClaim: boolean
  createdAt: string
  approvedAt?: string
  paidAt?: string
  activatedAt?: string
  completedAt?: string
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

const REVIEW_STARS = [1, 2, 3, 4, 5]

function ReviewModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void
  onSubmit: (rating: number, comment: string) => Promise<void>
}) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [hover, setHover] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) { toast.error('Please write a comment'); return }
    setSubmitting(true)
    try {
      await onSubmit(rating, comment)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Leave a Review</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
            <div className="flex gap-1">
              {REVIEW_STARS.map(s => (
                <button
                  key={s}
                  type="button"
                  onMouseEnter={() => setHover(s)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(s)}
                  className={`text-3xl transition-colors ${s <= (hover || rating) ? 'text-orange-400' : 'text-gray-200'}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your experience</label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              rows={4}
              placeholder="Share your experience with this rental..."
              maxLength={1000}
            />
            <p className="text-xs text-gray-400 text-right">{comment.length}/1000</p>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1">
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showReview, setShowReview] = useState(false)

  useEffect(() => {
    api.get(`/bookings/${id}`)
      .then(res => setBooking(res.data.booking))
      .catch(() => { toast.error('Booking not found'); navigate('/bookings') })
      .finally(() => setLoading(false))
  }, [id, navigate])

  const doAction = async (action: string, body?: object) => {
    setActionLoading(true)
    try {
      const { data } = await api.put(`/bookings/${id}/${action}`, body)
      setBooking(data.booking)
      toast.success('Booking updated')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Action failed')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReview = async (rating: number, comment: string) => {
    const isLender = user?._id === booking?.lender._id
    try {
      await api.post('/reviews', {
        bookingId: booking!._id,
        rating,
        comment,
        reviewType: isLender ? 'lender_reviewing_renter' : 'renter_reviewing_lender',
      })
      setBooking(prev => prev ? {
        ...prev,
        renterReviewed: isLender ? prev.renterReviewed : true,
        lenderReviewed: isLender ? true : prev.lenderReviewed,
      } : null)
      setShowReview(false)
      toast.success('Review submitted!')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit review')
      throw err
    }
  }

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-10 animate-pulse">
      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 space-y-4">
          <div className="h-6 bg-gray-200 rounded w-48" />
          <div className="h-32 bg-gray-200 rounded-xl" />
          <div className="h-48 bg-gray-200 rounded-xl" />
        </div>
        <div className="h-64 bg-gray-200 rounded-xl" />
      </div>
    </div>
  )

  if (!booking) return null

  const isRenter = user?._id === booking.renter._id
  const isLender = user?._id === booking.lender._id
  const canReview = booking.status === 'completed' && (
    (isRenter && !booking.renterReviewed) || (isLender && !booking.lenderReviewed)
  )
  const hasReviewed = isRenter ? booking.renterReviewed : booking.lenderReviewed

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back */}
      <button onClick={() => navigate('/bookings')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        ← Back to Bookings
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Status header */}
          <div className="card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-gray-500 mb-1">Booking #{booking._id.slice(-6).toUpperCase()}</p>
                <h1 className="text-xl font-bold text-gray-900">{booking.tool.title}</h1>
              </div>
              <span className={`badge text-sm capitalize px-3 py-1 ${STATUS_COLORS[booking.status] || 'bg-gray-100 text-gray-700'}`}>
                {booking.status}
              </span>
            </div>

            {/* Tool preview */}
            <Link to={`/tools/${booking.tool._id}`} className="flex items-center gap-3 mt-4 bg-gray-50 rounded-xl p-3 hover:bg-gray-100 transition-colors">
              <img
                src={booking.tool.images?.[0] || 'https://via.placeholder.com/60?text=Tool'}
                alt=""
                className="w-14 h-14 rounded-lg object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/60?text=Tool' }}
              />
              <div>
                <p className="font-medium text-gray-900">{booking.tool.title}</p>
                <p className="text-sm text-gray-500">{booking.tool.category}</p>
                <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                  <FiMapPin className="w-3 h-3" />
                  {booking.tool.location.city}, {booking.tool.location.state}
                </div>
              </div>
            </Link>
          </div>

          {/* Dates & delivery */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Rental Details</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 text-xs mb-1"><FiCalendar className="inline w-3 h-3 mr-1" />Start Date</p>
                <p className="font-medium">{new Date(booking.startDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1"><FiCalendar className="inline w-3 h-3 mr-1" />End Date</p>
                <p className="font-medium">{new Date(booking.endDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">Duration</p>
                <p className="font-medium">{booking.totalDays} day{booking.totalDays !== 1 ? 's' : ''}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">
                  {booking.deliveryOption === 'delivery' ? <FiTruck className="inline w-3 h-3 mr-1" /> : null}
                  Delivery
                </p>
                <p className="font-medium capitalize">{booking.deliveryOption}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">Payment Method</p>
                <p className="font-medium capitalize">{booking.paymentMethod}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">Payment Status</p>
                <p className="font-medium capitalize">{booking.paymentStatus}</p>
              </div>
            </div>

            {booking.renterMessage && (
              <div className="mt-4 bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Renter's message</p>
                <p className="text-sm text-gray-700">{booking.renterMessage}</p>
              </div>
            )}
            {booking.lenderNote && (
              <div className="mt-3 bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-blue-500 mb-1">Lender note</p>
                <p className="text-sm text-blue-800">{booking.lenderNote}</p>
              </div>
            )}
            {booking.cancellationReason && (
              <div className="mt-3 bg-red-50 rounded-lg p-3">
                <p className="text-xs text-red-500 mb-1">Cancellation reason</p>
                <p className="text-sm text-red-800">{booking.cancellationReason}</p>
              </div>
            )}
          </div>

          {/* Insurance */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-2">
              <FiShield className="w-5 h-5 text-green-600" />
              <h2 className="font-semibold text-gray-900">Protection Plan</h2>
              <span className="badge bg-green-100 text-green-700 capitalize">{booking.insurancePlan}</span>
            </div>
            <p className="text-sm text-gray-600">
              Coverage up to <strong>${booking.insuranceCoverageAmount.toLocaleString()}</strong> for damage, theft, and incidents.
            </p>
            {booking.status === 'completed' && !booking.hasClaim && (
              <Link
                to="/claims"
                state={{ bookingId: booking._id }}
                className="inline-flex items-center gap-1.5 text-sm text-orange-600 hover:underline mt-2"
              >
                <FiAlertCircle className="w-4 h-4" /> File a claim for this rental
              </Link>
            )}
          </div>

          {/* People */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-3">People</h2>
            <div className="grid grid-cols-2 gap-4">
              {([
                { label: 'Renter', person: booking.renter },
                { label: 'Lender', person: booking.lender },
              ] as { label: string; person: { _id: string; firstName: string; lastName: string; avatar?: string } }[]).map(({ label, person }) => (
                <Link key={label} to={`/profile/${person._id}`} className="flex items-center gap-3 hover:opacity-80">
                  {person.avatar ? (
                    <img src={person.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold">
                      {person.firstName[0]}{person.lastName[0]}
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className="font-medium text-gray-900">{person.firstName} {person.lastName}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Cost & Actions */}
        <div className="space-y-4">
          {/* Cost breakdown */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Cost Breakdown</h2>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>${booking.rentalRate}/day × {booking.totalDays} days</span>
                <span>${booking.rentalSubtotal.toFixed(2)}</span>
              </div>
              {booking.deliveryFee > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Delivery fee</span>
                  <span>${booking.deliveryFee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Protection plan</span>
                <span>${booking.insuranceFee.toFixed(2)}</span>
              </div>
              {booking.depositAmount > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Security deposit</span>
                  <span>${booking.depositAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-900 border-t border-gray-100 pt-2 mt-2">
                <span>Total charged</span>
                <span>${booking.totalCharged.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-500 text-xs">
                <span>Lender payout (80%)</span>
                <span>${booking.lenderPayout.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="card p-5 space-y-2">
            <h2 className="font-semibold text-gray-900 mb-3">Actions</h2>

            {/* Lender: approve/deny pending booking */}
            {isLender && booking.status === 'pending' && (
              <>
                <button
                  onClick={() => doAction('respond', { approved: true })}
                  disabled={actionLoading}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <FiCheck className="w-4 h-4" /> Approve Booking
                </button>
                <button
                  onClick={() => {
                    const reason = prompt('Reason for declining (optional):')
                    doAction('respond', { approved: false, lenderNote: reason || undefined })
                  }}
                  disabled={actionLoading}
                  className="btn-secondary w-full flex items-center justify-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
                >
                  <FiX className="w-4 h-4" /> Decline
                </button>
              </>
            )}

            {/* Lender: mark as active */}
            {isLender && (booking.status === 'approved' || booking.status === 'paid') && (
              <button
                onClick={() => doAction('activate')}
                disabled={actionLoading}
                className="btn-primary w-full"
              >
                Mark as Active (Tool Handed Over)
              </button>
            )}

            {/* Lender: complete */}
            {isLender && booking.status === 'active' && (
              <button
                onClick={() => doAction('complete')}
                disabled={actionLoading}
                className="btn-primary w-full"
              >
                <FiCheck className="inline w-4 h-4 mr-1.5" />
                Mark as Returned / Complete
              </button>
            )}

            {/* Renter or Lender: cancel */}
            {['pending', 'approved'].includes(booking.status) && (
              <button
                onClick={() => {
                  const reason = prompt('Reason for cancellation:')
                  if (reason !== null) doAction('cancel', { cancellationReason: reason })
                }}
                disabled={actionLoading}
                className="btn-secondary w-full text-red-600 border-red-200 hover:bg-red-50"
              >
                <FiX className="inline w-4 h-4 mr-1.5" />
                Cancel Booking
              </button>
            )}

            {/* Leave review */}
            {canReview && !hasReviewed && (
              <button
                onClick={() => setShowReview(true)}
                className="btn-outline w-full flex items-center justify-center gap-2"
              >
                <FiStar className="w-4 h-4" /> Leave a Review
              </button>
            )}
            {hasReviewed && booking.status === 'completed' && (
              <div className="text-center text-sm text-gray-500 py-2">
                <FiCheck className="inline w-4 h-4 text-green-500 mr-1" />
                Review submitted
              </div>
            )}

            {/* File claim */}
            {['active', 'completed'].includes(booking.status) && !booking.hasClaim && (
              <Link
                to="/claims"
                state={{ bookingId: booking._id }}
                className="btn-secondary w-full flex items-center justify-center gap-2 text-orange-600 border-orange-200 hover:bg-orange-50"
              >
                <FiAlertCircle className="w-4 h-4" /> File a Claim
              </Link>
            )}

            {booking.hasClaim && (
              <div className="bg-orange-50 rounded-lg p-3 text-sm text-orange-700 text-center">
                <FiAlertCircle className="inline w-4 h-4 mr-1" />
                Claim filed for this booking
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Timeline</h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <div className="w-2 h-2 rounded-full bg-gray-400" />
                <span>Requested {new Date(booking.createdAt).toLocaleDateString()}</span>
              </div>
              {booking.approvedAt && (
                <div className="flex items-center gap-2 text-blue-600">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  <span>Approved {new Date(booking.approvedAt).toLocaleDateString()}</span>
                </div>
              )}
              {booking.paidAt && (
                <div className="flex items-center gap-2 text-green-600">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span>Paid {new Date(booking.paidAt).toLocaleDateString()}</span>
                </div>
              )}
              {booking.activatedAt && (
                <div className="flex items-center gap-2 text-brand-600">
                  <div className="w-2 h-2 rounded-full bg-brand-400" />
                  <span>Active {new Date(booking.activatedAt).toLocaleDateString()}</span>
                </div>
              )}
              {booking.completedAt && (
                <div className="flex items-center gap-2 text-gray-900 font-medium">
                  <div className="w-2 h-2 rounded-full bg-gray-600" />
                  <span>Completed {new Date(booking.completedAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showReview && (
        <ReviewModal onClose={() => setShowReview(false)} onSubmit={handleReview} />
      )}
    </div>
  )
}
