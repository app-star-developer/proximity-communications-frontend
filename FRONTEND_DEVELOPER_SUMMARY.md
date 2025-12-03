# Frontend Developer Summary

## What Changed?

The Proximity Communications Server has been updated to support a **multi-tenant superuser management system**. This document summarizes the key changes for frontend integration.

## Key Changes

### 1. **New User Type: Platform Superuser**

- Platform superusers can manage multiple tenants
- They are NOT tied to any specific tenant
- They must select a tenant context before accessing tenant-scoped resources
- Identified by `isPlatformUser: true` in the user object

### 2. **Tenant Context Switching**

- Platform users must include the `X-Tenant-Context` header with a tenant UUID on all tenant-scoped API calls
- Tenant-bound users do NOT need this header (their context is implicit)
- Missing this header for platform users will result in a 400 error

### 3. **Access Levels**

The system supports three access levels, but in the managed service model, business users should only have viewer access:

| Level      | Permissions                                                    | Usage                             |
| ---------- | -------------------------------------------------------------- | --------------------------------- |
| **viewer** | Read-only access to all resources                              | ✅ **Use for all business users** |
| **editor** | Read + write access (campaigns, venues, events, notifications) | ⚠️ Reserved for future use        |
| **admin**  | Full access including user management                          | ⚠️ Platform superusers only       |

**Important**: In your managed service model, all business users should be invited with `accessLevel: "viewer"` for read-only access.

### 4. **Self-Service Signup Disabled**

- The `/v1/auth/signup` endpoint is no longer available
- Only platform superusers can create new tenants via `/v1/tenants`

## API Changes

### Authentication

#### Login Endpoint: `POST /v1/auth/login`

**Platform User Login (no tenant field):**

```json
{
  "email": "superuser@platform.local",
  "password": "password"
}
```

**Response includes `accessibleTenants`:**

```json
{
  "accessToken": "...",
  "user": {
    "isPlatformUser": true,
    "tenantId": null,
    ...
  },
  "accessibleTenants": [
    {
      "id": "tenant-uuid",
      "name": "Acme Corp",
      "slug": "acme-corp",
      "accessLevel": "admin"
    }
  ]
}
```

**Tenant User Login (with tenant field):**

```json
{
  "tenant": "acme-corp",
  "email": "user@acme.com",
  "password": "password"
}
```

**Response (no `accessibleTenants`):**

```json
{
  "accessToken": "...",
  "user": {
    "isPlatformUser": false,
    "tenantId": "tenant-uuid",
    "tenantSlug": "acme-corp",
    ...
  }
}
```

#### New Endpoint: `GET /v1/auth/accessible-tenants`

Retrieves the list of tenants the authenticated user can access.

### New Platform Management Endpoints

All require platform superuser permissions:

- `GET /v1/tenants` - List all tenants
- `POST /v1/tenants` - Create a new tenant
- `GET /v1/tenants/:id` - Get tenant details
- `PATCH /v1/tenants/:id` - Update tenant
- `POST /v1/tenants/:id/suspend` - Suspend tenant
- `POST /v1/tenants/:id/activate` - Activate tenant

### New User Management Endpoints

Require admin access level (or platform superuser):

- `GET /v1/tenants/:tenantId/users` - List tenant users
- `POST /v1/tenants/:tenantId/users/invite` - Invite user to tenant
- `PATCH /v1/tenants/:tenantId/users/:userId` - Update user access level
- `DELETE /v1/tenants/:tenantId/users/:userId` - Remove user from tenant

### Existing Endpoints Updated

All tenant-scoped endpoints (campaigns, venues, events, etc.) now:

- Require `X-Tenant-Context` header for platform users
- Use `activeTenantId` from the request context instead of `user.tenantId`

## Frontend Implementation Checklist

### 1. Update Login Flow

- [ ] Check `isPlatformUser` in login response
- [ ] Store `accessibleTenants` for platform users
- [ ] Show tenant selector for platform users
- [ ] Redirect tenant users directly to dashboard

### 2. Add Tenant Context Management

- [ ] Create state for `selectedTenant`
- [ ] Add tenant selector component (for platform users)
- [ ] Implement API interceptor to add `X-Tenant-Context` header
- [ ] Handle 400 error when tenant context is missing

