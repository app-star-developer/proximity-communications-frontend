# Frontend Delivery Plan (Reconciled with Proximity API)

## Scope

Build a responsive proximity-marketing dashboard for brand teams (e.g., Guinness) using React, TanStack Router, TanStack Query, and Axios. The implementation aligns with `openapi.json` (`/v1/*` endpoints) and progresses through auth/onboarding → analytics → campaign/venue management.

## Architecture Setup

1. `src/app` – top-level providers:
   - `AppProvider` wraps TanStack Query (React Query) and hosts devtools.
   - `AppRouter` wires TanStack Router route tree with protected route guards (`requireAuthLoader` using `/v1/users/me` + refresh when needed).
2. Shared UI kit in `src/components`:
   - Navigation (`Sidebar`, `Topbar`, `MobileSheet`), layout primitives, form inputs, feedback (toasts, banners).
   - Visualization primitives tailored for analytics (KPI cards, charts, maps).
3. API layer (`src/api`):
   - `client.ts` configures Axios base URL (`import.meta.env.VITE_API_BASE_URL`, default `http://localhost:3000/v1`) and interceptors for bearer auth, refresh flow, and `ValidationErrorResponse` parsing.
   - Feature modules (e.g., `src/api/modules/auth.ts`) map directly to OpenAPI operations (`/v1/auth/login`, `/v1/auth/refresh`, `/v1/campaigns`, `/v1/events/analytics/*`, `/v1/venues/*`).
4. Global state (`src/state`):
   - `authStore.ts` is a persisted Zustand store for access/refresh tokens and session metadata; profile data comes from TanStack Query (`/v1/users/me`).
   - `uiStore.ts` is a Zustand store for theme, nav state, and toast queue.

## Phase 1 – Authentication & Onboarding

- Routes: `/login`, `/forgot-password`, `/reset-password`, `/invite/accept`, `/dashboard` (protected layout), `/onboarding`.
- Components:
  - `AuthLayout` with brand theming, responsive split screen, and Google Maps background accent.
  - Forms built with React Hook Form + Zod validators derived from `AuthLoginRequest`, `AuthRefreshRequest`, and password-reset contract (to confirm once exposed).
- Data flow:
  - `POST /v1/auth/login` for brand credential sign-in.
  - `POST /v1/auth/refresh` via Axios response interceptor to renew tokens.
  - `POST /v1/auth/logout` triggered from profile menu.
  - Placeholder endpoints for password reset/invite acceptance (until backend schemas provided) with mocked mutation handlers for UI wiring.
- Protected routes:
  - Loader guard uses TanStack Query's `ensureQueryData` to fetch `/v1/users/me`, leveraging stored tokens and redirecting to `/login` on 401.
  - `AppShell` layout hosting dashboard navigation and route outlet.
- Onboarding wizard (`/onboarding`):
  - Steps: brand profile (`tenant` summary via `/v1/auth/login` payload), team invitations, venue linking (calls `/v1/venues/manual-import` or `/v1/venues/places-sync` for future automation), consent acknowledgement.
  - Persist progress in local storage to allow resume.

## Phase 2 – Analytics & Insights

- Dashboard overview (`/dashboard/overview`):
  - KPI tiles sourced from `/v1/events/analytics/summary`.
  - Time-series chart using `/v1/events/analytics/timeseries` with granularity filters.
  - Activity feed using campaign list (`GET /v1/campaigns?limit=5`) and notification stats placeholders.
- Audience insights (`/dashboard/audience`):
  - Segment distribution (derived from event payload metadata) with filterable tables.
  - Export actions leveraging the same analytics endpoints with query params.
- Engagement insights (`/dashboard/engagement`):
  - Compare `notification_sent`, `notification_opened`, `click`, `offer_redeemed`.
  - Include conversion funnel visualization.
- Venue insights (`/dashboard/venues`):
  - Map overlay (Google Maps) plotting venues from `VenueIngestionResult.records`.
  - Table with sorting/filtering, ability to trigger `/v1/venues/places-sync`.
