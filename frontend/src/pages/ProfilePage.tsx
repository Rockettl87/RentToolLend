import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { FiStar, FiTool, FiMapPin, FiCalendar, FiShield } from 'react-icons/fi'
import api from '../services/api'
import ToolCard from '../components/ToolCard'
import toast from 'react-hot-toast'

interface ProfileUser {
  _id: string
  firstName: string
  lastName: string
  avatar?: string
  location?: { city?: string; state?: string }
  lenderRating: number
  renterRating: number
  lenderReviewCount: number
  renterReviewCount: number
  createdAt: string
  totalRentalsAsRenter?: number
  totalRentalsAsLender?: number
}

interface Review {
  _id: string
  reviewer: { firstName: string; lastName: string; avatar?: string }
  rating: number
  comment: string
  reviewType: string
  createdAt: string
  tool?: { title: string }
}

interface Tool {
  _id: string
  title: string
  images: string[]
  pricePerDay: number
  category: string
  condition: string
  location: { city: string; state: string }
  rating: number
  reviewCount: number
  deliveryOptions: { pickup: boolean; delivery: boolean }
  owner: { firstName: string; lastName: string; avatar?: string; lenderRating: number; lenderReviewCount: number }
  depositAmount?: number
}

const StarRating: React.FC<{ rating: number; size?: 'sm' | 'lg' }> = ({ rating, size = 'sm' }) => (
  <span className={`flex items-center gap-0.5 ${size === 'lg' ? 'text-xl' : 'text-sm'}`}>
    {[1,2,3,4,5].map(i => (
      <span key={i} className={i <= Math.round(rating) ? 'star' : 'star-empty'}>★</span>
    ))}
  </span>
)

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>()
  const [profile, setProfile] = useState<ProfileUser | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [tools, setTools] = useState<Tool[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewTab, setReviewTab] = useState<'lender' | 'renter'>('lender')

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const [profileRes, reviewsRes, toolsRes] = await Promise.all([
          api.get(`/auth/user/${id}`),
          api.get(`/reviews/user/${id}`),
          api.get('/tools/search', { params: { ownerId: id, limit: 8 } }),
        ])
        setProfile(profileRes.data.user)
        setReviews(reviewsRes.data.reviews || [])
        setTools(toolsRes.data.tools || [])
      } catch {
        toast.error('Profile not found')
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [id])

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-10 animate-pulse">
      <div className="flex items-center gap-5 mb-8">
        <div className="w-24 h-24 rounded-full bg-gray-200" />
        <div className="space-y-2">
          <div className="h-6 bg-gray-200 rounded w-40" />
          <div className="h-4 bg-gray-200 rounded w-24" />
        </div>
      </div>
    </div>
  )

  if (!profile) return (
    <div className="text-center py-20 text-gray-500">Profile not found</div>
  )

  const lenderReviews = reviews.filter(r => r.reviewType === 'renter_reviewing_lender')
  const renterReviews = reviews.filter(r => r.reviewType === 'lender_reviewing_renter')
  const displayReviews = reviewTab === 'lender' ? lenderReviews : renterReviews

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Profile header */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {profile.avatar ? (
            <img src={profile.avatar} alt="" className="w-24 h-24 rounded-full object-cover" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-brand-200 flex items-center justify-center text-brand-700 text-3xl font-bold">
              {profile.firstName[0]}{profile.lastName[0]}
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {profile.firstName} {profile.lastName}
            </h1>
            {profile.location?.city && (
              <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                <FiMapPin className="w-4 h-4" />
                {profile.location.city}{profile.location.state ? `, ${profile.location.state}` : ''}
              </div>
            )}
            <div className="flex items-center gap-1 text-gray-400 text-sm mt-1">
              <FiCalendar className="w-4 h-4" />
              Member since {new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
            </div>
          </div>

          {/* Rating summary */}
          <div className="flex gap-6">
            {profile.lenderReviewCount > 0 && (
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <StarRating rating={profile.lenderRating} size="lg" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{profile.lenderRating.toFixed(1)}</p>
                <p className="text-xs text-gray-500">{profile.lenderReviewCount} lender review{profile.lenderReviewCount !== 1 ? 's' : ''}</p>
              </div>
            )}
            {profile.renterReviewCount > 0 && (
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <StarRating rating={profile.renterRating} size="lg" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{profile.renterRating.toFixed(1)}</p>
                <p className="text-xs text-gray-500">{profile.renterReviewCount} renter review{profile.renterReviewCount !== 1 ? 's' : ''}</p>
              </div>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-gray-100">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 text-brand-600 mb-1">
              <FiTool className="w-4 h-4" />
            </div>
            <p className="text-xl font-bold text-gray-900">{tools.length}</p>
            <p className="text-xs text-gray-500">Tools listed</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 text-green-600 mb-1">
              <FiShield className="w-4 h-4" />
            </div>
            <p className="text-xl font-bold text-gray-900">{profile.lenderReviewCount}</p>
            <p className="text-xs text-gray-500">Rentals completed</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 text-yellow-500 mb-1">
              <FiStar className="w-4 h-4" />
            </div>
            <p className="text-xl font-bold text-gray-900">{(reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0).toFixed(1)}</p>
            <p className="text-xs text-gray-500">Overall rating</p>
          </div>
        </div>
      </div>

      {/* Tool listings */}
      {tools.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiTool className="w-5 h-5" /> {profile.firstName}'s Tools ({tools.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {tools.map(tool => <ToolCard key={tool._id} tool={tool} />)}
          </div>
        </div>
      )}

      {/* Reviews */}
      {reviews.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiStar className="w-5 h-5" /> Reviews ({reviews.length})
          </h2>

          {/* Review type tabs */}
          {lenderReviews.length > 0 && renterReviews.length > 0 && (
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-4 w-fit">
              <button
                onClick={() => setReviewTab('lender')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${reviewTab === 'lender' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                As Lender ({lenderReviews.length})
              </button>
              <button
                onClick={() => setReviewTab('renter')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${reviewTab === 'renter' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                As Renter ({renterReviews.length})
              </button>
            </div>
          )}

          <div className="space-y-3">
            {displayReviews.map(review => (
              <div key={review._id} className="card p-4">
                <div className="flex items-center gap-3 mb-2">
                  {review.reviewer.avatar ? (
                    <img src={review.reviewer.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-sm font-bold">
                      {review.reviewer.firstName[0]}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{review.reviewer.firstName} {review.reviewer.lastName}</p>
                    <div className="flex items-center gap-2">
                      <StarRating rating={review.rating} />
                      <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                {review.tool && (
                  <p className="text-xs text-gray-400 mb-1.5">For: {review.tool.title}</p>
                )}
                <p className="text-sm text-gray-600">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {reviews.length === 0 && tools.length === 0 && (
        <div className="text-center py-16 text-gray-500">No activity yet.</div>
      )}
    </div>
  )
}
