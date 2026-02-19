import { useMemo, useId, useState } from 'react'
import {
  Link,
  createFileRoute,
  useNavigate,
} from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import type { QueryClient } from '@tanstack/react-query'

import { requireAuth } from '../../utils/requireAuth'
import { campaignsApi, type CreateCampaignPayload } from '../../api/modules/campaigns'
import { queryKeys } from '../../api/queryKeys'
import type { ApiErrorResponse, Campaign, VenueFilters, PromoType } from '../../api/types'
import { useUIStore } from '../../state/uiStore'
import { useVenueOptions } from '../../hooks/useVenues'
import { MediaLibrary } from '../../components/MediaLibrary'
import { useCountries, useStates, useLgas, useVenueTypes, usePromoTypes } from '../../hooks/useReferenceData'



const TIMEZONE_OPTIONS = [
  { value: '', label: 'Select timezone...' },
  { value: 'America/New_York', label: 'America/New_York (Eastern Time)' },
  { value: 'America/Chicago', label: 'America/Chicago (Central Time)' },
  { value: 'America/Denver', label: 'America/Denver (Mountain Time)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (Pacific Time)' },
  { value: 'America/Phoenix', label: 'America/Phoenix (Mountain Time - No DST)' },
  { value: 'America/Anchorage', label: 'America/Anchorage (Alaska Time)' },
  { value: 'Pacific/Honolulu', label: 'Pacific/Honolulu (Hawaii Time)' },
  { value: 'America/Toronto', label: 'America/Toronto (Eastern Time)' },
  { value: 'America/Vancouver', label: 'America/Vancouver (Pacific Time)' },
  { value: 'America/Mexico_City', label: 'America/Mexico_City (Central Time)' },
  { value: 'America/Sao_Paulo', label: 'America/Sao_Paulo (Brasilia Time)' },
  { value: 'America/Buenos_Aires', label: 'America/Buenos_Aires (Argentina Time)' },
  { value: 'Europe/London', label: 'Europe/London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (CET/CEST)' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin (CET/CEST)' },
  { value: 'Europe/Rome', label: 'Europe/Rome (CET/CEST)' },
  { value: 'Europe/Madrid', label: 'Europe/Madrid (CET/CEST)' },
  { value: 'Europe/Amsterdam', label: 'Europe/Amsterdam (CET/CEST)' },
  { value: 'Europe/Dublin', label: 'Europe/Dublin (GMT/IST)' },
  { value: 'Europe/Athens', label: 'Europe/Athens (EET/EEST)' },
  { value: 'Europe/Moscow', label: 'Europe/Moscow (MSK)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (Gulf Standard Time)' },
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (India Standard Time)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (Singapore Time)' },
  { value: 'Asia/Hong_Kong', label: 'Asia/Hong_Kong (Hong Kong Time)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (Japan Standard Time)' },
  { value: 'Asia/Seoul', label: 'Asia/Seoul (Korea Standard Time)' },
  { value: 'Asia/Shanghai', label: 'Asia/Shanghai (China Standard Time)' },
  { value: 'Asia/Bangkok', label: 'Asia/Bangkok (Indochina Time)' },
  { value: 'Asia/Jakarta', label: 'Asia/Jakarta (Western Indonesia Time)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (AEDT/AEST)' },
  { value: 'Australia/Melbourne', label: 'Australia/Melbourne (AEDT/AEST)' },
  { value: 'Australia/Brisbane', label: 'Australia/Brisbane (AEST)' },
  { value: 'Australia/Perth', label: 'Australia/Perth (AWST)' },
  { value: 'Pacific/Auckland', label: 'Pacific/Auckland (NZDT/NZST)' },
  { value: 'Africa/Lagos', label: 'Africa/Lagos (West Africa Time)' },
  { value: 'Africa/Johannesburg', label: 'Africa/Johannesburg (South Africa Standard Time)' },
  { value: 'Africa/Cairo', label: 'Africa/Cairo (EET/EEST)' },
]

const STEPS = ['Basics', 'Schedule', 'Promo Code', 'Targeting', 'Venues', 'Review'] as const

export const Route = createFileRoute('/campaigns/new')({
  loader: async ({ context, location }) => {
    const { queryClient } = context as { queryClient: QueryClient }
    return requireAuth({
      queryClient,
      locationHref: location.href,
    })
  },
  component: NewCampaignRoute,
})

function NewCampaignRoute() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { pushToast } = useUIStore()

  const nameId = useId()
  const descriptionId = useId()
  const statusId = useId()
  const startId = useId()
  const endId = useId()
  const timezoneId = useId()
  const radiusId = useId()
  const budgetId = useId()
  const venueSearchId = useId()
  const imageUrlId = useId()

  const [step, setStep] = useState(0)
  const [formState, setFormState] = useState({
    name: '',
    description: '',
    // status is inferred: 'active' if immediate, 'scheduled' if future, default to draft until launched
    status: 'draft' as Campaign['status'],
    venueSource: 'direct' as 'direct' | 'platform',
    startAt: '',
    endAt: '',
    timezone: '',
    radiusMeters: '',
    budgetCents: '',
    venueIds: [] as string[],
    venueFilters: {} as VenueFilters,
    imageUrl: '',
    // Promo Code State
    hasPromoCode: false,
    promoCode: '',
    promoDiscountType: 'fixed' as 'fixed' | 'percentage',
    promoDiscountValue: '',
    promoTypeId: '',
    selectedPromoType: undefined as PromoType | undefined,
  })
  
  const [scheduleMode, setScheduleMode] = useState<'immediate' | 'scheduled'>('immediate')
  const [showMediaLibrary, setShowMediaLibrary] = useState(false)
  const [venueSearch, setVenueSearch] = useState('')
  
  const venueOptionsQuery = useVenueOptions(venueSearch || '')
  const venueOptions = venueOptionsQuery.data?.data ?? []

  const countriesQuery = useCountries()
  const promoTypesQuery = usePromoTypes()
  const promoTypes = promoTypesQuery.data ?? []

  const slug = useMemo(() => slugify(formState.name), [formState.name])

  const mutation = useMutation({
    mutationFn: (payload: CreateCampaignPayload) => campaignsApi.create(payload),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns({}) })
      pushToast({
        id: crypto.randomUUID(),
        title: 'Campaign created',
        description: `${created.name} is ready to configure.`,
        intent: 'success',
      })
      navigate({
        to: '/campaigns/$campaignId',
        params: { campaignId: created.id },
      })
    },
    onError: (error) => {
      const axiosError = error as AxiosError<ApiErrorResponse>
      const message =
        axiosError.response?.data && 'message' in axiosError.response.data
          ? axiosError.response.data.message
          : 'Failed to create campaign. Check the input and try again.'
      pushToast({
        id: crypto.randomUUID(),
        title: 'Creation failed',
        description: message,
        intent: 'danger',
      })
    },
  })

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target
    setFormState((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const toggleVenueSelection = (venueId: string) => {
    setFormState((previous) => {
      const isSelected = previous.venueIds.includes(venueId)
      return {
        ...previous,
        venueIds: isSelected
          ? previous.venueIds.filter((id) => id !== venueId)
          : [...previous.venueIds, venueId],
      }
    })
  }

  const nextStep = () => setStep((current) => Math.min(current + 1, STEPS.length - 1))
  const previousStep = () => setStep((current) => Math.max(current - 1, 0))

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (step < STEPS.length - 1) {
      nextStep()
      return
    }


      // Map country ID to code for the payload
      const selectedCountry = countriesQuery.data?.find(c => c.id === formState.venueFilters.countryCode)
      const filtersPayload = {
        ...formState.venueFilters,
        countryCode: selectedCountry?.code || formState.venueFilters.countryCode
      }

    const payload: CreateCampaignPayload = {
      name: formState.name,
      description: formState.description || undefined,
      status: scheduleMode === 'immediate' ? 'active' : 'scheduled',
      timezone: formState.timezone || undefined,
      startAt: scheduleMode === 'scheduled' && formState.startAt ? new Date(formState.startAt).toISOString() : (scheduleMode === 'immediate' ? undefined : undefined),
      endAt: formState.endAt ? new Date(formState.endAt).toISOString() : undefined,
      radiusMeters: formState.radiusMeters ? Number(formState.radiusMeters) : undefined,
      budgetCents: formState.budgetCents ? Number(formState.budgetCents) : undefined,
      venueIds: formState.venueSource === 'direct' ? formState.venueIds : undefined,
      venueFilters: formState.venueSource === 'platform' ? filtersPayload : undefined,
      venueSource: formState.venueSource,
      isAllVenues: false, // Deprecated/Unused with new flow, usually
      imageUrl: formState.imageUrl || undefined,
      promoCode: formState.hasPromoCode ? {
        code: formState.promoCode || undefined,
        promoTypeId: formState.promoTypeId,
        discountType: formState.selectedPromoType?.slug?.includes('percentage') ? 'percentage' : 'fixed',
        discountValue: formState.promoDiscountValue ? Number(formState.promoDiscountValue) : 0,
        targetingConfiguration: {} // Simplification for now, as per plan
      } : undefined
    }

    mutation.mutate(payload)
  }

  const isSubmitting = mutation.isPending

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 rounded-2xl border border-slate-800/60 bg-slate-900/60 p-6 shadow-lg shadow-slate-950/30 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">New campaign</p>
          <h1 className="text-2xl font-semibold text-white">Create proximity promotion</h1>
          <p className="mt-1 text-sm text-slate-400">
            Step {step + 1} of {STEPS.length} • {STEPS[step]}
          </p>
        </div>
        <Link
          to="/campaigns"
          className="text-sm text-slate-400 transition hover:text-slate-100"
        >
          Cancel setup
        </Link>
      </header>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-slate-800/60 bg-slate-950/60 p-6 shadow-lg shadow-slate-950/20"
      >
        {step === 0 ? (
          <section className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor={nameId} className="text-xs uppercase tracking-wide text-slate-500">
                Campaign name
              </label>
              <input
                id={nameId}
                name="name"
                value={formState.name}
                onChange={handleChange}
                required
                placeholder="Guinness Happy Hour"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
              />
              <p className="text-xs text-slate-500">Slug preview: {slug || '—'}</p>
            </div>
            <div className="space-y-2">
              <label htmlFor={statusId} className="text-xs uppercase tracking-wide text-slate-500">
                Campaign Type
              </label>
              <div className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-300">
                Proximity Promotion
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label
                htmlFor={descriptionId}
                className="text-xs uppercase tracking-wide text-slate-500"
              >
                Description (optional)
              </label>
              <textarea
                id={descriptionId}
                name="description"
                value={formState.description}
                onChange={handleChange}
                rows={4}
                placeholder="Outline the promo incentive, eligibility, and messaging tone."
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label htmlFor={imageUrlId} className="text-xs uppercase tracking-wide text-slate-500">
                Campaign Image URL
              </label>
              <div className="flex gap-2">
                <input
                  id={imageUrlId}
                  name="imageUrl"
                  value={formState.imageUrl}
                  onChange={handleChange}
                  placeholder="https://storage.googleapis.com/..."
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                />
                <button
                  type="button"
                  onClick={() => setShowMediaLibrary(true)}
                  className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  Media Library
                </button>
              </div>
              {formState.imageUrl && (
                <div className="mt-2 aspect-video w-full max-w-xs overflow-hidden rounded-lg border border-slate-800 bg-slate-900">
                  <img src={formState.imageUrl} alt="Preview" className="h-full w-full object-cover" />
                </div>
              )}
            </div>
          </section>
        ) : null}

        {showMediaLibrary && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
            <div className="relative h-full max-h-[80vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 p-4">
                <h3 className="text-lg font-semibold text-white">Select Campaign Image</h3>
                <button
                  type="button"
                  onClick={() => setShowMediaLibrary(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <div className="h-full overflow-y-auto p-4 pb-20">
                <MediaLibrary
                  folder="campaigns"
                  onSelect={(url) => {
                    setFormState((prev) => ({ ...prev, imageUrl: url }))
                    setShowMediaLibrary(false)
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {step === 1 ? (
          <section className="space-y-6">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <label className="text-xs uppercase tracking-wide text-slate-500 mb-3 block">
                Launch Timing
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="scheduleMode"
                    value="immediate"
                    checked={scheduleMode === 'immediate'}
                    onChange={() => setScheduleMode('immediate')}
                    className="h-4 w-4 text-cyan-500 focus:ring-cyan-500/40"
                  />
                  <span className="text-sm text-slate-200">Launch Immediately</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="scheduleMode"
                    value="scheduled"
                    checked={scheduleMode === 'scheduled'}
                    onChange={() => setScheduleMode('scheduled')}
                    className="h-4 w-4 text-cyan-500 focus:ring-cyan-500/40"
                  />
                  <span className="text-sm text-slate-200">Schedule for Later</span>
                </label>
              </div>
            </div>

            {scheduleMode === 'scheduled' && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor={startId} className="text-xs uppercase tracking-wide text-slate-500">
                    Start date
                  </label>
                  <input
                    id={startId}
                    name="startAt"
                    type="datetime-local"
                    value={formState.startAt}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor={endId} className="text-xs uppercase tracking-wide text-slate-500">
                    End date
                  </label>
                  <input
                    id={endId}
                    name="endAt"
                    type="datetime-local"
                    value={formState.endAt}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  />
                </div>
              </div>
            )}
             <div className="space-y-2">
              <label htmlFor={timezoneId} className="text-xs uppercase tracking-wide text-slate-500">
                Time zone
              </label>
              <select
                id={timezoneId}
                name="timezone"
                value={formState.timezone}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
              >
                {TIMEZONE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </section>
        ) : null}

        {step === 2 ? (
          <section className="space-y-6">
             <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
               <div className="flex items-center justify-between">
                 <div>
                   <h3 className="text-sm font-semibold text-white">Attach Promo Code</h3>
                   <p className="text-xs text-slate-400">Generate a unique code for this campaign</p>
                 </div>
                 <label className="relative inline-flex items-center cursor-pointer">
                   <input 
                      type="checkbox" 
                      checked={formState.hasPromoCode} 
                      onChange={(e) => setFormState(prev => ({ ...prev, hasPromoCode: e.target.checked }))}
                      className="sr-only peer" 
                    />
                   <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                 </label>
               </div>
             </div>

             {formState.hasPromoCode && (
               <div className="grid gap-4 md:grid-cols-2">
                 <div className="space-y-2">
                   <label className="text-xs uppercase tracking-wide text-slate-500">Code (Optional)</label>
                   <input
                     name="promoCode"
                     value={formState.promoCode}
                     onChange={handleChange}
                     placeholder="e.g. SUMMER2024 (Leave empty to auto-generate)"
                     className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                   />
                 </div>
                 <div className="space-y-2">
                   <label className="text-xs uppercase tracking-wide text-slate-500">Promotion Type</label>
                   <select
                     name="promoTypeId"
                     value={formState.promoTypeId}
                     onChange={(e) => {
                       const selectedType = promoTypes.find(t => t.id === e.target.value)
                       setFormState(prev => ({ 
                         ...prev, 
                         promoTypeId: e.target.value,
                         selectedPromoType: selectedType,
                         // Reset discount value if not needed, or keep for later? Better reset to avoid confusion
                         promoDiscountValue: selectedType?.requiresValue ? prev.promoDiscountValue : ''
                       }))
                     }}
                     className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                   >
                     <option value="">Select a promotion type...</option>
                     {promoTypes.map(type => (
                       <option key={type.id} value={type.id}>{type.name}</option>
                     ))}
                   </select>
                 </div>
                 
                 {formState.selectedPromoType?.requiresValue && (
                   <div className="space-y-2">
                      <label className="text-xs uppercase tracking-wide text-slate-500">
                        {formState.selectedPromoType.valueLabel || 'Discount Value'}
                      </label>
                      <input
                        name="promoDiscountValue"
                        type="number"
                        min="0"
                        value={formState.promoDiscountValue}
                        onChange={handleChange}
                        placeholder={formState.selectedPromoType.slug === 'percentage_discount' ? '20' : '500'}
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                      />
                   </div>
                 )}
                 
                 {formState.selectedPromoType?.description && (
                   <div className="md:col-span-2 text-xs text-slate-500 italic">
                     {formState.selectedPromoType.description}
                   </div>
                 )}
               </div>
             )}
          </section>
        ) : null}

        {step === 3 ? (
          <section className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor={radiusId} className="text-xs uppercase tracking-wide text-slate-500">
                Radius (meters)
              </label>
              <input
                id={radiusId}
                name="radiusMeters"
                type="number"
                min={10}
                value={formState.radiusMeters}
                onChange={handleChange}
                placeholder="100"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor={budgetId} className="text-xs uppercase tracking-wide text-slate-500">
                Budget (cents)
              </label>
              <input
                id={budgetId}
                name="budgetCents"
                type="number"
                min={0}
                value={formState.budgetCents}
                onChange={handleChange}
                placeholder="250000"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
              />
            </div>
          </section>
        ) : null}

        {step === 4 ? (
          <section className="space-y-4">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <label className="text-xs uppercase tracking-wide text-slate-500 mb-3 block">
                Venue selection mode
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="venueSource"
                    value="direct"
                    checked={formState.venueSource === 'direct'}
                    onChange={() => setFormState(prev => ({ ...prev, venueSource: 'direct' }))}
                    className="h-4 w-4 text-cyan-500 focus:ring-cyan-500/40"
                  />
                  <span className="text-sm text-slate-200">Specific Venues (Direct)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="venueSource"
                    value="platform"
                    checked={formState.venueSource === 'platform'}
                    onChange={() => setFormState(prev => ({ ...prev, venueSource: 'platform' }))}
                    className="h-4 w-4 text-cyan-500 focus:ring-cyan-500/40"
                  />
                  <span className="text-sm text-slate-200">Platform Filters (Public)</span>
                </label>
              </div>
            </div>

            {formState.venueSource === 'direct' ? (
              <div className="space-y-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <label htmlFor={venueSearchId} className="text-xs uppercase tracking-wide text-slate-500">
                      Search venues
                    </label>
                    <p className="text-xs text-slate-500">
                      Select one or more venues. Create new venues from the Venues dashboard first if needed.
                    </p>
                  </div>
                  <input
                    id={venueSearchId}
                    value={venueSearch}
                    onChange={(event) => setVenueSearch(event.target.value)}
                    placeholder="Search by name"
                    className="w-full max-w-xs rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  />
                </div>
                <div className="space-y-2">
                  {venueOptionsQuery.isLoading ? (
                    <p className="text-xs text-slate-500">Loading venues…</p>
                  ) : venueOptions.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      No venues found. Try adjusting your search or create a new venue first.
                    </p>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                      {venueOptions.map((venue) => {
                        const checked = formState.venueIds.includes(venue.id)
                        return (
                          <label
                            key={venue.id}
                            className={`cursor-pointer rounded-xl border px-4 py-3 text-sm transition ${
                              checked
                                ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-100'
                                : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-cyan-500/40 hover:text-cyan-200'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleVenueSelection(venue.id)}
                                className="mt-1 h-4 w-4 rounded border border-slate-600 bg-slate-900 text-cyan-500 focus:ring-cyan-500/40"
                              />
                              <div>
                                <p className="font-semibold text-white">{venue.name}</p>
                                <p className="text-xs text-slate-400">
                                  {venue.city ?? 'Unknown city'} • {venue.countryCode ?? '??'}
                                </p>
                              </div>
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <VenueFiltersForm
                filters={formState.venueFilters}
                onFiltersChange={(filters) =>
                  setFormState((prev) => ({ ...prev, venueFilters: filters }))
                }
              />
            )}
          </section>
        ) : null}

        {step === 5 ? (
          <section className="space-y-3 text-sm text-slate-300">
            <h2 className="text-base font-semibold text-white">Review summary</h2>
            <ul className="space-y-2">
              <li>
                <strong>Name:</strong> {formState.name || '—'}
              </li>
              <li>
                <strong>Status:</strong> {scheduleMode === 'immediate' ? 'Launching Immediately' : 'Scheduled'}
              </li>
              <li>
                <strong>Schedule:</strong>{' '}
                {scheduleMode === 'immediate' 
                  ? 'Immediate' 
                  : `${formState.startAt || 'TBD'} → ${formState.endAt || 'Open ended'}`}
              </li>
              <li>
                <strong>Radius:</strong> {formState.radiusMeters || 'Not set'}
              </li>
              <li>
                <strong>Venues:</strong>{' '}
                {formState.venueSource === 'direct'
                  ? `${formState.venueIds.length} selected`
                  : 'Platform Filters'}
              </li>
              {formState.venueSource === 'platform' && (
                <li className="text-xs text-slate-400 pl-4">
                  Filters: {Object.keys(formState.venueFilters).length > 0
                    ? Object.entries(formState.venueFilters)
                        .filter(([_, v]) => v !== undefined && v !== null && (Array.isArray(v) ? v.length > 0 : true))
                        .map(([k]) => k)
                        .join(', ')
                    : 'None'}
                </li>
              )}
              {formState.hasPromoCode && (
                 <li>
                   <strong>Promo Code:</strong> {formState.promoCode || '(Auto-generated)'} • {formState.promoDiscountValue} {formState.promoDiscountType === 'percentage' ? '%' : 'credits'} off
                 </li>
              )}
            </ul>
          </section>
        ) : null}

        <footer className="flex items-center justify-between pt-4">
          <button
            type="button"
            onClick={previousStep}
            disabled={step === 0 || isSubmitting}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-500 hover:text-cyan-300 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-600"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={
              isSubmitting ||
              (step === 0 && !formState.name) ||
              (step === 2 &&
                formState.hasPromoCode &&
                (!formState.selectedPromoType || (formState.selectedPromoType.requiresValue && (!formState.promoDiscountValue || Number(formState.promoDiscountValue) <= 0)))) ||
              (step === 4 &&
                formState.venueSource === 'direct' &&
                formState.venueIds.length === 0) ||
              (step === 4 &&
                formState.venueSource === 'platform' &&
                Object.keys(formState.venueFilters).length === 0)
            }
            className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 disabled:cursor-not-allowed disabled:bg-cyan-500/50"
          >
            {step === STEPS.length - 1 ? (isSubmitting ? 'Creating…' : 'Launch campaign') : 'Continue'}
          </button>
        </footer>
      </form>
    </div>
  )
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}


const GEOPOLITICAL_ZONES = [
  { value: 'north_central', label: 'North Central' },
  { value: 'north_east', label: 'North East' },
  { value: 'north_west', label: 'North West' },
  { value: 'south_east', label: 'South East' },
  { value: 'south_south', label: 'South South' },
  { value: 'south_west', label: 'South West' },
]

function VenueFiltersForm({
  filters,
  onFiltersChange,
}: {
  filters: VenueFilters
  onFiltersChange: (filters: VenueFilters) => void
}) {
  const countriesQuery = useCountries()
  const statesQuery = useStates(filters.countryCode)
  const lgasQuery = useLgas(filters.stateId)
  const venueTypesQuery = useVenueTypes()

  // Auto-select Nigeria if it's the only option
  if (
    !filters.countryCode &&
    countriesQuery.data?.length === 1 &&
    countriesQuery.data[0].code === 'NG'
  ) {
    onFiltersChange({ ...filters, countryCode: countriesQuery.data[0].id })
  }

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target
    
    // Clear dependent fields when parent changes
    if (name === 'countryCode') {
      onFiltersChange({ ...filters, countryCode: value, stateId: undefined, lgaId: undefined })
      return
    }
    if (name === 'stateId') {
      onFiltersChange({ ...filters, stateId: value, lgaId: undefined })
      return
    }

    onFiltersChange({
      ...filters,
      [name]: value || undefined,
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wide text-slate-500">Country</label>
          <select
            name="countryCode"
            value={filters.countryCode ?? ''}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
          >
            <option value="">Select Country...</option>
            {countriesQuery.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wide text-slate-500">State</label>
          <select
            name="stateId"
            value={filters.stateId ?? ''}
            onChange={handleChange}
            disabled={!filters.countryCode}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 disabled:opacity-50"
          >
            <option value="">Select State...</option>
            {statesQuery.data?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wide text-slate-500">LGA</label>
          <select
            name="lgaId"
            value={filters.lgaId ?? ''}
            onChange={handleChange}
            disabled={!filters.stateId}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 disabled:opacity-50"
          >
            <option value="">Select LGA...</option>
            {lgasQuery.data?.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

         <div className="space-y-2">
          <label className="text-xs uppercase tracking-wide text-slate-500">Venue Type</label>
          <select
            name="venueTypeId"
            value={filters.venueTypeId ?? ''}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
          >
            <option value="">Select Type...</option>
            {venueTypesQuery.data?.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wide text-slate-500">Geopolitical Zone</label>
          <select
            name="geopoliticalZone"
            value={filters.geopoliticalZone ?? ''}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
          >
            <option value="">Select Zone...</option>
            {GEOPOLITICAL_ZONES.map((z) => (
              <option key={z.value} value={z.value}>
                {z.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}

