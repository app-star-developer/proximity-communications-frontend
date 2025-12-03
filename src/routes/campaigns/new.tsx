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
import type { ApiErrorResponse, Campaign, VenueFilters, VenuePrimaryType } from '../../api/types'
import { useUIStore } from '../../state/uiStore'
import { useVenueOptions } from '../../hooks/useVenues'
import { VenueSelector } from '../../components/VenueSelector'

const STATUS_OPTIONS: Campaign['status'][] = [
  'draft',
  'scheduled',
  'active',
]

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

const STEPS = ['Basics', 'Schedule', 'Targeting', 'Venues', 'Review'] as const

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

  const [step, setStep] = useState(0)
  const [venueSelectionMode, setVenueSelectionMode] = useState<'ids' | 'filters'>('ids')
  const [formState, setFormState] = useState({
    name: '',
    description: '',
    status: 'draft' as Campaign['status'],
    startAt: '',
    endAt: '',
    timezone: '',
    radiusMeters: '',
    budgetCents: '',
    venueIds: [] as string[],
    venueFilters: {} as VenueFilters,
  })

  const [venueSearch, setVenueSearch] = useState('')
  const venueOptionsQuery = useVenueOptions(venueSearch)
  const venueOptions = venueOptionsQuery.data?.data ?? []

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

    const payload: CreateCampaignPayload = {
      name: formState.name,
      description: formState.description || undefined,
      status: formState.status,
      timezone: formState.timezone || undefined,
      startAt: formState.startAt ? new Date(formState.startAt).toISOString() : undefined,
      endAt: formState.endAt ? new Date(formState.endAt).toISOString() : undefined,
      radiusMeters: formState.radiusMeters ? Number(formState.radiusMeters) : undefined,
      budgetCents: formState.budgetCents ? Number(formState.budgetCents) : undefined,
      venueIds: venueSelectionMode === 'ids' && formState.venueIds.length > 0 ? formState.venueIds : undefined,
      venueFilters: venueSelectionMode === 'filters' && Object.keys(formState.venueFilters).length > 0 ? formState.venueFilters : undefined,
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
                Initial status
              </label>
              <select
                id={statusId}
                name="status"
                value={formState.status}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
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
          </section>
        ) : null}

        {step === 1 ? (
          <section className="grid gap-4 md:grid-cols-2">
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
            <div className="space-y-2 md:col-span-2">
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

        {step === 3 ? (
          <section className="space-y-4">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <label className="text-xs uppercase tracking-wide text-slate-500 mb-3 block">
                Venue selection mode
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="venueMode"
                    value="ids"
                    checked={venueSelectionMode === 'ids'}
                    onChange={() => setVenueSelectionMode('ids')}
                    className="h-4 w-4 text-cyan-500 focus:ring-cyan-500/40"
                  />
                  <span className="text-sm text-slate-200">Select specific venues</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="venueMode"
                    value="filters"
                    checked={venueSelectionMode === 'filters'}
                    onChange={() => setVenueSelectionMode('filters')}
                    className="h-4 w-4 text-cyan-500 focus:ring-cyan-500/40"
                  />
                  <span className="text-sm text-slate-200">Use dynamic filters</span>
                </label>
              </div>
            </div>

            {venueSelectionMode === 'ids' ? (
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

        {step === 4 ? (
          <section className="space-y-3 text-sm text-slate-300">
            <h2 className="text-base font-semibold text-white">Review summary</h2>
            <ul className="space-y-2">
              <li>
                <strong>Name:</strong> {formState.name || '—'}
              </li>
              <li>
                <strong>Status:</strong> {formState.status}
              </li>
              <li>
                <strong>Schedule:</strong>{' '}
                {formState.startAt || formState.endAt
                  ? `${formState.startAt || 'Immediate'} → ${formState.endAt || 'Open ended'}`
                  : 'Not scheduled'}
              </li>
              <li>
                <strong>Radius:</strong> {formState.radiusMeters || 'Not set'}
              </li>
              <li>
                <strong>Venues:</strong>{' '}
                {venueSelectionMode === 'ids'
                  ? `${formState.venueIds.length} selected`
                  : 'Dynamic filters configured'}
              </li>
              {venueSelectionMode === 'filters' && (
                <li className="text-xs text-slate-400 pl-4">
                  Filters: {Object.keys(formState.venueFilters).length > 0
                    ? Object.entries(formState.venueFilters)
                        .filter(([_, v]) => v !== undefined && v !== null && (Array.isArray(v) ? v.length > 0 : true))
                        .map(([k]) => k)
                        .join(', ')
                    : 'None'}
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
              (step === 3 &&
                venueSelectionMode === 'ids' &&
                formState.venueIds.length === 0) ||
              (step === 3 &&
                venueSelectionMode === 'filters' &&
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

const VENUE_PRIMARY_TYPES: VenuePrimaryType[] = [
  'hotel',
  'restaurant',
  'bar',
  'cafe',
  'mall',
  'retail',
  'entertainment',
  'other',
]

function VenueFiltersForm({
  filters,
  onFiltersChange,
}: {
  filters: VenueFilters
  onFiltersChange: (filters: VenueFilters) => void
}) {
  const cityId = useId()
  const regionId = useId()
  const countryCodeId = useId()
  const statusId = useId()
  const radiusLatId = useId()
  const radiusLonId = useId()
  const radiusMetersId = useId()
  const isSharedId = useId()

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = event.target
    const checked = (event.target as HTMLInputElement).checked

    if (name === 'primaryType') {
      const checkbox = event.target as HTMLInputElement
      const currentTypes = filters.primaryType || []
      const newTypes = checkbox.checked
        ? [...currentTypes, value as VenuePrimaryType]
        : currentTypes.filter((t) => t !== value)
      onFiltersChange({
        ...filters,
        primaryType: newTypes.length > 0 ? newTypes : undefined,
      })
      return
    }

    if (name.startsWith('radius.')) {
      const field = name.split('.')[1] as 'latitude' | 'longitude' | 'meters'
      const currentRadius = filters.radius || { latitude: undefined, longitude: undefined, meters: undefined }
      const newValue = value ? Number(value) : undefined
      const newRadius = {
        ...currentRadius,
        [field]: newValue,
      }
      // Only include radius if all required fields are present
      if (newRadius.latitude !== undefined && newRadius.longitude !== undefined && newRadius.meters !== undefined) {
        onFiltersChange({
          ...filters,
          radius: newRadius as VenueFilters['radius'],
        })
      } else {
        onFiltersChange({
          ...filters,
          radius: undefined,
        })
      }
      return
    }

    if (type === 'checkbox') {
      onFiltersChange({
        ...filters,
        [name]: checked || undefined,
      })
      return
    }

    onFiltersChange({
      ...filters,
      [name]: value || undefined,
    })
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">
        Configure filters to dynamically select venues. All filters are optional and can be combined.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wide text-slate-500">
            Primary type
          </label>
          <div className="space-y-2">
            {VENUE_PRIMARY_TYPES.map((type) => (
              <label key={type} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="primaryType"
                  value={type}
                  checked={filters.primaryType?.includes(type) ?? false}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border border-slate-600 bg-slate-900 text-cyan-500 focus:ring-cyan-500/40"
                />
                <span className="text-sm text-slate-200 capitalize">{type}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <label htmlFor={cityId} className="text-xs uppercase tracking-wide text-slate-500">
            City
          </label>
          <input
            id={cityId}
            name="city"
            value={filters.city || ''}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor={regionId} className="text-xs uppercase tracking-wide text-slate-500">
            Region/State
          </label>
          <input
            id={regionId}
            name="region"
            value={filters.region || ''}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor={countryCodeId} className="text-xs uppercase tracking-wide text-slate-500">
            Country code (ISO-2)
          </label>
          <input
            id={countryCodeId}
            name="countryCode"
            value={filters.countryCode || ''}
            onChange={handleChange}
            maxLength={2}
            placeholder="US"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor={statusId} className="text-xs uppercase tracking-wide text-slate-500">
            Status
          </label>
          <select
            id={statusId}
            name="status"
            value={filters.status || ''}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
          >
            <option value="">Any</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              id={isSharedId}
              name="isShared"
              checked={filters.isShared ?? false}
              onChange={handleChange}
              className="h-4 w-4 rounded border border-slate-600 bg-slate-900 text-cyan-500 focus:ring-cyan-500/40"
            />
            <span className="text-xs uppercase tracking-wide text-slate-500">
              Include shared venues
            </span>
          </label>
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-xs uppercase tracking-wide text-slate-500">
            Radius filter (optional)
          </label>
          <div className="grid gap-3 md:grid-cols-3">
            <input
              id={radiusLatId}
              name="radius.latitude"
              type="number"
              step="any"
              min={-90}
              max={90}
              value={filters.radius?.latitude || ''}
              onChange={handleChange}
              placeholder="Latitude"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
            />
            <input
              id={radiusLonId}
              name="radius.longitude"
              type="number"
              step="any"
              min={-180}
              max={180}
              value={filters.radius?.longitude || ''}
              onChange={handleChange}
              placeholder="Longitude"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
            />
            <input
              id={radiusMetersId}
              name="radius.meters"
              type="number"
              min={0}
              value={filters.radius?.meters || ''}
              onChange={handleChange}
              placeholder="Radius (meters)"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
