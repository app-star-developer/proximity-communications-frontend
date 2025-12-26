import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import type { AxiosError } from "axios";
import { useId, useMemo, useState } from "react";

import { venuesApi } from "../../../api/modules/venues";
import { queryKeys } from "../../../api/queryKeys";
import type {
	ApiErrorResponse,
	CreateVenueRequest,
	NormalizedVenue,
	VenueIngestionResult,
} from "../../../api/types";
import { useUIStore } from "../../../state/uiStore";

type AddVenueMethod = "manual" | "google_places" | "csv";

export const Route = createFileRoute("/dashboard/venues/new")({
	component: AddVenueRoute,
});

function AddVenueRoute() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { pushToast } = useUIStore();

	const [method, setMethod] = useState<AddVenueMethod>("manual");

	const handleSuccess = async (message: string) => {
		pushToast({
			id: crypto.randomUUID(),
			title: "Venue added",
			description: message,
			intent: "success",
		});
		await queryClient.invalidateQueries({ queryKey: queryKeys.venues({}) });
		navigate({ to: "/dashboard/venues" });
	};

	const handleError = (error: unknown, fallback: string) => {
		const axiosError = error as AxiosError<ApiErrorResponse>;
		pushToast({
			id: crypto.randomUUID(),
			title: "Failed to add venue",
			description:
				axiosError.response?.data && "message" in axiosError.response.data
					? axiosError.response.data.message
					: fallback,
			intent: "danger",
		});
	};

	return (
		<div className="space-y-6">
			<header className="flex flex-col gap-3 rounded-2xl border border-slate-800/60 bg-slate-900/60 p-6 shadow-lg shadow-slate-950/30 md:flex-row md:items-center md:justify-between">
				<div>
					<p className="text-xs uppercase tracking-wide text-slate-500">
						Venues
					</p>
					<h1 className="text-2xl font-semibold text-white">Add a venue</h1>
					<p className="mt-1 text-sm text-slate-400">
						Choose how you want to add venues to your catalog.
					</p>
				</div>
				<Link
					to="/dashboard/venues"
					className="text-sm text-slate-400 transition hover:text-slate-100"
				>
					Back to venues
				</Link>
			</header>

			<section className="rounded-2xl border border-slate-800/60 bg-slate-950/60 p-6 shadow-lg shadow-slate-950/20 space-y-6">
				<MethodPicker value={method} onChange={setMethod} />

				{method === "manual" ? (
					<ManualVenueForm onSuccess={handleSuccess} onError={handleError} />
				) : null}

				{method === "google_places" ? (
					<GooglePlacesVenueForm
						onSuccess={handleSuccess}
						onError={handleError}
					/>
				) : null}

				{method === "csv" ? (
					<CsvUploadVenueForm onSuccess={handleSuccess} onError={handleError} />
				) : null}
			</section>
		</div>
	);
}

function MethodPicker({
	value,
	onChange,
}: {
	value: AddVenueMethod;
	onChange: (value: AddVenueMethod) => void;
}) {
	const groupId = useId();

	const options: Array<{
		value: AddVenueMethod;
		title: string;
		description: string;
	}> = [
		{
			value: "manual",
			title: "Manual",
			description: "Enter venue details yourself.",
		},
		{
			value: "google_places",
			title: "Google Places",
			description: "Search and import venue details from Google Places.",
		},
		{
			value: "csv",
			title: "Bulk CSV",
			description: "Upload/paste a CSV to create multiple venues at once.",
		},
	];

	return (
		<div className="space-y-3">
			<div>
				<p className="text-xs uppercase tracking-wide text-slate-500">
					Add method
				</p>
				<p className="mt-1 text-sm text-slate-400">
					Select one option to show the relevant form.
				</p>
			</div>
			<div className="grid gap-3 md:grid-cols-3">
				{options.map((opt) => {
					const checked = value === opt.value;
					return (
						<label
							key={opt.value}
							className={`cursor-pointer rounded-xl border p-4 transition ${
								checked
									? "border-cyan-500/60 bg-cyan-500/10"
									: "border-slate-800/70 bg-slate-950/40 hover:border-slate-700"
							}`}
						>
							<div className="flex items-start gap-3">
								<input
									id={`${groupId}-${opt.value}`}
									type="radio"
									name={`${groupId}-method`}
									checked={checked}
									onChange={() => onChange(opt.value)}
									className="mt-1 h-4 w-4 text-cyan-500 focus:ring-cyan-500/40"
								/>
								<div>
									<div className="text-sm font-semibold text-white">
										{opt.title}
									</div>
									<div className="mt-1 text-xs text-slate-400">
										{opt.description}
									</div>
								</div>
							</div>
						</label>
					);
				})}
			</div>
		</div>
	);
}

