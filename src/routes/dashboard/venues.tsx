import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { AxiosError } from "axios";
import { addDays, subDays } from "date-fns";
import { useId, useMemo, useState } from "react";
import { venuesApi } from "../../api/modules/venues";
import type {
	ApiErrorResponse,
	CreateVenueRequest,
	NormalizedVenue,
	UpdateVenueRequest,
	VenuePrimaryType,
} from "../../api/types";
import { useEventSummary } from "../../hooks/useAnalytics";
import {
	useDeleteVenue,
	useUpdateVenue,
	useVenueList,
} from "../../hooks/useVenues";
import { useAuthStore } from "../../state/authStore";
import { useUIStore } from "../../state/uiStore";

const TIMEZONE_OPTIONS = [
	{ value: "", label: "Select timezone..." },
	{ value: "America/New_York", label: "America/New_York (Eastern Time)" },
	{ value: "America/Chicago", label: "America/Chicago (Central Time)" },
	{ value: "America/Denver", label: "America/Denver (Mountain Time)" },
	{ value: "America/Los_Angeles", label: "America/Los_Angeles (Pacific Time)" },
	{
		value: "America/Phoenix",
		label: "America/Phoenix (Mountain Time - No DST)",
	},
	{ value: "America/Anchorage", label: "America/Anchorage (Alaska Time)" },
	{ value: "Pacific/Honolulu", label: "Pacific/Honolulu (Hawaii Time)" },
	{ value: "America/Toronto", label: "America/Toronto (Eastern Time)" },
	{ value: "America/Vancouver", label: "America/Vancouver (Pacific Time)" },
	{ value: "America/Mexico_City", label: "America/Mexico_City (Central Time)" },
	{ value: "America/Sao_Paulo", label: "America/Sao_Paulo (Brasilia Time)" },
	{
		value: "America/Buenos_Aires",
		label: "America/Buenos_Aires (Argentina Time)",
	},
	{ value: "Europe/London", label: "Europe/London (GMT/BST)" },
	{ value: "Europe/Paris", label: "Europe/Paris (CET/CEST)" },
	{ value: "Europe/Berlin", label: "Europe/Berlin (CET/CEST)" },
	{ value: "Europe/Rome", label: "Europe/Rome (CET/CEST)" },
	{ value: "Europe/Madrid", label: "Europe/Madrid (CET/CEST)" },
	{ value: "Europe/Amsterdam", label: "Europe/Amsterdam (CET/CEST)" },
	{ value: "Europe/Dublin", label: "Europe/Dublin (GMT/IST)" },
	{ value: "Europe/Athens", label: "Europe/Athens (EET/EEST)" },
	{ value: "Europe/Moscow", label: "Europe/Moscow (MSK)" },
	{ value: "Asia/Dubai", label: "Asia/Dubai (Gulf Standard Time)" },
	{ value: "Asia/Kolkata", label: "Asia/Kolkata (India Standard Time)" },
	{ value: "Asia/Singapore", label: "Asia/Singapore (Singapore Time)" },
	{ value: "Asia/Hong_Kong", label: "Asia/Hong_Kong (Hong Kong Time)" },
	{ value: "Asia/Tokyo", label: "Asia/Tokyo (Japan Standard Time)" },
	{ value: "Asia/Seoul", label: "Asia/Seoul (Korea Standard Time)" },
	{ value: "Asia/Shanghai", label: "Asia/Shanghai (China Standard Time)" },
	{ value: "Asia/Bangkok", label: "Asia/Bangkok (Indochina Time)" },
	{ value: "Asia/Jakarta", label: "Asia/Jakarta (Western Indonesia Time)" },
	{ value: "Australia/Sydney", label: "Australia/Sydney (AEDT/AEST)" },
	{ value: "Australia/Melbourne", label: "Australia/Melbourne (AEDT/AEST)" },
	{ value: "Australia/Brisbane", label: "Australia/Brisbane (AEST)" },
	{ value: "Australia/Perth", label: "Australia/Perth (AWST)" },
	{ value: "Pacific/Auckland", label: "Pacific/Auckland (NZDT/NZST)" },
	{ value: "Africa/Lagos", label: "Africa/Lagos (West Africa Time)" },
	{
		value: "Africa/Johannesburg",
		label: "Africa/Johannesburg (South Africa Standard Time)",
	},
	{ value: "Africa/Cairo", label: "Africa/Cairo (EET/EEST)" },
];

