import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { format, parseISO } from 'date-fns'
import { useId, useState } from 'react'
import { promoCodesApi } from '../api/modules/promoCodes'
import type {
	ApiErrorResponse,
	CreatePromoCodeRequest,
	UpdatePromoCodeRequest,
	PromoCode,
	PromoCodeStatus,
} from '../api/types'
import { useUIStore } from '../state/uiStore'

interface PromoCodesSectionProps {
	campaignId: string
}

export function PromoCodesSection({ campaignId }: PromoCodesSectionProps) {
	const { pushToast } = useUIStore()
	const queryClient = useQueryClient()
	const [showCreateForm, setShowCreateForm] = useState(false)

	const promoCodesQuery = useQuery({
		queryKey: ['promo-codes', campaignId],
		queryFn: () => promoCodesApi.list(campaignId),
	})

	const createMutation = useMutation({
		mutationFn: (payload: CreatePromoCodeRequest) =>
			promoCodesApi.create(campaignId, payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['promo-codes', campaignId] })
			pushToast({
				id: crypto.randomUUID(),
				title: 'Promo code created',
				description: 'The promo code has been created successfully.',
				intent: 'success',
			})
			setShowCreateForm(false)
		},
		onError: (error) => {
			const axiosError = error as AxiosError<ApiErrorResponse>
			pushToast({
				id: crypto.randomUUID(),
				title: 'Failed to create promo code',
				description:
					axiosError.response?.data && 'message' in axiosError.response.data
						? axiosError.response.data.message
						: 'Please try again.',
				intent: 'danger',
			})
		},
	})

	const deleteMutation = useMutation({
		mutationFn: (promoCodeId: string) => promoCodesApi.delete(promoCodeId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['promo-codes', campaignId] })
			pushToast({
				id: crypto.randomUUID(),
				title: 'Promo code revoked',
				description: 'The promo code has been revoked.',
				intent: 'success',
			})
		},
		onError: (error) => {
			const axiosError = error as AxiosError<ApiErrorResponse>
			pushToast({
				id: crypto.randomUUID(),
				title: 'Failed to revoke promo code',
				description:
					axiosError.response?.data && 'message' in axiosError.response.data
						? axiosError.response.data.message
						: 'Please try again.',
				intent: 'danger',
			})
		},
	})

	const updateMutation = useMutation({
		mutationFn: ({
			promoCodeId,
			payload,
		}: {
			promoCodeId: string
			payload: UpdatePromoCodeRequest
		}) => promoCodesApi.update(promoCodeId, payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['promo-codes', campaignId] })
			pushToast({
				id: crypto.randomUUID(),
				title: 'Promo code updated',
				description: 'The promo code has been updated successfully.',
				intent: 'success',
			})
		},
		onError: (error) => {
			const axiosError = error as AxiosError<ApiErrorResponse>
			pushToast({
				id: crypto.randomUUID(),
				title: 'Failed to update promo code',
				description:
					axiosError.response?.data && 'message' in axiosError.response.data
						? axiosError.response.data.message
						: 'Please try again.',
				intent: 'danger',
			})
		},
	})

	const regenerateMutation = useMutation({
		mutationFn: (promoCodeId: string) =>
			promoCodesApi.regenerate(promoCodeId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['promo-codes', campaignId] })
			pushToast({
				id: crypto.randomUUID(),
				title: 'Promo code regenerated',
				description: 'A new promo code has been generated.',
				intent: 'success',
			})
		},
		onError: (error) => {
			const axiosError = error as AxiosError<ApiErrorResponse>
			pushToast({
				id: crypto.randomUUID(),
				title: 'Failed to regenerate promo code',
				description:
					axiosError.response?.data && 'message' in axiosError.response.data
						? axiosError.response.data.message
						: 'Please try again.',
				intent: 'danger',
			})
		},
	})

	const handleDelete = (promoCode: PromoCode) => {
		if (
			!window.confirm(
				`Revoke promo code "${promoCode.code}"? This action cannot be undone.`,
			)
		)
			return
		deleteMutation.mutate(promoCode.id)
	}

	const handleUpdate = (promoCode: PromoCode, payload: UpdatePromoCodeRequest) => {
		updateMutation.mutate({ promoCodeId: promoCode.id, payload })
	}

	const handleRegenerate = (promoCode: PromoCode) => {
		if (
			!window.confirm(
				`Regenerate promo code "${promoCode.code}"? The old code will be revoked.`,
			)
		)
			return
		regenerateMutation.mutate(promoCode.id)
	}

	const promoCodes = promoCodesQuery.data?.data ?? []

	return (
		<section className="space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="text-sm font-semibold text-slate-300">Promo Codes</h3>
					<p className="text-xs text-slate-500">
						Manage promo codes for this campaign. Users can redeem these codes
						in the mobile app.
					</p>
				</div>
				{!showCreateForm && (
					<button
						type="button"
						onClick={() => setShowCreateForm(true)}
						className="rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-cyan-400"
					>
						Create Promo Code
					</button>
				)}
			</div>

			{showCreateForm && (
				<CreatePromoCodeForm
					campaignId={campaignId}
					onSubmit={(payload) => createMutation.mutate(payload)}
					onCancel={() => setShowCreateForm(false)}
					isPending={createMutation.isPending}
				/>
			)}

			{promoCodesQuery.isLoading ? (
				<div className="text-sm text-slate-500">Loading promo codes…</div>
			) : promoCodes.length === 0 ? (
				<div className="rounded-lg border border-dashed border-slate-800 bg-slate-900/50 px-4 py-6 text-center text-sm text-slate-500">
					No promo codes yet. Create one to get started.
				</div>
			) : (
				<div className="space-y-2">
					{promoCodes.map((promoCode) => (
						<PromoCodeCard
							key={promoCode.id}
							promoCode={promoCode}
							onUpdate={(payload) => handleUpdate(promoCode, payload)}
							onDelete={() => handleDelete(promoCode)}
							onRegenerate={() => handleRegenerate(promoCode)}
							isRegenerating={regenerateMutation.isPending}
							isUpdating={updateMutation.isPending}
						/>
					))}
				</div>
			)}
		</section>
	)
}

