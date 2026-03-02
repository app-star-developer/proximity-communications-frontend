import {  useState } from 'react'
import {
  Link,
  createFileRoute,
  useNavigate,
  redirect,
} from '@tanstack/react-router'
import type { AxiosError } from 'axios'
import type { QueryClient } from '@tanstack/react-query'

import { requireAuth } from '@/utils/requireAuth'
import { useCreateTenant } from '@/hooks/useTenants'
import type { ApiErrorResponse, BrandCategory, BrandProduct } from '@/api/types'
import { useUIStore } from '@/state/uiStore'
import { isPlatformUser } from '@/utils/permissions'
import { useAuthStore } from '@/state/authStore'
import { uploadsApi } from '@/api/modules/uploads'

const STEPS = [
  'Basic Details',
  'Administrator',
  'Business Details',
  'Products Catalog',
  'Finalization',
] as const

export const Route = createFileRoute('/platform/tenants/new')({
  loader: async ({ context, location }) => {
    const { queryClient } = context as { queryClient: QueryClient }
    await requireAuth({
      queryClient,
      locationHref: location.href,
    })
    const { user } = useAuthStore.getState()
    if (!isPlatformUser(user)) {
      throw redirect({ to: '/' })
    }
    return null
  },
  component: NewTenantRoute,
})

