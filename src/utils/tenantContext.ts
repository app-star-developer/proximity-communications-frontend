import type { QueryClient } from "@tanstack/react-query";

import { queryKeys } from "../api/queryKeys";

const ROOT_QUERY_KEYS_TO_KEEP = new Set<string>([
	queryKeys.currentUser[0],
	queryKeys.accessibleTenants[0],
]);

export function clearTenantScopedCache(queryClient: QueryClient) {
	queryClient.removeQueries({
		predicate: (query) => {
			const root = query.queryKey?.[0];
			if (typeof root !== "string") {
				return true;
			}
			return !ROOT_QUERY_KEYS_TO_KEEP.has(root);
		},
	});

	// Mutations may have been created under the previous tenant context (optimistic
	// updates, retry queues, etc.). Clearing avoids cross-tenant surprises.
	queryClient.getMutationCache().clear();
}



