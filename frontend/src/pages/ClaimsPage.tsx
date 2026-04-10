import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { FiShield, FiAlertCircle, FiUpload, FiX, FiChevronDown, FiChevronUp } from 'react-icons/fi'
import api from '../services/api'
import toast from 'react-hot-toast'

interface Claim {
  _id: string
  booking: { _id: string; tool?: { title: string } }
  tool: { title: string; images: string[] }
  claimType: string
  description: string
  status: string
  estimatedDamageAmount?: number
  approvedAmount?: number
  denialReason?: string
  images: string[]
  createdAt: string
  resolvedAt?: string
}

interface Booking {
  _id: string
  tool: { title: string }
  startDate: string
  endDate: string
  status: string
}

const STATUS_COLORS: Record<string, string> = {
  submitted: 'bg-yellow-100 text-yellow-700',
  under_review: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  denied: 'bg-red-100 text-red-700',
  resolved: 'bg-gray-100 text-gray-700',
  escalated: 'bg-orange-100 text-orange-700',
}

const CLAIM_TYPES = [
  { value: 'damage', label: 'Damage to Tool' },
  { value: 'theft', label: 'Theft' },
  { value: 'non_return', label: 'Tool Not Returned' },
  { value: 'injury', label: 'Injury' },
  { value: 'dispute', label: 'General Dispute' },
  { value: 'other', label: 'Other' },
]

