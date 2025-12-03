import type { QueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useId, useMemo, useState } from "react";

import { useAccessibleTenants } from "../hooks/useAccessibleTenants";
import { authStore } from "../state/authStore";
import { requireAuth } from "../utils/requireAuth";

export const Route = createFileRoute("/select-tenant")({
	loader: async ({ context, location }) => {
		const { queryClient } = context as { queryClient: QueryClient };
		// Ensure authenticated
		await requireAuth({ queryClient, locationHref: location.href });
		const { user, selectedTenant } = authStore.getState();
		if (!user?.isPlatformUser) {
			throw redirect({ to: "/" });
		}
		if (selectedTenant) {
			throw redirect({ to: "/" });
		}
		return null;
	},
	component: SelectTenantRoute,
});

function SelectTenantRoute() {
	const navigate = useNavigate();
	const accessibleTenantsQuery = useAccessibleTenants();
	const [tenantId, setTenantId] = useState<string>("");
	const tenantSelectId = useId();

	const options = useMemo(
		() => accessibleTenantsQuery.data ?? [],
		[accessibleTenantsQuery.data],
	);

	console.log(options);

	const handleConfirm = () => {
		if (!tenantId) return;
		const selectedTenant = options.find((t) => t.tenantId === tenantId);
		if (selectedTenant) {
			authStore.selectTenant(tenantId, selectedTenant.accessLevel);
		}
		navigate({ to: "/" });
	};

	return (
		<div className="grid min-h-[calc(100vh-4rem)] w-full place-items-center">
			<div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/70 p-8 shadow-2xl shadow-slate-950/40 backdrop-blur">
				<div className="mb-6 space-y-2 text-center">
					<h1 className="text-2xl font-semibold text-white">Select a tenant</h1>
					<p className="text-sm text-slate-400">
						Choose a tenant context to continue.
					</p>
				</div>
				<div className="space-y-4">
					<div className="space-y-1">
						<label
							className="text-sm font-medium text-slate-300"
							htmlFor={tenantSelectId}
						>
							Active tenant
						</label>
						<select
							id={tenantSelectId}
							className="w-full rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 text-slate-100 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/40"
							value={tenantId}
							onChange={(e) => setTenantId(e.target.value)}
						>
							<option value="">Select a tenant…</option>
							{options.map((t) => (
								<option key={t.tenantId} value={t.tenantId}>
									{t.tenantName}
								</option>
							))}
						</select>
					</div>
					<button
						type="button"
						onClick={handleConfirm}
						disabled={!tenantId || accessibleTenantsQuery.isLoading}
						className="w-full rounded-lg bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950 transition cursor-pointer hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 disabled:cursor-not-allowed disabled:bg-cyan-500/50"
					>
						Continue
					</button>
					{accessibleTenantsQuery.isError ? (
						<p className="text-xs text-red-400">
							Failed to load tenants. Please try again.
						</p>
					) : null}
					{accessibleTenantsQuery.isSuccess && options.length === 0 ? (
						<p className="text-xs text-slate-500">
							No tenants available. Contact your platform administrator.
						</p>
					) : null}
					{accessibleTenantsQuery.isLoading ? (
						<p className="text-xs text-slate-500">Loading tenants…</p>
					) : null}
				</div>
			</div>
		</div>
	);
}
