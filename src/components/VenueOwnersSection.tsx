import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { useId, useState } from 'react'
import { venueOwnersApi } from '../api/modules/venueOwners'
import type {
	ApiErrorResponse,
	CreateVenueOwnerRequest,
	VenueOwner,
} from '../api/types'
import { useUIStore } from '../state/uiStore'

interface VenueOwnersSectionProps {
	venueId: string
}

export function VenueOwnersSection({ venueId }: VenueOwnersSectionProps) {
	const { pushToast } = useUIStore()
	const queryClient = useQueryClient()
	const emailId = useId()
	const [email, setEmail] = useState('')

	const ownersQuery = useQuery({
		queryKey: ['venue-owners', venueId],
		queryFn: () => venueOwnersApi.list(venueId),
	})

	const createMutation = useMutation({
		mutationFn: (payload: CreateVenueOwnerRequest) =>
			venueOwnersApi.create(venueId, payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['venue-owners', venueId] })
			pushToast({
				id: crypto.randomUUID(),
				title: 'Owner account created',
				description: 'Password email will be sent shortly.',
				intent: 'success',
			})
			setEmail('')
		},
		onError: (error) => {
			const axiosError = error as AxiosError<ApiErrorResponse>
			pushToast({
				id: crypto.randomUUID(),
				title: 'Failed to create owner',
				description:
					axiosError.response?.data && 'message' in axiosError.response.data
						? axiosError.response.data.message
						: 'Please try again.',
				intent: 'danger',
			})
		},
	})

	const deleteMutation = useMutation({
		mutationFn: (ownerId: string) => venueOwnersApi.delete(venueId, ownerId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['venue-owners', venueId] })
			pushToast({
				id: crypto.randomUUID(),
				title: 'Owner removed',
				description: 'The venue owner has been removed.',
				intent: 'success',
			})
		},
		onError: (error) => {
			const axiosError = error as AxiosError<ApiErrorResponse>
			pushToast({
				id: crypto.randomUUID(),
				title: 'Failed to remove owner',
				description:
					axiosError.response?.data && 'message' in axiosError.response.data
						? axiosError.response.data.message
						: 'Please try again.',
				intent: 'danger',
			})
		},
	})

	const resendPasswordMutation = useMutation({
		mutationFn: (ownerId: string) =>
			venueOwnersApi.resendPassword(venueId, ownerId),
		onSuccess: () => {
			pushToast({
				id: crypto.randomUUID(),
				title: 'Password email sent',
				description: 'The password email has been sent successfully.',
				intent: 'success',
			})
		},
		onError: (error) => {
			const axiosError = error as AxiosError<ApiErrorResponse>
			pushToast({
				id: crypto.randomUUID(),
				title: 'Failed to send password',
				description:
					axiosError.response?.data && 'message' in axiosError.response.data
						? axiosError.response.data.message
						: 'Please try again.',
				intent: 'danger',
			})
		},
	})

	const handleCreate = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!email.trim()) return
		await createMutation.mutateAsync({ email: email.trim() })
	}

	const handleDelete = (ownerId: string, ownerEmail: string) => {
		if (!window.confirm(`Remove ${ownerEmail} as venue owner?`)) return
		deleteMutation.mutate(ownerId)
	}

	const owners = ownersQuery.data?.data ?? []

	return (
		<section className="space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="text-sm font-semibold text-slate-300">Venue Owners</h3>
					<p className="text-xs text-slate-500">
						Manage accounts that can access this venue's dashboard.
					</p>
				</div>
			</div>

			{/* Add Owner Form */}
			<form onSubmit={handleCreate} className="flex gap-2">
				<div className="flex-1">
					<label htmlFor={emailId} className="sr-only">
						Owner Email
					</label>
					<input
						id={emailId}
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder="owner@venue.com"
						className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
					/>
				</div>
				<button
					type="submit"
					disabled={!email.trim() || createMutation.isPending}
					className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 disabled:cursor-not-allowed disabled:bg-cyan-500/50"
				>
					{createMutation.isPending ? 'Creating…' : 'Add Owner'}
				</button>
			</form>

			{/* Owners List */}
			{ownersQuery.isLoading ? (
				<div className="text-sm text-slate-500">Loading owners…</div>
			) : owners.length === 0 ? (
				<div className="rounded-lg border border-dashed border-slate-800 bg-slate-900/50 px-4 py-6 text-center text-sm text-slate-500">
					No venue owners yet. Add one above to get started.
				</div>
			) : (
				<div className="space-y-2">
					{owners.map((owner) => (
						<VenueOwnerCard
							key={owner.id}
							owner={owner}
							onResendPassword={() => resendPasswordMutation.mutate(owner.id)}
							onDelete={() => handleDelete(owner.id, owner.email)}
							isResending={resendPasswordMutation.isPending}
							isDeleting={deleteMutation.isPending}
						/>
					))}
				</div>
			)}
		</section>
	)
}

