import type { QueryClient } from "@tanstack/react-query";
import { redirect } from "@tanstack/react-router";
import { useAuthStore } from "../state/authStore";
import { canManageUsers } from "./permissions";
import { requireAuth } from "./requireAuth";

export async function requireAdmin(options: {
	queryClient: QueryClient;
	locationHref: string;
}) {
	const profile = await requireAuth(options);
	const { user } = useAuthStore.getState();
	// Note: In a real implementation, you'd check the user's access level for the current tenant
	// For now, we'll allow access if they're a platform user or have admin access
	if (!user?.isPlatformUser && !canManageUsers(user)) {
		throw redirect({ to: "/" });
	}
	return profile;
}
