import React from 'react'
import { Link } from 'react-router-dom'
import { FiMapPin, FiStar, FiTruck, FiShield } from 'react-icons/fi'

interface ToolCardProps {
  tool: {
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
    owner: {
      firstName: string
      lastName: string
      avatar?: string
      lenderRating: number
      lenderReviewCount: number
    }
    depositAmount?: number
  }
  distanceMiles?: number
}

const StarRating: React.FC<{ rating: number; small?: boolean }> = ({ rating, small }) => {
  const size = small ? 'text-xs' : 'text-sm'
  return (
    <span className={`flex items-center gap-0.5 ${size}`}>
      {[1,2,3,4,5].map(i => (
        <span key={i} className={i <= Math.round(rating) ? 'star' : 'star-empty'}>★</span>
      ))}
    </span>
  )
}

export default function ToolCard({ tool, distanceMiles }: ToolCardProps) {
  const imageUrl = tool.images[0] || 'https://via.placeholder.com/400x300?text=No+Image'

  return (
    <Link to={`/tools/${tool._id}`} className="card hover:shadow-md transition-shadow duration-200 group">
      <div className="relative overflow-hidden aspect-video bg-gray-100">
        <img
          src={imageUrl}
          alt={tool.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Tool' }}
        />
        <div className="absolute top-2 left-2">
          <span className="badge bg-brand-600 text-white text-xs px-2 py-1">{tool.category}</span>
        </div>
        {tool.deliveryOptions.delivery && (
          <div className="absolute top-2 right-2 bg-white rounded-full px-2 py-1 flex items-center gap-1 text-xs font-medium text-gray-700 shadow">
            <FiTruck className="w-3 h-3" /> Delivery
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1">{tool.title}</h3>

        <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
          <FiMapPin className="w-3 h-3" />
          <span>{tool.location.city}, {tool.location.state}</span>
          {distanceMiles !== undefined && (
            <span className="ml-1 text-brand-600 font-medium">· {distanceMiles.toFixed(1)} mi</span>
          )}
        </div>

        {tool.rating > 0 && (
          <div className="flex items-center gap-1 mb-2">
            <StarRating rating={tool.rating} small />
            <span className="text-xs text-gray-500">({tool.reviewCount})</span>
          </div>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
          <div>
            <span className="text-lg font-bold text-gray-900">${tool.pricePerDay}</span>
            <span className="text-xs text-gray-500"> / day</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <FiShield className="w-3 h-3 text-green-500" />
            <span>Insured</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2">
          {tool.owner.avatar ? (
            <img src={tool.owner.avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
          ) : (
            <div className="w-5 h-5 rounded-full bg-brand-200 flex items-center justify-center text-brand-700 text-xs font-bold">
              {tool.owner.firstName[0]}
            </div>
          )}
          <span className="text-xs text-gray-500">{tool.owner.firstName} {tool.owner.lastName[0]}.</span>
          {tool.owner.lenderRating > 0 && (
            <span className="flex items-center text-xs text-gray-500">
              <span className="star">★</span> {tool.owner.lenderRating.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
