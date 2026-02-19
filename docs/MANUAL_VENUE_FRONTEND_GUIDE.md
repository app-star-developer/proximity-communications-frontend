# Manual Venue Entry - Frontend Implementation Guide

This guide details the frontend implementation for manually adding venues and bulk CSV uploads, ensuring data quality matches Google Places as closely as possible.

---

## 1. Critical Fields & Dropdowns

To ensure high data quality for manual entries, the following fields **MUST** be implemented as dropdowns or structured inputs.

### A. Primary Type (Dropdown)

**Required**. Used for venue categorization and filtering.

**Options (Source: `VenuePrimaryType`):**

```typescript
[
  { label: 'Hotel / Lodging', value: 'hotel' },
  { label: 'Restaurant', value: 'restaurant' },
  { label: 'Bar / Nightclub', value: 'bar' },
  { label: 'Cafe', value: 'cafe' },
  { label: 'Mall / Shopping Center', value: 'mall' },
  { label: 'Retail Store', value: 'retail' },
  { label: 'Entertainment (Cinema, Museum)', value: 'entertainment' },
  { label: 'Other', value: 'other' },
];
```

### B. Business Status (Dropdown)

**Optional**. Indicates the real-world operational status of the venue.

**Options:**

```typescript
[
  { label: 'Operational', value: 'OPERATIONAL' },
  { label: 'Temporarily Closed', value: 'CLOSED_TEMPORARILY' },
  { label: 'Permanently Closed', value: 'CLOSED_PERMANENTLY' },
];
```

### C. System Status (Dropdown)

**Required**. value defaults to 'active' if skipped.

**Options:**

```typescript
[
  { label: 'Active', value: 'active' },
  { label: 'Draft', value: 'draft' },
  { label: 'Inactive', value: 'inactive' },
];
```

### D. Country (Dropdown)

**Required**. ISO 3166-1 alpha-2 code.
**Recommendation**: Use a library like `country-list` or a static JSON list of countries relevant to your market.

**Example Data:**

```typescript
[
  { label: 'Nigeria', value: 'NG' },
  { label: 'Ghana', value: 'GH' },
  { label: 'United Kingdom', value: 'GB' },
  { label: 'United States', value: 'US' },
  // ...
];
```

### E. Timezone (Dropdown / Autocomplete)

**Required**. Essential for campaign scheduling.
**Recommendation**: Use `moment-timezone` or `Intl.supportedValuesOf('timeZone')` to populate this list.

**Example Data:**

```typescript
[
  { label: '(GMT+01:00) Lagos', value: 'Africa/Lagos' },
  { label: '(GMT+00:00) London', value: 'Europe/London' },
  { label: '(GMT-05:00) New York', value: 'America/New_York' },
  // ...
];
```

---

## 2. React Implementation Guide

### Recommended Stack

- **Form Handling**: `react-hook-form`
- **Validation**: `zod` + `@hookform/resolvers/zod`
- **UI Components**: `react-select` (for searchable dropdowns) or your UI library's Select component.

### Form Schema (Zod)

```typescript
import { z } from 'zod';

const manualVenueFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  addressLine1: z.string().optional(),
  city: z.string().optional(),
  countryCode: z.string().length(2, 'Select a valid country'),
  // Latitude/Longitude validation
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),

  // Dropdown fields
  primaryType: z.enum([
    'hotel',
    'restaurant',
    'bar',
    'cafe',
    'mall',
    'retail',
    'entertainment',
    'other',
  ]),
  status: z.enum(['active', 'draft', 'inactive']),
  businessStatus: z.enum(['OPERATIONAL', 'CLOSED_TEMPORARILY', 'CLOSED_PERMANENTLY']).optional(),
  timezone: z.string().min(1, 'Timezone is required'),
});
```

### Component Snippet

```tsx
import { useForm, Controller } from 'react-hook-form';
import Select from 'react-select'; // Example library

export const CreateVenueForm = () => {
  const { register, control, handleSubmit } = useForm({
    defaultValues: {
      status: 'active',
      countryCode: 'NG',
      timezone: 'Africa/Lagos',
      primaryType: 'other',
    },
  });

  const onSubmit = data => {
    // API Call to /api/venues/manual
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Name */}
      <input {...register('name')} placeholder="Venue Name" />

      {/* Primary Type Dropdown */}
      <Controller
        name="primaryType"
        control={control}
        render={({ field }) => (
          <Select
            {...field}
            options={[
              { value: 'restaurant', label: 'Restaurant' },
              { value: 'bar', label: 'Bar' },
              // ... load from constant
            ]}
            value={/* map string to option object */}
            onChange={val => field.onChange(val.value)}
          />
        )}
      />

      {/* Timezone Dropdown */}
      <Controller
        name="timezone"
        control={control}
        render={({ field }) => (
          <Select
            {...field}
            options={[
              { value: 'Africa/Lagos', label: 'Africa/Lagos' },
              // ...
            ]}
          />
        )}
      />

      {/* ... other fields */}

      <button type="submit">Create Venue</button>
    </form>
  );
};
```

---

## 3. CSV Bulk Upload Template

When providing a CSV template to users, ensure these headers are present to match the new fields.

| Header            | Required | Valid Values                        | Description                  |
| :---------------- | :------: | :---------------------------------- | :--------------------------- |
| `name`            |    ✅    | Text                                | Venue Name                   |
| `primaryType`     |    ❌    | `hotel`, `restaurant`, `bar`, ...   | Defaults to 'other' if empty |
| `status`          |    ❌    | `active`, `draft`, `inactive`       | Defaults to 'active'         |
| `business_status` |    ❌    | `OPERATIONAL`, `CLOSED_TEMPORARILY` |                              |
| `country_code`    |    ❌    | `NG`, `US`, `GB`...                 | ISO 2-letter code            |
| `timezone`        |    ❌    | `Africa/Lagos`, etc.                | Valid IANA timezone          |
| `latitude`        |    ❌    | `-90` to `90`                       | Decimal coordinates          |
| `longitude`       |    ❌    | `-180` to `180`                     | Decimal coordinates          |

**Note**: The CSV ingestor automatically maps `business_status` to the metadata field.
