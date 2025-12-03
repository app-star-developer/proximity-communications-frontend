import type { QueryClient } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import type { AxiosError } from "axios";
import { format, parseISO } from "date-fns";
import { useId, useMemo, useState } from "react";
import type { ApiErrorResponse } from "@/api/types";
import {
	useTenantList,
	useSuspendTenant,
	useActivateTenant,
} from "@/hooks/useTenants";
import { useAuthStore } from "@/state/authStore";
import { useUIStore } from "@/state/uiStore";
import { isPlatformUser } from "@/utils/permissions";
import { requireAuth } from "@/utils/requireAuth";

export const Route = createFileRoute("/platform/tenants/")({
	loader: async ({ context, location }) => {
		const { queryClient } = context as { queryClient: QueryClient };
		await requireAuth({
			queryClient,
			locationHref: location.href,
		});
		const { user } = useAuthStore.getState();
		if (!isPlatformUser(user)) {
			throw new Error("Platform access required");
		}
		return null;
	},
	component: TenantsListRoute,
});

function TenantsListRoute() {
	const { pushToast } = useUIStore();
	const [statusFilter, setStatusFilter] = useState<
		"all" | "active" | "suspended"
	>("all");
	const [searchTerm, setSearchTerm] = useState("");
	const statusSelectId = useId();

	const listParams = useMemo(
		() => ({
			status: statusFilter !== "all" ? statusFilter : undefined,
			search: searchTerm || undefined,
			limit: 50,
			offset: 0,
		}),
		[statusFilter, searchTerm],
	);

	const tenantsQuery = useTenantList(listParams);
	const suspendMutation = useSuspendTenant();
	const activateMutation = useActivateTenant();

	const tenants = tenantsQuery.data?.data ?? [];

	const handleSuspend = async (tenantId: string) => {
		if (!window.confirm("Suspend this tenant? All users will lose access.")) {
			return;
		}
		suspendMutation.mutate(tenantId, {
			onSuccess: () => {
				pushToast({
					id: crypto.randomUUID(),
					title: "Tenant suspended",
					description: "The tenant has been suspended successfully.",
					intent: "success",
				});
			},
			onError: (error) => {
				const axiosError = error as AxiosError<ApiErrorResponse>;
				pushToast({
					id: crypto.randomUUID(),
					title: "Failed to suspend tenant",
					description:
						axiosError.response?.data && "message" in axiosError.response.data
							? axiosError.response.data.message
							: "Please try again.",
					intent: "danger",
				});
			},
		});
	};

	const handleActivate = async (tenantId: string) => {
		activateMutation.mutate(tenantId, {
			onSuccess: () => {
				pushToast({
					id: crypto.randomUUID(),
					title: "Tenant activated",
					description: "The tenant has been activated successfully.",
					intent: "success",
				});
			},
			onError: (error) => {
				const axiosError = error as AxiosError<ApiErrorResponse>;
				pushToast({
					id: crypto.randomUUID(),
					title: "Failed to activate tenant",
					description:
						axiosError.response?.data && "message" in axiosError.response.data
							? axiosError.response.data.message
							: "Please try again.",
					intent: "danger",
				});
			},
		});
	};

	return (
		<div className="space-y-6">
			<header className="flex flex-col gap-4 rounded-2xl border border-slate-800/60 bg-slate-900/60 p-6 shadow-lg shadow-slate-950/30 lg:flex-row lg:items-center lg:justify-between">
				<div>
					<h2 className="text-xl font-semibold text-white">Tenants</h2>
					<p className="mt-1 text-sm text-slate-400">
						Manage all tenants in the platform.
					</p>
				</div>
				<Link
					to="/platform/tenants/new"
					className="inline-flex items-center justify-center rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
				>
					New tenant
				</Link>
			</header>

			<section className="rounded-2xl border border-slate-800/60 bg-slate-950/60 p-6 shadow-lg shadow-slate-950/20">
				<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
					<div className="flex items-center gap-3">
						<label
							htmlFor={statusSelectId}
							className="text-xs uppercase tracking-wide text-slate-500"
						>
							Status
						</label>
						<select
							id={statusSelectId}
							value={statusFilter}
							onChange={(e) =>
								setStatusFilter(e.target.value as typeof statusFilter)
							}
							className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
						>
							<option value="all">All</option>
							<option value="active">Active</option>
							<option value="suspended">Suspended</option>
						</select>
					</div>
					<div className="flex flex-1 items-center gap-2 md:justify-end">
						<input
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							placeholder="Search tenants…"
							className="w-full max-w-xs rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30"
						/>
					</div>
				</div>

				<div className="mt-6">
					{tenantsQuery.isLoading ? (
						<div className="text-center text-sm text-slate-500">Loading...</div>
					) : tenants.length === 0 ? (
						<div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 px-4 py-8 text-center text-sm text-slate-400">
							No tenants found.
						</div>
					) : (
						<div className="overflow-hidden rounded-xl border border-slate-800/70 bg-slate-950/50">
							<table className="min-w-full text-left text-sm text-slate-300">
								<thead className="bg-slate-900/70 text-xs uppercase tracking-wide text-slate-500">
									<tr>
										<th className="px-4 py-3">Name</th>
										<th className="px-4 py-3">Slug</th>
										<th className="px-4 py-3">Status</th>
										<th className="px-4 py-3">Contact Email</th>
										<th className="px-4 py-3">Created</th>
										<th className="px-4 py-3">Actions</th>
									</tr>
								</thead>
								<tbody>
									{tenants.map((tenant) => (
										<tr
											key={tenant.id}
											className="border-t border-slate-800/70"
										>
											<td className="px-4 py-3 text-white">{tenant.name}</td>
											<td className="px-4 py-3">{tenant.slug}</td>
											<td className="px-4 py-3">
												<span
													className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
														tenant.status === "active"
															? "bg-cyan-500/20 text-cyan-200 border border-cyan-500/40"
															: "bg-red-500/20 text-red-200 border border-red-500/40"
													}`}
												>
													{tenant.status}
												</span>
											</td>
											<td className="px-4 py-3">
												{tenant.contactEmail ?? "—"}
											</td>
											<td className="px-4 py-3">
												{format(parseISO(tenant.createdAt), "MMM d, yyyy")}
											</td>
											<td className="px-4 py-3">
												<div className="flex items-center gap-2">
													<Link
														to="/platform/tenants/$tenantId"
														params={{ tenantId: tenant.id }}
														className="text-xs text-cyan-300 hover:underline"
													>
														View
													</Link>
													{tenant.status === "active" ? (
														<button
															type="button"
															onClick={() => handleSuspend(tenant.id)}
															disabled={suspendMutation.isPending}
															className="text-xs text-red-300 hover:underline disabled:opacity-50"
														>
															Suspend
														</button>
													) : (
														<button
															type="button"
															onClick={() => handleActivate(tenant.id)}
															disabled={activateMutation.isPending}
															className="text-xs text-green-300 hover:underline disabled:opacity-50"
														>
															Activate
														</button>
													)}
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</section>
		</div>
	);
}