function PromoCodeCard({
	promoCode,
	onUpdate,
	onDelete,
	onRegenerate,
	isRegenerating,
	isUpdating,
}: {
	promoCode: PromoCode
	onUpdate: (payload: UpdatePromoCodeRequest) => void
	onDelete: () => void
	onRegenerate: () => void
	isRegenerating: boolean
	isUpdating: boolean
}) {
	const [isEditing, setIsEditing] = useState(false)
	const isValid =
		promoCode.status === 'active' &&
		(!promoCode.validFrom ||
			new Date(promoCode.validFrom) <= new Date()) &&
		(!promoCode.validTo || new Date(promoCode.validTo) >= new Date()) &&
		promoCode.currentUses < promoCode.maxUses

	if (isEditing) {
		return (
			<EditPromoCodeForm
				promoCode={promoCode}
				onSubmit={(payload) => {
					onUpdate(payload)
					setIsEditing(false)
				}}
				onCancel={() => setIsEditing(false)}
				isPending={isUpdating}
			/>
		)
	}

	return (
		<div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
			<div className="flex items-start justify-between">
				<div className="flex-1">
					<div className="flex items-center gap-3">
						<code className="rounded bg-slate-950 px-2 py-1 font-mono text-sm font-semibold text-cyan-300">
							{promoCode.code}
						</code>
						<span
							className={`rounded-full px-2 py-0.5 text-xs ${
								promoCode.status === 'active'
									? 'bg-green-500/20 text-green-300'
									: promoCode.status === 'draft'
										? 'bg-amber-500/20 text-amber-300'
										: 'bg-red-500/20 text-red-300'
							}`}
						>
							{promoCode.status}
						</span>
						{!isValid && promoCode.status === 'active' && (
							<span className="text-xs text-amber-500">Invalid/Expired</span>
						)}
					</div>
					<div className="mt-2 grid gap-2 text-xs text-slate-400 sm:grid-cols-2">
						<div>
							Uses: {promoCode.currentUses} / {promoCode.maxUses}
						</div>
						{promoCode.maxUsesPerUser && (
							<div>Max per user: {promoCode.maxUsesPerUser}</div>
						)}
						{promoCode.validFrom && (
							<div>
								Valid from:{' '}
								{format(parseISO(promoCode.validFrom), 'MMM d, yyyy')}
							</div>
						)}
						{promoCode.validTo && (
							<div>
								Valid until:{' '}
								{format(parseISO(promoCode.validTo), 'MMM d, yyyy')}
							</div>
						)}
					</div>
				</div>
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={() => setIsEditing(true)}
						disabled={isUpdating}
						className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 transition hover:border-cyan-500 hover:text-cyan-300 disabled:opacity-50"
					>
						Edit
					</button>
					{promoCode.status === 'active' && (
						<button
							type="button"
							onClick={onRegenerate}
							disabled={isRegenerating}
							className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 transition hover:border-cyan-500 hover:text-cyan-300 disabled:opacity-50"
						>
							Regenerate
						</button>
					)}
					<button
						type="button"
						onClick={onDelete}
						className="rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-1.5 text-xs text-red-300 transition hover:bg-red-500/20"
					>
						Revoke
					</button>
				</div>
			</div>
		</div>
	)
}

