import { api } from "../client";
import type {
	EventIngestRequest,
	EventIngestResponse,
	EventSummaryResponse,
	EventTimeseriesResponse,
} from "../types";

export interface EventSummaryParams {
	startAt?: string;
	endAt?: string;
	eventType?: string;
	campaignId?: string;
	venueId?: string;
	granularity?: "day" | "hour";
}

export const eventsApi = {
	async getSummary(params: EventSummaryParams = {}) {
		try {
			const response = await api.get<EventSummaryResponse>(
				"/events/analytics/summary",
				{ params },
			);
			console.log("ddata", response.data);
			return response.data;
		} catch (error) {
			console.error("Events summary API error:", error);
			console.error(
				"Request URL:",
				`/events/analytics/summary`,
				"Params:",
				params,
			);
			throw error;
		}
	},

	async getTimeseries(params: EventSummaryParams = {}) {
		try {
			const response = await api.get<EventTimeseriesResponse>(
				"/events/analytics/timeseries",
				{ params },
			);
			return response.data;
		} catch (error) {
			console.error("Events timeseries API error:", error);
			console.error(
				"Request URL:",
				`/events/analytics/timeseries`,
				"Params:",
				params,
			);
			throw error;
		}
	},

	async recordEvents(payload: EventIngestRequest) {
		const response = await api.post<EventIngestResponse>("/events", payload);
		return response.data;
	},
};