function VenueOwnerCard({
	owner,
	onResendPassword,
	onDelete,
	isResending,
	isDeleting,
}: {
	owner: VenueOwner
	onResendPassword: () => void
	onDelete: () => void
	isResending: boolean
	isDeleting: boolean
}) {
	const [passwordVisible, setPasswordVisible] = useState(false)
	const [copied, setCopied] = useState(false)

	const hasPassword = !owner.passwordChanged && owner.initialPassword

	const handleCopyPassword = async () => {
		if (!owner.initialPassword) return

		try {
			await navigator.clipboard.writeText(owner.initialPassword)
			setCopied(true)
			setTimeout(() => setCopied(false), 2000)
		} catch (err) {
			console.error('Failed to copy password:', err)
		}
	}

	return (
		<div className="rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-3 space-y-3">
			<div className="flex items-start justify-between">
				<div className="flex-1">
					<div className="text-sm font-medium text-white">{owner.email}</div>
					<div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
						<span
							className={`rounded-full px-2 py-0.5 ${
								owner.status === 'active'
									? 'bg-green-500/20 text-green-300'
									: 'bg-red-500/20 text-red-300'
							}`}
						>
							{owner.status}
						</span>
						{owner.passwordChanged ? (
							<span className="text-slate-500">Password changed</span>
						) : (
							<span className="text-amber-500">Initial password available</span>
						)}
						{owner.passwordSentAt && (
							<span className="text-slate-500">
								Sent:{' '}
								{new Date(owner.passwordSentAt).toLocaleDateString()}
							</span>
						)}
					</div>
				</div>
				<div className="flex items-center gap-2">
					{!owner.passwordChanged && (
						<button
							type="button"
							onClick={onResendPassword}
							disabled={isResending}
							className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 transition hover:border-cyan-500 hover:text-cyan-300 disabled:opacity-50"
						>
							{isResending ? 'Sending…' : 'Resend Password'}
						</button>
					)}
					<button
						type="button"
						onClick={onDelete}
						disabled={isDeleting}
						className="rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-1.5 text-xs text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
					>
						Remove
					</button>
				</div>
			</div>

			{hasPassword && (
				<div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 space-y-2">
					<div className="flex items-center justify-between">
						<label className="text-xs font-semibold text-amber-300 uppercase tracking-wide">
							Initial Password
						</label>
						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={() => setPasswordVisible(!passwordVisible)}
								className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-300 transition hover:border-slate-600 hover:text-slate-200"
							>
								{passwordVisible ? 'Hide' : 'Show'}
							</button>
							<button
								type="button"
								onClick={handleCopyPassword}
								className={`rounded border px-2 py-1 text-xs transition ${
									copied
										? 'border-green-500/50 bg-green-500/20 text-green-300'
										: 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20'
								}`}
							>
								{copied ? 'Copied!' : 'Copy'}
							</button>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<code className="flex-1 rounded bg-slate-950 px-3 py-2 font-mono text-sm font-semibold text-cyan-300">
							{passwordVisible
								? owner.initialPassword
								: '•'.repeat(owner.initialPassword?.length || 12)}
						</code>
					</div>
					<p className="text-xs text-amber-400/80">
						⚠️ This password is only visible because it hasn't been changed yet.
						Send it securely to the venue owner if they didn't receive the email.
					</p>
				</div>
			)}

			{owner.passwordChanged && (
				<div className="rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 text-xs text-slate-500">
					Password has been changed. Initial password is no longer available.
				</div>
			)}
		</div>
	)
}

