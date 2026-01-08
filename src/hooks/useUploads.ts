import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadsApi, type MediaUploadListParams } from "../api/modules/uploads";
import { queryKeys } from "../api/queryKeys";

export function useUploads(params: MediaUploadListParams) {
	const filters = useMemo(() => params, [params]);

	return useQuery({
		queryKey: queryKeys.uploads(filters),
		queryFn: () => uploadsApi.list(filters),
	});
}

export function useUploadImage() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			file,
			name,
			folder,
		}: {
			file: File;
			name?: string;
			folder?: "campaigns" | "promo-codes";
		}) => uploadsApi.upload(file, name, folder),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["uploads"] });
		},
	});
}

export function useDeleteImage() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => uploadsApi.delete(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["uploads"] });
		},
	});
}