### 3. Implement Access Level Controls

- [ ] Store user's `accessLevel` in state
- [ ] Create permission check utilities
- [ ] Add conditional rendering based on access level
- [ ] Disable/hide UI elements based on permissions

### 4. Update API Calls

- [ ] Ensure all tenant-scoped calls include tenant context
- [ ] Add new tenant management API functions (platform users)
- [ ] Add new user management API functions (admins)
- [ ] Handle new error responses

### 5. Update TypeScript Types

- [ ] Add `isPlatformUser` to user type
- [ ] Make `tenantId` and `tenantSlug` nullable
- [ ] Add `AccessibleTenant` type
- [ ] Add `AccessLevel` type
- [ ] Update login response type

### 6. Add UI Components

- [ ] Tenant selector dropdown
- [ ] Access level badge
- [ ] Platform-only routes
- [ ] Admin-only sections
- [ ] Permission-based buttons

### 7. Error Handling

- [ ] Handle missing tenant context (400)
- [ ] Handle insufficient permissions (403)
- [ ] Show appropriate error messages
- [ ] Redirect to tenant selector when needed

### 8. Testing

- [ ] Test platform user login flow
- [ ] Test tenant user login flow
- [ ] Test tenant context switching
- [ ] Test access level restrictions
- [ ] Test error scenarios

## Quick Start Example

```typescript
// 1. Login
const response = await login(credentials);

// 2. Check user type
if (response.user.isPlatformUser) {
  // Platform user
  setAccessibleTenants(response.accessibleTenants);
  showTenantSelector();
} else {
  // Tenant user
  setActiveTenant(response.user.tenantId);
  navigateToDashboard();
}

// 3. Add API interceptor
api.interceptors.request.use((config) => {
  if (user?.isPlatformUser && selectedTenant) {
    config.headers['X-Tenant-Context'] = selectedTenant;
  }
  return config;
});

// 4. Conditional rendering
const canEdit = accessLevel === 'editor' || accessLevel === 'admin';
const canManageUsers = accessLevel === 'admin';

return (
  <div>
    {user.isPlatformUser && <TenantSelector />}
    <CampaignList />
    {canEdit && <CreateCampaignButton />}
    {canManageUsers && <UserManagementLink />}
  </div>
);
```

## Documentation Files

1. **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - Complete API reference with examples
2. **[FRONTEND_INTEGRATION_GUIDE.md](./FRONTEND_INTEGRATION_GUIDE.md)** - Detailed integration guide with code samples
3. **[OpenAPI Specification](../openapi/openapi.yaml)** - Machine-readable API spec
4. **[README.md](../README.md)** - Updated project documentation

## OpenAPI/Swagger

The complete OpenAPI 3.1 specification is available at `openapi/openapi.yaml`.

**Use it to:**

- Generate TypeScript client SDK
- Import into Postman/Insomnia
- View in Swagger UI
- Validate requests/responses

**Validate the spec:**

```bash
pnpm run docs:openapi:validate
```

**Export to Postman:**

```bash
pnpm run docs:postman:export
```

## Need Help?

- Check the [Frontend Integration Guide](./FRONTEND_INTEGRATION_GUIDE.md) for detailed examples
- Review the [API Documentation](./API_DOCUMENTATION.md) for endpoint details
- Refer to the [Implementation Summary](../IMPLEMENTATION_SUMMARY.md) for backend changes
- Use the OpenAPI spec to generate client code

## Breaking Changes

⚠️ **Important:**

1. **User object structure changed** - `tenantId` and `tenantSlug` are now nullable
2. **Login response changed** - Platform users receive `accessibleTenants` array
3. **Self-service signup removed** - `/v1/auth/signup` endpoint disabled
4. **Tenant context required** - Platform users must include `X-Tenant-Context` header

## Migration Path

1. Update TypeScript types to match new user structure
2. Implement tenant selector UI for platform users
3. Add API interceptor for tenant context header
4. Update permission checks to use access levels
5. Test thoroughly with both user types
6. Deploy frontend and backend together

## Questions?

Contact the backend team or refer to the comprehensive documentation in the `docs/` directory.
