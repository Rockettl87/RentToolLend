import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiUpload, FiX, FiMapPin, FiDollarSign, FiTool, FiShield } from 'react-icons/fi'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

const CATEGORIES = [
  'Power Tools', 'Hand Tools', 'Garden & Outdoor', 'Construction',
  'Plumbing', 'Electrical', 'Automotive', 'Cleaning', 'Painting',
  'Measuring & Layout', 'Ladders & Scaffolding', 'Welding',
  'Air Tools & Compressors', 'Concrete & Masonry', 'Other'
]

const CONDITIONS = ['Like New', 'Excellent', 'Good', 'Fair']

interface FormData {
  title: string
  description: string
  category: string
  brand: string
  model: string
  condition: string
  pricePerDay: string
  pricePerWeek: string
  depositAmount: string
  minRentalDays: string
  maxRentalDays: string
  city: string
  state: string
  address: string
  zip: string
  deliveryPickup: boolean
  deliveryDelivery: boolean
  deliveryRadiusMiles: string
  deliveryFlatRate: string
  requiresId: boolean
  requiresDeposit: boolean
  specialInstructions: string
  safetyNotes: string
  tags: string
}

const STEPS = ['Basic Info', 'Pricing', 'Location & Delivery', 'Photos', 'Review']

export default function ListToolPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState<FormData>({
    title: '',
    description: '',
    category: CATEGORIES[0],
    brand: '',
    model: '',
    condition: CONDITIONS[0],
    pricePerDay: '',
    pricePerWeek: '',
    depositAmount: '0',
    minRentalDays: '1',
    maxRentalDays: '30',
    city: user?.location?.city || '',
    state: user?.location?.state || '',
    address: user?.location?.address || '',
    zip: '',
    deliveryPickup: true,
    deliveryDelivery: false,
    deliveryRadiusMiles: '10',
    deliveryFlatRate: '0',
    requiresId: false,
    requiresDeposit: false,
    specialInstructions: '',
    safetyNotes: '',
    tags: '',
  })

  const set = (field: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))

  const toggle = (field: keyof FormData) => () =>
    setForm(prev => ({ ...prev, [field]: !(prev[field] as boolean) }))

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    if (images.length + files.length > 8) {
      toast.error('Maximum 8 images allowed')
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      Array.from(files).forEach(f => formData.append('images', f))
      const { data } = await api.post('/uploads/images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setImages(prev => [...prev, ...data.urls])
      toast.success(`${data.urls.length} image${data.urls.length > 1 ? 's' : ''} uploaded`)
    } catch {
      toast.error('Image upload failed')
    } finally {
      setUploading(false)
    }
    e.target.value = ''
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const validateStep = () => {
    if (step === 0) {
      if (!form.title.trim()) { toast.error('Title is required'); return false }
      if (!form.description.trim()) { toast.error('Description is required'); return false }
    }
    if (step === 1) {
      if (!form.pricePerDay || Number(form.pricePerDay) < 1) { toast.error('Daily price must be at least $1'); return false }
    }
    if (step === 2) {
      if (!form.city.trim()) { toast.error('City is required'); return false }
      if (!form.state.trim()) { toast.error('State is required'); return false }
    }
    return true
  }

  const nextStep = () => {
    if (validateStep()) setStep(s => s + 1)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      // Use user location coordinates if available
      const coordinates = user?.location?.coordinates || [-98.35, 39.5]
      const { data } = await api.post('/tools', {
        title: form.title,
        description: form.description,
        category: form.category,
        brand: form.brand || undefined,
        model: form.model || undefined,
        condition: form.condition,
        pricePerDay: Number(form.pricePerDay),
        pricePerWeek: form.pricePerWeek ? Number(form.pricePerWeek) : undefined,
        depositAmount: Number(form.depositAmount),
        minRentalDays: Number(form.minRentalDays),
        maxRentalDays: Number(form.maxRentalDays),
        location: {
          coordinates,
          address: form.address,
          city: form.city,
          state: form.state,
          zip: form.zip,
        },
        deliveryOptions: {
          pickup: form.deliveryPickup,
          delivery: form.deliveryDelivery,
          deliveryRadiusMiles: Number(form.deliveryRadiusMiles),
          deliveryFlatRate: Number(form.deliveryFlatRate),
        },
        requiresId: form.requiresId,
        requiresDeposit: form.requiresDeposit,
        specialInstructions: form.specialInstructions || undefined,
        safetyNotes: form.safetyNotes || undefined,
        images,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      })
      toast.success('Tool listed successfully!')
      navigate(`/tools/${data.tool._id}`)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to list tool')
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass = 'input-field'
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1'

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">List Your Tool</h1>
        <p className="text-gray-500 text-sm">Start earning from tools you own</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-1">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div className={`flex items-center gap-1.5 shrink-0 text-sm font-medium ${i === step ? 'text-brand-600' : i < step ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === step ? 'bg-brand-600 text-white' : i < step ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className="hidden sm:inline">{s}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 min-w-4 ${i < step ? 'bg-green-400' : 'bg-gray-200'}`} />}
          </React.Fragment>
        ))}
      </div>

      <div className="card p-6">
        {/* Step 0: Basic Info */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-900 text-lg mb-4 flex items-center gap-2"><FiTool /> Basic Information</h2>
            <div>
              <label className={labelClass}>Tool title *</label>
              <input type="text" value={form.title} onChange={set('title')} className={inputClass} placeholder="e.g. DeWalt 20V Cordless Drill" maxLength={100} />
            </div>
            <div>
              <label className={labelClass}>Description *</label>
              <textarea value={form.description} onChange={set('description')} className={inputClass} rows={4} placeholder="Describe the tool, its capabilities, what it's good for, and any accessories included..." maxLength={2000} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Category *</label>
                <select value={form.category} onChange={set('category')} className={inputClass}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Condition *</label>
                <select value={form.condition} onChange={set('condition')} className={inputClass}>
                  {CONDITIONS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Brand</label>
                <input type="text" value={form.brand} onChange={set('brand')} className={inputClass} placeholder="e.g. DeWalt" />
              </div>
              <div>
                <label className={labelClass}>Model</label>
                <input type="text" value={form.model} onChange={set('model')} className={inputClass} placeholder="e.g. DCD791D2" />
              </div>
            </div>
            <div>
              <label className={labelClass}>Tags (comma-separated)</label>
              <input type="text" value={form.tags} onChange={set('tags')} className={inputClass} placeholder="e.g. drill, cordless, battery" />
            </div>
          </div>
        )}

        {/* Step 1: Pricing */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-900 text-lg mb-4 flex items-center gap-2"><FiDollarSign /> Pricing</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Price per day * ($)</label>
                <input type="number" value={form.pricePerDay} onChange={set('pricePerDay')} className={inputClass} min={1} placeholder="25" />
              </div>
              <div>
                <label className={labelClass}>Price per week ($)</label>
                <input type="number" value={form.pricePerWeek} onChange={set('pricePerWeek')} className={inputClass} min={1} placeholder="Optional" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Security deposit ($)</label>
                <input type="number" value={form.depositAmount} onChange={set('depositAmount')} className={inputClass} min={0} placeholder="0" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Min rental (days)</label>
                <input type="number" value={form.minRentalDays} onChange={set('minRentalDays')} className={inputClass} min={1} />
              </div>
              <div>
                <label className={labelClass}>Max rental (days)</label>
                <input type="number" value={form.maxRentalDays} onChange={set('maxRentalDays')} className={inputClass} min={1} />
              </div>
            </div>
            <div className="space-y-2">
              <label className={labelClass}>Requirements</label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.requiresDeposit} onChange={toggle('requiresDeposit')} className="w-4 h-4 accent-brand-600" />
                <span className="text-sm text-gray-700">Require security deposit</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.requiresId} onChange={toggle('requiresId')} className="w-4 h-4 accent-brand-600" />
                <span className="text-sm text-gray-700">Require ID verification</span>
              </label>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-sm text-green-800">
              <FiShield className="inline w-4 h-4 mr-1.5" />
              You receive <strong>80%</strong> of each rental. Platform takes 20% for payment processing and insurance.
            </div>
            {form.pricePerDay && (
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                For a 3-day rental at ${form.pricePerDay}/day, you'd earn <strong>${(Number(form.pricePerDay) * 3 * 0.8).toFixed(2)}</strong>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Location & Delivery */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-900 text-lg mb-4 flex items-center gap-2"><FiMapPin /> Location & Delivery</h2>
            <div>
              <label className={labelClass}>Street address</label>
              <input type="text" value={form.address} onChange={set('address')} className={inputClass} placeholder="123 Main St" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <label className={labelClass}>City *</label>
                <input type="text" value={form.city} onChange={set('city')} className={inputClass} placeholder="Denver" />
              </div>
              <div>
                <label className={labelClass}>State *</label>
                <input type="text" value={form.state} onChange={set('state')} className={inputClass} placeholder="CO" maxLength={2} />
              </div>
              <div>
                <label className={labelClass}>ZIP</label>
                <input type="text" value={form.zip} onChange={set('zip')} className={inputClass} placeholder="80202" />
              </div>
            </div>

            <div>
              <label className={labelClass}>Delivery options</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.deliveryPickup} onChange={toggle('deliveryPickup')} className="w-4 h-4 accent-brand-600" />
                  <span className="text-sm text-gray-700">Pickup available (renter comes to you)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.deliveryDelivery} onChange={toggle('deliveryDelivery')} className="w-4 h-4 accent-brand-600" />
                  <span className="text-sm text-gray-700">Delivery available (you deliver to renter)</span>
                </label>
              </div>
            </div>

            {form.deliveryDelivery && (
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-lg">
                <div>
                  <label className={labelClass}>Delivery radius (miles)</label>
                  <input type="number" value={form.deliveryRadiusMiles} onChange={set('deliveryRadiusMiles')} className={inputClass} min={1} />
                </div>
                <div>
                  <label className={labelClass}>Delivery flat rate ($)</label>
                  <input type="number" value={form.deliveryFlatRate} onChange={set('deliveryFlatRate')} className={inputClass} min={0} />
                </div>
              </div>
            )}

            <div>
              <label className={labelClass}>Special instructions (optional)</label>
              <textarea value={form.specialInstructions} onChange={set('specialInstructions')} className={inputClass} rows={2} placeholder="e.g. Call ahead, park on street..." />
            </div>
            <div>
              <label className={labelClass}>Safety notes (optional)</label>
              <textarea value={form.safetyNotes} onChange={set('safetyNotes')} className={inputClass} rows={2} placeholder="Any safety warnings or certifications required..." />
            </div>
          </div>
        )}

        {/* Step 3: Photos */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-900 text-lg mb-1 flex items-center gap-2"><FiUpload /> Photos</h2>
            <p className="text-sm text-gray-500 mb-4">Upload up to 8 photos. Good photos increase rentals significantly.</p>

            <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 cursor-pointer transition-colors ${uploading ? 'border-gray-200 bg-gray-50' : 'border-brand-300 hover:border-brand-500 bg-brand-50'}`}>
              <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="sr-only" disabled={uploading || images.length >= 8} />
              <FiUpload className="w-8 h-8 text-brand-500 mb-2" />
              <span className="text-sm font-medium text-brand-700">
                {uploading ? 'Uploading...' : images.length >= 8 ? 'Maximum images reached' : 'Click to upload photos'}
              </span>
              <span className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP · Max 5MB each · {images.length}/8</span>
            </label>

            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {images.map((url, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    {i === 0 && (
                      <div className="absolute top-1 left-1 bg-brand-600 text-white text-xs px-1.5 py-0.5 rounded font-medium">Main</div>
                    )}
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <FiX className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-900 text-lg mb-4">Review Your Listing</h2>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
              <div className="text-gray-500">Title</div>
              <div className="font-medium text-gray-900">{form.title}</div>
              <div className="text-gray-500">Category</div>
              <div>{form.category}</div>
              <div className="text-gray-500">Condition</div>
              <div>{form.condition}</div>
              <div className="text-gray-500">Price/day</div>
              <div className="font-bold text-brand-600">${form.pricePerDay}</div>
              {form.pricePerWeek && <><div className="text-gray-500">Price/week</div><div>${form.pricePerWeek}</div></>}
              <div className="text-gray-500">Deposit</div>
              <div>${form.depositAmount}</div>
              <div className="text-gray-500">Location</div>
              <div>{form.city}, {form.state}</div>
              <div className="text-gray-500">Rental duration</div>
              <div>{form.minRentalDays}–{form.maxRentalDays} days</div>
              <div className="text-gray-500">Delivery</div>
              <div>{[form.deliveryPickup && 'Pickup', form.deliveryDelivery && 'Delivery'].filter(Boolean).join(', ')}</div>
              <div className="text-gray-500">Photos</div>
              <div>{images.length} uploaded</div>
            </div>

            {images.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pt-2">
                {images.slice(0, 4).map((url, i) => (
                  <img key={i} src={url} alt="" className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
                ))}
                {images.length > 4 && (
                  <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 text-sm flex-shrink-0">
                    +{images.length - 4}
                  </div>
                )}
              </div>
            )}

            {images.length === 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
                No photos uploaded. Tools with photos get 3× more rentals.
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-4 border-t border-gray-100">
          {step > 0 ? (
            <button onClick={() => setStep(s => s - 1)} className="btn-secondary">Back</button>
          ) : (
            <div />
          )}
          {step < STEPS.length - 1 ? (
            <button onClick={nextStep} className="btn-primary">Continue</button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting} className="btn-primary">
              {submitting ? 'Publishing...' : 'Publish Listing'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