function CreatePromoCodeForm({
	
	onSubmit,
	onCancel,
	isPending,
}: {
	campaignId: string
	onSubmit: (payload: CreatePromoCodeRequest) => void
	onCancel: () => void
	isPending: boolean
}) {
	const codeId = useId()
	const maxUsesId = useId()
	const maxUsesPerUserId = useId()
	const validFromId = useId()
	const validToId = useId()

	const [formState, setFormState] = useState({
		code: '',
		status: 'active' as PromoCodeStatus,
		maxUses: 100,
		maxUsesPerUser: 1,
		validFrom: '',
		validTo: '',
	})

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		onSubmit({
			code: formState.code.trim() || undefined,
			status: formState.status,
			maxUses: formState.maxUses,
			maxUsesPerUser: formState.maxUsesPerUser || undefined,
			validFrom: formState.validFrom || undefined,
			validTo: formState.validTo || undefined,
		})
	}

	return (
		<form
			onSubmit={handleSubmit}
			className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 space-y-4"
		>
			<div className="grid gap-4 sm:grid-cols-2">
				<div className="space-y-2">
					<label
						htmlFor={codeId}
						className="text-xs uppercase tracking-wide text-slate-500"
					>
						Code (optional - auto-generated if empty)
					</label>
					<input
						id={codeId}
						type="text"
						value={formState.code}
						onChange={(e) =>
							setFormState((prev) => ({ ...prev, code: e.target.value }))
						}
						className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
						placeholder="SUMMER2025"
					/>
				</div>
				<div className="space-y-2">
					<label
						htmlFor={`${codeId}-status`}
						className="text-xs uppercase tracking-wide text-slate-500"
					>
						Status *
					</label>
					<select
						id={`${codeId}-status`}
						value={formState.status}
						onChange={(e) =>
							setFormState((prev) => ({
								...prev,
								status: e.target.value as PromoCodeStatus,
							}))
						}
						className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
					>
						<option value="draft">Draft</option>
						<option value="active">Active</option>
					</select>
				</div>
				<div className="space-y-2">
					<label
						htmlFor={maxUsesId}
						className="text-xs uppercase tracking-wide text-slate-500"
					>
						Max Uses *
					</label>
					<input
						id={maxUsesId}
						type="number"
						min="1"
						value={formState.maxUses}
						onChange={(e) =>
							setFormState((prev) => ({
								...prev,
								maxUses: parseInt(e.target.value, 10) || 1,
							}))
						}
						required
						className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
					/>
				</div>
				<div className="space-y-2">
					<label
						htmlFor={maxUsesPerUserId}
						className="text-xs uppercase tracking-wide text-slate-500"
					>
						Max Uses Per User
					</label>
					<input
						id={maxUsesPerUserId}
						type="number"
						min="1"
						value={formState.maxUsesPerUser}
						onChange={(e) =>
							setFormState((prev) => ({
								...prev,
								maxUsesPerUser: parseInt(e.target.value, 10) || 1,
							}))
						}
						className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
					/>
				</div>
				<div className="space-y-2">
					<label
						htmlFor={validFromId}
						className="text-xs uppercase tracking-wide text-slate-500"
					>
						Valid From (optional)
					</label>
					<input
						id={validFromId}
						type="datetime-local"
						value={formState.validFrom}
						onChange={(e) =>
							setFormState((prev) => ({ ...prev, validFrom: e.target.value }))
						}
						className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
					/>
				</div>
				<div className="space-y-2">
					<label
						htmlFor={validToId}
						className="text-xs uppercase tracking-wide text-slate-500"
					>
						Valid To (optional)
					</label>
					<input
						id={validToId}
						type="datetime-local"
						value={formState.validTo}
						onChange={(e) =>
							setFormState((prev) => ({ ...prev, validTo: e.target.value }))
						}
						className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
					/>
				</div>
			</div>
			<div className="flex items-center justify-end gap-3">
				<button
					type="button"
					onClick={onCancel}
					className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:text-slate-200"
				>
					Cancel
				</button>
				<button
					type="submit"
					disabled={isPending}
					className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 disabled:cursor-not-allowed disabled:bg-cyan-500/50"
				>
					{isPending ? 'Creating…' : 'Create Promo Code'}
				</button>
			</div>
		</form>
	)
}

