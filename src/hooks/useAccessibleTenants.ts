import { useQuery } from "@tanstack/react-query";
import { authApi } from "../api/modules/auth";
import { queryKeys } from "../api/queryKeys";
import type { AccessibleTenant } from "../api/types";

export function useAccessibleTenants(options?: { enabled?: boolean }) {
	return useQuery({
		queryKey: queryKeys.accessibleTenants,
		enabled: options?.enabled,
		queryFn: async () => {
			const response = await authApi.getAccessibleTenants();
			return response.tenants as AccessibleTenant[];
		},
	});
}