function ManualVenueForm({
	onSuccess,
	onError,
}: {
	onSuccess: (message: string) => Promise<void>;
	onError: (error: unknown, fallback: string) => void;
}) {
	const nameId = useId();
	const cityId = useId();
	const countryId = useId();
	const timezoneId = useId();
	const address1Id = useId();
	const ownerEmailId = useId();

	const [formState, setFormState] = useState({
		name: "",
		addressLine1: "",
		city: "",
		countryCode: "",
		timezone: "",
		ownerEmail: "",
	});

	const createMutation = useMutation({
		mutationFn: (payload: CreateVenueRequest) => venuesApi.create(payload),
	});

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormState((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		try {
			const result = await createMutation.mutateAsync({
				name: formState.name.trim(),
				addressLine1: formState.addressLine1.trim() || undefined,
				city: formState.city.trim() || undefined,
				countryCode: formState.countryCode.trim() || undefined,
				timezone: formState.timezone.trim() || undefined,
				ownerEmail: formState.ownerEmail.trim() || undefined,
				status: "active",
			});
			const message = result.ownerCreationInitiated
				? "Venue created successfully. Owner account creation initiated."
				: "Venue created successfully.";
			await onSuccess(message);
		} catch (error) {
			onError(error, "Please check the fields and try again.");
		}
	};

	return (
		<div className="space-y-4">
			<div>
				<h2 className="text-base font-semibold text-white">Manual entry</h2>
				<p className="mt-1 text-xs text-slate-500">
					Minimal fields to get started. You can extend this later.
				</p>
			</div>

			<form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
				<div className="space-y-2 md:col-span-2">
					<label
						htmlFor={nameId}
						className="text-xs uppercase tracking-wide text-slate-500"
					>
						Name *
					</label>
					<input
						id={nameId}
						name="name"
						value={formState.name}
						onChange={handleChange}
						required
						className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
						placeholder="e.g. Guinness Bar Lagos"
					/>
				</div>

				<div className="space-y-2 md:col-span-2">
					<label
						htmlFor={address1Id}
						className="text-xs uppercase tracking-wide text-slate-500"
					>
						Address line 1 (optional)
					</label>
					<input
						id={address1Id}
						name="addressLine1"
						value={formState.addressLine1}
						onChange={handleChange}
						className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
						placeholder="123 Main St"
					/>
				</div>

				<div className="space-y-2">
					<label
						htmlFor={cityId}
						className="text-xs uppercase tracking-wide text-slate-500"
					>
						City (optional)
					</label>
					<input
						id={cityId}
						name="city"
						value={formState.city}
						onChange={handleChange}
						className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
						placeholder="Lagos"
					/>
				</div>

				<div className="space-y-2">
					<label
						htmlFor={countryId}
						className="text-xs uppercase tracking-wide text-slate-500"
					>
						Country code (optional)
					</label>
					<input
						id={countryId}
						name="countryCode"
						value={formState.countryCode}
						onChange={handleChange}
						className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
						placeholder="NG"
						maxLength={2}
					/>
				</div>

				<div className="space-y-2 md:col-span-2">
					<label
						htmlFor={timezoneId}
						className="text-xs uppercase tracking-wide text-slate-500"
					>
						Timezone (optional)
					</label>
					<input
						id={timezoneId}
						name="timezone"
						value={formState.timezone}
						onChange={handleChange}
						className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
						placeholder="Africa/Lagos"
					/>
				</div>

				<div className="space-y-2 md:col-span-2">
					<label
						htmlFor={ownerEmailId}
						className="text-xs uppercase tracking-wide text-slate-500"
					>
						Owner Email (optional)
					</label>
					<input
						id={ownerEmailId}
						name="ownerEmail"
						type="email"
						value={formState.ownerEmail}
						onChange={handleChange}
						className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
						placeholder="owner@venue.com"
					/>
					<p className="text-xs text-slate-500">
						If provided, a venue owner account will be created automatically with an initial password sent via email.
					</p>
				</div>

				<div className="md:col-span-2 flex items-center justify-end gap-3 pt-2">
					<button
						type="submit"
						disabled={createMutation.isPending}
						className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 disabled:cursor-not-allowed disabled:bg-cyan-500/50"
					>
						{createMutation.isPending ? "Creating…" : "Create venue"}
					</button>
				</div>
			</form>
		</div>
	);
}

function GooglePlacesVenueForm({
	onSuccess,
	onError,
}: {
	onSuccess: (message: string) => Promise<void>;
	onError: (error: unknown, fallback: string) => void;
}) {
	const queryId = useId();
	const [textQuery, setTextQuery] = useState("");
	const [results, setResults] = useState<NormalizedVenue[]>([]);
	const [selected, setSelected] = useState<Record<string, boolean>>({});

	const previewMutation = useMutation({
		mutationFn: () => {
			return venuesApi.placesPreview({
				textQuery: textQuery.trim(),
				pageSize: 10,
			});
		},
		onSuccess: (data) => {
			setResults(data.venues ?? []);
			setSelected({});
		},
	});

	const importMutation = useMutation({
		mutationFn: async (venues: NormalizedVenue[]) => {
			// Create sequentially to avoid hammering API and simplify error handling
			const created: string[] = [];
			for (const v of venues) {
				const payload: CreateVenueRequest = {
					name: v.name,
					slug: v.slug || undefined,
					description: v.description || undefined,
					addressLine1: v.addressLine1 || undefined,
					addressLine2: v.addressLine2 || undefined,
					city: v.city || undefined,
					region: v.region || undefined,
					postalCode: v.postalCode || undefined,
					countryCode: v.countryCode || undefined,
					timezone: v.timezone || undefined,
					latitude: v.latitude ?? undefined,
					longitude: v.longitude ?? undefined,
					externalId: v.externalId || undefined,
					status: "active",
					metadata: v.metadata ?? undefined,
					// Extract ownerEmail from metadata if present
					ownerEmail:
						(v.metadata?.email as string) ||
						(v.metadata?.ownerEmail as string) ||
						undefined,
				};
				await venuesApi.create(payload);
				created.push(v.name);
			}
			return created.length;
		},
	});

	const selectedVenues = useMemo(() => {
		return results.filter((r) => selected[r.slug]);
	}, [results, selected]);

	const handleImport = async () => {
		if (selectedVenues.length === 0) return;
		try {
			const createdCount = await importMutation.mutateAsync(selectedVenues);
			await onSuccess(`${createdCount} venue(s) imported successfully.`);
		} catch (error) {
			onError(error, "Unable to import venues. Please try again.");
		}
	};

	return (
		<div className="space-y-4">
			<div>
				<h2 className="text-base font-semibold text-white">Google Places</h2>
				<p className="mt-1 text-xs text-slate-500">
					Search and import venues. Select one or more results and import them.
				</p>
			</div>

			<div className="grid gap-3 md:grid-cols-[1fr,auto]">
				<div className="space-y-2">
					<label
						htmlFor={queryId}
						className="text-xs uppercase tracking-wide text-slate-500"
					>
						Search query *
					</label>
					<input
						id={queryId}
						value={textQuery}
						onChange={(e) => setTextQuery(e.target.value)}
						className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
						placeholder="e.g. Guinness bar Lagos"
					/>
				</div>
				<div className="flex items-end">
					<button
						type="button"
						disabled={!textQuery.trim() || previewMutation.isPending}
						onClick={async () => {
							try {
								await previewMutation.mutateAsync();
							} catch (error) {
								onError(error, "Search failed. Please try again.");
							}
						}}
						className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-500 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{previewMutation.isPending ? "Searching…" : "Search"}
					</button>
				</div>
			</div>

			{results.length > 0 ? (
				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<p className="text-xs text-slate-500">{results.length} result(s)</p>
						<button
							type="button"
							disabled={selectedVenues.length === 0 || importMutation.isPending}
							onClick={handleImport}
							className="rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-cyan-500/50"
						>
							{importMutation.isPending ? "Importing…" : "Import selected"}
						</button>
					</div>

					<div className="grid gap-3 md:grid-cols-2">
						{results.map((place) => (
							<label
								key={`${place.slug}-${place.externalId}`}
								className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/50 p-4 cursor-pointer hover:border-slate-700"
							>
								<input
									type="checkbox"
									checked={Boolean(selected[place.slug])}
									onChange={(e) =>
										setSelected((prev) => ({
											...prev,
											[place.slug]: e.target.checked,
										}))
									}
									className="mt-1 h-4 w-4 rounded border border-slate-600 bg-slate-900 text-cyan-500 focus:ring-cyan-500/40"
								/>
								<div className="min-w-0">
									<div className="text-sm font-semibold text-white truncate">
										{place.name}
									</div>
									<div className="mt-1 text-xs text-slate-400 truncate">
										{place.addressLine1 ?? "—"}
									</div>
									<div className="mt-1 text-xs text-slate-500 truncate">
										{place.city ?? "—"}
										{place.region ? `, ${place.region}` : ""}{" "}
										{place.countryCode ?? ""}
									</div>
								</div>
							</label>
						))}
					</div>
				</div>
			) : null}
		</div>
	);
}

function CsvUploadVenueForm({
	onSuccess,
	onError,
}: {
	onSuccess: (message: string) => Promise<void>;
	onError: (error: unknown, fallback: string) => void;
}) {
	const fileId = useId();
	const csvTextareaId = useId();
	const [csvText, setCsvText] = useState("");
	const [lastResult, setLastResult] = useState<VenueIngestionResult | null>(
		null,
	);

	const importMutation = useMutation({
		mutationFn: (csvData: string) => venuesApi.manualImport({ csvData }),
		onSuccess: (result) => {
			setLastResult(result);
		},
	});

	const handleFile = async (file: File) => {
		// Reset previous result when a new file is loaded
		setLastResult(null);

		const name = file.name.toLowerCase();
		const isCsv =
			name.endsWith(".csv") ||
			file.type.includes("csv") ||
			file.type === "text/plain";
		const isExcel =
			name.endsWith(".xlsx") ||
			name.endsWith(".xls") ||
			file.type ===
				"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
			file.type === "application/vnd.ms-excel";

		if (isCsv) {
			const text = await file.text();
			setCsvText(text);
			return;
		}

		if (isExcel) {
			const buffer = await file.arrayBuffer();
			const XLSX = await import("xlsx");
			const workbook = XLSX.read(buffer, { type: "array" });
			const firstSheetName = workbook.SheetNames[0];
			if (!firstSheetName) {
				throw new Error("No sheets found in the Excel file.");
			}
			const sheet = workbook.Sheets[firstSheetName];
			const csv = XLSX.utils.sheet_to_csv(sheet);
			setCsvText(csv);
			return;
		}

		throw new Error("Unsupported file type. Please upload CSV or Excel.");
	};

	const handleSubmit = async () => {
		try {
			const result = await importMutation.mutateAsync(csvText);
			await onSuccess(
				`Imported ${result.inserted} venue(s). Duplicates: ${result.duplicates}, skipped: ${result.lowQuality}.`,
			);
		} catch (error) {
			onError(error, "CSV import failed. Please check the CSV and try again.");
		}
	};

	return (
		<div className="space-y-4">
			<div>
				<h2 className="text-base font-semibold text-white">Bulk CSV upload</h2>
				<p className="mt-1 text-xs text-slate-500">
					Upload a CSV file or paste CSV content below.
				</p>
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				<div className="space-y-2">
					<label
						htmlFor={fileId}
						className="text-xs uppercase tracking-wide text-slate-500"
					>
						CSV or Excel file (optional)
					</label>
					<input
						id={fileId}
						type="file"
						accept=".csv,text/csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.xls,application/vnd.ms-excel"
						onChange={(e) => {
							const file = e.target.files?.[0];
							if (file) {
								handleFile(file).catch(() => {
									// ignore
								});
							}
						}}
						className="block w-full text-sm text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-200 hover:file:bg-slate-800"
					/>
				</div>
				<div className="flex items-end justify-end">
					<button
						type="button"
						disabled={!csvText.trim() || importMutation.isPending}
						onClick={handleSubmit}
						className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-cyan-500/50"
					>
						{importMutation.isPending ? "Importing…" : "Import CSV"}
					</button>
				</div>
			</div>

			<div className="space-y-2">
				<label
					htmlFor={csvTextareaId}
					className="text-xs uppercase tracking-wide text-slate-500"
				>
					CSV content
				</label>
				<textarea
					id={csvTextareaId}
					value={csvText}
					onChange={(e) => setCsvText(e.target.value)}
					rows={10}
					placeholder="Paste CSV data here…"
					className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
				/>
			</div>

			{lastResult ? (
				<div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-xs text-slate-300">
					<div className="font-semibold text-white">Last import</div>
					<div className="mt-2 grid gap-2 md:grid-cols-3">
						<div>
							<span className="text-slate-500">Inserted:</span>{" "}
							{lastResult.inserted}
						</div>
						<div>
							<span className="text-slate-500">Duplicates:</span>{" "}
							{lastResult.duplicates}
						</div>
						<div>
							<span className="text-slate-500">Skipped:</span>{" "}
							{lastResult.lowQuality}
						</div>
					</div>
				</div>
			) : null}
		</div>
	);
}
