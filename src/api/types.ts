export interface AuthenticatedUser {
	id: string;
	email: string;
	tenantId: string | null;
	tenantSlug: string | null;
	isPlatformUser: boolean;
	roles: string[];
	permissions: string[];
}

export type AccessLevel = "viewer" | "editor" | "admin";

export interface AccessibleTenant {
	tenantId: string;
	tenantName: string;
	tenantSlug: string;
	accessLevel: AccessLevel;
}

export interface AuthTokenResponse {
	accessToken: string;
	refreshToken: string;
	accessTokenExpiresAt: string;
	refreshTokenExpiresAt: string;
	sessionId: string;
	user: AuthenticatedUser;
	accessibleTenants?: AccessibleTenant[];
}

export interface ValidationErrorResponse {
	errors: Record<string, string[]>;
}

export interface MessageResponse {
	message: string;
}

export interface CodedErrorResponse {
	code: string;
	message: string;
}

export type ApiErrorResponse =
	| ValidationErrorResponse
	| MessageResponse
	| CodedErrorResponse;

export interface AuthLoginRequest {
	tenant?: string;
	email: string;
	password: string;
}

export interface AuthRefreshRequest {
	refreshToken: string;
}

export interface UserProfileResponse {
	user: AuthenticatedUser;
	sessionId: string;
}

export interface EventSummaryResponse {
	data: Array<{
		eventType: string;
		count: number;
	}>;
}

export interface EventTimeseriesResponse {
	data: Array<{
		period: string;
		count: number;
	}>;
}

export interface Campaign {
	id: string;
	tenantId: string;
	name: string;
	description?: string | null;
	slug: string;
	status:
		| "draft"
		| "scheduled"
		| "active"
		| "paused"
		| "completed"
		| "cancelled";
	startAt?: string | null;
	endAt?: string | null;
	radiusMeters?: number | null;
	timezone?: string | null;
	budgetCents?: number | null;
	venueIds: string[];
	venueFilters?: VenueFilters | null;
	createdAt: string;
	updatedAt: string;
}

export interface CampaignListResponse {
	data: Campaign[];
}

export interface AuthForgotPasswordRequest {
	tenant: string;
	email: string;
}

export interface AuthResetPasswordRequest {
	token: string;
	password: string;
}

export interface AuthSignupRequest {
	tenantName: string;
	tenantSlug?: string;
	contactEmail?: string;
	adminEmail: string;
	password: string;
	firstName?: string;
	lastName?: string;
}

export interface AuthSignupResponse {
	message: string;
	tenantId: string;
	tenantSlug: string;
	adminUserId: string;
}

export interface CreateVenueRequest {
	name: string;
	slug?: string;
	description?: string;
	addressLine1?: string;
	addressLine2?: string;
	city?: string;
	region?: string;
	postalCode?: string;
	countryCode?: string;
	timezone?: string;
	latitude?: number;
	longitude?: number;
	externalId?: string;
	status?: "draft" | "active" | "inactive";
	metadata?: Record<string, unknown>;
}

export interface Venue extends CreateVenueRequest {
	id: string;
	tenantId: string;
	createdAt: string;
	updatedAt: string;
}

export interface VenueListResponse {
	data: Venue[];
	pagination?: {
		limit: number;
		offset: number;
		count: number;
	};
}

export interface VenuePlacesSyncRequest {
	tenantId: string;
	textQuery: string;
	locationBias?: {
		latitude: number;
		longitude: number;
		radiusMeters: number;
	};
	pageSize?: number;
}

export interface VenueIngestionResult {
	inserted: number;
	duplicates: number;
	lowQuality: number;
	records: NormalizedVenue[];
}

export interface NormalizedVenue {
	tenantId: string;
	name: string;
	slug: string;
	description?: string;
	addressLine1?: string;
	addressLine2?: string;
	city?: string;
	region?: string;
	postalCode?: string;
	countryCode?: string;
	latitude?: number;
	longitude?: number;
	timezone?: string;
	externalId?: string;
	phoneNumber?: string;
	source: "manual" | "google_places";
	categories: string[];
	raw?: Record<string, unknown>;
	metadata?: Record<string, unknown>;
}

export interface VenuePlacesPreviewResponse {
	raw: GooglePlace[];
	venues: NormalizedVenue[];
}

export interface GooglePlace {
	id: string;
	displayName?: {
		text?: string;
	};
	shortFormattedAddress?: string;
	formattedAddress?: string;
	location?: {
		latitude?: number;
		longitude?: number;
	};
	types?: string[];
	primaryType?: string;
	internationalPhoneNumber?: string;
	rating?: number;
	userRatingCount?: number;
	businessStatus?: string;
	[key: string]: unknown;
}

