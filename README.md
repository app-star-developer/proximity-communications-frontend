# Proximity Communications Frontend

## Feature Overview

### Authentication & Onboarding

- Brand signup form to register a new tenant via `/v1/auth/signup`
- Brand login with token refresh logic and protected routes (UI wiring complete, pending password reset endpoints)
- Onboarding checklist outlining brand profile, team invites, venue sync, and first campaign creation

### Analytics

- Dashboard KPIs sourced from `/v1/events/analytics/summary`
- Engagement charts using `/v1/events/analytics/timeseries`
- Campaign cards with filtered search and pagination

### Campaign Management

- Campaign list with status filters and search
- Detail view showing metadata, engagement snapshot, and linked venues
- Edit form for campaign metadata and scheduling
- Venue management surface to attach/detach venue IDs
- Multi-step creation wizard covering basics, schedule, targeting, venues, and review

## Roadmap

### In Progress

- Build mobile-responsive layouts for analytics tabs (audience, venues)
- Integrate venue metadata (address, coordinates) in campaign detail and locations views

### Planned

- Invite acceptance flows once backend endpoints are exposed
- Campaign geofence preview and notification creative editor
- Venue map visualization leveraging Google Maps API
- Draft persistence for campaign wizard
- Automated tests (unit, component, Playwright smoke scenarios)

### Completed Milestones

- Authentication shell with TanStack Router guards and Axios interceptors
- Dashboard analytics with charts and KPI tiles
- Campaign CRUD including creation wizard, edit screens, venue linking, and cancellation workflow

## Getting Started

```bash
pnpm install
pnpm dev
```

Visit `http://localhost:5173` after the Vite dev server starts.

### Environment Variables

Create a `.env` (or `.env.local`) file at the project root with:

```bash
VITE_API_BASE_URL=http://localhost:3000/v1
VITE_GOOGLE_MAPS_API_KEY=
VITE_TENANT_SLUG=
```

- `VITE_API_BASE_URL` points to your running Proximity API instance.
- `VITE_GOOGLE_MAPS_API_KEY` is required once map views are enabled.
- `VITE_TENANT_SLUG` seeds default tenant context for local testing.

### Build & Preview

```bash
pnpm build
pnpm serve
```

## Testing & Quality

| Command       | Description                         |
| ------------- | ----------------------------------- |
| `pnpm lint`   | Lints the codebase via Biome        |
| `pnpm format` | Formats source files via Biome      |
| `pnpm check`  | Combined lint + format verification |
| `pnpm test`   | Runs the Vitest unit test suite     |

Continuous integration should run `pnpm lint`, `pnpm test`, and `pnpm build` before deployments.

## Styling

- Tailwind CSS powers utility-first styling.
- `src/styles.css` defines polished global tokens (dark background, typography, button/input helpers).
- Component-level styling follows Tailwind conventions for rapid iteration.

## Routing

This project uses [TanStack Router](https://tanstack.com/router). The initial setup is a file based router, which means that the routes are managed as files in `src/routes`.

### Adding A Route

To add a new route to your application just add another a new file in the `./src/routes` directory.

TanStack will automatically generate the content of the route file for you.

Now that you have two routes you can use a `Link` component to navigate between them.

### Adding Links

To use SPA (Single Page Application) navigation you will need to import the `Link` component from `@tanstack/react-router`.

```tsx
import { Link } from "@tanstack/react-router";
```

Then anywhere in your JSX you can use it like so:

```tsx
<Link to="/about">About</Link>
```

This will create a link that will navigate to the `/about` route.

More information on the `Link` component can be found in the [Link documentation](https://tanstack.com/router/v1/docs/framework/react/api/router/linkComponent).

### Using A Layout

In the File Based Routing setup the layout is located in `src/routes/__root.tsx`. Anything you add to the root route will appear in all the routes. The route content will appear in the JSX where you use the `<Outlet />` component.

Here is an example layout that includes a header:

```tsx
import { Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { Link } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: () => (
    <>
      <header>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
        </nav>
      </header>
      <Outlet />
      <TanStackRouterDevtools />
    </>
  ),
});
```

The `<TanStackRouterDevtools />` component is not required so you can remove it if you don't want it in your layout.

More information on layouts can be found in the [Layouts documentation](https://tanstack.com/router/latest/docs/framework/react/guide/routing-concepts#layouts).

## Data Fetching

There are multiple ways to fetch data in your application. You can use TanStack Query to fetch data from a server. But you can also use the `loader` functionality built into TanStack Router to load the data for a route before it's rendered.

For example:

```tsx
const peopleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/people",
  loader: async () => {
    const response = await fetch("https://swapi.dev/api/people");
    return response.json() as Promise<{
      results: {
        name: string;
      }[];
    }>;
  },
  component: () => {
    const data = peopleRoute.useLoaderData();
    return (
      <ul>
        {data.results.map((person) => (
          <li key={person.name}>{person.name}</li>
        ))}
      </ul>
    );
  },
});
```

Loaders simplify your data fetching logic dramatically. Check out more information in the [Loader documentation](https://tanstack.com/router/latest/docs/framework/react/guide/data-loading#loader-parameters).

### React-Query

React-Query is an excellent addition or alternative to route loading and integrating it into you application is a breeze.

First add your dependencies:

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
```

Next we'll need to create a query client and provider. We recommend putting those in `main.tsx`.

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// ...

const queryClient = new QueryClient();

// ...

if (!rootElement.innerHTML) {
```
