import { QueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuthStore } from "../state/authStore";
import { canManageUsers } from "../utils/permissions";
import { requireAuth } from "../utils/requireAuth";

export const Route = createFileRoute("/onboarding")({
	loader: async ({ context, location }) => {
		const { queryClient } = context as { queryClient: QueryClient };
		return requireAuth({
			queryClient,
			locationHref: location.href,
		});
	},
	component: OnboardingRoute,
});

function OnboardingRoute() {
	const { user } = useAuthStore();
	const canInviteUsers = canManageUsers(user);

	return (
		<section className="mx-auto max-w-3xl space-y-6 rounded-2xl border border-slate-800/60 bg-slate-900/60 p-8 shadow-xl shadow-slate-950/30">
			<header className="space-y-2">
				<h1 className="text-2xl font-semibold text-white">
					Welcome, {user?.tenantSlug ?? "brand partner"}
				</h1>
				<p className="text-sm text-slate-400">
					Let's make sure your proximity marketing workspace is ready. Complete
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
					<p className="mt-2 text-xs text-slate-500 italic">
						This step requires future API endpoints for brand profile
						management.
					</p>
				</li>
				<li className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
					<div className="flex items-start justify-between">
						<div className="flex-1">
							<h2 className="font-semibold text-white">
								2. Invite collaborators
							</h2>
							<p className="mt-1 text-slate-400">
								Add marketing managers, analysts, and venue partners with
								tailored permissions.
							</p>
						</div>
						{canInviteUsers && user?.tenantId ? (
							<Link
								to="/tenants/$tenantId/users/invite"
								params={{ tenantId: user.tenantId }}
								className="ml-4 rounded-lg border border-cyan-500/60 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-200 transition hover:bg-cyan-500/20"
							>
								Invite user →
							</Link>
						) : null}
					</div>
					{!canInviteUsers && (
						<p className="mt-2 text-xs text-slate-500 italic">
							Admin access required to invite users.
						</p>
					)}
				</li>
				<li className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
					<div className="flex items-start justify-between">
						<div className="flex-1">
							<h2 className="font-semibold text-white">
								3. Sync venues and geofences
							</h2>
							<p className="mt-1 text-slate-400">
								Kick off a Google Places sync or upload a CSV to populate
								lounges, cafes, and retailers carrying your products.
							</p>
						</div>
						<Link
							to="/dashboard/venues"
							className="ml-4 rounded-lg border border-cyan-500/60 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-200 transition hover:bg-cyan-500/20"
						>
							Manage venues →
						</Link>
					</div>
					<p className="mt-2 text-xs text-slate-500">
						Use the Venues dashboard to sync from Google Places or import venues
						manually via CSV.
					</p>
				</li>
				<li className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
					<div className="flex items-start justify-between">
						<div className="flex-1">
							<h2 className="font-semibold text-white">
								4. Launch first campaign
							</h2>
							<p className="mt-1 text-slate-400">
								Set up campaign objectives, creatives, and trigger radius to
								start generating proximity notifications in the companion
								HappyHour app.
							</p>
						</div>
						<Link
							to="/campaigns/new"
							className="ml-4 rounded-lg border border-cyan-500/60 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-200 transition hover:bg-cyan-500/20"
						>
							Create campaign →
						</Link>
					</div>
				</li>
			</ol>
			<p className="text-xs text-slate-500">
				Future iterations will persist wizard progress via the API and surface
				role-based task assignments.
			</p>
		</section>
	);
}
