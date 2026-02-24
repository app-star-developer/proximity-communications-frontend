import type { QueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { addDays, format, subDays, startOfDay, startOfWeek, startOfMonth } from "date-fns";
import { useId, useMemo, useState } from "react";
import {
	Area,
	AreaChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

import { useEventSummary, useEventTimeseries } from "../hooks/useAnalytics";
import { useAuthStore } from "../state/authStore";
import { requireAuth } from "../utils/requireAuth";

const DATE_PRESETS = [
	{ label: "All Time", value: "all_time" },
	{ label: "Today", value: "today" },
	{ label: "This Week", value: "this_week" },
	{ label: "This Month", value: "this_month" },
	{ label: "Last 7 days", value: 7 },
	{ label: "Last 30 days", value: 30 },
	{ label: "Last 90 days", value: 90 },
	{ label: "Custom Range", value: "custom" },
] as const;

type DatePreset = (typeof DATE_PRESETS)[number];

const EVENT_PRIORITY = [
	"notification_sent",
	"notification_opened",
	"click",
	"offer_redeemed",
	"geofence_trigger",
] as const;

export const Route = createFileRoute("/")({
	loader: async ({ context, location }) => {
		const { queryClient } = context as { queryClient: QueryClient };
		return requireAuth({
			queryClient,
			locationHref: location.href,
		});
	},
	component: DashboardOverview,
});

function DashboardOverview() {
	const { user } = useAuthStore();
	const [preset, setPreset] = useState<DatePreset>(DATE_PRESETS[0]);
	const [customStart, setCustomStart] = useState<string>("");
	const [customEnd, setCustomEnd] = useState<string>("");

	const { startAt, endAt } = useMemo(() => {
		if (preset.value === "all_time") {
			return { startAt: undefined, endAt: undefined };
		}

		if (preset.value === "custom") {
			if (!customStart || !customEnd) {
				return { startAt: undefined, endAt: undefined };
			}
			return {
				startAt: new Date(customStart).toISOString(),
				endAt: addDays(new Date(customEnd), 1).toISOString(),
			};
		}

		const end = new Date();
		let start: Date;

		switch (preset.value) {
			case "today":
				start = startOfDay(end);
				break;
			case "this_week":
				start = startOfWeek(end, { weekStartsOn: 1 });
				break;
			case "this_month":
				start = startOfMonth(end);
				break;
			default:
				start = subDays(end, preset.value as number);
				break;
		}

		return {
			startAt: start.toISOString(),
			endAt: addDays(end, 1).toISOString(),
		};
	}, [preset, customStart, customEnd]);

	const summaryQuery = useEventSummary({
		startAt,
		endAt,
		granularity: "day",
	});

	const isShortRange = useMemo(() => {
		if (preset.value === "today") return true;
		if (typeof preset.value === "number" && preset.value <= 7) return true;
		return false;
	}, [preset.value]);

	const timeseriesQuery = useEventTimeseries({
		startAt,
		endAt,
		granularity: isShortRange ? "hour" : "day",
	});

	const gradientId = useId();

	const summaryMetrics = useMemo(() => {
		if (!summaryQuery.data?.data) {
			return EVENT_PRIORITY.map((eventType) => ({
				eventType,
				count: 0,
			}));
		}

		const lookup = new Map(
			summaryQuery.data.data.map((entry) => [entry.eventType, entry.count]),
		);

		return EVENT_PRIORITY.map((eventType) => ({
			eventType,
			count: lookup.get(eventType) ?? 0,
		}));
	}, [summaryQuery.data]);

	const timeseriesData = useMemo(() => {
		return (
			timeseriesQuery.data?.data.map((point) => ({
				period: format(
					new Date(point.period),
					isShortRange ? "MMM d, ha" : "MMM d",
				),
				count: point.count,
			})) ?? []
		);
	}, [isShortRange, timeseriesQuery.data]);

	const totalSent = summaryMetrics.find(
		(metric) => metric.eventType === "notification_sent",
	)?.count;
	const totalOpened = summaryMetrics.find(
		(metric) => metric.eventType === "notification_opened",
	)?.count;
	const totalClicks = summaryMetrics.find(
		(metric) => metric.eventType === "click",
	)?.count;

	const ctr =
		totalSent && totalSent > 0
			? `${(((totalOpened ?? 0) / totalSent) * 100).toFixed(1)}%`
			: "--";
	const cvr =
		totalOpened && totalOpened > 0
			? `${(((totalClicks ?? 0) / totalOpened) * 100).toFixed(1)}%`
			: "--";

	return (
		<div className="space-y-6">
			<section className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-6 shadow-lg shadow-slate-950/20 backdrop-blur">
				<header className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
					<div>
						<h2 className="text-lg font-semibold text-white">Welcome back</h2>
						<p className="text-sm text-slate-400">
							{user
								? `Here's the latest campaign telemetry for ${user.tenantSlug}.`
								: "Review the latest campaign telemetry across all organizations."}
						</p>
					</div>
					<div className="flex flex-col gap-2 md:flex-row md:items-center">
						<div className="flex items-center gap-2">
							<span className="text-xs uppercase tracking-wide text-slate-500">
								Range
							</span>
							<select
								value={preset.value}
								onChange={(event) => {
									const next = DATE_PRESETS.find(
										(option) => option.value.toString() === event.target.value,
									);
									if (next) {
										setPreset(next);
									}
								}}
								className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
							>
								{DATE_PRESETS.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</select>
						</div>

						{preset.value === "custom" && (
							<div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-300">
								<input
									type="date"
									value={customStart}
									onChange={(e) => setCustomStart(e.target.value)}
									className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-200 outline-none focus:border-cyan-500"
								/>
								<span className="text-xs text-slate-500">to</span>
								<input
									type="date"
									value={customEnd}
									onChange={(e) => setCustomEnd(e.target.value)}
									className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-200 outline-none focus:border-cyan-500"
								/>
							</div>
						)}
					</div>
				</header>
				{summaryQuery.isError ? (
					<ErrorBanner message="We couldn't load analytics. Try refreshing or check your API credentials." />
				) : null}
				<div className="grid gap-4 md:grid-cols-4">
					<MetricCard
						title="Notifications sent"
						value={
							summaryQuery.isLoading
								? "..."
								: (totalSent?.toLocaleString() ?? "0")
						}
						description={`Across ${preset.label.toLowerCase()}.`}
					/>
					<MetricCard
						title="Opens"
						value={
							summaryQuery.isLoading
								? "..."
								: (totalOpened?.toLocaleString() ?? "0")
						}
						description="Unique open events from proximity alerts."
					/>
					<MetricCard
						title="Click-through rate"
						value={summaryQuery.isLoading ? "..." : ctr}
						description="Opens vs total notifications."
					/>
					<MetricCard
						title="Conversion rate"
						value={summaryQuery.isLoading ? "..." : cvr}
						description="Clicks vs opens."
					/>
				</div>
			</section>
			<section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
				<div className="rounded-2xl border border-slate-800/60 bg-slate-950/60 p-6 shadow-lg shadow-slate-950/20">
					<header className="mb-4 flex items-center justify-between">
						<div>
							<h3 className="text-base font-semibold text-white">
								Engagement over time
							</h3>
							<p className="text-xs text-slate-500">
								Aggregated event counts by {Number(preset.value) <= 7 ? "hour" : "day"}.
							</p>
						</div>
						{timeseriesQuery.isFetching ? (
							<span className="text-xs text-slate-500">Refreshing…</span>
						) : null}
					</header>
					{timeseriesQuery.isError ? (
						<ErrorBanner message="Time-series analytics unavailable." />
					) : (
						<div className="h-72 w-full">
							<ResponsiveContainer>
								<AreaChart data={timeseriesData}>
									<defs>
										<linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
											<stop
												offset="10%"
												stopColor="#2dd4bf"
												stopOpacity={0.35}
											/>
											<stop offset="95%" stopColor="#0f172a" stopOpacity={0} />
										</linearGradient>
									</defs>
									<XAxis
										dataKey="period"
										axisLine={false}
										tickLine={false}
										tick={{ fill: "#94a3b8", fontSize: 12 }}
									/>
									<YAxis
										allowDecimals={false}
										width={48}
										axisLine={false}
										tickLine={false}
										tick={{ fill: "#94a3b8", fontSize: 12 }}
									/>
									<Tooltip
										cursor={{ stroke: "#2dd4bf", strokeOpacity: 0.15 }}
										contentStyle={{
											backgroundColor: "#0f172a",
											borderRadius: "12px",
											border: "1px solid rgba(148,163,184,0.2)",
											color: "#e2e8f0",
										}}
									/>
									<Area
										type="monotone"
										dataKey="count"
										stroke="#2dd4bf"
										strokeWidth={2}
										fill={"url(#${gradientId})"}
										dot={false}
										isAnimationActive={false}
									/>
								</AreaChart>
							</ResponsiveContainer>
						</div>
					)}
				</div>
				<div className="rounded-2xl border border-slate-800/60 bg-slate-950/60 p-6 shadow-lg shadow-slate-950/20">
					<header className="mb-4">
						<h3 className="text-base font-semibold text-white">
							Event breakdown
						</h3>
						<p className="text-xs text-slate-500">
							Top proximity outcomes in the selected range.
						</p>
					</header>
					{summaryQuery.isError ? (
						<ErrorBanner message="Summary data unavailable." />
					) : null}
					<ul className="space-y-3">
						{summaryMetrics.map((metric) => (
							<li
								key={metric.eventType}
								className="flex items-center justify-between rounded-xl border border-slate-800/70 bg-slate-950/50 px-4 py-3"
							>
								<span className="text-sm font-medium capitalize text-slate-200">
									{metric.eventType.replace(/_/g, " ")}
								</span>
								<span className="text-sm font-semibold text-white">
									{summaryQuery.isLoading
										? "..."
										: metric.count.toLocaleString()}
								</span>
							</li>
						))}
					</ul>
				</div>
			</section>
		</div>
	);
}

function MetricCard({
	title,
	value,
	description,
}: {
	title: string;
	value: string;
	description: string;
}) {
	return (
		<div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5 shadow-inner shadow-slate-950/30">
			<p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
				{title}
			</p>
			<p className="mt-3 text-3xl font-semibold text-white">{value}</p>
			<p className="mt-2 text-xs text-slate-500">{description}</p>
		</div>
	);
}

function ErrorBanner({ message }: { message: string }) {
	return (
		<div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs text-red-200">
			{message}
		</div>
	);
}
