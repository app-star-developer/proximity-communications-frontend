# Admin Platform Dashboard — Frontend Implementation Guide

> **For: Frontend Developer (Admin/Organization Dashboard)**
> **Backend Base URL:** `http://localhost:3000/api` (dev) or your deployed API URL
> **Auth:** All endpoints require `Authorization: Bearer <token>` header

This guide covers the admin platform dashboard where organizations create and manage campaigns with promo codes.

---

## Table of Contents

1. [Reference Data (Promo Types, Locations, Venue Types)](#1-reference-data)
2. [Campaign Management](#2-campaign-management)
3. [Promo Code Management](#3-promo-code-management)
4. [TypeScript Types](#4-typescript-types)
5. [React Query Hooks](#5-react-query-hooks)
6. [UI Flow Recommendations](#6-ui-flow-recommendations)

---

## 1. Reference Data

### Promo Types

Fetch once and cache — rarely changes. **No auth required.**

```
GET /v1/promo-types
```

**Response:**

```json
{
  "data": [
    {
      "id": "uuid-percentage",
      "slug": "percentage",
      "name": "Percentage Discount",
      "description": "Discount by a percentage of the total price",
      "requiresValue": true,
      "valueLabel": "Percentage (%)",
      "isActive": true,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    },
    {
      "id": "uuid-fixed",
      "slug": "fixed",
      "name": "Fixed Amount Off",
      "description": "Subtract a fixed amount from the total price",
      "requiresValue": true,
      "valueLabel": "Amount (₦)",
      "isActive": true
    },
    {
      "id": "uuid-bogo",
      "slug": "bogo",
      "name": "Buy One Get One Free",
      "description": "Customer buys one item and gets another free",
      "requiresValue": false,
      "valueLabel": null,
      "isActive": true
    },
    {
      "id": "uuid-buy_x_get_y",
      "slug": "buy_x_get_y",
      "name": "Buy X Get Y",
      "description": "Buy a specified quantity and get additional items free or discounted",
      "requiresValue": false,
      "valueLabel": null,
      "isActive": true
    },
    {
      "id": "uuid-free_item",
      "slug": "free_item",
      "name": "Free Item",
      "description": "Customer receives a specific item for free",
      "requiresValue": false,
      "valueLabel": null,
      "isActive": true
    },
    {
      "id": "uuid-free_shipping",
      "slug": "free_shipping",
      "name": "Free Delivery",
      "description": "Waive delivery or shipping fees",
      "requiresValue": false,
      "valueLabel": null,
      "isActive": true
    },
    {
      "id": "uuid-cashback",
      "slug": "cashback",
      "name": "Cashback",
      "description": "Customer receives a percentage back as store credit",
      "requiresValue": true,
      "valueLabel": "Cashback Percentage (%)",
      "isActive": true
    },
    {
      "id": "uuid-bundle",
      "slug": "bundle",
      "name": "Bundle Deal",
      "description": "Multiple items bundled together at a reduced price",
      "requiresValue": true,
      "valueLabel": "Bundle Price (₦)",
      "isActive": true
    },
    {
      "id": "uuid-flat_price",
      "slug": "flat_price",
      "name": "Flat Price",
      "description": "Item available at a specific flat price",
      "requiresValue": true,
      "valueLabel": "Flat Price (₦)",
      "isActive": true
    },
    {
      "id": "uuid-loyalty_points",
      "slug": "loyalty_points",
      "name": "Loyalty Points Multiplier",
      "description": "Earn multiplied loyalty points on purchase",
      "requiresValue": true,
      "valueLabel": "Points Multiplier (e.g. 2 = 2x)",
      "isActive": true
    }
  ]
}
```

### Promo Type Form Behavior

Use `requiresValue` and `valueLabel` from the promo type to dynamically control the form:

| Slug             |    Show Value Field?    | Show Config Fields? | Config Details                                           |
| ---------------- | :---------------------: | :-----------------: | -------------------------------------------------------- |
| `percentage`     |  ✅ Value = percentage  |         ❌          | —                                                        |
| `fixed`          | ✅ Value = amount in ₦  |         ❌          | —                                                        |
| `bogo`           |           ❌            |         ❌          | —                                                        |
| `buy_x_get_y`    |           ❌            |         ✅          | `buyQuantity`, `getQuantity`, `getItemDiscount` (0-100%) |
| `free_item`      |           ❌            |         ✅          | `freeItemName` (text input)                              |
| `free_shipping`  |           ❌            |         ❌          | —                                                        |
| `cashback`       |  ✅ Value = cashback %  |         ❌          | —                                                        |
| `bundle`         | ✅ Value = bundle price |         ✅          | `bundleItems` (array of item names)                      |
| `flat_price`     |  ✅ Value = flat price  |         ❌          | —                                                        |
| `loyalty_points` |  ✅ Value = multiplier  |         ❌          | —                                                        |

### Countries, States, LGAs (for platform venue filters)

```
GET /v1/locations/countries
→ { "data": [{ "id": "uuid", "name": "Nigeria", "code": "NG" }] }

GET /v1/locations/countries/:countryId/states
→ { "data": [{ "id": "uuid", "name": "Lagos", "code": "LA", "countryId": "uuid" }] }

GET /v1/locations/states/:stateId/lgas
→ { "data": [{ "id": "uuid", "name": "Ikeja", "stateId": "uuid" }] }
```

### Venue Types

```
GET /v1/venue-types
→ { "data": [{ "id": "uuid", "name": "Restaurant", "slug": "restaurant" }] }
```

---

## 2. Campaign Management

### List Campaigns

```
GET /v1/campaigns?status=active&page=1&limit=20
Authorization: Bearer <token>
```

**Response:**

```json
{
  "data": [
    {
      "id": "campaign-uuid",
      "tenantId": "tenant-uuid",
      "name": "Summer Promo Lagos",
      "description": "Summer promotion across Lagos restaurants",
      "imageUrl": "https://example.com/image.jpg",
      "slug": "tenant-uuid-summer-promo-lagos",
      "status": "scheduled",
      "venueSource": "platform",
      "startAt": "2025-06-01T00:00:00.000Z",
      "endAt": "2025-08-31T23:59:59.000Z",
      "radiusMeters": 500,
      "timezone": null,
      "budgetCents": 500000,
      "venues": [
        {
          "id": "venue-uuid-1",
          "name": "Lagos Bar & Grill",
          "slug": "lagos-bar-and-grill",
          "address": "123 Victoria Island",
          "city": "Lagos"
        }
      ],
      "totalVenuesCount": 45,
      "createdAt": "2025-05-15T10:00:00.000Z",
      "updatedAt": "2025-05-15T10:00:00.000Z"
    }
  ]
}
```

### Get Campaign by ID

```
GET /v1/campaigns/:campaignId
Authorization: Bearer <token>
```

Returns a single campaign object (same shape as list item, no `data` wrapper).

### Create Campaign — Platform Flow (NEW)

Select venues from all platform venues using location and type filters. Venues receive invitations they must accept/decline.

```
POST /v1/campaigns
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Summer Promo Lagos",
  "description": "Summer promotion across Lagos restaurants",
  "venueSource": "platform",
  "venueFilters": {
    "stateId": "state-uuid-lagos",
    "venueTypeId": "venue-type-uuid-restaurant",
    "city": "Lagos"
  },
  "startAt": "2025-06-01T00:00:00Z",
  "endAt": "2025-08-31T23:59:59Z",
  "radiusMeters": 500,
  "budgetCents": 500000,
  "promoCode": {
    "code": "SUMMER25",
    "promoTypeId": "uuid-percentage",
    "discountType": "percentage",
    "discountValue": 25,
    "maxUses": 1000
  }
}
```

**venueFilters options** (all optional, combine as needed):

```typescript
interface VenueFilters {
  primaryType?: string[];
  city?: string;
  region?: string;
  countryCode?: string; // ISO 2-letter
  radius?: {
    latitude: number; // -90 to 90
    longitude: number; // -180 to 180
    meters: number;
  };
  status?: "active" | "draft" | "inactive";
  isShared?: boolean;
  stateId?: string; // UUID from /locations/.../states
  lgaId?: string; // UUID from /locations/.../lgas
  geopoliticalZone?:
    | "north_central"
    | "north_east"
    | "north_west"
    | "south_east"
    | "south_south"
    | "south_west";
  venueTypeId?: string; // UUID from /venue-types
}
```

### Create Campaign — Direct Flow (Legacy)

Select specific venues you own directly.

```json
{
  "name": "My Campaign",
  "venueSource": "direct",
  "venueIds": ["venue-uuid-1", "venue-uuid-2"],
  "startAt": "2025-06-01T00:00:00Z",
  "promoCode": {
    "promoTypeId": "uuid-bogo",
    "discountType": "fixed",
    "discountValue": 0
  }
}
```

### Create Campaign with Buy X Get Y promo:

```json
{
  "name": "Buy 2 Get 1 Free",
  "venueSource": "platform",
  "venueFilters": { "stateId": "state-uuid" },
  "promoCode": {
    "promoTypeId": "uuid-buy_x_get_y",
    "discountType": "fixed",
    "discountValue": 0,
    "promoConfig": {
      "buyQuantity": 2,
      "getQuantity": 1,
      "getItemDiscount": 100
    }
  }
}
```

**Response:** `201 Created` — returns the full campaign object.

### Update Campaign

```
PUT /v1/campaigns/:campaignId
Authorization: Bearer <token>

{ "description": "Updated description" }
```

### Cancel Campaign

```
DELETE /v1/campaigns/:campaignId
Authorization: Bearer <token>
```

Returns `204 No Content`.

---

## 3. Promo Code Management

### Create Promo Code (standalone, under a campaign)

```
POST /v1/campaigns/:campaignId/promo-codes
Authorization: Bearer <token>

{
  "code": "WELCOME50",
  "type": "percentage",
  "value": 50,
  "promoTypeId": "uuid-percentage",
  "maxUses": 500,
  "validFrom": "2025-06-01T00:00:00Z",
  "validTo": "2025-08-31T23:59:59Z"
}
```

**Response:**

```json
{
  "id": "promo-code-uuid",
  "campaignId": "campaign-uuid",
  "tenantId": "tenant-uuid",
  "code": "WELCOME50",
  "imageUrl": null,
  "status": "active",
  "maxUses": 500,
  "currentUses": 0,
  "validFrom": "2025-06-01T00:00:00.000Z",
  "validTo": "2025-08-31T23:59:59.000Z",
  "createdAt": "2025-05-15T10:00:00.000Z",
  "updatedAt": "2025-05-15T10:00:00.000Z",
  "discountType": "percentage",
  "discountValue": 50,
  "promoTypeId": "uuid-percentage",
  "promoConfig": null,
  "targetingConfiguration": null
}
```

### Example payloads by promo type:

**Buy X Get Y:**

```json
{
  "promoTypeId": "uuid-buy_x_get_y",
  "type": "fixed",
  "value": 0,
  "promoConfig": {
    "buyQuantity": 2,
    "getQuantity": 1,
    "getItemDiscount": 100
  }
}
```

**Free Item:**

```json
{
  "promoTypeId": "uuid-free_item",
  "type": "fixed",
  "value": 0,
  "promoConfig": { "freeItemName": "Coca-Cola 35cl" }
}
```

**Bundle:**

```json
{
  "promoTypeId": "uuid-bundle",
  "type": "fixed",
  "value": 2500,
  "promoConfig": {
    "bundleItems": ["Burger", "Fries", "Drink"],
    "bundlePrice": 2500
  }
}
```

### List Promo Codes for Campaign

```
GET /v1/campaigns/:campaignId/promo-codes
Authorization: Bearer <token>
```

**Response:** `{ "data": [PromoCode, ...] }`

### Get / Update / Delete / Regenerate Promo Code

```
GET    /v1/promo-codes/:promoCodeId            — Get details
PUT    /v1/promo-codes/:promoCodeId            — Update (status, maxUses, dates)
DELETE /v1/promo-codes/:promoCodeId            — Revoke (soft delete → status: 'revoked')
POST   /v1/promo-codes/:promoCodeId/regenerate — New code, old revoked
```

All require `Authorization: Bearer <token>`.

**Regenerate response:**

```json
{
  "id": "new-promo-code-uuid",
  "code": "ABCDEF1234",
  "oldCodeId": "old-promo-code-uuid",
  "oldCode": "WELCOME50",
  "status": "revoked"
}
```

---

## 4. TypeScript Types

```typescript
// ============================================================================
// Reference Data
// ============================================================================

interface PromoType {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  requiresValue: boolean;
  valueLabel: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Campaigns
// ============================================================================

type VenueSource = "direct" | "platform";
type CampaignStatus =
  | "active"
  | "draft"
  | "scheduled"
  | "paused"
  | "completed"
  | "cancelled";

interface CampaignResponse {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  slug: string;
  status: CampaignStatus;
  venueSource: VenueSource;
  startAt: string | null;
  endAt: string | null;
  radiusMeters: number | null;
  timezone: string | null;
  budgetCents: number | null;
  venues: CampaignVenueSnippet[];
  totalVenuesCount: number;
  createdAt: string;
  updatedAt: string;
}

interface CampaignVenueSnippet {
  id: string;
  name: string;
  slug: string;
  address?: string;
  city?: string | null;
}

interface CreateCampaignInput {
  name: string;
  description?: string;
  imageUrl?: string;
  venueSource?: VenueSource; // default: 'direct'
  /** @deprecated Use venueFilters with venueSource='platform' */
  venueIds?: string[];
  venueFilters?: VenueFilters;
  isAllVenues?: boolean;
  startAt?: string;
  endAt?: string;
  radiusMeters?: number;
  timezone?: string;
  budgetCents?: number;
  status?: CampaignStatus;
  promoCode?: InlinePromoCode;
}

interface InlinePromoCode {
  code?: string;
  discountType?: "percentage" | "fixed";
  discountValue: number;
  maxUses?: number;
  promoTypeId?: string;
  promoConfig?: PromoConfig;
  targetingConfiguration?: Record<string, unknown>;
}

interface VenueFilters {
  primaryType?: string[];
  city?: string;
  region?: string;
  countryCode?: string;
  radius?: { latitude: number; longitude: number; meters: number };
  status?: "active" | "draft" | "inactive";
  isShared?: boolean;
  stateId?: string;
  lgaId?: string;
  geopoliticalZone?:
    | "north_central"
    | "north_east"
    | "north_west"
    | "south_east"
    | "south_south"
    | "south_west";
  venueTypeId?: string;
}

// ============================================================================
// Promo Codes
// ============================================================================

interface PromoCode {
  id: string;
  campaignId: string;
  tenantId: string;
  code: string;
  imageUrl: string | null;
  status: "draft" | "active" | "expired" | "archived" | "revoked";
  maxUses: number | null;
  currentUses: number;
  validFrom: string | null;
  validTo: string | null;
  createdAt: string;
  updatedAt: string;
  /** @deprecated Use promoTypeId */
  discountType: "percentage" | "fixed";
  discountValue: number;
  promoTypeId: string | null;
  promoConfig: Record<string, unknown> | null;
  targetingConfiguration: Record<string, unknown> | null;
}

interface CreatePromoCodeInput {
  code?: string;
  type?: "percentage" | "fixed";
  value?: number;
  promoTypeId?: string;
  promoConfig?: PromoConfig;
  maxUses?: number;
  validFrom?: string;
  validTo?: string;
  imageUrl?: string;
  targetingConfiguration?: Record<string, unknown>;
}

interface PromoConfig {
  buyQuantity?: number; // buy_x_get_y
  getQuantity?: number; // buy_x_get_y
  getItemDiscount?: number; // buy_x_get_y (0-100, 100 = free)
  freeItemName?: string; // free_item
  bundleItems?: string[]; // bundle
  bundlePrice?: number; // bundle
  pointsMultiplier?: number; // loyalty_points
  [key: string]: unknown;
}
```

---

## 5. React Query Hooks

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

// ── Reference Data ──────────────────────────────────────────────────────────

export function usePromoTypes() {
  return useQuery({
    queryKey: ["promo-types"],
    queryFn: () =>
      api.get("/promo-types").then((r) => r.data.data as PromoType[]),
    staleTime: 1000 * 60 * 60,
  });
}

export function useCountries() {
  return useQuery({
    queryKey: ["countries"],
    queryFn: () => api.get("/locations/countries").then((r) => r.data.data),
    staleTime: Infinity,
  });
}

export function useStates(countryId: string) {
  return useQuery({
    queryKey: ["states", countryId],
    queryFn: () =>
      api
        .get(`/locations/countries/${countryId}/states`)
        .then((r) => r.data.data),
    enabled: !!countryId,
    staleTime: Infinity,
  });
}

export function useLgas(stateId: string) {
  return useQuery({
    queryKey: ["lgas", stateId],
    queryFn: () =>
      api.get(`/locations/states/${stateId}/lgas`).then((r) => r.data.data),
    enabled: !!stateId,
    staleTime: Infinity,
  });
}

export function useVenueTypes() {
  return useQuery({
    queryKey: ["venue-types"],
    queryFn: () => api.get("/venue-types").then((r) => r.data.data),
    staleTime: Infinity,
  });
}

// ── Campaigns ───────────────────────────────────────────────────────────────

export function useCampaigns(params?: Record<string, string>) {
  return useQuery({
    queryKey: ["campaigns", params],
    queryFn: () => api.get("/campaigns", { params }).then((r) => r.data.data),
  });
}

export function useCampaign(campaignId: string) {
  return useQuery({
    queryKey: ["campaigns", campaignId],
    queryFn: () => api.get(`/campaigns/${campaignId}`).then((r) => r.data),
    enabled: !!campaignId,
  });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCampaignInput) =>
      api.post("/campaigns", input).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["campaigns"] }),
  });
}

export function useUpdateCampaign(campaignId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<CreateCampaignInput>) =>
      api.put(`/campaigns/${campaignId}`, input).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["campaigns"] }),
  });
}

