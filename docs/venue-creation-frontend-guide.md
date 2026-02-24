# Venue Creation Frontend Implementation Guide

This guide outlines the required fields and implementation flow for creating a venue as an organization.

## Required Fields

Following recent backend updates, the following fields are now strictly required when creating a venue:

- `name`: The name of the venue (String).
- `city`: The city where the venue is located (String).
- `stateId`: The UUID of the state (String/UUID).
- `lgaId`: The UUID of the Local Government Area (String/UUID).

## Frontend Validation Schema (Zod)

If you are using [Zod](https://zod.dev/) on the frontend, use the following schema to ensure compatibility with the backend:

```typescript
import { z } from 'zod';

const createVenueSchema = z.object({
  name: z.string().min(1, 'Venue name is required'),
  city: z.string().min(1, 'City is required'),
  stateId: z.string().uuid('Please select a valid State'),
  lgaId: z.string().uuid('Please select a valid LGA'),
  // Optional fields
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  description: z.string().optional(),
  phoneNumber: z.string().optional(),
  email: z.string().email().optional(),
  status: z.enum(['active', 'inactive', 'draft']).optional().default('draft'),
});

type CreateVenueInput = z.infer<typeof createVenueSchema>;
```

## Sample Request Payload

When sending a `POST` request to `/api/v1/venues`, the payload should look like this:

```json
{
  "name": "Central Plaza",
  "city": "Ikeja",
  "stateId": "550e8400-e29b-41d4-a716-446655440000",
  "lgaId": "660e8400-e29b-41d4-a716-446655440000",
  "status": "active"
}
```

## Implementation Flow

To provide a good user experience, follow this flow for selecting location data:

1.  **Fetch States**: Call `GET /api/v1/locations/countries/:countryId/states` to populate the State dropdown.
    - _Note: You can usually default `countryId` to the project's primary country UUID._
2.  **Select State**: When the user selects a state, store the `stateId`.
3.  **Fetch LGAs**: Call `GET /api/v1/locations/states/:stateId/lgas` using the selected `stateId` to populate the LGA dropdown.
4.  **Select LGA**: The user selects an LGA, providing the `lgaId`.
5.  **Submit**: Send all required fields in the `POST /api/v1/venues` request.

## Error Handling

If any required field is missing, the backend will return a `400 Bad Request` with a standard Zod error format:

```json
{
  "errors": {
    "city": ["city is required"],
    "stateId": ["stateId must be a valid UUID"],
    "lgaId": ["lgaId must be a valid UUID"]
  }
}
```
