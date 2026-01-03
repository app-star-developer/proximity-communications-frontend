import { TanStackDevtools } from "@tanstack/react-devtools";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	createRootRoute,
	Link,
	Outlet,
	useNavigate,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { useEffect, useRef } from "react";
import { authApi } from "../api/modules/auth";
import { AppLayout } from "../app/layouts/AppLayout";
import { LighthouseLogo } from "../components/LighthouseLogo";
import { useAccessibleTenants } from "../hooks/useAccessibleTenants";
import { authStore, useAuthStore } from "../state/authStore";
import { useUIStore } from "../state/uiStore";
import { clearTenantScopedCache } from "../utils/tenantContext";
import { canManageUsers, isPlatformUser } from "../utils/permissions";

function RootComponent() {
	return (
		<AppLayout>
			<GlobalNav />
			<ToastContainer />
			<Outlet />
			{!import.meta.env.PROD && (
				<TanStackDevtools
					config={{
						position: "bottom-right",
					}}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
					]}
				/>
			)}
		</AppLayout>
	);
}

function GlobalNav() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { status, user, selectedTenant } = useAuthStore();

	const accessibleTenantsQuery = useAccessibleTenants({
		enabled: status === "authenticated" && isPlatformUser(user),
	});
	const tenantOptions = accessibleTenantsQuery.data ?? [];

	const logoutMutation = useMutation({
		mutationFn: authApi.logout,
		onSettled: () => {
			authStore.clearSession();
			queryClient.removeQueries();
			navigate({ to: "/login" });
		},
	});

	const handleLogout = () => {
		logoutMutation.mutate();
	};

	const handleTenantChange = (tenantId: string) => {
		if (!tenantId) {
			authStore.clearTenantSelection();
			clearTenantScopedCache(queryClient);
			navigate({ to: "/select-tenant" });
			return;
		}

		const next = tenantOptions.find((t) => t.tenantId === tenantId);
		if (!next) {
			return;
		}

		if (tenantId === selectedTenant) {
			return;
		}

		authStore.selectTenant(tenantId, next.accessLevel);
		clearTenantScopedCache(queryClient);
		navigate({ to: "/" });
	};

	return (
		<header className="sticky top-0 z-40 mb-6 w-full border-b border-slate-800/60 bg-slate-950/80 px-4 py-3 backdrop-blur md:px-8">
			<div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-4">
				<div className="flex items-center gap-4">
					<Link to="/" className="flex items-center">
						<LighthouseLogo size={44} />
					</Link>
					{status === "authenticated" ? (
						<nav className="hidden items-center gap-3 text-sm md:flex">
							{[
								{ to: "/campaigns", label: "Campaigns" },
								{ to: "/dashboard/venues", label: "Venues" },
								{ to: "/audience", label: "Audience" },
								{ to: "/notifications", label: "Notifications" },
								// { to: "/geofencing", label: "Geofencing" },
								...(isPlatformUser(user)
									? [{ to: "/platform/tenants", label: "Platform" }]
									: []),
								...(canManageUsers(user) && user?.tenantId
									? [{ to: "/platform/tenants", label: "Users" }]
									: []),
							].map((item) => (
								<Link
									key={item.to + item.label}
									to={item.to}
									activeOptions={{ exact: false }}
									className="rounded-full px-3 py-1.5 text-sm font-semibold transition text-slate-400 hover:text-white hover:bg-slate-800/80"
									activeProps={{
										className:
											"rounded-full px-3 py-1.5 text-sm font-semibold transition bg-cyan-500 text-white shadow shadow-cyan-500/40",
									}}
								>
									{item.label}
								</Link>
							))}
						</nav>
					) : null}
				</div>
				<div className="flex items-center gap-3 text-sm text-slate-300">
					{status === "authenticated" && user ? (
						<>
							{isPlatformUser(user) ? (
								<div className="hidden items-center gap-2 md:flex">
									<label
										className="text-xs font-medium text-slate-400"
										htmlFor="tenant-context"
									>
										Organization
									</label>
									<select
										id="tenant-context"
										className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs font-medium text-slate-100 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 disabled:cursor-not-allowed disabled:opacity-60"
										value={selectedTenant ?? ""}
										onChange={(e) => handleTenantChange(e.target.value)}
										disabled={accessibleTenantsQuery.isLoading}
									>
										<option value="">Select…</option>
										{tenantOptions.map((t) => (
											<option key={t.tenantId} value={t.tenantId}>
												{t.tenantName}
											</option>
										))}
									</select>
								</div>
							) : null}
							<span className="hidden rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs font-medium text-slate-200 md:inline">
								{user.email}
							</span>
							<button
								type="button"
								onClick={handleLogout}
								disabled={logoutMutation.isPending}
								className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-cyan-500 hover:text-cyan-300 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-500"
							>
								{logoutMutation.isPending ? "Signing out…" : "Sign out"}
							</button>
						</>
					) : (
						<div className="flex items-center gap-2">
							<Link
								to="/login"
								className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-cyan-500 hover:text-cyan-300"
							>
								Sign in
							</Link>
							<Link
								to="/signup"
								className="rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-cyan-400"
							>
								Sign up
							</Link>
						</div>
					)}
				</div>
			</div>
		</header>
	);
}

