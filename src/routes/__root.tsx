import { TanStackDevtools } from "@tanstack/react-devtools";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	createRootRoute,
	Link,
	Outlet,
	useNavigate,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { authApi } from "../api/modules/auth";
import { AppLayout } from "../app/layouts/AppLayout";
import { authStore, useAuthStore } from "../state/authStore";
import { useUIStore } from "../state/uiStore";
import { canManageUsers, isPlatformUser } from "../utils/permissions";

function RootComponent() {
	return (
		<AppLayout>
			<GlobalNav />
			<ToastContainer />
			<Outlet />
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
		</AppLayout>
	);
}

function GlobalNav() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { status, user } = useAuthStore();

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

	return (
		<header className="sticky top-0 z-40 mb-6 w-full border-b border-slate-800/60 bg-slate-950/80 px-4 py-3 backdrop-blur md:px-8">
			<div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-4">
				<div className="flex items-center gap-4">
					<Link to="/" className="text-lg font-semibold text-white">
						Proximity Console
					</Link>
					{status === "authenticated" ? (
						<nav className="hidden items-center gap-3 text-sm text-slate-300 md:flex">
							<Link to="/" className="hover:text-cyan-300">
								Overview
							</Link>
							<Link to="/campaigns" className="hover:text-cyan-300">
								Campaigns
							</Link>
							<Link to="/dashboard/venues" className="hover:text-cyan-300">
								Venues
							</Link>
							<Link to="/dashboard/audience" className="hover:text-cyan-300">
								Audience
							</Link>
							{isPlatformUser(user) ? (
								<Link to="/platform/tenants" className="hover:text-cyan-300">
									Platform
								</Link>
							) : null}
							{canManageUsers(user) && user?.tenantId ? (
								<Link to="/platform/tenants" className="hover:text-cyan-300">
									Users
								</Link>
							) : null}
						</nav>
					) : null}
				</div>
				<div className="flex items-center gap-3 text-sm text-slate-300">
					{status === "authenticated" && user ? (
						<>
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
	if (!toasts.length) {
		return null;
	}
	return (
		<div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-3 px-4">
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
							onClick={() => dismissToast(toast.id)}
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
