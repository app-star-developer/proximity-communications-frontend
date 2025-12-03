import type { QueryClient } from "@tanstack/react-query";
import {
	createFileRoute,
	Link,
	Outlet,
	useRouterState,
} from "@tanstack/react-router";

import { requireAuth } from "../../utils/requireAuth";

export const Route = createFileRoute("/dashboard/__layout")({
	loader: async ({ context, location }) => {
		const { queryClient } = context as { queryClient: QueryClient };
		return requireAuth({
			queryClient,
			locationHref: location.href,
		});
	},
	component: DashboardLayout,
});

function DashboardLayout() {
	return (
		<div className="flex min-h-[calc(100vh-4rem)] flex-col gap-6 pb-10">
			<header className="flex items-center justify-between rounded-2xl border border-slate-800/60 bg-slate-900/60 px-6 py-4 shadow-lg shadow-slate-950/30 backdrop-blur">
				<div>
					<h1 className="text-lg font-semibold text-white">
						Proximity Marketing Console
					</h1>
					<p className="text-xs text-slate-400">
						Monitor geofenced campaigns, venues, and engagement in real time.
					</p>
				</div>
				<nav className="hidden items-center gap-3 sm:flex">
					<DashboardLink to="/">Overview</DashboardLink>
					<DashboardLink to="/campaigns">Campaigns</DashboardLink>
					<DashboardLink to="/dashboard/venues">Venues</DashboardLink>
					<DashboardLink to="/dashboard/audience">Audience</DashboardLink>
				</nav>
			</header>
			<main className="flex-1">
				<Outlet />
			</main>
		</div>
	);
}

function DashboardLink({
	to,
	children,
}: {
	to: string;
	children: React.ReactNode;
}) {
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});
	const isActive = pathname === to || pathname.startsWith(`${to}/`);

	return (
		<Link
			to={to}
			className={`rounded-full px-4 py-2 text-sm font-medium transition ${
				isActive
					? "bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/30"
					: "text-slate-300 hover:bg-slate-800/80 hover:text-white"
			}`}
		>
			{children}
		</Link>
	);
}