- TanStack Query hooks (`useEventSummary`, `useEventTimeseries`, `useCampaignList`) with caching, background refetch, and placeholder skeletons.
- Error boundaries dedicated per route to surface `CodedErrorResponse` or validation issues.

## Phase 3 – Campaign Creation & Management

- Route structure:
  - `/campaigns` list (table + cards) using `GET /v1/campaigns`.
  - `/campaigns/new` wizard using `POST /v1/campaigns`.
  - `/campaigns/:campaignId` detail view with metadata, analytics snippet, timeline.
  - `/campaigns/:campaignId/edit` patch workflow using `PUT /v1/campaigns/{campaignId}`.
  - `/campaigns/:campaignId/locations` venue linking dashboard, reading from attached `venueIds`.
- Campaign builder steps:
  1. Basics – name, slug preview (client-side slugify).
  2. Scheduling – `startAt`, `endAt`, time zone select.
  3. Targeting – radius + geofence preview, hooking into `GeofenceEvaluationRequest` for simulated triggers.
  4. Budget & messaging – `budgetCents`, push notification preview.
  5. Venue selection – integrate venues list (with manual import + Google Places sync triggers).
- Reusable components: `CampaignCard`, `CampaignStatusBadge`, `VenueList`, `LocationMap`, `NotificationPreview`.
- Permissions (RBAC):
  - Extract `roles`/`permissions` from `AuthenticatedUser` to gate UI actions (e.g., creation, cancellation).
- Activity log:
  - Surface events subset filtered by `campaignId` using analytics endpoints.
  - Provide manual cancel button calling `DELETE /v1/campaigns/{campaignId}`.

## Cross-Cutting Concerns

- Theme & Responsiveness:
  - Mobile-first breakpoints, collapsible side nav, top-level `useMediaQuery` hook (based on `window.matchMedia`).
  - Chart reflow using ResizeObserver.
- Accessibility:
  - Semantic landmarks, focus management in modals/drawers, reduced-motion variations for map animations.
- Error & Toast Handling:
  - Axios response interceptor to normalize `ValidationErrorResponse` into field errors for forms.
  - Toast queue component that consumes `uiStore` updates.
- Testing:
  - Unit tests (Vitest) for stores (`authStore`, `uiStore`) and API hooks (mock Axios).
  - Component tests using Testing Library for auth forms and campaign wizard.
  - Outline Playwright smoke scenarios for login and campaign creation (future automation).
- CI hooks:
  - `pnpm lint`, `pnpm test`, `pnpm build` pipelines; GitHub Actions stub referencing pnpm cache.

## Deliverables & Milestones

- **M1 Auth release:** login/reset UI, onboarding wizard, protected shell, token persistence.
- **M2 Analytics release:** overview dashboards, charts, venue insights with map.
- **M3 Campaign release:** campaign CRUD, venue linking workflow, notification preview.
- **M4 Polish:** responsive refinements, map performance tuning, documentation updates, CI pipeline.

## Documentation

- `docs/api-contracts.md` – map React hooks to OpenAPI operationIds (`login`, `listCampaigns`, `getEventTimeseries`, etc.).
- `docs/ux-wireframes.md` – embed Figma snapshots for dashboard and campaign flows.
- `docs/state-diagram.png` – illustrate auth/token refresh lifecycle and navigation guards.
- README updates:
  - Environment variables (`VITE_API_BASE_URL`, `VITE_GOOGLE_MAPS_API_KEY`, `VITE_TENANT_SLUG` default).
  - Setup instructions using pnpm (`pnpm install`, `pnpm dev`).
  - Feature checklist tracking milestone completion.

## Todo Status

- [x] Set up TanStack Router shell, providers, and Axios client scaffold
- [x] Implement brand authentication flows and onboarding wizard
- [x] Build analytics dashboards, charts, and venue insights
- [x] Implement campaign creation, editing, and venue linking
- [ ] Finalize documentation, responsiveness polish, and quality checks
