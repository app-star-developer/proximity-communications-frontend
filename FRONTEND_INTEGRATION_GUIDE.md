# Frontend Integration Guide

## Overview

This guide provides frontend developers with everything needed to integrate with the Proximity Communications API's new multi-tenant superuser management system.

## Table of Contents

1. [Authentication Flow](#authentication-flow)
2. [User Types](#user-types)
3. [Tenant Context Management](#tenant-context-management)
4. [Access Levels](#access-levels)
5. [API Integration](#api-integration)
6. [TypeScript Types](#typescript-types)
7. [State Management](#state-management)
8. [UI Components](#ui-components)
9. [Error Handling](#error-handling)
10. [Testing](#testing)

## Authentication Flow

### Login Process

```typescript
// Login function
async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const response = await api.post('/v1/auth/login', credentials);
  return response.data;
}

// For platform superusers (omit tenant field)
const platformLogin = {
  email: 'superuser@platform.local',
  password: 'password123',
};

// For tenant-bound users (include tenant field)
const tenantLogin = {
  tenant: 'acme-corp',
  email: 'user@acme.com',
  password: 'password123',
};
```

### Response Handling

```typescript
const loginResponse = await login(credentials);

if (loginResponse.user.isPlatformUser) {
  // Platform user - show tenant selector
  setUserType('platform');
  setAccessibleTenants(loginResponse.accessibleTenants);
  // Prompt user to select a tenant
  showTenantSelector();
} else {
  // Regular tenant user - proceed to dashboard
  setUserType('tenant');
  setActiveTenant(loginResponse.user.tenantId);
  navigateToDashboard();
}

// Store tokens
localStorage.setItem('accessToken', loginResponse.accessToken);
localStorage.setItem('refreshToken', loginResponse.refreshToken);
```

## User Types

### Platform Superuser

- **Characteristics**:
  - `isPlatformUser: true`
  - `tenantId: null`
  - `tenantSlug: null`
  - Has `accessibleTenants` array in login response
  - Must select a tenant to work with

- **Permissions**:
  - Create, read, update, suspend tenants
  - Manage users across all tenants
  - Switch between tenant contexts

### Tenant-Bound User

- **Characteristics**:
  - `isPlatformUser: false`
  - `tenantId: string` (UUID)
  - `tenantSlug: string`
  - No tenant selector needed

- **Permissions**:
  - Based on access level (viewer, editor, admin)
  - Scoped to their assigned tenant

## Tenant Context Management

### For Platform Users

Platform users must select a tenant before accessing tenant-scoped resources:

```typescript
// State management
const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
const [accessibleTenants, setAccessibleTenants] = useState<AccessibleTenant[]>([]);

// Tenant selector component
function TenantSelector() {
  return (
    <select
      value={selectedTenant || ''}
      onChange={(e) => setSelectedTenant(e.target.value)}
    >
      <option value="">Select a tenant...</option>
      {accessibleTenants.map(tenant => (
        <option key={tenant.id} value={tenant.id}>
          {tenant.name} ({tenant.accessLevel})
        </option>
      ))}
    </select>
  );
}
```

### API Interceptor

Add the `X-Tenant-Context` header for platform users:

```typescript
// Axios interceptor
api.interceptors.request.use(config => {
  const user = getCurrentUser();

  if (user?.isPlatformUser && selectedTenant) {
    config.headers['X-Tenant-Context'] = selectedTenant;
  }

  return config;
});

// Fetch wrapper
async function fetchWithTenantContext(url: string, options: RequestInit = {}) {
  const user = getCurrentUser();

  if (user?.isPlatformUser && selectedTenant) {
    options.headers = {
      ...options.headers,
      'X-Tenant-Context': selectedTenant,
    };
  }

  return fetch(url, options);
}
```

## Access Levels

### Viewer

**Permissions:**

- Read campaigns, events, analytics, venues
- View geofencing data
- View notifications

**UI Restrictions:**

- Hide create/edit buttons
- Disable form inputs
- Show read-only badges

```typescript
const isViewer = accessLevel === 'viewer';

return (
  <div>
    <CampaignList />
    {!isViewer && <CreateCampaignButton />}
  </div>
);
```

### Editor

**Permissions:**

- All viewer permissions
- Create and edit campaigns
- Create and edit venues
- Send notifications
- Record events

**UI Restrictions:**

- Hide user management
- Show create/edit buttons
- Enable form inputs

```typescript
const canEdit = accessLevel === 'editor' || accessLevel === 'admin';

return (
  <div>
    <CampaignForm disabled={!canEdit} />
    {canEdit && <SaveButton />}
  </div>
);
```

### Admin

**Permissions:**

- All editor permissions
- Manage users (invite, update access, remove)
- Full tenant access

**UI Restrictions:**

- Show all features
- Display user management section

```typescript
const isAdmin = accessLevel === 'admin';

return (
  <div>
    <Dashboard />
    {isAdmin && <UserManagementLink />}
  </div>
);
```

## API Integration

### Campaigns

```typescript
// List campaigns
async function listCampaigns(params: CampaignListParams) {
  const response = await api.get('/v1/campaigns', { params });
  return response.data;
}

// Create campaign
async function createCampaign(data: CreateCampaignData) {
  const response = await api.post('/v1/campaigns', data);
  return response.data;
}

// Update campaign
async function updateCampaign(id: string, data: UpdateCampaignData) {
  const response = await api.put(`/v1/campaigns/${id}`, data);
  return response.data;
}
```

### Tenant Management (Platform Users Only)

```typescript
// List all tenants
async function listTenants(params: TenantListParams) {
  const response = await api.get('/v1/tenants', { params });
  return response.data;
}

// Create tenant
async function createTenant(data: CreateTenantData) {
  const response = await api.post('/v1/tenants', data);
  return response.data;
}

// Suspend tenant
async function suspendTenant(tenantId: string) {
  const response = await api.post(`/v1/tenants/${tenantId}/suspend`);
  return response.data;
}
```

### User Management (Admin Only)

```typescript
// List tenant users
async function listTenantUsers(tenantId: string) {
  const response = await api.get(`/v1/tenants/${tenantId}/users`);
  return response.data;
}

// Invite user
async function inviteUser(tenantId: string, data: InviteUserData) {
  const response = await api.post(`/v1/tenants/${tenantId}/users/invite`, data);
  return response.data;
}

// Update user access
async function updateUserAccess(tenantId: string, userId: string, data: UpdateAccessData) {
  const response = await api.patch(`/v1/tenants/${tenantId}/users/${userId}`, data);
  return response.data;
}

// Remove user
async function removeUser(tenantId: string, userId: string) {
  await api.delete(`/v1/tenants/${tenantId}/users/${userId}`);
}
```

## TypeScript Types

```typescript
// User types
interface AuthenticatedUser {
  id: string;
  email: string;
  tenantId: string | null;
  tenantSlug: string | null;
  isPlatformUser: boolean;
  roles: string[];
  permissions: string[];
}

interface AccessibleTenant {
  id: string;
  name: string;
  slug: string;
  accessLevel: AccessLevel;
}

type AccessLevel = 'viewer' | 'editor' | 'admin';

// Login types
interface LoginCredentials {
  tenant?: string;
  email: string;
  password: string;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
  sessionId: string;
  user: AuthenticatedUser;
  accessibleTenants?: AccessibleTenant[];
}

// Tenant types
interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'suspended';
  contactEmail: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

interface CreateTenantData {
  tenantName: string;
  tenantSlug?: string;
  contactEmail?: string;
  adminEmail: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

// User management types
interface TenantUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  status: 'invited' | 'active' | 'suspended';
  accessLevel: AccessLevel;
  grantedAt: string;
  expiresAt: string | null;
}

interface InviteUserData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  accessLevel: AccessLevel;
  expiresAt?: string;
}

// Campaign types
interface Campaign {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  slug: string;
  status: CampaignStatus;
  startAt: string | null;
  endAt: string | null;
  radiusMeters: number | null;
  timezone: string | null;
  budgetCents: number | null;
  venueIds: string[];
  createdAt: string;
  updatedAt: string;
}

type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled';
```

## State Management

### Using React Context

```typescript
// AuthContext.tsx
interface AuthContextType {
  user: AuthenticatedUser | null;
  selectedTenant: string | null;
  accessibleTenants: AccessibleTenant[];
  accessLevel: AccessLevel | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  selectTenant: (tenantId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  const [accessibleTenants, setAccessibleTenants] = useState<AccessibleTenant[]>([]);
  const [accessLevel, setAccessLevel] = useState<AccessLevel | null>(null);

  const login = async (credentials: LoginCredentials) => {
    const response = await api.post('/v1/auth/login', credentials);
    setUser(response.data.user);

    if (response.data.user.isPlatformUser) {
      setAccessibleTenants(response.data.accessibleTenants);
    } else {
      setSelectedTenant(response.data.user.tenantId);
    }

    localStorage.setItem('accessToken', response.data.accessToken);
    localStorage.setItem('refreshToken', response.data.refreshToken);
  };

  const selectTenant = (tenantId: string) => {
    setSelectedTenant(tenantId);
    const tenant = accessibleTenants.find(t => t.id === tenantId);
    setAccessLevel(tenant?.accessLevel || null);
  };

  const logout = () => {
    setUser(null);
    setSelectedTenant(null);
    setAccessibleTenants([]);
    setAccessLevel(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  };

  return (
    <AuthContext.Provider value={{
      user,
      selectedTenant,
      accessibleTenants,
      accessLevel,
      login,
      logout,
      selectTenant,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### Using Redux

```typescript
// authSlice.ts
interface AuthState {
  user: AuthenticatedUser | null;
  selectedTenant: string | null;
  accessibleTenants: AccessibleTenant[];
  accessLevel: AccessLevel | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  selectedTenant: null,
  accessibleTenants: [],
  accessLevel: null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<AuthenticatedUser>) => {
      state.user = action.payload;
    },
    setSelectedTenant: (state, action: PayloadAction<string>) => {
      state.selectedTenant = action.payload;
      const tenant = state.accessibleTenants.find(t => t.id === action.payload);
      state.accessLevel = tenant?.accessLevel || null;
    },
    setAccessibleTenants: (state, action: PayloadAction<AccessibleTenant[]>) => {
      state.accessibleTenants = action.payload;
    },
    logout: state => {
      state.user = null;
      state.selectedTenant = null;
      state.accessibleTenants = [];
      state.accessLevel = null;
    },
  },
});

export const { setUser, setSelectedTenant, setAccessibleTenants, logout } = authSlice.actions;
export default authSlice.reducer;
```

## UI Components

### Tenant Selector (Platform Users)

```typescript
function TenantSelector() {
  const { accessibleTenants, selectedTenant, selectTenant } = useAuth();

  return (
    <div className="tenant-selector">
      <label htmlFor="tenant-select">Active Tenant:</label>
      <select
        id="tenant-select"
        value={selectedTenant || ''}
        onChange={(e) => selectTenant(e.target.value)}
        className="form-select"
      >
        <option value="">Select a tenant...</option>
        {accessibleTenants.map(tenant => (
          <option key={tenant.id} value={tenant.id}>
            {tenant.name} ({tenant.accessLevel})
          </option>
        ))}
      </select>
    </div>
  );
}
```

### Access Level Badge

```typescript
function AccessLevelBadge({ level }: { level: AccessLevel }) {
  const colors = {
    viewer: 'bg-blue-100 text-blue-800',
    editor: 'bg-green-100 text-green-800',
    admin: 'bg-purple-100 text-purple-800',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[level]}`}>
      {level}
    </span>
  );
}
```

### Protected Route

```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredAccessLevel?: AccessLevel;
  platformOnly?: boolean;
}

function ProtectedRoute({
  children,
  requiredAccessLevel,
  platformOnly
}: ProtectedRouteProps) {
  const { user, accessLevel } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (platformOnly && !user.isPlatformUser) {
    return <Navigate to="/unauthorized" />;
  }

  if (requiredAccessLevel) {
    const levelHierarchy = { viewer: 1, editor: 2, admin: 3 };
    const userLevel = accessLevel ? levelHierarchy[accessLevel] : 0;
    const requiredLevel = levelHierarchy[requiredAccessLevel];

    if (userLevel < requiredLevel) {
      return <Navigate to="/unauthorized" />;
    }
  }

  return <>{children}</>;
}

// Usage
<Route path="/tenants" element={
  <ProtectedRoute platformOnly>
    <TenantsPage />
  </ProtectedRoute>
} />

<Route path="/users" element={
  <ProtectedRoute requiredAccessLevel="admin">
    <UserManagementPage />
  </ProtectedRoute>
} />
```

## Error Handling

### API Error Interceptor

```typescript
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 400) {
      const message = error.response.data?.message || '';

      if (message.includes('X-Tenant-Context')) {
        // Platform user hasn't selected a tenant
        toast.error('Please select a tenant to continue');
        // Redirect to tenant selector or show modal
        return Promise.reject(new Error('TENANT_CONTEXT_REQUIRED'));
      }
    }

    if (error.response?.status === 401) {
      // Token expired or invalid
      logout();
      navigate('/login');
      return Promise.reject(new Error('UNAUTHORIZED'));
    }

    if (error.response?.status === 403) {
      // Insufficient permissions
      toast.error('You do not have permission to perform this action');
      return Promise.reject(new Error('FORBIDDEN'));
    }

    return Promise.reject(error);
  },
);
```

### Error Display Component

```typescript
function ErrorBoundary({ error }: { error: Error }) {
  if (error.message === 'TENANT_CONTEXT_REQUIRED') {
    return (
      <div className="error-container">
        <h2>Tenant Selection Required</h2>
        <p>Please select a tenant from the dropdown to continue.</p>
        <TenantSelector />
      </div>
    );
  }

  if (error.message === 'FORBIDDEN') {
    return (
      <div className="error-container">
        <h2>Access Denied</h2>
        <p>You do not have permission to access this resource.</p>
        <Link to="/dashboard">Return to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="error-container">
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
    </div>
  );
}
```

## Testing

### Mock Data

```typescript
// test/mocks/auth.ts
export const mockPlatformUser: AuthenticatedUser = {
  id: 'user-1',
  email: 'superuser@platform.local',
  tenantId: null,
  tenantSlug: null,
  isPlatformUser: true,
  roles: ['superuser'],
  permissions: ['platform:tenants:read', 'platform:tenants:create'],
};

export const mockTenantUser: AuthenticatedUser = {
  id: 'user-2',
  email: 'user@acme.com',
  tenantId: 'tenant-1',
  tenantSlug: 'acme-corp',
  isPlatformUser: false,
  roles: ['admin'],
  permissions: ['campaigns:read', 'campaigns:write'],
};

export const mockAccessibleTenants: AccessibleTenant[] = [
  {
    id: 'tenant-1',
    name: 'Acme Corp',
    slug: 'acme-corp',
    accessLevel: 'admin',
  },
  {
    id: 'tenant-2',
    name: 'Beta Inc',
    slug: 'beta-inc',
    accessLevel: 'viewer',
  },
];
```

### Test Examples

```typescript
// Login.test.tsx
describe('Login', () => {
  it('should show tenant selector for platform users', async () => {
    const mockLogin = jest.fn().mockResolvedValue({
      user: mockPlatformUser,
      accessibleTenants: mockAccessibleTenants,
    });

    render(<Login onLogin={mockLogin} />);

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'superuser@platform.local' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(screen.getByText('Select a tenant...')).toBeInTheDocument();
    });
  });

  it('should redirect to dashboard for tenant users', async () => {
    const mockLogin = jest.fn().mockResolvedValue({
      user: mockTenantUser,
    });

    render(<Login onLogin={mockLogin} />);

    // ... login actions

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });
});
```

## Best Practices

1. **Always check user type before rendering UI**

   ```typescript
   if (user.isPlatformUser) {
     // Show tenant selector
   } else {
     // Show tenant-specific content
   }
   ```

2. **Validate tenant context before API calls**

   ```typescript
   if (user.isPlatformUser && !selectedTenant) {
     showTenantSelectorModal();
     return;
   }
   ```

3. **Use access level for conditional rendering**

   ```typescript
   const canEdit = ['editor', 'admin'].includes(accessLevel);
   ```

4. **Handle token expiration gracefully**

   ```typescript
   async function refreshToken() {
     const refreshToken = localStorage.getItem('refreshToken');
     const response = await api.post('/v1/auth/refresh', { refreshToken });
     localStorage.setItem('accessToken', response.data.accessToken);
   }
   ```

5. **Provide clear feedback for permission errors**
   ```typescript
   if (error.response?.status === 403) {
     toast.error('You need admin access to perform this action');
   }
   ```

## Additional Resources

- [API Documentation](./API_DOCUMENTATION.md)
- [OpenAPI Specification](../openapi/openapi.yaml)
- [Implementation Summary](../IMPLEMENTATION_SUMMARY.md)
- [README](../README.md)