function NewTenantRoute() {
  const navigate = useNavigate()
  const { pushToast } = useUIStore()
  
  const [step, setStep] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  
  const [formState, setFormState] = useState({
    tenantName: '',
    tenantSlug: '',
    contactEmail: '',
    adminEmail: '',
    password: '',
    firstName: '',
    lastName: '',
    jobTitle: '',
    phoneNumber: '',
    idCardUrl: '',
    rcNumber: '',
    registeredAddress: '',
    certificateOfIncorporationUrl: '',
    isAgency: false,
    authorizationLetterUrl: '',
    products: [] as BrandProduct[],
    termsAccepted: false,
  })

  // Local state for adding a product
  const [newProduct, setNewProduct] = useState<BrandProduct>({
    brandName: '',
    category: 'fmcg',
    nafdacNumber: '',
    imageUrl: '',
  })

  const createMutation = useCreateTenant()

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = event.target as HTMLInputElement
    const val = type === 'checkbox' ? (event.target as HTMLInputElement).checked : value
    setFormState((previous) => ({
      ...previous,
      [name]: val,
    }))
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      pushToast({
        id: 'upload-start',
        title: 'Uploading...',
        description: `Uploading ${fieldName.replace('Url', '').replace(/([A-Z])/g, ' $1').toLowerCase()}...`,
        intent: 'info',
      })
      const response = await uploadsApi.upload(file, file.name, 'tenants')
      setFormState(prev => ({ ...prev, [fieldName]: response.imageUrl }))
      pushToast({
        id: crypto.randomUUID(),
        title: 'Upload successful',
        description: `${file.name} uploaded.`,
        intent: 'success',
      })
    } catch (error) {
      pushToast({
        id: crypto.randomUUID(),
        title: 'Upload failed',
        description: 'Failed to upload file. Please try again.',
        intent: 'danger',
      })
    } finally {
      setIsUploading(false)
    }
  }

  const addProduct = () => {
    if (!newProduct.brandName || !newProduct.imageUrl) {
        pushToast({
            id: crypto.randomUUID(),
            title: 'Incomplete product',
            description: 'Brand name and image are required.',
            intent: 'warning'
        })
        return
    }
    setFormState(prev => ({
      ...prev,
      products: [...prev.products, newProduct]
    }))
    setNewProduct({
      brandName: '',
      category: 'fmcg',
      nafdacNumber: '',
      imageUrl: '',
    })
  }

  const removeProduct = (index: number) => {
    setFormState(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index)
    }))
  }

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const response = await uploadsApi.upload(file, file.name, 'brands')
      setNewProduct(prev => ({ ...prev, imageUrl: response.imageUrl }))
      pushToast({
        id: crypto.randomUUID(),
        title: 'Image uploaded',
        description: 'Product image ready.',
        intent: 'success',
      })
    } catch (error) {
      pushToast({
        id: crypto.randomUUID(),
        title: 'Upload failed',
        description: 'Failed to upload product image.',
        intent: 'danger',
      })
    } finally {
      setIsUploading(false)
    }
  }

  const nextStep = () => {
    // Validation before proceeding
    if (step === 0 && !formState.tenantName) {
        pushToast({ id: 'v0', title: 'Error', description: 'Company name is required.', intent: 'danger' })
        return
    }
    if (step === 1 && (!formState.adminEmail || !formState.password)) {
        pushToast({ id: 'v1', title: 'Error', description: 'Admin email and password are required.', intent: 'danger' })
        return
    }
    if (step === 2) {
        if (!formState.rcNumber || !formState.registeredAddress || !formState.certificateOfIncorporationUrl || !formState.phoneNumber) {
             pushToast({ id: 'v2', title: 'Error', description: 'RC Number, Address, Certificate, and Phone are required.', intent: 'danger' })
             return
        }
        if (formState.isAgency && !formState.authorizationLetterUrl) {
             pushToast({ id: 'v2a', title: 'Error', description: 'Authorization Letter is required for agencies.', intent: 'danger' })
             return
        }
    }
    if (step === 3 && formState.products.length === 0) {
        pushToast({ id: 'v3', title: 'Error', description: 'Please add at least one product.', intent: 'danger' })
        return
    }
    
    setStep(s => Math.min(s + 1, STEPS.length - 1))
  }

  const prevStep = () => setStep(s => Math.max(s - 1, 0))

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!formState.termsAccepted) {
        pushToast({
            id: crypto.randomUUID(),
            title: 'Terms not accepted',
            description: 'Please accept the Terms of Use to proceed.',
            intent: 'warning'
        })
        return
    }

    createMutation.mutate(
      {
        tenantName: formState.tenantName,
        tenantSlug: formState.tenantSlug || undefined,
        contactEmail: formState.contactEmail || undefined,
        adminEmail: formState.adminEmail,
        password: formState.password,
        firstName: formState.firstName || undefined,
        lastName: formState.lastName || undefined,
        brandPartnerDetails: {
          rcNumber: formState.rcNumber,
          registeredAddress: formState.registeredAddress,
          certificateOfIncorporationUrl: formState.certificateOfIncorporationUrl,
          isAgency: formState.isAgency,
          jobTitle: formState.jobTitle || undefined,
          phoneNumber: formState.phoneNumber,
          idCardUrl: formState.idCardUrl || undefined,
          authorizationLetterUrl: formState.authorizationLetterUrl || undefined,
          products: formState.products,
          termsAccepted: formState.termsAccepted,
        },
      },
      {
        onSuccess: (created) => {
          pushToast({
            id: crypto.randomUUID(),
            title: 'Organization created',
            description: `${formState.tenantName} onboarded successfully.`,
            intent: 'success',
          })
          navigate({
            to: '/platform/tenants/$tenantId',
            params: { tenantId: created.tenantId },
          })
        },
        onError: (error) => {
          const axiosError = error as AxiosError<ApiErrorResponse>
          const data = axiosError.response?.data as any
          const message = data?.message || 'Failed to create organization. Check the input and try again.'
          
          pushToast({
            id: crypto.randomUUID(),
            title: 'Creation failed',
            description: message,
            intent: 'danger',
          })
        },
      },
    )
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 rounded-2xl border border-slate-800/60 bg-slate-900/60 p-6 shadow-lg shadow-slate-950/30 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
             Brand Partner Onboarding
          </p>
          <h1 className="text-2xl font-semibold text-white">{STEPS[step]}</h1>
          <p className="mt-1 text-sm text-slate-400">
            Step {step + 1} of {STEPS.length}
          </p>
        </div>
        <Link
          to="/platform/tenants"
          className="text-sm text-slate-400 transition hover:text-slate-100"
        >
          Cancel
        </Link>
      </header>

      <div className="mb-6 flex gap-2 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
        {STEPS.map((_, i) => (
          <div 
            key={i} 
            className={`flex-1 transition-colors duration-300 ${i <= step ? 'bg-cyan-500' : 'bg-transparent'}`}
          />
        ))}
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-slate-800/60 bg-slate-950/60 p-6 shadow-lg shadow-slate-950/20"
      >
        {step === 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wide text-slate-500">
                Company Name *
              </label>
              <input
                name="tenantName"
                value={formState.tenantName}
                onChange={handleChange}
                required
                className="input-field"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wide text-slate-500">
                Contact Email (Optional)
              </label>
              <input
                name="contactEmail"
                type="email"
                value={formState.contactEmail}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wide text-slate-500">
                Organization Slug (Legacy)
              </label>
              <input
                name="tenantSlug"
                value={formState.tenantSlug}
                onChange={handleChange}
                placeholder="auto-generated"
                className="input-field"
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wide text-slate-500">First Name</label>
              <input name="firstName" value={formState.firstName} onChange={handleChange} className="input-field" />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wide text-slate-500">Last Name</label>
              <input name="lastName" value={formState.lastName} onChange={handleChange} className="input-field" />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wide text-slate-500">Work Email *</label>
              <input name="adminEmail" type="email" value={formState.adminEmail} onChange={handleChange} required className="input-field" />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wide text-slate-500">Temporary Password *</label>
              <input name="password" type="password" value={formState.password} onChange={handleChange} required minLength={8} className="input-field" />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wide text-slate-500">Job Title</label>
              <input name="jobTitle" value={formState.jobTitle} onChange={handleChange} className="input-field" />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wide text-slate-500">Phone Number *</label>
              <input name="phoneNumber" value={formState.phoneNumber} onChange={handleChange} required className="input-field" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs uppercase tracking-wide text-slate-500">ID Card (Optional)</label>
              <FileUploader onUpload={(e) => handleFileUpload(e, 'idCardUrl')} currentUrl={formState.idCardUrl} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wide text-slate-500">RC Number (CAC) *</label>
              <input name="rcNumber" value={formState.rcNumber} onChange={handleChange} required className="input-field" />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wide text-slate-500">Registered Address *</label>
              <input name="registeredAddress" value={formState.registeredAddress} onChange={handleChange} required className="input-field" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs uppercase tracking-wide text-slate-500">Certificate of Incorporation *</label>
              <FileUploader onUpload={(e) => handleFileUpload(e, 'certificateOfIncorporationUrl')} currentUrl={formState.certificateOfIncorporationUrl} required />
            </div>
            <div className="flex items-center gap-3 py-2">
              <input 
                id="isAgency"
                name="isAgency" 
                type="checkbox" 
                checked={formState.isAgency} 
                onChange={handleChange} 
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500/30"
              />
              <label htmlFor="isAgency" className="text-sm text-slate-300">Is this an Agency?</label>
            </div>
            {formState.isAgency && (
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs uppercase tracking-wide text-slate-500">Brand Authorization Letter *</label>
                <FileUploader onUpload={(e) => handleFileUpload(e, 'authorizationLetterUrl')} currentUrl={formState.authorizationLetterUrl} required />
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-4">
              <h3 className="text-sm font-semibold text-white">Add New Product</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wide text-slate-500">Brand Name</label>
                  <input 
                    value={newProduct.brandName} 
                    onChange={e => setNewProduct(p => ({ ...p, brandName: e.target.value }))}
                    className="input-field text-xs"
                    placeholder="e.g. Acme Cola"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wide text-slate-500">Category</label>
                  <select 
                    value={newProduct.category} 
                    onChange={e => setNewProduct(p => ({ ...p, category: e.target.value as BrandCategory }))}
                    className="input-field text-xs"
                  >
                    <option value="alcohol">Alcohol</option>
                    <option value="non_alcoholic">Non-Alcoholic</option>
                    <option value="fmcg">FMCG</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wide text-slate-500">NAFDAC No. (Optional)</label>
                  <input 
                    value={newProduct.nafdacNumber} 
                    onChange={e => setNewProduct(p => ({ ...p, nafdacNumber: e.target.value }))}
                    className="input-field text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wide text-slate-500">Product Image *</label>
                  <FileUploader onUpload={handleProductImageUpload} currentUrl={newProduct.imageUrl} compact />
                </div>
              </div>
              <button 
                type="button" 
                onClick={addProduct}
                className="w-full rounded-lg bg-slate-800 py-2 text-xs font-semibold text-white transition hover:bg-slate-700"
              >
                + Add Product to List
              </button>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white">Products ({formState.products.length})</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {formState.products.map((product, idx) => (
                  <div key={idx} className="relative group rounded-xl border border-slate-800 bg-slate-900/60 p-3 flex gap-3 overflow-hidden">
                    <img src={product.imageUrl} className="h-12 w-12 rounded shadow object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm truncate">{product.brandName}</p>
                      <p className="text-[10px] text-slate-400 uppercase">{product.category.replace('_', ' ')}</p>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => removeProduct(idx)}
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white underline decoration-cyan-500/30 underline-offset-4">Review Summary</h3>
              <div className="grid gap-6 md:grid-cols-2">
                <section className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase">Organization</h4>
                  <p className="text-sm text-slate-200">{formState.tenantName}</p>
                  <p className="text-xs text-slate-400">{formState.contactEmail || 'No contact email'}</p>
                </section>
                <section className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase">Administrator</h4>
                  <p className="text-sm text-slate-200">{formState.firstName} {formState.lastName}</p>
                  <p className="text-xs text-slate-400">{formState.adminEmail}</p>
                </section>
                <section className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase">Business Info</h4>
                  <p className="text-sm text-slate-200">RC: {formState.rcNumber}</p>
                  <p className="text-xs text-slate-400">Type: {formState.isAgency ? 'Agency' : 'Direct Brand'}</p>
                </section>
                <section className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase">Catalog</h4>
                  <p className="text-sm text-slate-200">{formState.products.length} Products added</p>
                </section>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <input 
                 id="terms"
                 name="termsAccepted" 
                 type="checkbox" 
                 required 
                 checked={formState.termsAccepted} 
                 onChange={handleChange} 
                 className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500/30"
              />
              <label htmlFor="terms" className="text-xs text-slate-400 leading-relaxed">
                I hereby confirm that I have the legal authority to register this organization and that all provided information and documents are authentic. I accept the <span className="text-cyan-400 cursor-pointer">Terms of Use</span> and <span className="text-cyan-400 cursor-pointer">Privacy Policy</span>.
              </label>
            </div>
          </div>
        )}

        <footer className="flex items-center justify-between pt-4 border-t border-slate-800/60">
          <button
            type="button"
            onClick={prevStep}
            disabled={step === 0 || createMutation.isPending || isUploading}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-400 transition hover:text-slate-100 disabled:opacity-30"
          >
            Previous
          </button>
          
          <div className="flex gap-3">
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={isUploading}
                className="rounded-lg bg-cyan-500 px-6 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50"
              >
                Continue
              </button>
            ) : (
              <button
                type="submit"
                disabled={createMutation.isPending || !formState.termsAccepted || isUploading}
                className="rounded-lg bg-cyan-500 px-6 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50"
              >
                {createMutation.isPending ? 'Finalizing...' : 'Complete Onboarding'}
              </button>
            )}
          </div>
        </footer>
      </form>

      <style>{`
        .input-field {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid #334155;
          background-color: #0f172a;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          color: #e2e8f0;
          outline: none;
          transition: border-color 0.2s;
        }
        .input-field:focus {
          border-color: #06b6d4;
          box-shadow: 0 0 0 2px rgba(6, 182, 212, 0.3);
        }
      `}</style>
    </div>
  )
}

