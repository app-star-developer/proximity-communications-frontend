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
	ownerEmail?: string; // Optional: triggers owner account creation
}

export interface Venue extends CreateVenueRequest {
	id: string;
	tenantId: string;
	createdAt: string;
	updatedAt: string;
	primaryType: string;
	ownerCreationInitiated?: boolean; // Indicates owner account creation started
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

// Campaign Notification Configuration Types
export interface CampaignNotificationActionButton {
	label: string;
	action: string;
}

export interface CampaignNotificationConfig {
	id: string;
	campaignId: string;
	venueId?: string | null; // null for default config, venueId for per-venue override
	title: string;
	body?: string | null;
	deepLinkUrl?: string | null;
	imageUrl?: string | null;
	actionButtons?: CampaignNotificationActionButton[] | null;
	createdAt: string;
	updatedAt: string;
}

export interface CampaignNotificationConfigResponse {
	default: CampaignNotificationConfig | null;
	venueOverrides: CampaignNotificationConfig[];
}

export interface CreateCampaignNotificationConfigRequest {
	title: string;
	body?: string;
	deepLinkUrl?: string;
	imageUrl?: string;
	actionButtons?: CampaignNotificationActionButton[];
	venueId?: string; // Optional: if provided, creates a per-venue override
}

export interface UpdateCampaignNotificationConfigRequest {
	title?: string;
	body?: string | null;
	deepLinkUrl?: string | null;
	imageUrl?: string | null;
	actionButtons?: CampaignNotificationActionButton[] | null;
}

// Audience Types
export interface AudienceMetricsResponse {
	totalDevices: number;
	activeUsers: {
		last7Days: number;
		last30Days: number;
	};
}

export interface AudienceGrowthDataPoint {
	date: string;
	count: number;
}

export interface AudienceGrowthResponse {
	data: AudienceGrowthDataPoint[];
}

export interface Device {
	id: string;
	radarUserId?: string;
	name?: string;
	email?: string;
	expoPushToken?: string;
	metadata?: Record<string, unknown>;
	firstSeen?: string;
	lastSeen?: string;
	eventCount: number;
	campaignsEngaged: string[];
	venuesEngaged: string[];
}

export interface AudienceDevicesResponse {
	devices: Device[];
	pagination: {
		limit: number;
		offset: number;
		total: number;
	};
}

export interface DeviceEngagement {
	firstSeen?: string;
	lastSeen?: string;
	totalEvents: number;
	campaigns: Array<{
		campaignId: string;
		eventCount: number;
	}>;
	venues: Array<{
		venueId: string;
		eventCount: number;
	}>;
	eventsByType: Array<{
		eventType: string;
		count: number;
	}>;
}

export interface AudienceDeviceDetailsResponse {
	device: Device & {
		createdAt: string;
		updatedAt: string;
	};
	engagement: DeviceEngagement;
}

export interface AudienceSegmentationResponse {
	byCampaign: Array<{
		campaignId: string;
		deviceCount: number;
	}>;
	byVenue: Array<{
		venueId: string;
		deviceCount: number;
	}>;
	activeVsInactive: {
		active7Days: number;
		active30Days: number;
		inactive: number;
	};
}

// Venue Owner Types
export interface VenueOwner {
	id: string;
	venueId: string;
	email: string;
	supabaseUserId?: string | null;
	status: "active" | "suspended";
	passwordChanged: boolean;
	passwordSentAt?: string | null;
	initialPassword?: string | null; // Only present if passwordChanged = false
	createdAt: string;
	updatedAt: string;
}

export interface VenueOwnerListResponse {
	data: VenueOwner[];
}

export interface CreateVenueOwnerRequest {
	email: string;
}

export interface ResendPasswordResponse {
	success: boolean;
	message: string;
}

export interface RetryOwnerCreationResponse {
	retried: number;
	succeeded: number;
	failed: number;
}

// Promo Code Types
export type PromoCodeStatus = "active" | "revoked" | "expired" | 'draft';
export type PromoCodeFormat = "human_readable" | "alphanumeric" | "numeric";

export interface PromoCodeGenerationSettings {
	format?: PromoCodeFormat;
	length?: number;
	prefix?: string;
	caseSensitive?: boolean;
	allowRegeneration?: boolean;
}

export interface PromoCode {
	id: string;
	campaignId: string;
	code: string;
	status: PromoCodeStatus;
	maxUses: number;
	currentUses: number;
	maxUsesPerUser?: number;
	validFrom?: string | null;
	validTo?: string | null;
	generationSettings?: PromoCodeGenerationSettings | null;
	createdAt: string;
	updatedAt: string;
}

export interface PromoCodeListResponse {
	data: PromoCode[];
}

export interface CreatePromoCodeRequest {
	code?: string; // Optional: auto-generate if not provided
	status?: PromoCodeStatus;
	maxUses: number;
	maxUsesPerUser?: number;
	validFrom?: string;
	validTo?: string;
	generationSettings?: PromoCodeGenerationSettings;
}

export interface UpdatePromoCodeRequest {
	maxUses?: number;
	status?: PromoCodeStatus;
	validFrom?: string | null;
	validTo?: string | null;
}

export interface RegeneratePromoCodeRequest {
	generationSettings?: PromoCodeGenerationSettings;
}

export interface RegeneratePromoCodeResponse {
	id: string;
	code: string;
	oldCodeId: string;
	oldCode: string;
	status: PromoCodeStatus;
}

// Promo Code Redemption Types
export interface PromoCodeRedemption {
	id: string;
	promoCode: {
		id: string;
		code: string;
		campaignId: string;
		campaignName: string;
	};
	venue: {
		id: string;
		name: string;
	};
	redeemedBy: string; // deviceId or userId
	redeemedAt: string;
	verifiedAt?: string | null;
	status: "pending" | "verified";
}

export interface PromoCodeRedemptionListResponse {
	data: PromoCodeRedemption[];
}

export interface RedeemPromoCodeRequest {
	campaignId: string;
	venueId?: string;
}

export interface RedeemPromoCodeResponse {
	redemptionId: string;
	code: string;
	status: "pending" | "verified";
	message: string;
	redeemedAt: string;
	venue: {
		id: string;
		name: string;
	};
}

export interface PromoCodeStatusResponse {
	code: string;
	valid: boolean;
	status: PromoCodeStatus;
	canRedeem: boolean;
	message: string;
	campaign: {
		id: string;
		name: string;
	};
}