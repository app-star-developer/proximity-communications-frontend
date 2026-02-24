# Frontend Guide: Brand Partner Organization Creation

This document outlines how the frontend should implement the Brand Partner Onboarding flow. Brand Partners (Organizations or Agencies) are created by Platform Admins via the main Tenant creation endpoint.

## Overview

The form should be restricted to users with the `platform:tenants:create` permission (Platform Admins). The flow consists of gathering Organization details, Admin User details, Brand Partner specific details, uploading required files, and submitting a combined JSON payload to `POST /api/v1/tenants`.

## 1. UI Components & Inputs Mapping

The frontend form should be broken down into logical sections. Here is exactly what inputs, dropdowns, and file uploaders are needed, and how they map to the API payload.

### Step 1: Basic Organization Details

- **Company Name** (Text Input) -> Maps to `tenantName`
- **Contact Email** (Email Input, Optional) -> Maps to `contactEmail`

### Step 2: Administrator Representative Details

_This creates the primary user who will manage the Brand Partner account._

- **First Name** (Text Input, Optional) -> Maps to `firstName`
- **Last Name** (Text Input, Optional) -> Maps to `lastName`
- **Work Email** (Email Input) -> Maps to `adminEmail` (Used for login)
- **Temporary Password** (Password Input) -> Maps to `password` (Must be at least 8 characters)
- **Job Title** (Text Input, Optional) -> Maps to `brandPartnerDetails.jobTitle`
- **Phone Number** (Text Input) -> Maps to `brandPartnerDetails.phoneNumber`
- **ID Card** (File Uploader, Optional) -> Upload file first, map URL to `brandPartnerDetails.idCardUrl`

### Step 3: Brand Partner Business Details

- **RC Number (CAC)** (Text Input) -> Maps to `brandPartnerDetails.rcNumber`
- **Registered Address** (Text Input) -> Maps to `brandPartnerDetails.registeredAddress`
- **Certificate of Incorporation** (File Uploader, Required) -> Upload file first, map URL to `brandPartnerDetails.certificateOfIncorporationUrl`
- **Is this an Agency?** (Checkbox/Toggle) -> Maps to `brandPartnerDetails.isAgency`
  - _Conditional Field:_ If **Yes**, show **Brand Authorization Letter** (File Uploader, Required) -> Upload file first, map URL to `brandPartnerDetails.authorizationLetterUrl`. _If `isAgency` is true and this URL is missing, the API will reject the request._

### Step 4: Products Catalog

_This section should allow adding multiple products dynamically (e.g., an array of form groups)._
For **each** product added:

- **Brand Name** (Text Input) -> Maps to `brandName`
- **Product Category** (Dropdown) -> Maps to `category`. Options MUST strictly have values:
  - `"alcohol"` (Label: Alcohol)
  - `"non_alcoholic"` (Label: Non-Alcoholic)
  - `"fmcg"` (Label: FMCG)
  - `"other"` (Label: Other)
- **NAFDAC Registration Number** (Text Input, Optional) -> Maps to `nafdacNumber`
- **Product Image** (File Uploader, Required) -> Upload file first, map URL to `imageUrl`

### Step 5: Finalization

- **Terms of Use** (Checkbox, Required) -> Maps to `brandPartnerDetails.termsAccepted` (Must be strictly `true`)

---

## 2. File Upload Sequence

The `POST /api/v1/tenants` endpoint **does not accept raw files**. It requires string URLs.

**Sequence of Actions:**

1. When the user selects files (Certificate, ID Card, Product Images), upload them directly to the backend upload endpoint (e.g., `POST /api/v1/uploads`) or your Cloudinary/S3 provider.
2. Store the returned URLs in the form state.
3. Once the user clicks "Submit", construct the final JSON payload using the string URLs.

---

## 3. API Request Specification

**Endpoint:** `POST /api/v1/tenants`
**Authorization:** `Bearer <Superuser_JWT_Token>`
**Content-Type:** `application/json`

### Complete Request Payload Sample

```json
{
  "tenantName": "Acme Beverages Limited",
  "adminEmail": "jane.doe@acme.com",
  "password": "SecurePassword123!",
  "firstName": "Jane",
  "lastName": "Doe",
  "contactEmail": "hello@acme.com",

  "brandPartnerDetails": {
    "rcNumber": "RC123456",
    "registeredAddress": "123 Business St, Victoria Island, Lagos",
    "certificateOfIncorporationUrl": "https://res.cloudinary.com/demo/image/upload/certificate.pdf",

    "isAgency": false,
    "jobTitle": "Marketing Director",
    "phoneNumber": "+2348012345678",
    "idCardUrl": "https://res.cloudinary.com/demo/image/upload/idcard.jpg",
    "authorizationLetterUrl": "https://res.cloudinary.com/demo/image/upload/auth-letter.pdf",

    "products": [
      {
        "brandName": "Acme Cola",
        "category": "non_alcoholic",
        "nafdacNumber": "A1-1234",
        "imageUrl": "https://res.cloudinary.com/demo/image/upload/acme-cola.jpg"
      },
      {
        "brandName": "Acme Premium Lager",
        "category": "alcohol",
        "imageUrl": "https://res.cloudinary.com/demo/image/upload/acme-lager.jpg"
      }
    ],
    "termsAccepted": true
  }
}
```

---

## 4. API Response Handling

### Success Response (201 Created)

When successful, the backend provisions the Tenant sandbox, links the Admin user, and creates all the `brand_partners` and `brand_products` records atomically.

```json
{
  "message": "Tenant created successfully",
  "tenantId": "eefe03cc-bc04-45e0-997e-d9b80894e773",
  "tenantSlug": "acme-beverages-limited",
  "adminUserId": "02ad4563-ad01-cf56-baq1-q9bd8373b5a1"
}
```

_Frontend Action: Show a success toast, redirect the Platform Admin back to the Organizations list._

### Validation Errors (400 Bad Request)

If the form submission is missing required fields or violates rules (like agency requiring auth letters), the API returns a structured validation error.

```json
{
  "errors": {
    "brandPartnerDetails.termsAccepted": ["Terms of Use must be accepted"],
    "brandPartnerDetails.authorizationLetterUrl": ["Authorization Letter is required for Agencies"],
    "brandPartnerDetails.products.0.category": [
      "Invalid enum value. Expected 'alcohol' | 'non_alcoholic' | 'fmcg' | 'other'"
    ]
  }
}
```

_Frontend Action: Parse the `errors` object and highlight the corresponding input fields in red._

### Conflict Error (409 Conflict)

If an organization already exists with the same name/slug.

```json
{
  "code": "TENANT_ALREADY_EXISTS",
  "message": "A tenant already exists with slug 'acme-beverages-limited'"
}
```

_Frontend Action: Inform the user that the company name might already be registered in the system._
