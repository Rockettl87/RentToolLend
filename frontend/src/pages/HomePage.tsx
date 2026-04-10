import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiSearch, FiMapPin, FiShield, FiDollarSign, FiStar, FiTool } from 'react-icons/fi'

const CATEGORIES = [
  { name: 'Power Tools', icon: '🔧', color: 'bg-orange-100 text-orange-700' },
  { name: 'Hand Tools', icon: '🔨', color: 'bg-yellow-100 text-yellow-700' },
  { name: 'Garden & Outdoor', icon: '🌿', color: 'bg-green-100 text-green-700' },
  { name: 'Construction', icon: '🏗️', color: 'bg-gray-100 text-gray-700' },
  { name: 'Plumbing', icon: '🔩', color: 'bg-blue-100 text-blue-700' },
  { name: 'Electrical', icon: '⚡', color: 'bg-purple-100 text-purple-700' },
  { name: 'Automotive', icon: '🚗', color: 'bg-red-100 text-red-700' },
  { name: 'Ladders & Scaffolding', icon: '🪜', color: 'bg-indigo-100 text-indigo-700' },
]

const FEATURES = [
  {
    icon: <FiMapPin className="w-7 h-7" />,
    title: 'Find Tools Near You',
    desc: 'Search by GPS, address, or zip code with adjustable radius. See exactly how far each tool is from you.',
    color: 'text-brand-600 bg-brand-50'
  },
  {
    icon: <FiShield className="w-7 h-7" />,
    title: 'Insurance Protection',
    desc: 'Every rental includes our Protection Plan covering damage, theft, and incidents — for both lenders and renters.',
    color: 'text-green-600 bg-green-50'
  },
  {
    icon: <FiDollarSign className="w-7 h-7" />,
    title: 'Earn From Your Tools',
    desc: 'List tools you own and earn money when neighbors rent them. You receive 80% of every rental directly.',
    color: 'text-blue-600 bg-blue-50'
  },
  {
    icon: <FiStar className="w-7 h-7" />,
    title: 'Trusted Community',
    desc: 'Verified reviews on lenders and renters. Know who you\'re dealing with before every transaction.',
    color: 'text-yellow-600 bg-yellow-50'
  },
]

export default function HomePage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [location, setLocation] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (location) params.set('address', location)
    navigate(`/search?${params.toString()}`)
  }

  const handleGpsSearch = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition((pos) => {
      const params = new URLSearchParams()
      params.set('lat', pos.coords.latitude.toString())
      params.set('lng', pos.coords.longitude.toString())
      if (search) params.set('q', search)
      navigate(`/search?${params.toString()}`)
    })
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-600 via-brand-700 to-orange-800 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <FiTool className="w-10 h-10" />
            <h1 className="text-4xl md:text-5xl font-extrabold">RentToolLend</h1>
          </div>
          <p className="text-xl md:text-2xl font-light mb-3 text-orange-100">
            Rent any tool from your community
          </p>
          <p className="text-base text-orange-200 mb-10 max-w-2xl mx-auto">
            Find tools near you, earn money from tools you own. Secure payments, insurance protection, and verified reviews — all in one place.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="bg-white rounded-2xl p-3 flex flex-col md:flex-row gap-3 shadow-xl">
            <div className="flex-1 flex items-center gap-2 px-3">
              <FiSearch className="text-gray-400 w-5 h-5 flex-shrink-0" />
              <input
                type="text"
                placeholder="What tool do you need?"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 outline-none text-gray-900 text-sm placeholder-gray-400"
              />
            </div>
            <div className="flex items-center gap-2 px-3 border-l border-gray-100">
              <FiMapPin className="text-gray-400 w-5 h-5 flex-shrink-0" />
              <input
                type="text"
                placeholder="City, zip, or address"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="flex-1 outline-none text-gray-900 text-sm placeholder-gray-400 w-40"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleGpsSearch}
                title="Use my location"
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl px-3 py-2.5 transition-colors"
              >
                <FiMapPin className="w-5 h-5" />
              </button>
              <button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl px-6 py-2.5 transition-colors whitespace-nowrap">
                Search
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Browse by Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
          {CATEGORIES.map(cat => (
            <button
              key={cat.name}
              onClick={() => navigate(`/search?category=${encodeURIComponent(cat.name)}`)}
              className={`${cat.color} rounded-xl p-4 text-center hover:opacity-80 transition-opacity cursor-pointer`}
            >
              <div className="text-2xl mb-1">{cat.icon}</div>
              <div className="text-xs font-medium leading-tight">{cat.name}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Why RentToolLend?</h2>
            <p className="text-gray-500 max-w-xl mx-auto">The most trusted tool sharing community with built-in protections for everyone.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className="text-center p-6">
                <div className={`${f.color} w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                  {f.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Insurance section */}
      <section className="bg-green-50 py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <FiShield className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-3">RentToolLend Protection Plan</h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Every rental automatically includes our Protection Plan. Both lenders and renters are covered against damage, accidents, and incidents. File a claim directly through the platform and our team resolves it quickly.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            {[
              { plan: 'Basic', coverage: '$500', fee: '5%', color: 'bg-white' },
              { plan: 'Standard', coverage: '$1,000', fee: '10%', color: 'bg-green-600 text-white', featured: true },
              { plan: 'Premium', coverage: '$5,000', fee: '15%', color: 'bg-white' },
            ].map(p => (
              <div key={p.plan} className={`${p.color} rounded-xl p-5 border ${p.featured ? 'border-green-600 shadow-lg' : 'border-gray-200'}`}>
                {p.featured && <div className="text-xs font-bold uppercase tracking-wide mb-2 opacity-80">Most Popular</div>}
                <div className="text-xl font-bold mb-1">{p.plan}</div>
                <div className="text-3xl font-extrabold mb-1">{p.coverage}</div>
                <div className={`text-sm ${p.featured ? 'opacity-80' : 'text-gray-500'}`}>Coverage · {p.fee} of rental total</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Payment methods */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Flexible Payment Options</h2>
          <p className="text-gray-500 mb-6">Pay and get paid your way</p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-gray-700">
            {['💳 Credit Card (Stripe)', '🅿️ PayPal', '💚 Venmo', '🏦 Zelle'].map(m => (
              <div key={m} className="bg-white border border-gray-200 rounded-xl px-5 py-3 font-medium text-sm shadow-sm">{m}</div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-900 text-white py-16 px-4 text-center">
        <h2 className="text-3xl font-bold mb-3">Ready to get started?</h2>
        <p className="text-gray-400 mb-8">Join thousands of neighbors sharing tools and saving money.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button onClick={() => navigate('/search')} className="bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 px-8 rounded-xl transition-colors">
            Find a Tool
          </button>
          <button onClick={() => navigate('/list-tool')} className="bg-white hover:bg-gray-100 text-gray-900 font-semibold py-3 px-8 rounded-xl transition-colors">
            List Your Tools
          </button>
        </div>
      </section>
    </div>
  )
}