function EditPromoCodeForm({
	promoCode,
	onSubmit,
	onCancel,
	isPending,
}: {
	promoCode: PromoCode
	onSubmit: (payload: UpdatePromoCodeRequest) => void
	onCancel: () => void
	isPending: boolean
}) {
	const maxUsesId = useId()
	const statusId = useId()
	const validFromId = useId()
	const validToId = useId()

	const [formState, setFormState] = useState({
		maxUses: promoCode.maxUses,
		status: promoCode.status,
		validFrom: promoCode.validFrom
			? format(parseISO(promoCode.validFrom), "yyyy-MM-dd'T'HH:mm")
			: '',
		validTo: promoCode.validTo
			? format(parseISO(promoCode.validTo), "yyyy-MM-dd'T'HH:mm")
			: '',
	})

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		onSubmit({
			maxUses: formState.maxUses,
			status: formState.status,
			validFrom: formState.validFrom || null,
			validTo: formState.validTo || null,
		})
	}

	return (
		<form
			onSubmit={handleSubmit}
			className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 space-y-4"
		>
			<div className="flex items-center gap-3 mb-2">
				<code className="rounded bg-slate-950 px-2 py-1 font-mono text-sm font-semibold text-cyan-300">
					{promoCode.code}
				</code>
				<span className="text-xs text-slate-500">
					Uses: {promoCode.currentUses} / {promoCode.maxUses}
				</span>
			</div>

			<div className="grid gap-4 sm:grid-cols-2">
				<div className="space-y-2">
					<label
						htmlFor={maxUsesId}
						className="text-xs uppercase tracking-wide text-slate-500"
					>
						Max Uses *
					</label>
					<input
						id={maxUsesId}
						type="number"
						min="1"
						value={formState.maxUses}
						onChange={(e) =>
							setFormState((prev) => ({
								...prev,
								maxUses: parseInt(e.target.value, 10) || 1,
							}))
						}
						required
						className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
					/>
				</div>
				<div className="space-y-2">
					<label
						htmlFor={statusId}
						className="text-xs uppercase tracking-wide text-slate-500"
					>
						Status *
					</label>
					<select
						id={statusId}
						value={formState.status}
						onChange={(e) =>
							setFormState((prev) => ({
								...prev,
								status: e.target.value as PromoCodeStatus,
							}))
						}
						className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
					>
						<option value="draft">Draft</option>
						<option value="active">Active</option>
						<option value="revoked">Revoked</option>
					</select>
				</div>
				<div className="space-y-2">
					<label
						htmlFor={validFromId}
						className="text-xs uppercase tracking-wide text-slate-500"
					>
						Valid From (optional)
					</label>
					<input
						id={validFromId}
						type="datetime-local"
						value={formState.validFrom}
						onChange={(e) =>
							setFormState((prev) => ({ ...prev, validFrom: e.target.value }))
						}
						className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
					/>
				</div>
				<div className="space-y-2">
					<label
						htmlFor={validToId}
						className="text-xs uppercase tracking-wide text-slate-500"
					>
						Valid To (optional)
					</label>
					<input
						id={validToId}
						type="datetime-local"
						value={formState.validTo}
						onChange={(e) =>
							setFormState((prev) => ({ ...prev, validTo: e.target.value }))
						}
						className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
					/>
				</div>
			</div>
			<div className="flex items-center justify-end gap-3">
				<button
					type="button"
					onClick={onCancel}
					className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:text-slate-200"
				>
					Cancel
				</button>
				<button
					type="submit"
					disabled={isPending}
					className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 disabled:cursor-not-allowed disabled:bg-cyan-500/50"
				>
					{isPending ? 'Updating…' : 'Update Promo Code'}
				</button>
			</div>
		</form>
	)
}