export function useCancelCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (campaignId: string) => api.delete(`/campaigns/${campaignId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["campaigns"] }),
  });
}

// ── Promo Codes ─────────────────────────────────────────────────────────────

export function usePromoCodesByCampaign(campaignId: string) {
  return useQuery({
    queryKey: ["promo-codes", campaignId],
    queryFn: () =>
      api.get(`/campaigns/${campaignId}/promo-codes`).then((r) => r.data.data),
    enabled: !!campaignId,
  });
}

export function useCreatePromoCode(campaignId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePromoCodeInput) =>
      api
        .post(`/campaigns/${campaignId}/promo-codes`, input)
        .then((r) => r.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["promo-codes", campaignId] }),
  });
}

export function useUpdatePromoCode(promoCodeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<CreatePromoCodeInput>) =>
      api.put(`/promo-codes/${promoCodeId}`, input).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["promo-codes"] }),
  });
}

export function useDeletePromoCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (promoCodeId: string) =>
      api.delete(`/promo-codes/${promoCodeId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["promo-codes"] }),
  });
}

export function useRegeneratePromoCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      promoCodeId,
      settings,
    }: {
      promoCodeId: string;
      settings?: { length?: number };
    }) =>
      api
        .post(`/promo-codes/${promoCodeId}/regenerate`, settings ?? {})
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["promo-codes"] }),
  });
}
```

---

## 6. UI Flow Recommendations

### Campaign Creation Form

1. **Step 1: Basic Info** — Name, description, image, dates, budget
2. **Step 2: Venue Selection**
   - Radio toggle: **Direct** (select owned venues) vs **Platform** (filter by location/type)
   - If Platform: show cascading dropdowns → State → LGA → Venue Type → Geopolitical Zone
   - If Direct: venue multi-select from owned venues
3. **Step 3: Promo Code** (optional)
   - Promo Type dropdown (from `GET /promo-types`)
   - Dynamic fields based on selected type (use `requiresValue` and `valueLabel`)
   - Config fields for `buy_x_get_y`, `free_item`, `bundle` (show/hide based on `slug`)
   - Code field (optional — auto-generated if left empty)
   - Max uses, valid date range
4. **Submit** — single `POST /campaigns` call with everything

### Campaign Detail View

- Campaign info + status badge
- **Venues tab** — list of matched venues with count + invitation status (for platform campaigns)
- **Promo Codes tab** — list promo codes, create new, regenerate, revoke
- **Stats** — total redemptions, active promo codes
