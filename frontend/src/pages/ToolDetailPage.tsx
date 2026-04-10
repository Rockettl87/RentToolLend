import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import {
  FiMapPin, FiStar, FiTruck, FiShield, FiCalendar, FiUser,
  FiChevronLeft, FiChevronRight, FiAlertCircle, FiCheck
} from 'react-icons/fi'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

interface Tool {
  _id: string
  title: string
  description: string
  category: string
  brand?: string
  model?: string
  condition: string
  images: string[]
  pricePerDay: number
  pricePerWeek?: number
  depositAmount: number
  minRentalDays: number
  maxRentalDays: number
  location: { city: string; state: string; address?: string }
  deliveryOptions: {
    pickup: boolean
    delivery: boolean
    deliveryRadiusMiles: number
    deliveryFeePerMile: number
    deliveryFlatRate: number
  }
  requiresId: boolean
  requiresDeposit: boolean
  specialInstructions?: string
  safetyNotes?: string
  rating: number
  reviewCount: number
  totalRentals: number
  isAvailable: boolean
  owner: {
    _id: string
    firstName: string
    lastName: string
    avatar?: string
    lenderRating: number
    lenderReviewCount: number
    createdAt: string
  }
  tags: string[]
}

interface Review {
  _id: string
  reviewer: { firstName: string; lastName: string; avatar?: string }
  rating: number
  comment: string
  categories?: { communication?: number; accuracy?: number; condition?: number; value?: number }
  createdAt: string
}

interface Cost {
  totalDays: number
  rentalRate: number
  rentalSubtotal: number
  insuranceFee: number
  deliveryFee: number
  depositAmount: number
  totalCharged: number
  lenderPayout: number
}

const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
  <span className="flex items-center gap-0.5">
    {[1,2,3,4,5].map(i => (
      <span key={i} className={i <= Math.round(rating) ? 'star' : 'star-empty'}>★</span>
    ))}
  </span>
)

const PAYMENT_METHODS = [
  { value: 'stripe', label: '💳 Credit / Debit Card (Stripe)' },
  { value: 'paypal', label: '🅿️ PayPal' },
  { value: 'venmo', label: '💚 Venmo' },
  { value: 'zelle', label: '🏦 Zelle' },
]

const INSURANCE_PLANS = [
  { value: 'basic', label: 'Basic', coverage: '$500', fee: '5%' },
  { value: 'standard', label: 'Standard', coverage: '$1,000', fee: '10%' },
  { value: 'premium', label: 'Premium', coverage: '$5,000', fee: '15%' },
]

