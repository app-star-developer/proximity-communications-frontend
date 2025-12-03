import { createFileRoute } from '@tanstack/react-router'

import { requireAuth } from '../utils/requireAuth'
import { useAuthStore } from '../state/authStore'
import { QueryClient } from '@tanstack/react-query'

export const Route = createFileRoute('/onboarding')({
  loader: async ({ context, location }) => {
    const { queryClient } = context as { queryClient: QueryClient }
    return requireAuth({
      queryClient,
      locationHref: location.href,
    })
  },
  component: OnboardingRoute,
})

function OnboardingRoute() {
  const { user } = useAuthStore()

  return (
    <section className="mx-auto max-w-3xl space-y-6 rounded-2xl border border-slate-800/60 bg-slate-900/60 p-8 shadow-xl shadow-slate-950/30">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-white">
          Welcome, {user?.tenantSlug ?? 'brand partner'}
        </h1>
        <p className="text-sm text-slate-400">
          Let’s make sure your proximity marketing workspace is ready. Complete
          the steps below or assign them to your team.
        </p>
      </header>
      <ol className="space-y-4 text-sm text-slate-300">
        <li className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <h2 className="font-semibold text-white">1. Confirm brand profile</h2>
          <p className="mt-1 text-slate-400">
            Pull brand metadata from the HappyHour backend or provide manual
            overrides (logo, color palette, default messaging tone).
          </p>
        </li>
        <li className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <h2 className="font-semibold text-white">2. Invite collaborators</h2>
          <p className="mt-1 text-slate-400">
            Use the upcoming `/v1/users/invitations` endpoint to add marketing
            managers, analysts, and venue partners with tailored permissions.
          </p>
        </li>
        <li className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <h2 className="font-semibold text-white">
            3. Sync venues and geofences
          </h2>
          <p className="mt-1 text-slate-400">
            Kick off a Google Places sync or upload a CSV to populate lounges,
            cafes, and retailers carrying your products.
          </p>
        </li>
        <li className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <h2 className="font-semibold text-white">4. Launch first campaign</h2>
          <p className="mt-1 text-slate-400">
            Set up campaign objectives, creatives, and trigger radius to start
            generating proximity notifications in the companion HappyHour app.
          </p>
        </li>
      </ol>
      <p className="text-xs text-slate-500">
        Future iterations will persist wizard progress via the API and surface
        role-based task assignments.
      </p>
    </section>
  )
}
