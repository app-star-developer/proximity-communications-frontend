import { useState } from "react";
import { useUploads, useUploadImage, useDeleteImage } from "../hooks/useUploads";
import { formatBytes } from "../utils/format";
import { useUIStore } from "../state/uiStore";

interface MediaLibraryProps {
	onSelect?: (imageUrl: string) => void;
	folder?: "campaigns" | "promo-codes";
	standalone?: boolean;
}

export function MediaLibrary({ onSelect, folder: initialFolder = "campaigns", standalone = false }: MediaLibraryProps) {
	const [search, setSearch] = useState("");
	const [folder, setFolder] = useState<"campaigns" | "promo-codes">(initialFolder);
	const [uploading, setUploading] = useState(false);
	const { pushToast } = useUIStore();

	const { data, isLoading, refetch } = useUploads({
		search,
		folder,
		limit: 50,
	});

    console.log('data', data)

	const uploadMutation = useUploadImage();
	const deleteMutation = useDeleteImage();

	const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setUploading(true);
		try {
			await uploadMutation.mutateAsync({ file, folder });
			pushToast({
				id: Math.random().toString(36).substr(2, 9),
				title: "Success",
				description: "Image uploaded successfully",
				intent: "success",
			});
			refetch();
		} catch (error) {
			pushToast({
				id: Math.random().toString(36).substr(2, 9),
				title: "Error",
				description: "Failed to upload image",
				intent: "danger",
			});
		} finally {
			setUploading(false);
		}
	};

	const handleDelete = async (id: string) => {
		if (!confirm("Are you sure you want to delete this image?")) return;

		try {
			await deleteMutation.mutateAsync(id);
			pushToast({
				id: Math.random().toString(36).substr(2, 9),
				title: "Deleted",
				description: "Image removed from library",
				intent: "success",
			});
			refetch();
		} catch (error) {
			pushToast({
				id: Math.random().toString(36).substr(2, 9),
				title: "Error",
				description: "Failed to delete image",
				intent: "danger",
			});
		}
	};

	const copyToClipboard = (url: string) => {
		navigator.clipboard.writeText(url);
		pushToast({
			id: Math.random().toString(36).substr(2, 9),
			title: "Copied!",
			description: "Image URL copied to clipboard",
			intent: "success",
		});
	};

	return (
		<div className={`flex flex-col gap-6 ${standalone ? 'p-6 md:p-8 bg-slate-950 min-h-screen text-slate-100' : ''}`}>
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<h2 className="text-2xl font-bold text-white">Media Library</h2>
					<p className="text-sm text-slate-400">Manage and select images for your campaigns</p>
				</div>
				<label className="flex cursor-pointer items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:opacity-50">
					{uploading ? "Uploading..." : "Upload Image"}
					<input
						type="file"
						className="hidden"
						accept="image/*"
						onChange={handleFileUpload}
						disabled={uploading}
					/>
				</label>
			</div>

			<div className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4 md:flex-row md:items-center">
				<div className="flex-1">
					<input
						type="text"
						placeholder="Search images..."
						className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-white outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>
				</div>
				<div className="flex gap-2">
					<button
						className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
							folder === "campaigns"
								? "bg-slate-800 text-white"
								: "text-slate-400 hover:text-white"
						}`}
						onClick={() => setFolder("campaigns")}
					>
						Campaigns
					</button>
					<button
						className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
							folder === "promo-codes"
								? "bg-slate-800 text-white"
								: "text-slate-400 hover:text-white"
						}`}
						onClick={() => setFolder("promo-codes")}
					>
						Promo Codes
					</button>
				</div>
			</div>

			{isLoading ? (
				<div className="flex h-64 items-center justify-center">
					<div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent"></div>
				</div>
			) : data?.length === 0 ? (
				<div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 text-slate-500">
					<p>No images found in this folder</p>
				</div>
			) : (
				<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
					{data?.map((img) => (
						<div
							key={img.id}
							className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900 transition hover:border-slate-600 hover:shadow-lg"
						>
							<div className="aspect-square w-full bg-slate-800">
								<img
									src={img.imageUrl}
									alt={img.name}
									className="h-full w-full object-cover"
								/>
							</div>
							<div className="p-3">
								<p className="truncate text-xs font-medium text-slate-200" title={img.name}>
									{img.name}
								</p>
								<p className="mt-1 text-[10px] text-slate-500">
									{formatBytes(img.sizeBytes)}
								</p>
							</div>

							<div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950/80 opacity-0 backdrop-blur-sm transition group-hover:opacity-100">
								{onSelect ? (
									<button
										onClick={() => onSelect(img.imageUrl)}
										className="rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-cyan-500"
									>
										Select Image
									</button>
								) : (
									<button
										onClick={() => copyToClipboard(img.imageUrl)}
										className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-slate-700"
									>
										Copy URL
									</button>
								)}
								<button
									onClick={() => handleDelete(img.id)}
									className="text-xs font-semibold text-red-400 hover:text-red-300"
								>
									Delete
								</button>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
