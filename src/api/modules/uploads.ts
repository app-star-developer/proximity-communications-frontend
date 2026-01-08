import { api } from "../client";
import type {
    MediaUpload,
	MediaUploadListResponse,
	MediaUploadResponse,
} from "../types";

export interface MediaUploadListParams {
	search?: string;
	folder?: "campaigns" | "promo-codes";
	limit?: number;
	offset?: number;
}

export const uploadsApi = {
	async list(params?: MediaUploadListParams) {
		const response = await api.get<MediaUpload[]>("/uploads", {
			params,
		});
		return response.data
	},

	async upload(file: File, name?: string, folder: "campaigns" | "promo-codes" = "campaigns") {
		const formData = new FormData();
		formData.append("image", file);
		if (name) {
			formData.append("name", name);
		}

		const response = await api.post<MediaUploadResponse>(
			`/uploads/image?folder=${folder}`,
			formData,
			{
				headers: {
					"Content-Type": "multipart/form-data",
				},
			},
		);
		return response.data;
	},

	async delete(id: string) {
		await api.delete(`/uploads/${id}`);
	},
};