// Tenant Management Types
export interface TenantResponse {
	id: string;
	name: string;
	slug: string;
	status: "active" | "suspended";
	contactEmail?: string | null;
	metadata?: Record<string, unknown> | null;
	createdAt: string;
	updatedAt: string;
}

export interface TenantListResponse {
	data: TenantResponse[];
	pagination: {
		limit: number;
		offset: number;
		count: number;
	};
}

export interface CreateTenantRequest {
	tenantName: string;
	tenantSlug?: string;
	contactEmail?: string;
	adminEmail: string;
	password: string;
	firstName?: string;
	lastName?: string;
}

export interface UpdateTenantRequest {
	name?: string;
	contactEmail?: string;
	metadata?: Record<string, unknown>;
}

export interface AccessibleTenantsResponse {
	tenants: AccessibleTenant[];
}

// Tenant User Management Types
export interface TenantUserResponse {
	id: string;
	email: string;
	firstName?: string | null;
	lastName?: string | null;
	status: "invited" | "active" | "suspended";
	accessLevel: AccessLevel;
	grantedAt: string;
	expiresAt?: string | null;
}

export interface TenantUserListResponse {
	data: TenantUserResponse[];
}

export interface InviteUserRequest {
	email: string;
	password: string;
	firstName?: string;
	lastName?: string;
	accessLevel: AccessLevel;
	expiresAt?: string;
}

export interface UpdateUserAccessRequest {
	accessLevel: AccessLevel;
	expiresAt?: string | null;
}

// Event Ingestion Types
export type EventType =
	| "geofence_trigger"
	| "geofence_dwell"
	| "notification_sent"
	| "notification_opened"
	| "notification_delivery_error"
	| "impression"
	| "click"
	| "offer_viewed"
	| "offer_redeemed";

export interface EventInput {
	eventType: EventType;
	occurredAt?: string;
	campaignId?: string;
	venueId?: string;
	userId?: string;
	sessionId?: string;
	offerId?: string;
	payload?: Record<string, unknown>;
}

export interface EventIngestRequest {
	events: EventInput[];
}

export interface EventIngestResponse {
	recorded: number;
}

// Geofencing Types
export interface LocationPing {
	deviceId: string;
	latitude: number;
	longitude: number;
	accuracyMeters?: number;
	occurredAt?: string;
}

export interface GeofenceEvaluationRequest {
	locations: LocationPing[];
}

export interface GeofenceEvaluationResponse {
	triggers: number;
}

// Notification Types
export interface NotificationSendRequest {
	to: string[];
	title: string;
	body?: string;
	data?: Record<string, unknown>;
	campaignId?: string;
}

export interface NotificationSendResponse {
	tickets: number;
}

export interface NotificationReceipt {
	ticketId: string;
	status: "ok" | "error";
	details?: Record<string, unknown>;
}

export interface NotificationReceiptsRequest {
	receipts: NotificationReceipt[];
}

export interface NotificationReceiptsResponse {
	received: number;
}

// Venue Types
export type VenuePrimaryType =
	| "hotel"
	| "restaurant"
	| "bar"
	| "cafe"
	| "mall"
	| "retail"
	| "entertainment"
	| "other";

export interface UpdateVenueRequest {
	name?: string;
	slug?: string;
	description?: string;
	addressLine1?: string;
	addressLine2?: string;
	city?: string;
	region?: string;
	postalCode?: string;
	countryCode?: string;
	timezone?: string;
	latitude?: number;
	longitude?: number;
	externalId?: string;
	status?: "draft" | "active" | "inactive";
	primaryType?: VenuePrimaryType;
	isShared?: boolean;
	metadata?: Record<string, unknown>;
}

export interface VenueManualImportRequest {
	csvData: string;
}

export interface VenueFilters {
	primaryType?: VenuePrimaryType[];
	city?: string;
	region?: string;
	countryCode?: string;
	radius?: {
		latitude: number;
		longitude: number;
		meters: number;
	};
	status?: "active" | "draft" | "inactive";
	isShared?: boolean;
}

// Campaign Types Enhancement
export interface CreateCampaignRequest {
	name: string;
	description?: string;
	radiusMeters?: number;
	timezone?: string;
	startAt?: string;
	endAt?: string;
	budgetCents?: number;
	venueIds?: string[];
	venueFilters?: VenueFilters;
	status?: Campaign["status"];
}

export interface UpdateCampaignRequest extends Partial<CreateCampaignRequest> {}
