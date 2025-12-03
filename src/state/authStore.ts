import { create } from "zustand";
import { persist } from "zustand/middleware";

import type {
	AccessLevel,
	AuthenticatedUser,
	AuthTokenResponse,
} from "../api/types";

type AuthStatus = "idle" | "authenticated" | "anonymous";

export interface AuthState {
	status: AuthStatus;
	user: AuthenticatedUser | null;
	accessToken: string | null;
	refreshToken: string | null;
	accessTokenExpiresAt: string | null;
	refreshTokenExpiresAt: string | null;
	sessionId: string | null;
	selectedTenant: string | null;
	accessLevel: AccessLevel | null;
	hydrated: boolean;
	applyTokenResponse: (response: AuthTokenResponse) => void;
	clearSession: () => void;
	markAuthenticated: (user: AuthenticatedUser) => void;
	markAnonymous: () => void;
	selectTenant: (tenantId: string, accessLevel?: AccessLevel) => void;
}

const initialState = {
	status: "idle" as AuthStatus,
	user: null,
	accessToken: null,
	refreshToken: null,
	accessTokenExpiresAt: null,
	refreshTokenExpiresAt: null,
	sessionId: null,
	selectedTenant: null,
	accessLevel: null as AccessLevel | null,
};

export const useAuthStore = create<AuthState>()(
	persist(
		(set) => ({
			...initialState,
			hydrated: false,
			applyTokenResponse: (response) =>
				set((prev) => {
					const next: Partial<AuthState> = {
						status: "authenticated",
						user: response.user,
						accessToken: response.accessToken,
						refreshToken: response.refreshToken,
						accessTokenExpiresAt: response.accessTokenExpiresAt,
						refreshTokenExpiresAt: response.refreshTokenExpiresAt,
						sessionId: response.sessionId,
					};

					if (response.user && !response.user.isPlatformUser) {
						next.selectedTenant = response.user.tenantId ?? null;
					}

					return { ...prev, ...next } as AuthState;
				}),
			clearSession: () =>
				set({
					...initialState,
					status: "anonymous",
				}),
			markAuthenticated: (user) =>
				set((prev) => ({
					...prev,
					status: "authenticated",
					user,
					selectedTenant: user.isPlatformUser
						? prev.selectedTenant
						: (user.tenantId ?? null),
				})),
			markAnonymous: () =>
				set({
					...initialState,
					status: "anonymous",
				}),
			selectTenant: (tenantId, accessLevel) =>
				set((prev) => ({
					...prev,
					selectedTenant: tenantId,
					accessLevel: accessLevel ?? null,
				})),
		}),
		{
			name: "proximity.auth.v1",
			partialize: (state) => ({
				status: state.status,
				user: state.user,
				accessToken: state.accessToken,
				refreshToken: state.refreshToken,
				accessTokenExpiresAt: state.accessTokenExpiresAt,
				refreshTokenExpiresAt: state.refreshTokenExpiresAt,
				sessionId: state.sessionId,
				selectedTenant: state.selectedTenant,
				accessLevel: state.accessLevel,
			}),
			onRehydrateStorage: () => (state) => {
				if (!state) {
					return;
				}

				state.hydrated = true;
				if (state.status === "idle") {
					state.status = state.accessToken ? "authenticated" : "anonymous";
				}
			},
		},
	),
);

export const authStore = {
	getState: () => useAuthStore.getState(),
	applyTokenResponse: (response: AuthTokenResponse) =>
		useAuthStore.getState().applyTokenResponse(response),
	clearSession: () => useAuthStore.getState().clearSession(),
	markAuthenticated: (user: AuthenticatedUser) =>
		useAuthStore.getState().markAuthenticated(user),
	markAnonymous: () => useAuthStore.getState().markAnonymous(),
	selectTenant: (tenantId: string, accessLevel?: AccessLevel) =>
		useAuthStore.getState().selectTenant(tenantId, accessLevel),
};
