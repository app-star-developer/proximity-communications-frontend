import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	createFileRoute,
	Link,
	redirect,
	useNavigate,
	useSearch,
} from "@tanstack/react-router";
import type { AxiosError } from "axios";
import { Eye, EyeOff } from "lucide-react";
import { useId, useState } from "react";

import { authApi } from "../api/modules/auth";
import { usersApi } from "../api/modules/users";
import { queryKeys } from "../api/queryKeys";
import type { ApiErrorResponse } from "../api/types";
import { LighthouseLogo } from "../components/LighthouseLogo";
import { authStore } from "../state/authStore";

type LoginSearch = {
	redirect?: string;
};

const parseErrorMessage = (error: unknown) => {
	const axiosError = error as AxiosError<ApiErrorResponse>;
	const responseData = axiosError.response?.data;

	if (!responseData) {
		return "Unable to sign in. Please try again.";
	}

	if ("errors" in responseData) {
		const [firstKey] = Object.keys(responseData.errors);
		if (firstKey) {
			return responseData.errors[firstKey]?.[0] ?? "Invalid credentials.";
		}
	}

	if ("message" in responseData && typeof responseData.message === "string") {
		return responseData.message ?? "An error occured. Please try again.";
	}

	if ("code" in responseData && typeof responseData.code === "string") {
		return responseData.code;
	}

	return "Unable to sign in. Please try again.";
};

export const Route = createFileRoute("/login")({
	component: LoginRoute,
	validateSearch: (search: Record<string, unknown>): LoginSearch => ({
		redirect:
			typeof search.redirect === "string" && search.redirect.length > 0
				? search.redirect
				: undefined,
	}),
	loader: () => {
		const { accessToken } = authStore.getState();
		if (accessToken) {
			throw redirect({
				to: "/",
			});
		}
		return null;
	},
});

function LoginRoute() {
	const search = useSearch({ from: Route.fullPath });
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const emailInputId = useId();
	const passwordInputId = useId();
	const [tenant] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isPasswordVisible, setIsPasswordVisible] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const redirectTo = search.redirect ?? "/";

	const loginMutation = useMutation({
		mutationFn: authApi.login,
		onSuccess: async (response) => {
			setErrorMessage(null);

			// Always fetch user profile first to ensure it's available
			await queryClient.invalidateQueries({
				queryKey: queryKeys.currentUser,
			});
			await queryClient.ensureQueryData({
				queryKey: queryKeys.currentUser,
				queryFn: usersApi.getCurrentUser,
			});

			// Handle platform superusers: require tenant selection
			if (response.user.isPlatformUser) {
				const { selectedTenant } = authStore.getState();
				if (!selectedTenant) {
					navigate({ to: "/select-tenant" });
					return;
				}
			}

			navigate({
				to: redirectTo,
			});
		},
		onError: (error) => {
			console.log("login error", error);
			setErrorMessage(parseErrorMessage(error));
		},
	});

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setErrorMessage(null);
		const payload: { tenant?: string; email: string; password: string } = {
			email,
			password,
		};
		if (tenant.trim().length > 0) {
			payload.tenant = tenant.trim();
		}
		loginMutation.mutate(payload);
	};

	const isSubmitting = loginMutation.isPending;

	return (
		<div className="grid min-h-[calc(100vh-4rem)] w-full place-items-center">
			<div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/70 p-8 shadow-2xl shadow-slate-950/40 backdrop-blur">
				<div className="mb-8 space-y-4 text-center">
					<div className="flex justify-center">
						<LighthouseLogo size={56} />
					</div>
					<h1 className="text-2xl font-semibold text-white">
						Sign in to Lighthouse
					</h1>
					<p className="text-sm text-slate-400">
						Manage proximity campaigns, venues, and analytics in one place.
					</p>
				</div>
				<form onSubmit={handleSubmit} className="space-y-5">
					{/* <div className="space-y-1">
						<label
							htmlFor={tenantInputId}
							className="text-sm font-medium text-slate-300"
						>
							Organization
						</label>
						<input
							id={tenantInputId}
							name="tenant"
							type="text"
							autoComplete="organization"
							value={tenant}
							onChange={(event) => setTenant(event.target.value)}
							className="w-full rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 text-slate-100 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/40"
							placeholder="e.g. guinness"
							required={false}
						/>
					</div> */}
					<div className="space-y-1">
						<label
							htmlFor={emailInputId}
							className="text-sm font-medium text-slate-300"
						>
							Email address
						</label>
						<input
							id={emailInputId}
							name="email"
							type="email"
							autoComplete="username"
							value={email}
							onChange={(event) => setEmail(event.target.value)}
							className="w-full rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 text-slate-100 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/40"
							placeholder="you@brand.com"
							required
						/>
					</div>
					<div className="space-y-1">
						<label
							htmlFor={passwordInputId}
							className="text-sm font-medium text-slate-300"
						>
							Password
						</label>
						<div className="relative">
							<input
								id={passwordInputId}
								name="password"
								type={isPasswordVisible ? "text" : "password"}
								autoComplete="current-password"
								value={password}
								onChange={(event) => setPassword(event.target.value)}
								className="w-full rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 pr-12 text-slate-100 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/40"
								placeholder="Enter your password"
								required
							/>
							<button
								type="button"
								aria-label={
									isPasswordVisible ? "Hide password" : "Show password"
								}
								aria-pressed={isPasswordVisible}
								onClick={() => setIsPasswordVisible((prev) => !prev)}
								className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-slate-400 transition hover:bg-slate-900 hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
							>
								{isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
							</button>
						</div>
					</div>
					{errorMessage ? (
						<p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
							{errorMessage}
						</p>
					) : null}
					<button
						type="submit"
						disabled={isSubmitting}
						className="w-full rounded-lg bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950 transition cursor-pointer hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 disabled:cursor-not-allowed disabled:bg-cyan-500/50"
					>
						{isSubmitting ? "Signing in…" : "Sign in"}
					</button>
				</form>
				<div className="mt-6 flex flex-col gap-2 text-center text-xs text-slate-500">
					<span>
						Forgot password?{" "}
						<Link
							to="/forgot-password"
							className="text-cyan-400 underline decoration-dotted decoration-1 underline-offset-4 hover:text-cyan-300"
						>
							Request reset link
						</Link>
					</span>
					<span>
						Need access? Contact your proximity marketing administrator.
					</span>
				</div>
			</div>
		</div>
	);
}