export default function ToolDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [tool, setTool] = useState<Tool | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [imgIndex, setImgIndex] = useState(0)

  // Booking form
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [deliveryOption, setDeliveryOption] = useState<'pickup' | 'delivery'>('pickup')
  const [paymentMethod, setPaymentMethod] = useState('stripe')
  const [insurancePlan, setInsurancePlan] = useState('standard')
  const [renterMessage, setRenterMessage] = useState('')
  const [cost, setCost] = useState<Cost | null>(null)
  const [calcLoading, setCalcLoading] = useState(false)
  const [bookLoading, setBookLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [toolRes, reviewRes] = await Promise.all([
          api.get(`/tools/${id}`),
          api.get(`/reviews/tool/${id}`),
        ])
        setTool(toolRes.data.tool)
        setReviews(reviewRes.data.reviews || [])
      } catch {
        toast.error('Tool not found')
        navigate('/search')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id, navigate])

  useEffect(() => {
    if (!startDate || !endDate || !tool) return
    const calc = async () => {
      setCalcLoading(true)
      try {
        const { data } = await api.post('/bookings/calculate', {
          toolId: tool._id,
          startDate,
          endDate,
          deliveryOption,
          insurancePlan,
        })
        setCost(data)
      } catch {
        setCost(null)
      } finally {
        setCalcLoading(false)
      }
    }
    calc()
  }, [startDate, endDate, deliveryOption, insurancePlan, tool])

  const handleBook = async () => {
    if (!user) { navigate('/login'); return }
    if (!startDate || !endDate) { toast.error('Select rental dates'); return }
    setBookLoading(true)
    try {
      const { data } = await api.post('/bookings', {
        toolId: tool!._id,
        startDate,
        endDate,
        deliveryOption,
        paymentMethod,
        insurancePlan,
        renterMessage,
      })
      toast.success('Booking request sent!')
      navigate(`/bookings/${data.booking._id}`)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Booking failed')
    } finally {
      setBookLoading(false)
    }
  }

  if (loading) return (
    <div className="max-w-6xl mx-auto px-4 py-10 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="aspect-video bg-gray-200 rounded-xl" />
          <div className="h-6 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
        <div className="h-96 bg-gray-200 rounded-xl" />
      </div>
    </div>
  )

  if (!tool) return null

  const images = tool.images.length > 0 ? tool.images : ['https://via.placeholder.com/800x600?text=No+Image']
  const isOwner = user?._id === tool.owner._id

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Images + Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image gallery */}
          <div className="relative aspect-video bg-gray-100 rounded-xl overflow-hidden">
            <img
              src={images[imgIndex]}
              alt={tool.title}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x600?text=Tool' }}
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setImgIndex(i => (i - 1 + images.length) % images.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-2 hover:bg-black/70"
                >
                  <FiChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setImgIndex(i => (i + 1) % images.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-2 hover:bg-black/70"
                >
                  <FiChevronRight className="w-5 h-5" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setImgIndex(i)}
                      className={`w-2 h-2 rounded-full transition-colors ${i === imgIndex ? 'bg-white' : 'bg-white/50'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((img, i) => (
                <button key={i} onClick={() => setImgIndex(i)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${i === imgIndex ? 'border-brand-500' : 'border-gray-200'}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Title & meta */}
          <div>
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{tool.title}</h1>
              <span className={`badge shrink-0 ${tool.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {tool.isAvailable ? 'Available' : 'Unavailable'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
              <span className="badge bg-brand-100 text-brand-700">{tool.category}</span>
              <span>Condition: <strong className="text-gray-700">{tool.condition}</strong></span>
              {tool.brand && <span>Brand: <strong className="text-gray-700">{tool.brand}</strong></span>}
              {tool.model && <span>Model: <strong className="text-gray-700">{tool.model}</strong></span>}
            </div>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1">
                <FiMapPin className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">{tool.location.city}, {tool.location.state}</span>
              </div>
              {tool.rating > 0 && (
                <div className="flex items-center gap-1">
                  <StarRating rating={tool.rating} />
                  <span className="text-sm text-gray-500">({tool.reviewCount} reviews)</span>
                </div>
              )}
              <span className="text-sm text-gray-500">{tool.totalRentals} rentals</span>
            </div>
          </div>

          {/* Description */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-2">About this tool</h2>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{tool.description}</p>
            {tool.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {tool.tags.map(tag => (
                  <span key={tag} className="badge bg-gray-100 text-gray-600">#{tag}</span>
                ))}
              </div>
            )}
          </div>

          {/* Delivery & requirements */}
          <div className="card p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Pickup & Delivery</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                {tool.deliveryOptions.pickup && <li className="flex items-center gap-2"><FiCheck className="text-green-500" /> Pickup available</li>}
                {tool.deliveryOptions.delivery && (
                  <li className="flex items-center gap-2">
                    <FiTruck className="text-brand-500" />
                    Delivery within {tool.deliveryOptions.deliveryRadiusMiles} miles
                    {tool.deliveryOptions.deliveryFlatRate > 0
                      ? ` · $${tool.deliveryOptions.deliveryFlatRate} flat`
                      : ` · $${tool.deliveryOptions.deliveryFeePerMile}/mi`}
                  </li>
                )}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Requirements</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>Min rental: <strong>{tool.minRentalDays} day{tool.minRentalDays > 1 ? 's' : ''}</strong></li>
                <li>Max rental: <strong>{tool.maxRentalDays} days</strong></li>
                {tool.requiresId && <li className="text-amber-700">⚠ ID required</li>}
                {tool.requiresDeposit && <li>Security deposit: <strong>${tool.depositAmount}</strong></li>}
              </ul>
            </div>
            {tool.specialInstructions && (
              <div className="col-span-2">
                <h3 className="font-semibold text-gray-900 mb-1">Special instructions</h3>
                <p className="text-sm text-gray-600">{tool.specialInstructions}</p>
              </div>
            )}
            {tool.safetyNotes && (
              <div className="col-span-2 bg-amber-50 rounded-lg p-3 flex gap-2">
                <FiAlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-800">{tool.safetyNotes}</p>
              </div>
            )}
          </div>

          {/* Owner */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-3">About the lender</h2>
            <Link to={`/profile/${tool.owner._id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              {tool.owner.avatar ? (
                <img src={tool.owner.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-brand-200 flex items-center justify-center text-brand-700 text-lg font-bold">
                  {tool.owner.firstName[0]}{tool.owner.lastName[0]}
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-900">{tool.owner.firstName} {tool.owner.lastName}</p>
                {tool.owner.lenderRating > 0 && (
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <StarRating rating={tool.owner.lenderRating} />
                    <span>{tool.owner.lenderRating.toFixed(1)} ({tool.owner.lenderReviewCount} reviews)</span>
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-0.5">
                  Member since {new Date(tool.owner.createdAt).getFullYear()}
                </p>
              </div>
            </Link>
          </div>

          {/* Reviews */}
          {reviews.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-semibold text-gray-900 text-lg">Reviews ({reviews.length})</h2>
              {reviews.map(review => (
                <div key={review._id} className="card p-4">
                  <div className="flex items-center gap-3 mb-2">
                    {review.reviewer.avatar ? (
                      <img src={review.reviewer.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-bold">
                        {review.reviewer.firstName[0]}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{review.reviewer.firstName} {review.reviewer.lastName}</p>
                      <div className="flex items-center gap-1">
                        <StarRating rating={review.rating} />
                        <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Booking card */}
        <div className="space-y-4">
          <div className="card p-5 sticky top-20">
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-3xl font-bold text-gray-900">${tool.pricePerDay}</span>
              <span className="text-gray-500">/day</span>
              {tool.pricePerWeek && (
                <span className="text-sm text-gray-400 ml-2">${tool.pricePerWeek}/week</span>
              )}
            </div>

            {isOwner ? (
              <div className="bg-brand-50 rounded-lg p-4 text-center text-sm text-brand-700 font-medium">
                This is your listing.{' '}
                <Link to="/dashboard" className="underline">Manage it in Dashboard</Link>
              </div>
            ) : !tool.isAvailable ? (
              <div className="bg-red-50 rounded-lg p-4 text-center text-sm text-red-700">
                This tool is currently unavailable.
              </div>
            ) : (
              <>
                {/* Date selection */}
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      <FiCalendar className="inline w-3 h-3 mr-1" />Start Date
                    </label>
                    <DatePicker
                      selected={startDate}
                      onChange={date => { setStartDate(date); if (endDate && date && date >= endDate) setEndDate(null) }}
                      minDate={new Date()}
                      className="input-field text-sm"
                      placeholderText="Select start date"
                      dateFormat="MMM d, yyyy"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      <FiCalendar className="inline w-3 h-3 mr-1" />End Date
                    </label>
                    <DatePicker
                      selected={endDate}
                      onChange={date => setEndDate(date)}
                      minDate={startDate || new Date()}
                      className="input-field text-sm"
                      placeholderText="Select end date"
                      dateFormat="MMM d, yyyy"
                    />
                  </div>
                </div>

                {/* Delivery option */}
                {tool.deliveryOptions.delivery && (
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Pickup or Delivery</label>
                    <div className="grid grid-cols-2 gap-2">
                      {tool.deliveryOptions.pickup && (
                        <button
                          onClick={() => setDeliveryOption('pickup')}
                          className={`py-2 rounded-lg text-sm font-medium border transition-colors ${deliveryOption === 'pickup' ? 'bg-brand-600 text-white border-brand-600' : 'border-gray-200 text-gray-600 hover:border-brand-400'}`}
                        >
                          Pickup
                        </button>
                      )}
                      <button
                        onClick={() => setDeliveryOption('delivery')}
                        className={`py-2 rounded-lg text-sm font-medium border transition-colors ${deliveryOption === 'delivery' ? 'bg-brand-600 text-white border-brand-600' : 'border-gray-200 text-gray-600 hover:border-brand-400'}`}
                      >
                        <FiTruck className="inline w-3.5 h-3.5 mr-1" />Delivery
                      </button>
                    </div>
                  </div>
                )}

                {/* Insurance plan */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    <FiShield className="inline w-3 h-3 mr-1" />Protection Plan
                  </label>
                  <div className="space-y-1.5">
                    {INSURANCE_PLANS.map(p => (
                      <button
                        key={p.value}
                        onClick={() => setInsurancePlan(p.value)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm border transition-colors ${insurancePlan === p.value ? 'bg-green-50 border-green-500 text-green-800' : 'border-gray-200 text-gray-600 hover:border-green-300'}`}
                      >
                        <span className="font-medium">{p.label}</span>
                        <span className="text-xs">{p.coverage} · {p.fee}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment method */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Payment Method</label>
                  <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="input-field text-sm">
                    {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>

                {/* Message */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Message to lender (optional)</label>
                  <textarea
                    value={renterMessage}
                    onChange={e => setRenterMessage(e.target.value)}
                    className="input-field text-sm resize-none"
                    rows={2}
                    placeholder="Tell the lender about your project..."
                  />
                </div>

                {/* Cost breakdown */}
                {cost && !calcLoading && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-4 space-y-1 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>${cost.rentalRate}/day × {cost.totalDays} days</span>
                      <span>${cost.rentalSubtotal.toFixed(2)}</span>
                    </div>
                    {cost.deliveryFee > 0 && (
                      <div className="flex justify-between text-gray-600">
                        <span>Delivery fee</span>
                        <span>${cost.deliveryFee.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-gray-600">
                      <span>Protection plan</span>
                      <span>${cost.insuranceFee.toFixed(2)}</span>
                    </div>
                    {cost.depositAmount > 0 && (
                      <div className="flex justify-between text-gray-600">
                        <span>Security deposit</span>
                        <span>${cost.depositAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-1 mt-1">
                      <span>Total</span>
                      <span>${cost.totalCharged.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-gray-400">Lender receives ${cost.lenderPayout.toFixed(2)}</p>
                  </div>
                )}
                {calcLoading && startDate && endDate && (
                  <div className="text-center text-sm text-gray-500 mb-4">Calculating cost...</div>
                )}

                <button
                  onClick={handleBook}
                  disabled={bookLoading || !startDate || !endDate}
                  className="btn-primary w-full"
                >
                  {bookLoading ? 'Sending request...' : user ? 'Request Booking' : 'Sign in to Book'}
                </button>
                <p className="text-xs text-center text-gray-400 mt-2">
                  You won't be charged until the lender approves
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
