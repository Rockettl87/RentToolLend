import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import L from 'leaflet'
import { FiMap, FiGrid, FiFilter, FiMapPin, FiX, FiSearch } from 'react-icons/fi'
import api from '../services/api'
import ToolCard from '../components/ToolCard'
import toast from 'react-hot-toast'

const CATEGORIES = ['All', 'Power Tools', 'Hand Tools', 'Garden & Outdoor', 'Construction', 'Plumbing', 'Electrical', 'Automotive', 'Cleaning', 'Painting', 'Measuring & Layout', 'Ladders & Scaffolding', 'Welding', 'Air Tools & Compressors', 'Concrete & Masonry', 'Other']

interface Tool {
  _id: string
  title: string
  images: string[]
  pricePerDay: number
  category: string
  condition: string
  location: { city: string; state: string; coordinates: [number, number] }
  rating: number
  reviewCount: number
  deliveryOptions: { pickup: boolean; delivery: boolean }
  owner: { firstName: string; lastName: string; avatar?: string; lenderRating: number; lenderReviewCount: number }
  depositAmount?: number
}

// Fix Leaflet default icons
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [tools, setTools] = useState<Tool[]>([])
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [total, setTotal] = useState(0)

  // Filter state
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [category, setCategory] = useState(searchParams.get('category') || 'All')
  const [radius, setRadius] = useState(Number(searchParams.get('radius')) || 25)
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '')
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'distance')
  const [deliveryOnly, setDeliveryOnly] = useState(searchParams.get('deliveryOnly') === 'true')
  const [userLat, setUserLat] = useState<number | null>(Number(searchParams.get('lat')) || null)
  const [userLng, setUserLng] = useState<number | null>(Number(searchParams.get('lng')) || null)
  const [addressInput, setAddressInput] = useState(searchParams.get('address') || '')

  const fetchTools = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = { sortBy, radius: radius.toString() }
      if (query) params.q = query
      if (category !== 'All') params.category = category
      if (minPrice) params.minPrice = minPrice
      if (maxPrice) params.maxPrice = maxPrice
      if (deliveryOnly) params.deliveryOnly = 'true'
      if (userLat && userLng) {
        params.lat = userLat.toString()
        params.lng = userLng.toString()
      }

      const { data } = await api.get('/tools/search', { params })
      setTools(data.tools)
      setTotal(data.pagination.total)
    } catch (err) {
      toast.error('Failed to load tools')
    } finally {
      setLoading(false)
    }
  }, [query, category, radius, minPrice, maxPrice, sortBy, deliveryOnly, userLat, userLng])

  useEffect(() => {
    fetchTools()
  }, [fetchTools])

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return toast.error('Geolocation not supported')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLat(pos.coords.latitude)
        setUserLng(pos.coords.longitude)
        setAddressInput('Current location')
        toast.success('Using your current location')
      },
      () => toast.error('Could not get your location')
    )
  }

  const mapCenter: [number, number] = userLat && userLng ? [userLat, userLng] : [39.5, -98.35]

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Search header */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="flex-1 flex gap-2">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search tools..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchTools()}
              className="input-field pl-9"
            />
          </div>
          <div className="relative">
            <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Location"
              value={addressInput}
              onChange={e => setAddressInput(e.target.value)}
              className="input-field pl-9 w-48"
            />
          </div>
          <button onClick={handleUseMyLocation} className="btn-secondary px-3" title="Use my location">
            <FiMapPin className="w-4 h-4 text-brand-600" />
          </button>
          <button onClick={fetchTools} className="btn-primary px-4">Search</button>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowFilters(!showFilters)} className={`btn-secondary flex items-center gap-2 ${showFilters ? 'border-brand-500 text-brand-600' : ''}`}>
            <FiFilter className="w-4 h-4" /> Filters
          </button>
          <button onClick={() => setViewMode('grid')} className={`p-2.5 rounded-lg border ${viewMode === 'grid' ? 'bg-brand-50 border-brand-500 text-brand-600' : 'border-gray-200 text-gray-500'}`}>
            <FiGrid className="w-4 h-4" />
          </button>
          <button onClick={() => setViewMode('map')} className={`p-2.5 rounded-lg border ${viewMode === 'map' ? 'bg-brand-50 border-brand-500 text-brand-600' : 'border-gray-200 text-gray-500'}`}>
            <FiMap className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="col-span-2">
            <label className="text-xs font-medium text-gray-500 mb-1 block">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="input-field text-sm">
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Radius</label>
            <select value={radius} onChange={e => setRadius(Number(e.target.value))} className="input-field text-sm">
              {[5, 10, 25, 50, 100].map(r => <option key={r} value={r}>{r} mi</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Min Price/Day</label>
            <input type="number" placeholder="$0" value={minPrice} onChange={e => setMinPrice(e.target.value)} className="input-field text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Max Price/Day</label>
            <input type="number" placeholder="Any" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className="input-field text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Sort By</label>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="input-field text-sm">
              <option value="distance">Distance</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="newest">Newest</option>
            </select>
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <input type="checkbox" id="deliveryOnly" checked={deliveryOnly} onChange={e => setDeliveryOnly(e.target.checked)} className="w-4 h-4 accent-brand-600" />
            <label htmlFor="deliveryOnly" className="text-sm text-gray-700">Delivery available only</label>
          </div>
          <div className="col-span-2 flex gap-2">
            <button onClick={fetchTools} className="btn-primary flex-1">Apply Filters</button>
            <button onClick={() => { setCategory('All'); setMinPrice(''); setMaxPrice(''); setDeliveryOnly(false); setSortBy('distance'); }} className="btn-secondary">
              <FiX className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {CATEGORIES.map(c => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex-shrink-0 ${category === c ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-400'}`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-500 mb-4">
        {loading ? 'Searching...' : `${total} tool${total !== 1 ? 's' : ''} found${userLat ? ` within ${radius} miles` : ''}`}
      </div>

      {/* Content */}
      {viewMode === 'grid' ? (
        <div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="card animate-pulse">
                  <div className="aspect-video bg-gray-200" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                    <div className="h-5 bg-gray-200 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : tools.length === 0 ? (
            <div className="text-center py-20">
              <FiSearch className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-lg">No tools found</p>
              <p className="text-gray-400 text-sm mt-1">Try expanding your search radius or adjusting filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {tools.map(tool => <ToolCard key={tool._id} tool={tool} />)}
            </div>
          )}
        </div>
      ) : (
        <div className="h-[600px] rounded-xl overflow-hidden border border-gray-200">
          <MapContainer center={mapCenter} zoom={10} className="h-full w-full">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap contributors" />
            {userLat && userLng && (
              <>
                <Marker position={[userLat, userLng]}>
                  <Popup>Your location</Popup>
                </Marker>
                <Circle center={[userLat, userLng]} radius={radius * 1609} color="#f97316" fillOpacity={0.05} weight={2} />
              </>
            )}
            {tools.map(tool => (
              tool.location.coordinates[1] && (
                <Marker key={tool._id} position={[tool.location.coordinates[1], tool.location.coordinates[0]]}>
                  <Popup>
                    <div className="w-48">
                      <p className="font-semibold text-sm">{tool.title}</p>
                      <p className="text-brand-600 font-bold">${tool.pricePerDay}/day</p>
                      <a href={`/tools/${tool._id}`} className="text-xs text-blue-600 underline">View details</a>
                    </div>
                  </Popup>
                </Marker>
              )
            ))}
          </MapContainer>
        </div>
      )}
    </div>
  )
}