const RANGE_OPTIONS = [
	{ label: "Last 7 days", value: 7 },
	{ label: "Last 14 days", value: 14 },
	{ label: "Last 30 days", value: 30 },
] as const;

const ENGAGEMENT_TYPES = [
	"notification_sent",
	"notification_opened",
	"click",
	"offer_viewed",
	"offer_redeemed",
] as const;

const PAGE_SIZE = 20;

const EMPTY_VENUE_FORM: VenueFormState = {
	name: "",
	slug: "",
	description: "",
	addressLine1: "",
	addressLine2: "",
	city: "",
	region: "",
	postalCode: "",
	countryCode: "",
	timezone: "",
	latitude: "",
	longitude: "",
	externalId: "",
	status: "active",
};

type VenueFormState = {
	name: string;
	slug: string;
	description: string;
	addressLine1: string;
	addressLine2: string;
	city: string;
	region: string;
	postalCode: string;
	countryCode: string;
	timezone: string;
	latitude: string;
	longitude: string;
	externalId: string;
	status: "draft" | "active" | "inactive";
};

type PlacesFormState = {
	textQuery: string;
	latitude: string;
	longitude: string;
	radiusMeters: string;
	pageSize: string;
};

export const Route = createFileRoute("/dashboard/venues")({
	component: VenuesRoute,
});