function ToastContainer() {
	const { toasts, dismissToast } = useUIStore();

	const timeoutsRef = useRef<Map<string, number>>(new Map());

	useEffect(() => {
		const activeIds = new Set(toasts.map((toast) => toast.id));

		// Clear any timers for toasts that no longer exist
		for (const [id, timeoutId] of timeoutsRef.current.entries()) {
			if (!activeIds.has(id)) {
				window.clearTimeout(timeoutId);
				timeoutsRef.current.delete(id);
			}
		}

		// Schedule auto-dismiss for new toasts
		for (const toast of toasts) {
			const duration = toast.duration ?? 5000;
			if (duration === 0) {
				continue; // explicit "sticky" toast
			}
			if (timeoutsRef.current.has(toast.id)) {
				continue;
			}

			const timeoutId = window.setTimeout(() => {
				timeoutsRef.current.delete(toast.id);
				dismissToast(toast.id);
			}, duration);

			timeoutsRef.current.set(toast.id, timeoutId);
		}
	}, [toasts, dismissToast]);

	useEffect(() => {
		return () => {
			for (const timeoutId of timeoutsRef.current.values()) {
				window.clearTimeout(timeoutId);
			}
			timeoutsRef.current.clear();
		};
	}, []);

	const handleDismiss = (id: string) => {
		const timeoutId = timeoutsRef.current.get(id);
		if (timeoutId) {
			window.clearTimeout(timeoutId);
			timeoutsRef.current.delete(id);
		}
		dismissToast(id);
	};

	if (!toasts.length) {
		return null;
	}
	return (
		<div className="pointer-events-none fixed bottom-4 right-4 z-100 flex w-full max-w-sm flex-col gap-3 px-4">
			{toasts.map((toast) => (
				<div
					key={toast.id}
					className="pointer-events-auto rounded-xl border border-slate-800 bg-slate-950/90 p-4 shadow-xl shadow-slate-950/40"
				>
					<div className="flex items-start justify-between gap-3">
						<div>
							<p className="text-sm font-semibold text-white">{toast.title}</p>
							{toast.description ? (
								<p className="mt-1 text-xs text-slate-400">
									{toast.description}
								</p>
							) : null}
						</div>
						<button
							type="button"
							onClick={() => handleDismiss(toast.id)}
							className="text-xs text-slate-500 transition hover:text-slate-200"
						>
							×
						</button>
					</div>
				</div>
			))}
		</div>
	);
}

export const Route = createRootRoute({
	component: RootComponent,
});
