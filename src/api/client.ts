import axios, {
	type AxiosError,
	type AxiosInstance,
	type AxiosResponse,
	type InternalAxiosRequestConfig,
} from "axios";
import { authStore } from "../state/authStore";
import type { ApiErrorResponse, AuthTokenResponse } from "./types";

const API_BASE_URL =
	import.meta.env.VITE_API_BASE_URL ??
	"https://proximity-communications-216192893907.europe-west1.run.app/api/v1";

type RetryableRequestConfig = InternalAxiosRequestConfig & {
	_retry?: boolean;
};

type PendingRequest = {
	resolve: (value?: unknown) => void;
	reject: (reason?: unknown) => void;
};

const api: AxiosInstance = axios.create({
	baseURL: API_BASE_URL,
	headers: {
		"Content-Type": "application/json",
	},
	timeout: 25_000,
});

let isRefreshing = false;
const refreshQueue: PendingRequest[] = [];

const enqueueRequest = (pending: PendingRequest) => {
	refreshQueue.push(pending);
};

const resolveQueue = (error?: unknown) => {
	while (refreshQueue.length) {
		const pending = refreshQueue.shift();
		if (!pending) {
			continue;
		}

		if (error) {
			pending.reject(error);
		} else {
			pending.resolve(null);
		}
	}
};

const refreshTokens = async () => {
	const { refreshToken } = authStore.getState();
	if (!refreshToken) {
		throw new Error("Missing refresh token");
	}

	const response = await axios.post<AuthTokenResponse>(
		`${API_BASE_URL}/auth/refresh`,
		{ refreshToken },
	);

	authStore.applyTokenResponse(response.data);
};

api.interceptors.request.use((config) => {
	const { accessToken, user, selectedTenant } = authStore.getState();
	const headers = config.headers ?? {};

	if (accessToken && !headers.Authorization) {
		headers.Authorization = `Bearer ${accessToken}`;
	}

	if (user?.isPlatformUser && selectedTenant && !headers["X-Tenant-Context"]) {
		headers["X-Tenant-Context"] = selectedTenant;
	}

	return { ...config, headers };
});

api.interceptors.response.use(
	(response: AxiosResponse) => response,
	async (error: AxiosError<ApiErrorResponse>) => {
		const responseStatus = error.response?.status;
		const message =
			(error.response?.data as any)?.message &&
			typeof (error.response?.data as any).message === "string"
				? ((error.response?.data as any).message as string)
				: "";
		const originalRequest = error.config as RetryableRequestConfig | undefined;

		// Missing tenant context for platform users → nudge selection
		if (responseStatus === 400 && message.includes("X-Tenant-Context")) {
			const { user } = authStore.getState();
			if (user?.isPlatformUser && typeof window !== "undefined") {
				if (!window.location.pathname.startsWith("/select-tenant")) {
					const current =
						window.location.pathname +
						window.location.search +
						window.location.hash;
					const redirectParam =
						current && current !== "/login"
							? `?redirect=${encodeURIComponent(current)}`
							: "";
					window.location.replace(`/select-tenant${redirectParam}`);
				}
			}
		}

		if (
			responseStatus === 401 &&
			originalRequest &&
			!originalRequest._retry &&
			authStore.getState().refreshToken
		) {
			if (isRefreshing) {
				return new Promise((resolve, reject) => {
					enqueueRequest({
						resolve: async () => {
							try {
								const retryResponse = await api(originalRequest);
								resolve(retryResponse);
							} catch (retryError) {
								reject(retryError);
							}
						},
						reject,
					});
				});
			}

			originalRequest._retry = true;
			isRefreshing = true;

			try {
				await refreshTokens();
				resolveQueue();
				return api(originalRequest);
			} catch (refreshError) {
				resolveQueue(refreshError);
				authStore.clearSession();
				return Promise.reject(refreshError);
			} finally {
				isRefreshing = false;
			}
		}

		if (responseStatus === 401) {
			authStore.clearSession();
			if (typeof window !== "undefined") {
				const current =
					window.location.pathname +
					window.location.search +
					window.location.hash;
				const redirectParam =
					current && current !== "/login"
						? `?redirect=${encodeURIComponent(current)}`
						: "";
				if (!window.location.pathname.startsWith("/login")) {
					window.location.replace(`/login${redirectParam}`);
				}
			}
		}

		return Promise.reject(error);
	},
);

export { api };