function VenuesRoute() {
	const venueInputId = useId();
	const [venueId, setVenueId] = useState("");
	const [submittedVenueId, setSubmittedVenueId] = useState<string | undefined>(
		undefined,
	);
	const [range, setRange] = useState<(typeof RANGE_OPTIONS)[number]>(
		RANGE_OPTIONS[0],
	);

	const [venueSearch, setVenueSearch] = useState("");
	const [page, setPage] = useState(0);
	const { user } = useAuthStore();
	const { pushToast } = useUIStore();
	const queryClient = useQueryClient();

	const [filters, setFilters] = useState<{
		primaryType?: VenuePrimaryType[];
		city?: string;
		region?: string;
		countryCode?: string;
		status?: "draft" | "active" | "inactive";
		isShared?: boolean;
	}>({});

	const [editingVenue, setEditingVenue] = useState<string | null>(null);

	const [createForm, setCreateForm] =
		useState<VenueFormState>(EMPTY_VENUE_FORM);
	const [placesForm, setPlacesForm] = useState<PlacesFormState>({
		textQuery: "",
		latitude: "",
		longitude: "",
		radiusMeters: "",
		pageSize: "5",
	});
	const [placesResults, setPlacesResults] = useState<NormalizedVenue[]>([]);
	const [selectedPreview, setSelectedPreview] = useState<
		Record<string, boolean>
	>({});
	const placesId = useId();
	const createId = useId();
	const filtersId = useId();

	const { startAt, endAt } = useMemo(() => {
		const end = new Date();
		const start = subDays(end, range.value);
		return {
			startAt: start.toISOString(),
			endAt: addDays(end, 1).toISOString(),
		};
	}, [range.value]);

	const summaryQuery = useEventSummary({
		startAt,
		endAt,
		venueId: submittedVenueId,
	});

	const venueListQuery = useVenueList({
		search: venueSearch || undefined,
		limit: PAGE_SIZE,
		offset: page * PAGE_SIZE,
		primaryType: filters.primaryType,
		city: filters.city,
		region: filters.region,
		countryCode: filters.countryCode,
		isShared: filters.isShared,
		...(filters.status ? { status: filters.status } : {}),
	});

	const createVenueMutation = useMutation({
		mutationFn: (payload: CreateVenueRequest) => venuesApi.create(payload),
		onSuccess: () => {
			setCreateForm(EMPTY_VENUE_FORM);
			setPlacesResults([]);
			queryClient.invalidateQueries({ queryKey: ["venues"] });
		},
	});

	const deleteVenueMutation = useDeleteVenue();

	const placesPreviewMutation = useMutation({
		mutationFn: () => {
			if (!placesForm.textQuery.trim()) {
				return Promise.resolve({ raw: [], venues: [] });
			}
			return venuesApi.placesPreview({
				textQuery: placesForm.textQuery.trim(),
				pageSize: placesForm.pageSize ? Number(placesForm.pageSize) : undefined,
				latitude: placesForm.latitude ? Number(placesForm.latitude) : undefined,
				longitude: placesForm.longitude
					? Number(placesForm.longitude)
					: undefined,
				radiusMeters: placesForm.radiusMeters
					? Number(placesForm.radiusMeters)
					: undefined,
			});
		},
		onSuccess: (result) => {
			setPlacesResults(result.venues ?? []);
			setSelectedPreview({});
		},
	});

	const metrics = useMemo(() => {
		const data = summaryQuery.data?.data ?? [];
		return data
			.filter((item) =>
				ENGAGEMENT_TYPES.includes(
					item.eventType as (typeof ENGAGEMENT_TYPES)[number],
				),
			)
			.map((item) => ({
				eventType: item.eventType,
				label: labelForEvent(item.eventType),
				count: item.count,
			}));
	}, [summaryQuery.data]);

	const total = metrics.reduce((sum, item) => sum + item.count, 0);

	const venues = venueListQuery.data?.data ?? [];
	const pagination = venueListQuery.data?.pagination;
	const totalPages = pagination
		? Math.ceil(pagination.count / pagination.limit)
		: undefined;

	const handleVenueSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
		setVenueSearch(event.target.value);
		setPage(0);
	};

	const handleCreateChange = (
		event: React.ChangeEvent<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>,
	) => {
		const { name, value } = event.target;
		setCreateForm((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleCreateSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const payload: CreateVenueRequest = {
			name: createForm.name,
			slug: createForm.slug || undefined,
			description: createForm.description || undefined,
			addressLine1: createForm.addressLine1 || undefined,
			addressLine2: createForm.addressLine2 || undefined,
			city: createForm.city || undefined,
			region: createForm.region || undefined,
			postalCode: createForm.postalCode || undefined,
			countryCode: createForm.countryCode || undefined,
			timezone: createForm.timezone || undefined,
			latitude: createForm.latitude ? Number(createForm.latitude) : undefined,
			longitude: createForm.longitude
				? Number(createForm.longitude)
				: undefined,
			externalId: createForm.externalId || undefined,
			status: createForm.status,
		};
		createVenueMutation.mutate(payload);
	};

	const handlePlacesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = event.target;
		setPlacesForm((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handlePlacesSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		placesPreviewMutation.mutate();
	};

	const importSelectedPlaces = () => {
		if (!user?.tenantId) {
			return;
		}
		const selectedRecords = placesResults.filter(
			(record) => selectedPreview[record.slug],
		);
		if (selectedRecords.length === 0) {
			return;
		}
		createVenueMutation.mutate({
			name: selectedRecords[0].name,
			slug: selectedRecords[0].slug,
			description: selectedRecords[0].description,
			addressLine1: selectedRecords[0].addressLine1,
			addressLine2: selectedRecords[0].addressLine2,
			city: selectedRecords[0].city,
			region: selectedRecords[0].region,
			postalCode: selectedRecords[0].postalCode,
			countryCode: selectedRecords[0].countryCode,
			timezone: selectedRecords[0].timezone,
			latitude: selectedRecords[0].latitude,
			longitude: selectedRecords[0].longitude,
			externalId: selectedRecords[0].externalId,
			status: "active",
		});
	};

	const applyNormalizedVenue = (record: NormalizedVenue) => {
		setCreateForm((prev) => ({
			...prev,
			name: record.name ?? prev.name,
			slug: record.slug ?? prev.slug,
			description: record.description ?? prev.description,
			addressLine1: record.addressLine1 ?? prev.addressLine1,
			addressLine2: record.addressLine2 ?? prev.addressLine2,
			city: record.city ?? prev.city,
			region: record.region ?? prev.region,
			postalCode: record.postalCode ?? prev.postalCode,
			countryCode: record.countryCode ?? prev.countryCode,
			timezone: record.timezone ?? prev.timezone,
			latitude: record.latitude ? String(record.latitude) : prev.latitude,
			longitude: record.longitude ? String(record.longitude) : prev.longitude,
			externalId: record.externalId ?? prev.externalId,
		}));
	};

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const trimmed = venueId.trim();
		setSubmittedVenueId(trimmed.length > 0 ? trimmed : undefined);
	};

	return (
		<div className="space-y-6">
			<section className="card-surface p-6">
				<header className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
					<div>
						<p className="text-xs uppercase tracking-wide text-slate-500">
							Google places
						</p>
						<h2 className="text-lg font-semibold text-white">Search places</h2>
						<p className="text-sm text-slate-400">
							Search Google Places and prefill venue details before saving to
							the tenant catalog.
						</p>
					</div>
				</header>
				<form
					onSubmit={handlePlacesSubmit}
					className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
				>
					<div className="space-y-2">
						<label
							className="text-xs uppercase tracking-wide text-slate-500"
							htmlFor={`${placesId}-textQuery`}
						>
							Text query
						</label>
						<input
							id={`${placesId}-textQuery`}
							name="textQuery"
							value={placesForm.textQuery}
							onChange={handlePlacesChange}
							required
							placeholder="E.g. Guinness bar Lagos"
							className="input"
						/>
					</div>
					<div className="space-y-2">
						<label
							className="text-xs uppercase tracking-wide text-slate-500"
							htmlFor={`${placesId}-latitude`}
						>
							Latitude (optional)
						</label>
						<input
							id={`${placesId}-latitude`}
							name="latitude"
							value={placesForm.latitude}
							onChange={handlePlacesChange}
							placeholder="6.5244"
							className="input"
						/>
					</div>
					<div className="space-y-2">
						<label
							className="text-xs uppercase tracking-wide text-slate-500"
							htmlFor={`${placesId}-longitude`}
						>
							Longitude (optional)
						</label>
						<input
							id={`${placesId}-longitude`}
							name="longitude"
							value={placesForm.longitude}
							onChange={handlePlacesChange}
							placeholder="3.3792"
							className="input"
						/>
					</div>
					<div className="space-y-2">
						<label
							className="text-xs uppercase tracking-wide text-slate-500"
							htmlFor={`${placesId}-radius`}
						>
							Radius (m)
						</label>
						<input
							id={`${placesId}-radius`}
							name="radiusMeters"
							value={placesForm.radiusMeters}
							onChange={handlePlacesChange}
							placeholder="500"
							className="input"
						/>
					</div>
					<div className="space-y-2">
						<label
							className="text-xs uppercase tracking-wide text-slate-500"
							htmlFor={`${placesId}-pageSize`}
						>
							Results
						</label>
						<input
							id={`${placesId}-pageSize`}
							name="pageSize"
							value={placesForm.pageSize}
							onChange={handlePlacesChange}
							className="input"
						/>
					</div>
					<div className="flex items-end">
						<button
							type="submit"
							disabled={placesPreviewMutation.isPending}
							className="btn-primary cursor-pointer"
						>
							{placesPreviewMutation.isPending ? "Searching…" : "Search places"}
						</button>
					</div>
				</form>
				{placesResults.length > 0 ? (
					<div className="mt-6 grid gap-4 md:grid-cols-2">
						{placesResults.map((place) => (
							<article
								key={`${place.externalId}-${place.slug}`}
								className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/60 p-4"
							>
								<div className="flex items-start gap-3">
									<input
										type="checkbox"
										checked={Boolean(selectedPreview[place.slug])}
										onChange={(event) =>
											setSelectedPreview((prev) => ({
												...prev,
												[place.slug]: event.target.checked,
											}))
										}
										className="mt-0.5 h-4 w-4 rounded border border-slate-600 bg-slate-900 text-cyan-500 focus:ring-cyan-500/40"
									/>
									<div>
										<h3 className="text-sm font-semibold text-white">
											{place.name}
										</h3>
										<p className="text-xs text-slate-400">
											{place.addressLine1}
										</p>
										<p className="text-xs text-slate-500">
											{place.city}, {place.region} {place.postalCode}
										</p>
										<button
											type="button"
											className="btn-outline mt-2 text-xs"
											onClick={() => applyNormalizedVenue(place)}
										>
											Prefill form
										</button>
									</div>
								</div>
							</article>
						))}
						<button
							type="button"
							onClick={importSelectedPlaces}
							disabled={
								Object.values(selectedPreview).every((checked) => !checked) ||
								createVenueMutation.isPending
							}
							className="btn-primary text-xs md:col-span-2"
						>
							{createVenueMutation.isPending
								? "Saving…"
								: "Save selected venue"}
						</button>
					</div>
				) : null}
			</section>

			<section className="card-surface p-6">
				<header className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
					<div>
						<p className="text-xs uppercase tracking-wide text-slate-500">
							Create venue
						</p>
						<h2 className="text-lg font-semibold text-white">
							Add a new location
						</h2>
						<p className="text-sm text-slate-400">
							Save venues to your tenant catalog. These will be available when
							configuring campaigns.
						</p>
					</div>
				</header>
				<form
					onSubmit={handleCreateSubmit}
					className="grid gap-4 md:grid-cols-2"
				>
					<Field label="Name" id={`${createId}-name`} required>
						<input
							id={`${createId}-name`}
							name="name"
							value={createForm.name}
							onChange={handleCreateChange}
							required
							className="input"
						/>
					</Field>
					<Field label="Slug" id={`${createId}-slug`}>
						<input
							id={`${createId}-slug`}
							name="slug"
							value={createForm.slug}
							onChange={handleCreateChange}
							className="input"
						/>
					</Field>
					<Field label="Description" id={`${createId}-description`} full>
						<textarea
							id={`${createId}-description`}
							name="description"
							value={createForm.description}
							onChange={handleCreateChange}
							rows={3}
							className="input"
						/>
					</Field>
					<Field label="Address line 1" id={`${createId}-address1`}>
						<input
							id={`${createId}-address1`}
							name="addressLine1"
							value={createForm.addressLine1}
							onChange={handleCreateChange}
							className="input"
						/>
					</Field>
					<Field label="Address line 2" id={`${createId}-address2`}>
						<input
							id={`${createId}-address2`}
							name="addressLine2"
							value={createForm.addressLine2}
							onChange={handleCreateChange}
							className="input"
						/>
					</Field>
					<Field label="City" id={`${createId}-city`}>
						<input
							id={`${createId}-city`}
							name="city"
							value={createForm.city}
							onChange={handleCreateChange}
							className="input"
						/>
					</Field>
					<Field label="Region" id={`${createId}-region`}>
						<input
							id={`${createId}-region`}
							name="region"
							value={createForm.region}
							onChange={handleCreateChange}
							className="input"
						/>
					</Field>
					<Field label="Postal code" id={`${createId}-postal`}>
						<input
							id={`${createId}-postal`}
							name="postalCode"
							value={createForm.postalCode}
							onChange={handleCreateChange}
							className="input"
						/>
					</Field>
					<Field label="Country" id={`${createId}-country`}>
						<input
							id={`${createId}-country`}
							name="countryCode"
							value={createForm.countryCode}
							onChange={handleCreateChange}
							className="input"
						/>
					</Field>
					<Field label="Timezone" id={`${createId}-timezone`}>
						<select
							id={`${createId}-timezone`}
							name="timezone"
							value={createForm.timezone}
							onChange={handleCreateChange}
							className="input"
						>
							{TIMEZONE_OPTIONS.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
					</Field>
					<Field label="Latitude" id={`${createId}-latitude`}>
						<input
							id={`${createId}-latitude`}
							name="latitude"
							value={createForm.latitude}
							onChange={handleCreateChange}
							className="input"
						/>
					</Field>
					<Field label="Longitude" id={`${createId}-longitude`}>
						<input
							id={`${createId}-longitude`}
							name="longitude"
							value={createForm.longitude}
							onChange={handleCreateChange}
							className="input"
						/>
					</Field>
					<Field label="External ID" id={`${createId}-external`}>
						<input
							id={`${createId}-external`}
							name="externalId"
							value={createForm.externalId}
							onChange={handleCreateChange}
							className="input"
						/>
					</Field>
					<Field label="Status" id={`${createId}-status`}>
						<select
							id={`${createId}-status`}
							name="status"
							value={createForm.status}
							onChange={handleCreateChange}
							className="input"
						>
							<option value="draft">Draft</option>
							<option value="active">Active</option>
							<option value="inactive">Inactive</option>
						</select>
					</Field>
					<div className="md:col-span-2">
						<button
							type="submit"
							disabled={createVenueMutation.isPending}
							className="btn-primary"
						>
							{createVenueMutation.isPending ? "Saving…" : "Create venue"}
						</button>
					</div>
				</form>
			</section>

			<section className="card-surface p-6">
				<header className="mb-4 flex flex-col gap-4">
					<div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
						<div>
							<p className="text-xs uppercase tracking-wide text-slate-500">
								Venue catalog
							</p>
							<h2 className="text-lg font-semibold text-white">
								Stored venues
							</h2>
						</div>
						<input
							value={venueSearch}
							onChange={handleVenueSearch}
							placeholder="Search venues by name"
							className="input max-w-xs"
						/>
					</div>
					<div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
						<div>
							<label
								htmlFor={`${filtersId}-primaryType`}
								className="text-xs uppercase tracking-wide text-slate-500 mb-1 block"
							>
								Primary type
							</label>
							<select
								id={`${filtersId}-primaryType`}
								value={filters.primaryType?.[0] || ""}
								onChange={(e) =>
									setFilters((prev) => ({
										...prev,
										primaryType: e.target.value
											? [e.target.value as VenuePrimaryType]
											: undefined,
									}))
								}
								className="input"
							>
								<option value="">All</option>
								{[
									"hotel",
									"restaurant",
									"bar",
									"cafe",
									"mall",
									"retail",
									"entertainment",
									"other",
								].map((type) => (
									<option key={type} value={type}>
										{type.charAt(0).toUpperCase() + type.slice(1)}
									</option>
								))}
							</select>
						</div>
						<div>
							<label
								htmlFor={`${filtersId}-city`}
								className="text-xs uppercase tracking-wide text-slate-500 mb-1 block"
							>
								City
							</label>
							<input
								id={`${filtersId}-city`}
								value={filters.city || ""}
								onChange={(e) =>
									setFilters((prev) => ({
										...prev,
										city: e.target.value || undefined,
									}))
								}
								placeholder="Filter by city"
								className="input"
							/>
						</div>
						<div>
							<label
								htmlFor={`${filtersId}-countryCode`}
								className="text-xs uppercase tracking-wide text-slate-500 mb-1 block"
							>
								Country code
							</label>
							<input
								id={`${filtersId}-countryCode`}
								value={filters.countryCode || ""}
								onChange={(e) =>
									setFilters((prev) => ({
										...prev,
										countryCode: e.target.value || undefined,
									}))
								}
								placeholder="US, GB, etc."
								maxLength={2}
								className="input"
							/>
						</div>
						<div>
							<label
								htmlFor={`${filtersId}-status`}
								className="text-xs uppercase tracking-wide text-slate-500 mb-1 block"
							>
								Status
							</label>
							<select
								id={`${filtersId}-status`}
								value={filters.status || ""}
								onChange={(e) =>
									setFilters((prev) => ({
										...prev,
										status: e.target.value
											? (e.target.value as typeof filters.status)
											: undefined,
									}))
								}
								className="input"
							>
								<option value="">All</option>
								<option value="active">Active</option>
								<option value="draft">Draft</option>
								<option value="inactive">Inactive</option>
							</select>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<label className="flex items-center gap-2 cursor-pointer">
							<input
								type="checkbox"
								checked={filters.isShared ?? false}
								onChange={(e) =>
									setFilters((prev) => ({
										...prev,
										isShared: e.target.checked || undefined,
									}))
								}
								className="h-4 w-4 rounded border border-slate-600 bg-slate-900 text-cyan-500 focus:ring-cyan-500/40"
							/>
							<span className="text-xs text-slate-300">
								Include shared venues
							</span>
						</label>
						<button
							type="button"
							onClick={() => setFilters({})}
							className="text-xs text-slate-400 hover:text-slate-200"
						>
							Clear filters
						</button>
					</div>
				</header>
				<div className="overflow-hidden rounded-xl border border-slate-800/70 bg-slate-950/50">
					<table className="min-w-full text-left text-sm text-slate-300">
						<thead className="bg-slate-900/70 text-xs uppercase tracking-wide text-slate-500">
							<tr>
								<th className="px-4 py-3">Name</th>
								<th className="px-4 py-3">City</th>
								<th className="px-4 py-3">Country</th>
								<th className="px-4 py-3">Status</th>
								<th className="px-4 py-3">Actions</th>
							</tr>
						</thead>
						<tbody>
							{venues.map((venue) => (
								<tr key={venue.id} className="border-t border-slate-800/70">
									<td className="px-4 py-3 text-white">{venue.name}</td>
									<td className="px-4 py-3">{venue.city ?? "—"}</td>
									<td className="px-4 py-3">{venue.countryCode ?? "—"}</td>
									<td className="px-4 py-3 capitalize">
										{venue.status ?? "—"}
									</td>
									<td className="px-4 py-3">
										<div className="flex items-center gap-2">
											<button
												type="button"
												onClick={() => setEditingVenue(venue.id)}
												className="text-xs text-cyan-300 hover:underline"
											>
												Edit
											</button>
											<button
												type="button"
												onClick={() => {
													if (window.confirm(`Delete ${venue.name}?`)) {
														deleteVenueMutation.mutate(venue.id, {
															onSuccess: () => {
																pushToast({
																	id: crypto.randomUUID(),
																	title: "Venue deleted",
																	description:
																		"The venue has been deleted successfully.",
																	intent: "success",
																});
															},
															onError: (error) => {
																const axiosError =
																	error as AxiosError<ApiErrorResponse>;
																pushToast({
																	id: crypto.randomUUID(),
																	title: "Failed to delete venue",
																	description:
																		axiosError.response?.data &&
																		"message" in axiosError.response.data
																			? axiosError.response.data.message
																			: "Please try again.",
																	intent: "danger",
																});
															},
														});
													}
												}}
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
										className="px-4 py-6 text-center text-slate-500"
									>
										{venueListQuery.isLoading
											? "Loading venues…"
											: "No venues found. Try adjusting your search."}
									</td>
								</tr>
							) : null}
						</tbody>
					</table>
				</div>
				{totalPages && totalPages > 1 ? (
					<div className="mt-4 flex items-center justify-end gap-3 text-xs text-slate-400">
						<button
							type="button"
							onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
							disabled={page === 0}
							className="btn-outline"
						>
							Previous
						</button>
						<span>
							Page {page + 1} of {totalPages}
						</span>
						<button
							type="button"
							onClick={() =>
								setPage((prev) =>
									totalPages ? Math.min(prev + 1, totalPages - 1) : prev + 1,
								)
							}
							disabled={totalPages ? page >= totalPages - 1 : false}
							className="btn-outline"
						>
							Next
						</button>
					</div>
				) : null}
			</section>

			<header className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-6 shadow-lg shadow-slate-950/30">
				<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
					<div>
						<p className="text-xs uppercase tracking-wide text-slate-500">
							Venue analytics
						</p>
						<h1 className="text-2xl font-semibold text-white">
							Location performance
						</h1>
						<p className="mt-1 text-sm text-slate-400">
							Evaluate geofence trigger density and offer engagement for
							individual venues.
						</p>
					</div>
					<div className="flex items-center gap-2">
						<span className="text-xs uppercase tracking-wide text-slate-500">
							Range
						</span>
						<select
							value={range.value}
							onChange={(event) => {
								const next = RANGE_OPTIONS.find(
									(option) => option.value === Number(event.target.value),
								);
								if (next) {
									setRange(next);
								}
							}}
							className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
						>
							{RANGE_OPTIONS.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
					</div>
				</div>
			</header>

			<section className="rounded-2xl border border-slate-800/60 bg-slate-950/60 p-6 shadow-lg shadow-slate-950/20">
				<form
					onSubmit={handleSubmit}
					className="flex flex-col gap-4 md:flex-row md:items-end md:gap-6"
				>
					<div className="flex-1 space-y-2">
						<label
							htmlFor={venueInputId}
							className="text-xs uppercase tracking-wide text-slate-500"
						>
							Venue ID
						</label>
						<input
							id={venueInputId}
							value={venueId}
							onChange={(event) => setVenueId(event.target.value)}
							placeholder="Paste a venue identifier"
							className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
						/>
						<p className="text-xs text-slate-500">
							Use HappyHour venue IDs or Google Places IDs ingested through
							`/v1/venues/*` endpoints.
						</p>
					</div>
					<button
						type="submit"
						className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
					>
						Apply filter
					</button>
				</form>
			</section>

			<section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
				<article className="rounded-2xl border border-slate-800/60 bg-slate-950/60 p-6 shadow-lg shadow-slate-950/20">
					<header className="mb-4 flex items-center justify-between">
						<div>
							<h2 className="text-base font-semibold text-white">
								Engagement breakdown
							</h2>
							<p className="text-xs text-slate-500">
								Events recorded{" "}
								{submittedVenueId
									? `for venue ${submittedVenueId}`
									: "across all venues"}
								.
							</p>
						</div>
						{summaryQuery.isFetching ? (
							<span className="text-xs text-slate-500">Refreshing…</span>
						) : null}
					</header>
					{summaryQuery.isError ? (
						<div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs text-red-200">
							Unable to load venue metrics. Check the venue ID and try again.
						</div>
					) : (
						<div className="overflow-hidden rounded-xl border border-slate-800/70 bg-slate-950/50">
							<table className="min-w-full text-left text-sm text-slate-300">
								<thead className="bg-slate-900/70 text-xs uppercase tracking-wide text-slate-500">
									<tr>
										<th className="px-4 py-3">Event type</th>
										<th className="px-4 py-3 text-right">Count</th>
									</tr>
								</thead>
								<tbody>
									{metrics.map((item) => (
										<tr
											key={item.eventType}
											className="border-t border-slate-800/70"
										>
											<td className="px-4 py-3 capitalize">{item.label}</td>
											<td className="px-4 py-3 text-right font-semibold text-white">
												{item.count.toLocaleString()}
											</td>
										</tr>
									))}
									{metrics.length === 0 ? (
										<tr>
											<td
												colSpan={2}
												className="px-4 py-6 text-center text-slate-500"
											>
												{summaryQuery.isLoading
													? "Loading venue metrics…"
													: "No events recorded for this range."}
											</td>
										</tr>
									) : null}
								</tbody>
							</table>
						</div>
					)}
				</article>
				<aside className="space-y-4 rounded-2xl border border-slate-800/60 bg-slate-950/60 p-6 shadow-lg shadow-slate-950/20">
					<header>
						<h2 className="text-base font-semibold text-white">At a glance</h2>
						<p className="text-xs text-slate-500">
							Key venue insights for the selected range.
						</p>
					</header>
					<div className="space-y-3 text-sm text-slate-300">
						<p>
							<span className="text-slate-500">Total events:</span>{" "}
							<span className="font-semibold text-white">
								{summaryQuery.isLoading ? "..." : total.toLocaleString()}
							</span>
						</p>
						<p className="text-xs text-slate-500">
							Venue analytics improve as more HappyHour mobile users opt-in to
							location sharing. Schedule venue-list syncs and Google Places
							ingestion to keep data fresh.
						</p>
					</div>
					<div className="rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-3 text-xs text-slate-400">
						<p className="font-semibold text-slate-200">Next actions</p>
						<ul className="mt-2 list-disc space-y-1 pl-5">
							<li>
								Run `/v1/venues/places-sync` for new neighbourhood launches.
							</li>
							<li>
								Encourage venues to publish HappyHour offers to drive more
								signals.
							</li>
							<li>Add map visualizations to compare venue clusters.</li>
						</ul>
					</div>
				</aside>
			</section>
		</div>
	);
}

function labelForEvent(eventType: string) {
	switch (eventType) {
		case "notification_sent":
			return "Notifications sent";
		case "notification_opened":
			return "Notifications opened";
		case "click":
			return "Clicks";
		case "offer_viewed":
			return "Offer views";
		case "offer_redeemed":
			return "Offer redeems";
		default:
			return eventType;
	}
}

function Field({
	label,
	id,
	children,
	required,
	full,
}: {
	label: string;
	id: string;
	children: React.ReactNode;
	required?: boolean;
	full?: boolean;
}) {
	return (
		<div className={full ? "md:col-span-2 space-y-2" : "space-y-2"}>
			<label
				htmlFor={id}
				className="text-xs uppercase tracking-wide text-slate-500"
			>
				{label}
				{required ? " *" : ""}
			</label>
			{children}
		</div>
	);
}