export default function ClaimsPage() {
  const locationState = useLocation().state as { bookingId?: string } | null
  const [claims, setClaims] = useState<Claim[]>([])
  const [eligibleBookings, setEligibleBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(!!locationState?.bookingId)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    bookingId: locationState?.bookingId || '',
    claimType: 'damage',
    description: '',
    estimatedDamageAmount: '',
    images: [] as string[],
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [claimsRes, rentalsRes, lendingRes] = await Promise.all([
          api.get('/claims/my-claims'),
          api.get('/bookings/my-rentals'),
          api.get('/bookings/my-lending'),
        ])
        setClaims(claimsRes.data.claims || [])

        // Eligible: active or completed bookings without a claim
        const allBookings: Booking[] = [
          ...(rentalsRes.data.bookings || []),
          ...(lendingRes.data.bookings || []),
        ]
        const eligible = allBookings.filter(
          b => ['active', 'completed'].includes(b.status)
        )
        setEligibleBookings(eligible)
      } catch {
        toast.error('Failed to load claims')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    if (form.images.length + files.length > 5) {
      toast.error('Maximum 5 evidence photos')
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      Array.from(files).forEach(f => formData.append('images', f))
      const { data } = await api.post('/uploads/images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setForm(prev => ({ ...prev, images: [...prev.images, ...data.urls] }))
    } catch {
      toast.error('Image upload failed')
    } finally {
      setUploading(false)
    }
    e.target.value = ''
  }

  const removeImage = (index: number) => {
    setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.bookingId) { toast.error('Select a booking'); return }
    if (!form.description.trim()) { toast.error('Description is required'); return }

    setSubmitting(true)
    try {
      const { data } = await api.post('/claims', {
        bookingId: form.bookingId,
        claimType: form.claimType,
        description: form.description,
        estimatedDamageAmount: form.estimatedDamageAmount ? Number(form.estimatedDamageAmount) : undefined,
        images: form.images,
      })
      setClaims(prev => [data.claim, ...prev])
      setForm({ bookingId: '', claimType: 'damage', description: '', estimatedDamageAmount: '', images: [] })
      setShowForm(false)
      toast.success('Claim submitted. We\'ll review it within 24 hours.')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit claim')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-10 animate-pulse space-y-3">
      <div className="h-8 bg-gray-200 rounded w-32" />
      {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FiShield className="w-6 h-6 text-brand-600" /> Insurance Claims
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">File and track claims for your rentals</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center gap-2"
        >
          <FiAlertCircle className="w-4 h-4" />
          {showForm ? 'Cancel' : 'File a Claim'}
        </button>
      </div>

      {/* New claim form */}
      {showForm && (
        <div className="card p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">New Claim</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Booking *</label>
              <select
                value={form.bookingId}
                onChange={e => setForm(prev => ({ ...prev, bookingId: e.target.value }))}
                className="input-field"
                required
              >
                <option value="">Select a booking...</option>
                {eligibleBookings.map(b => (
                  <option key={b._id} value={b._id}>
                    {b.tool.title} · {new Date(b.startDate).toLocaleDateString()} – {new Date(b.endDate).toLocaleDateString()}
                  </option>
                ))}
              </select>
              {eligibleBookings.length === 0 && (
                <p className="text-xs text-gray-400 mt-1">No eligible bookings. Claims can be filed on active or completed rentals.</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Claim type *</label>
              <select
                value={form.claimType}
                onChange={e => setForm(prev => ({ ...prev, claimType: e.target.value }))}
                className="input-field"
              >
                {CLAIM_TYPES.map(ct => <option key={ct.value} value={ct.value}>{ct.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea
                value={form.description}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                className="input-field resize-none"
                rows={4}
                placeholder="Describe what happened in detail. Include when it occurred, the extent of damage or loss, and any relevant context..."
                maxLength={3000}
                required
              />
              <p className="text-xs text-gray-400 text-right">{form.description.length}/3000</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estimated damage amount ($)</label>
              <input
                type="number"
                value={form.estimatedDamageAmount}
                onChange={e => setForm(prev => ({ ...prev, estimatedDamageAmount: e.target.value }))}
                className="input-field"
                min={0}
                placeholder="Optional"
              />
            </div>

            {/* Evidence photos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Evidence photos (optional, max 5)</label>
              <label className={`flex items-center justify-center gap-2 border-2 border-dashed rounded-xl p-4 cursor-pointer transition-colors ${uploading ? 'border-gray-200' : 'border-gray-300 hover:border-brand-400'}`}>
                <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="sr-only" disabled={uploading || form.images.length >= 5} />
                <FiUpload className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500">{uploading ? 'Uploading...' : `Upload photos (${form.images.length}/5)`}</span>
              </label>
              {form.images.length > 0 && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {form.images.map((url, i) => (
                    <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden group">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <FiX className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
              <FiShield className="inline w-4 h-4 mr-1.5" />
              Our team reviews all claims within 24 hours. You may be contacted for additional information.
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={submitting} className="btn-primary flex-1">
                {submitting ? 'Submitting...' : 'Submit Claim'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Claims list */}
      {claims.length === 0 ? (
        <div className="text-center py-16">
          <FiShield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No claims filed yet</p>
          <p className="text-gray-400 text-sm mt-1">
            If something goes wrong during a rental, file a claim for insurance coverage.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {claims.map(claim => (
            <div key={claim._id} className="card overflow-hidden">
              <div
                className="p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedId(expandedId === claim._id ? null : claim._id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-gray-900 truncate">{claim.tool?.title || 'Tool'}</p>
                    <span className={`badge text-xs capitalize ${STATUS_COLORS[claim.status] || 'bg-gray-100 text-gray-600'}`}>
                      {claim.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                    <span className="capitalize">{claim.claimType.replace('_', ' ')}</span>
                    <span>Filed {new Date(claim.createdAt).toLocaleDateString()}</span>
                    {claim.estimatedDamageAmount && <span>Est. ${claim.estimatedDamageAmount}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {claim.approvedAmount !== undefined && claim.approvedAmount > 0 && (
                    <span className="text-green-600 font-semibold text-sm">${claim.approvedAmount} approved</span>
                  )}
                  {expandedId === claim._id ? <FiChevronUp className="w-4 h-4 text-gray-400" /> : <FiChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </div>

              {expandedId === claim._id && (
                <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Description</p>
                    <p className="text-sm text-gray-700">{claim.description}</p>
                  </div>

                  {claim.images.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Evidence photos</p>
                      <div className="flex gap-2 flex-wrap">
                        {claim.images.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                            <img src={url} alt="" className="w-16 h-16 rounded-lg object-cover hover:opacity-80 transition-opacity" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {claim.status === 'approved' && claim.approvedAmount !== undefined && (
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-sm font-medium text-green-800">
                        ✓ Claim approved — ${claim.approvedAmount} will be disbursed
                      </p>
                      {claim.resolvedAt && (
                        <p className="text-xs text-green-600 mt-0.5">Resolved {new Date(claim.resolvedAt).toLocaleDateString()}</p>
                      )}
                    </div>
                  )}

                  {claim.status === 'denied' && claim.denialReason && (
                    <div className="bg-red-50 rounded-lg p-3">
                      <p className="text-sm font-medium text-red-800">Claim denied</p>
                      <p className="text-sm text-red-700 mt-0.5">{claim.denialReason}</p>
                    </div>
                  )}

                  {claim.status === 'submitted' && (
                    <div className="bg-yellow-50 rounded-lg p-3 text-sm text-yellow-700">
                      Under review — we'll get back to you within 24 hours.
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
