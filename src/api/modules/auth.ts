import { authStore } from "../../state/authStore";
import { api } from "../client";
import type {
	AuthForgotPasswordRequest,
	AuthLoginRequest,
	AuthResetPasswordRequest,
	AuthTokenResponse,
	MessageResponse,
	AccessibleTenantsResponse,
} from "../types";

export const authApi = {
	async login(payload: AuthLoginRequest) {
		const response = await api.post<AuthTokenResponse>("/auth/login", payload);
		authStore.applyTokenResponse(response.data);
		return response.data;
	},

	async refresh(refreshToken: string) {
		const response = await api.post<AuthTokenResponse>("/auth/refresh", {
			refreshToken,
		});
		authStore.applyTokenResponse(response.data);
		return response.data;
	},

	async logout() {
		await api.post<MessageResponse | undefined>("/auth/logout");
		authStore.clearSession();
	},

	async requestPasswordReset(payload: AuthForgotPasswordRequest) {
		const response = await api.post<MessageResponse>(
			"/auth/password/forgot",
			payload,
		);
		return response.data;
	},

	async resetPassword(payload: AuthResetPasswordRequest) {
		const response = await api.post<MessageResponse>(
			"/auth/password/reset",
			payload,
		);
		return response.data;
	},

	async getAccessibleTenants() {
		const response = await api.get<AccessibleTenantsResponse>(
			"/auth/accessible-tenants",
		);
		return response.data;
	},
};