function FileUploader({ 
  onUpload, 
  currentUrl, 
  required, 
  compact 
}: { 
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void, 
  currentUrl?: string,
  required?: boolean,
  compact?: boolean
}) {
  return (
    <div className={`relative flex items-center gap-3 rounded-lg border border-dashed p-3 transition ${currentUrl ? 'border-cyan-500/50 bg-cyan-500/5' : 'border-slate-700 bg-slate-900/50'}`}>
      <div className={`overflow-hidden rounded bg-slate-800 flex items-center justify-center text-slate-500 ${compact ? 'h-8 w-8' : 'h-10 w-10'}`}>
        {currentUrl ? (
          <img src={currentUrl} className="h-full w-full object-cover" />
        ) : (
          <span className="text-xl">↑</span>
        )}
      </div>
      <div className="flex-1">
        <p className="text-xs font-medium text-slate-300">
          {currentUrl ? "File ready" : "Choose file..."}
        </p>
        {currentUrl && !compact && (
          <p className="text-[10px] text-cyan-400 truncate max-w-[200px]">{currentUrl}</p>
        )}
      </div>
      <label className="cursor-pointer rounded-md bg-slate-800 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-700">
        Browse
        <input type="file" className="hidden" onChange={onUpload} required={required && !currentUrl} />
      </label>
    </div>
  )
}
