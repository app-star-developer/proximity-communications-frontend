import { useId, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
// Route file - triggers route tree regeneration
import { useMutation } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import type { QueryClient } from '@tanstack/react-query'

import { requireAuth } from '../../utils/requireAuth'
import { geofencingApi } from '../../api/modules/geofencing'
import type {
  ApiErrorResponse,
  GeofenceEvaluationRequest,
  LocationPing,
} from '../../api/types'
import { useUIStore } from '../../state/uiStore'

export const Route = createFileRoute('/geofencing/')({
  loader: async ({ context, location }) => {
    const { queryClient } = context as { queryClient: QueryClient }
    return requireAuth({
      queryClient,
      locationHref: location.href,
    })
  },
  component: GeofencingRoute,
})

function GeofencingRoute() {
  const { pushToast } = useUIStore()
  const locationsId = useId()

  const [formState, setFormState] = useState({
    locations: '',
  })

  const [lastResult, setLastResult] = useState<number | null>(null)

  const evaluateMutation = useMutation({
    mutationFn: (payload: GeofenceEvaluationRequest) =>
      geofencingApi.evaluateLocations(payload),
    onSuccess: (response) => {
      setLastResult(response.triggers)
      pushToast({
        id: crypto.randomUUID(),
        title: 'Evaluation complete',
        description: `${response.triggers} geofence trigger(s) detected.`,
        intent: 'success',
      })
    },
    onError: (error) => {
      const axiosError = error as AxiosError<ApiErrorResponse>
      pushToast({
        id: crypto.randomUUID(),
        title: 'Evaluation failed',
        description:
          axiosError.response?.data && 'message' in axiosError.response.data
            ? axiosError.response.data.message
            : 'Please check the input and try again.',
        intent: 'danger',
      })
      setLastResult(null)
    },
  })

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = event.target
    setFormState({ locations: value })
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!formState.locations.trim()) {
      pushToast({
        id: crypto.randomUUID(),
        title: 'Invalid input',
        description: 'Please provide location data.',
        intent: 'warning',
      })
      return
    }

    let locations: LocationPing[]
    try {
      locations = JSON.parse(formState.locations)
      if (!Array.isArray(locations)) {
        throw new Error('Locations must be an array')
      }
    } catch {
      pushToast({
        id: crypto.randomUUID(),
        title: 'Invalid JSON',
        description:
          'The locations field must be a valid JSON array of location objects.',
        intent: 'warning',
      })
      return
    }

    // Validate location structure
    for (const location of locations) {
      if (
        typeof location.deviceId !== 'string' ||
        typeof location.latitude !== 'number' ||
        typeof location.longitude !== 'number'
      ) {
        pushToast({
          id: crypto.randomUUID(),
          title: 'Invalid location format',
          description:
            'Each location must have deviceId (string), latitude (number), and longitude (number).',
          intent: 'warning',
        })
        return
      }
      if (location.latitude < -90 || location.latitude > 90) {
        pushToast({
          id: crypto.randomUUID(),
          title: 'Invalid latitude',
          description: 'Latitude must be between -90 and 90.',
          intent: 'warning',
        })
        return
      }
      if (location.longitude < -180 || location.longitude > 180) {
        pushToast({
          id: crypto.randomUUID(),
          title: 'Invalid longitude',
          description: 'Longitude must be between -180 and 180.',
          intent: 'warning',
        })
        return
      }
    }

    const payload: GeofenceEvaluationRequest = { locations }
    evaluateMutation.mutate(payload)
  }

  const exampleLocations = [
    {
      deviceId: 'device-123',
      latitude: 40.7128,
      longitude: -74.006,
      accuracyMeters: 10,
      occurredAt: new Date().toISOString(),
    },
    {
      deviceId: 'device-456',
      latitude: 40.7589,
      longitude: -73.9851,
      accuracyMeters: 15,
      occurredAt: new Date().toISOString(),
    },
  ]

  const handleLoadExample = () => {
    setFormState({ locations: JSON.stringify(exampleLocations, null, 2) })
  }

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-6 shadow-lg shadow-slate-950/30">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Geofencing
          </p>
          <h1 className="text-2xl font-semibold text-white">
            Geofence evaluation tool
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Test device location pings against active geofences to verify
            proximity triggers.
          </p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <section className="rounded-2xl border border-slate-800/60 bg-slate-950/60 p-6 shadow-lg shadow-slate-950/20">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">
                Location pings
              </h2>
              <p className="text-xs text-slate-500">
                Provide device locations as a JSON array.
              </p>
            </div>
            <button
              type="button"
              onClick={handleLoadExample}
              className="text-xs text-cyan-300 hover:underline"
            >
              Load example
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor={locationsId}
                className="text-xs uppercase tracking-wide text-slate-500"
              >
                Locations (JSON array) *
              </label>
              <textarea
                id={locationsId}
                name="locations"
                value={formState.locations}
                onChange={handleChange}
                required
                rows={16}
                placeholder='[{"deviceId": "device-123", "latitude": 40.7128, "longitude": -74.006, "accuracyMeters": 10, "occurredAt": "2024-01-01T12:00:00Z"}]'
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
              />
              <p className="text-xs text-slate-500">
                JSON array of location ping objects. Each location must have{' '}
                <code className="rounded bg-slate-800 px-1 py-0.5">
                  deviceId
                </code>
                ,{' '}
                <code className="rounded bg-slate-800 px-1 py-0.5">
                  latitude
                </code>
                , and{' '}
                <code className="rounded bg-slate-800 px-1 py-0.5">
                  longitude
                </code>
                . Optional fields:{' '}
                <code className="rounded bg-slate-800 px-1 py-0.5">
                  accuracyMeters
                </code>
                ,{' '}
                <code className="rounded bg-slate-800 px-1 py-0.5">
                  occurredAt
                </code>
                .
              </p>
            </div>

            <button
              type="submit"
              disabled={evaluateMutation.isPending}
              className="w-full rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 disabled:cursor-not-allowed disabled:bg-cyan-500/50"
            >
              {evaluateMutation.isPending
                ? 'Evaluating…'
                : 'Evaluate locations'}
            </button>
          </form>
        </section>

        <aside className="space-y-4">
          {lastResult !== null && (
            <div className="rounded-2xl border border-cyan-500/40 bg-cyan-500/10 p-6 shadow-lg shadow-cyan-500/20">
              <h3 className="text-sm font-semibold text-cyan-200">
                Evaluation result
              </h3>
              <p className="mt-2 text-3xl font-bold text-white">
                {lastResult}
              </p>
              <p className="mt-1 text-xs text-cyan-300">
                geofence trigger{lastResult !== 1 ? 's' : ''} detected
              </p>
            </div>
          )}

          <div className="rounded-2xl border border-slate-800/60 bg-slate-950/60 p-6 shadow-lg shadow-slate-950/20">
            <h3 className="text-sm font-semibold text-white">About</h3>
            <p className="mt-2 text-xs text-slate-400">
              This tool evaluates device location pings against active
              geofences for campaigns. Use it to test proximity detection and
              verify that location data triggers the expected geofence events.
            </p>
            <p className="mt-3 text-xs text-slate-500">
              The evaluation returns the number of geofence triggers detected
              for the provided locations.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800/60 bg-slate-950/60 p-6 shadow-lg shadow-slate-950/20">
            <h3 className="text-sm font-semibold text-white">Field reference</h3>
            <dl className="mt-3 space-y-2 text-xs">
              <div>
                <dt className="font-medium text-slate-300">deviceId</dt>
                <dd className="text-slate-500">Unique device identifier (required)</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-300">latitude</dt>
                <dd className="text-slate-500">Latitude in degrees, -90 to 90 (required)</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-300">longitude</dt>
                <dd className="text-slate-500">Longitude in degrees, -180 to 180 (required)</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-300">accuracyMeters</dt>
                <dd className="text-slate-500">Location accuracy in meters (optional)</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-300">occurredAt</dt>
                <dd className="text-slate-500">ISO 8601 timestamp (optional)</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  )
}

