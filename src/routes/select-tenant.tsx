import type { QueryClient } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import {
	createFileRoute,
	redirect,
	useNavigate,
	useSearch,
} from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Building2, CheckCircle2, ArrowRight } from "lucide-react";

import { useAccessibleTenants } from "../hooks/useAccessibleTenants";
import { authStore, useAuthStore } from "../state/authStore";
import { requireAuth } from "../utils/requireAuth";
import { clearTenantScopedCache } from "../utils/tenantContext";

type SelectTenantSearch = {
	redirect?: string;
};

export const Route = createFileRoute("/select-tenant")({
	validateSearch: (search: Record<string, unknown>): SelectTenantSearch => ({
		redirect:
			typeof search.redirect === "string" && search.redirect.length > 0
				? search.redirect
				: undefined,
	}),
	loader: async ({ context, location }) => {
		const { queryClient } = context as { queryClient: QueryClient };
		// Ensure authenticated
		await requireAuth({ queryClient, locationHref: location.href });
		const { user } = authStore.getState();
		if (!user?.isPlatformUser) {
			throw redirect({ to: "/" });
		}
		return null;
	},
	component: SelectTenantRoute,
});

function SelectTenantRoute() {
	const navigate = useNavigate();
	const searchParams = useSearch({ from: Route.fullPath });
	const queryClient = useQueryClient();
	const accessibleTenantsQuery = useAccessibleTenants();
	const { selectedTenant } = useAuthStore();
	
	const [searchQuery, setSearchQuery] = useState("");

	const tenants = useMemo(
		() => accessibleTenantsQuery.data ?? [],
		[accessibleTenantsQuery.data],
	);

	const filteredTenants = useMemo(() => {
		return tenants.filter((t) =>
			t.tenantName.toLowerCase().includes(searchQuery.toLowerCase())
		);
	}, [tenants, searchQuery]);

	const handleSelect = (tenantId: string, accessLevel: any) => {
		authStore.selectTenant(tenantId, accessLevel);
		clearTenantScopedCache(queryClient);
		navigate({ to: searchParams.redirect ?? "/" });
	};

	return (
		<div className="flex min-h-[calc(100vh-8rem)] w-full flex-col items-center px-4 py-12 md:px-8">
			<div className="w-full max-w-4xl space-y-8">
				<div className="space-y-2 text-center">
					<h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
						Switch Organization
					</h1>
					<p className="text-slate-400">
						Select an organization to manage your workspace and campaigns.
					</p>
				</div>

				<div className="relative group">
					<Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-cyan-400" />
					<input
						type="text"
						placeholder="Search organizations..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="h-14 w-full rounded-2xl border border-slate-800 bg-slate-900/50 pl-12 pr-4 text-lg text-white outline-none transition-all placeholder:text-slate-600 focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10"
					/>
				</div>

				{accessibleTenantsQuery.isLoading ? (
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{[...Array(6)].map((_, i) => (
							<div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-800/40" />
						))}
					</div>
				) : (
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{filteredTenants.map((t) => {
							const isActive = t.tenantId === selectedTenant;
							return (
								<button
									key={t.tenantId}
									onClick={() => handleSelect(t.tenantId, t.accessLevel)}
									className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-5 text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${
										isActive
											? "border-cyan-500 bg-cyan-500/10 shadow-[0_0_20px_rgba(6,182,212,0.15)]"
											: "border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/60"
									}`}
								>
									<div className="space-y-3">
										<div className="flex items-start justify-between">
											<div className={`rounded-xl p-2.5 transition-colors ${
												isActive ? "bg-cyan-500 text-slate-950" : "bg-slate-800 text-slate-400 group-hover:bg-slate-700"
											}`}>
												<Building2 size={24} />
											</div>
											{isActive && (
												<div className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-400">
													Active
												</div>
											)}
										</div>
										<div>
											<h3 className="line-clamp-1 font-bold text-white group-hover:text-cyan-400 transition-colors">
												{t.tenantName}
											</h3>
											<p className="mt-1 text-xs text-slate-500 capitalize tracking-wide">
												{t.accessLevel.replace('_', ' ')}
											</p>
										</div>
									</div>
									<div className={`mt-4 flex items-center gap-2 text-xs font-bold transition-all ${
										isActive ? "text-cyan-400" : "text-slate-500 group-hover:text-cyan-400 translate-x-[-4px] group-hover:translate-x-0"
									}`}>
										<span>{isActive ? "Currently Active" : "Switch to this org"}</span>
										<ArrowRight size={14} className={isActive ? "hidden" : "block"} />
									</div>
									
									{isActive && (
										<div className="absolute -right-2 -top-2 text-cyan-500/10">
											<CheckCircle2 size={80} />
										</div>
									)}
								</button>
							);
						})}
					</div>
				)}

				{!accessibleTenantsQuery.isLoading && filteredTenants.length === 0 && (
					<div className="flex flex-col items-center justify-center py-20 text-center">
						<div className="rounded-full bg-slate-900 p-6 text-slate-700">
							<Building2 size={48} />
						</div>
						<h3 className="mt-4 text-xl font-semibold text-slate-300">No organizations found</h3>
						<p className="mt-2 text-slate-500">
							{searchQuery 
								? `We couldn't find any results for "${searchQuery}"`
								: "You don't have access to any organizations yet."}
						</p>
						{searchQuery && (
							<button 
								onClick={() => setSearchQuery("")}
								className="mt-6 text-sm font-bold text-cyan-500 hover:text-cyan-400 transition-colors"
							>
								Clear Search
							</button>
						)}
					</div>
				)}

				{accessibleTenantsQuery.isError && (
					<div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center">
						<p className="text-red-400 font-medium">Failed to load organizations</p>
						<button 
							onClick={() => accessibleTenantsQuery.refetch()}
							className="mt-4 text-sm font-bold text-white underline underline-offset-4 hover:text-red-300"
						>
							Try again
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
