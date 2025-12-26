import { createFileRoute, Link } from "@tanstack/react-router";
import type { AxiosError } from "axios";
import { useId, useState } from "react";

import type { ApiErrorResponse, Venue } from "../../../api/types";
import { useDeleteVenue, useVenueList } from "../../../hooks/useVenues";
import { useUIStore } from "../../../state/uiStore";
import { VenueDetailsModal } from "../../../components/VenueDetailsModal";

const PAGE_SIZE = 20;

export const Route = createFileRoute("/dashboard/venues/")({
	component: VenuesListRoute,
});

function VenuesListRoute() {
	const searchId = useId();
	const { pushToast } = useUIStore();
	const deleteVenueMutation = useDeleteVenue();

	const [search, setSearch] = useState("");
	const [page, setPage] = useState(0);
	const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);

	const venueListQuery = useVenueList({
		search: search.trim() ? search.trim() : undefined,
		limit: PAGE_SIZE,
		offset: page * PAGE_SIZE,
	});

	const venues = venueListQuery.data?.data ?? [];
	const pagination = venueListQuery.data?.pagination;
	const totalPages = pagination
		? Math.max(1, Math.ceil(pagination.count / pagination.limit))
		: 1;

	const handleDeleteVenue = (venue: Venue) => {
		if (!window.confirm(`Delete ${venue.name}?`)) {
			return;
		}

		deleteVenueMutation.mutate(venue.id, {
			onSuccess: () => {
				pushToast({
					id: crypto.randomUUID(),
					title: "Venue deleted",
					description: "The venue has been deleted successfully.",
					intent: "success",
				});
			},
			onError: (error) => {
				const axiosError = error as AxiosError<ApiErrorResponse>;
				pushToast({
					id: crypto.randomUUID(),
					title: "Failed to delete venue",
					description:
						axiosError.response?.data && "message" in axiosError.response.data
							? axiosError.response.data.message
							: "Please try again.",
					intent: "danger",
				});
			},
		});
	};

	return (
		<div className="space-y-6">
			<header className="flex flex-col gap-4 rounded-2xl border border-slate-800/60 bg-slate-900/60 p-6 shadow-lg shadow-slate-950/30 md:flex-row md:items-center md:justify-between">
				<div>
					<p className="text-xs uppercase tracking-wide text-slate-500">
						Venues
					</p>
					<h1 className="text-2xl font-semibold text-white">Venue catalog</h1>
					<p className="mt-1 text-sm text-slate-400">
						View and manage venues available for campaign targeting.
					</p>
				</div>
				<div className="flex items-center gap-3">
					<Link
						to="/dashboard/venues/new"
						className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
					>
						Add venue
					</Link>
				</div>
			</header>

			<section className="rounded-2xl border border-slate-800/60 bg-slate-950/60 p-6 shadow-lg shadow-slate-950/20 space-y-4">
				<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
					<div className="flex-1 space-y-2">
						<label
							htmlFor={searchId}
							className="text-xs tracking-wide text-slate-500"
						>
							Search
						</label>
						<div className="flex-1 space-y-2 ">
							<div className="flex items-center gap-4">
								<input
									id={searchId}
									value={search}
									onChange={(e) => {
										setSearch(e.target.value);
										setPage(0);
									}}
									placeholder="Search venues by name, city, or country…"
									className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
								/>
								{pagination ? (
									<span className="text-xs text-slate-500 text-nowrap">
										Showing {venues.length} of {pagination.count}
									</span>
								) : (
									<span>{venues.length} venues</span>
								)}
							</div>
						</div>
					</div>
				</div>

				<div className="overflow-hidden rounded-xl border border-slate-800/70 bg-slate-950/50">
					<table className="min-w-full text-left text-sm text-slate-300">
						<thead className="bg-slate-900/70 text-xs uppercase tracking-wide text-slate-500">
							<tr>
								<th className="px-4 py-3">Name</th>
								<th className="px-4 py-3">City</th>
								<th className="px-4 py-3">Country</th>
								<th className="px-4 py-3">Timezone</th>
								<th className="px-4 py-3 text-right">Actions</th>
							</tr>
						</thead>
						<tbody>
							{venues.map((venue) => (
								<tr key={venue.id} className="border-t border-slate-800/70 hover:bg-slate-900/30 transition">
									<td className="px-4 py-3 text-white font-medium">
										<button
											type="button"
											onClick={() => setSelectedVenue(venue)}
											className="text-left hover:text-cyan-300 hover:underline transition cursor-pointer"
										>
											{venue.name}
										</button>
									</td>
									<td className="px-4 py-3">{venue.city ?? "—"}</td>
									<td className="px-4 py-3">{venue.countryCode ?? "—"}</td>
									<td className="px-4 py-3">{venue.timezone ?? "—"}</td>
									<td className="px-4 py-3">
										<div className="flex items-center justify-end gap-3">
											{/* Future: add edit route */}
											<button
												type="button"
												onClick={() => handleDeleteVenue(venue)}
												disabled={deleteVenueMutation.isPending}
												className="text-xs text-red-300 hover:underline disabled:opacity-50"
											>
												Delete
											</button>
										</div>
									</td>
								</tr>
							))}
							{venues.length === 0 ? (
								<tr>
									<td
										colSpan={5}
										className="px-4 py-10 text-center text-slate-500"
									>
										{venueListQuery.isLoading
											? "Loading venues…"
											: "No venues found. Add a venue to get started."}
									</td>
								</tr>
							) : null}
						</tbody>
					</table>
				</div>

				{totalPages > 1 ? (
					<div className="flex items-center justify-end gap-3 text-xs text-slate-400">
						<button
							type="button"
							onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
							disabled={page === 0}
							className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 transition hover:border-slate-600 disabled:opacity-50"
						>
							Previous
						</button>
						<span>
							Page {page + 1} of {totalPages}
						</span>
						<button
							type="button"
							onClick={() =>
								setPage((prev) => Math.min(prev + 1, totalPages - 1))
							}
							disabled={page >= totalPages - 1}
							className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 transition hover:border-slate-600 disabled:opacity-50"
						>
							Next
						</button>
					</div>
				) : null}
			</section>

			{selectedVenue && (
				<VenueDetailsModal
					venue={selectedVenue}
					onClose={() => setSelectedVenue(null)}
				/>
			)}
		</div>
	);
}
