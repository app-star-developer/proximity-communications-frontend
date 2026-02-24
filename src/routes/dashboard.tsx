import type { QueryClient } from "@tanstack/react-query";
import {
	createFileRoute,
	Outlet,
} from "@tanstack/react-router";

import { requireAuth } from "@/utils/requireAuth";

export const Route = createFileRoute("/dashboard")({
	loader: async ({ context, location }) => {
		const { queryClient } = context as { queryClient: QueryClient };
		return requireAuth({
			queryClient,
			locationHref: location.href,
		})
	},
	component: DashboardLayout,
});

function DashboardLayout() {
	return (
		<main className="flex-1 pb-10">
			<Outlet />
		</main>
	);
}


