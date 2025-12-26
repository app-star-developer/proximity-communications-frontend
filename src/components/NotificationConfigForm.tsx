import { useId, useState, useRef } from 'react'
import type {
	CampaignNotificationConfig,
	CreateCampaignNotificationConfigRequest,
	UpdateCampaignNotificationConfigRequest,
	CampaignNotificationActionButton,
} from '../api/types'
import { TemplateVariablePicker } from './TemplateVariablePicker'

interface NotificationConfigFormProps {
	campaignId: string
	initialData?: CampaignNotificationConfig | null
	onSave: (
		payload:
			| CreateCampaignNotificationConfigRequest
			| UpdateCampaignNotificationConfigRequest,
	) => Promise<void>
	onCancel?: () => void
	isLoading?: boolean
}

export function NotificationConfigForm({
	campaignId,
	initialData,
	onSave,
	onCancel,
	isLoading = false,
}: NotificationConfigFormProps) {
	const titleId = useId()
	const bodyId = useId()
	const deepLinkId = useId()
	const imageUrlId = useId()
	const titleInputRef = useRef<HTMLInputElement>(null)
	const bodyInputRef = useRef<HTMLTextAreaElement>(null)
	const deepLinkInputRef = useRef<HTMLInputElement>(null)

	const [formState, setFormState] = useState({
		title: initialData?.title ?? '',
		body: initialData?.body ?? '',
		deepLinkUrl:
			initialData?.deepLinkUrl ??
			`app://campaign/{{campaignId}}?venue={{venueId}}`,
		imageUrl: initialData?.imageUrl ?? '',
		actionButtons:
			initialData?.actionButtons ?? ([] as CampaignNotificationActionButton[]),
	})

	const [newActionButton, setNewActionButton] = useState({
		label: '',
		action: '',
	})

	const insertVariable = (
		variable: string,
		inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		if (!inputRef.current) return

		const input = inputRef.current
		const start = input.selectionStart ?? 0
		const end = input.selectionEnd ?? 0
		const value = input.value
		const newValue = value.slice(0, start) + variable + value.slice(end)

		if (input === titleInputRef.current) {
			setFormState((prev) => ({ ...prev, title: newValue }))
		} else if (input === bodyInputRef.current) {
			setFormState((prev) => ({ ...prev, body: newValue }))
		} else if (input === deepLinkInputRef.current) {
			setFormState((prev) => ({ ...prev, deepLinkUrl: newValue }))
		}

		// Restore cursor position after variable insertion
		setTimeout(() => {
			input.focus()
			const newCursorPos = start + variable.length
			input.setSelectionRange(newCursorPos, newCursorPos)
		}, 0)
	}

	const handleChange = (
		event: React.ChangeEvent<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>,
	) => {
		const { name, value } = event.target
		setFormState((prev) => ({
			...prev,
			[name]: value,
		}))
	}

	const handleAddActionButton = () => {
		if (!newActionButton.label.trim() || !newActionButton.action.trim()) {
			return
		}

		setFormState((prev) => ({
			...prev,
			actionButtons: [
				...prev.actionButtons,
				{
					label: newActionButton.label,
					action: newActionButton.action,
				},
			],
		}))

		setNewActionButton({ label: '', action: '' })
	}

	const handleRemoveActionButton = (index: number) => {
		setFormState((prev) => ({
			...prev,
			actionButtons: prev.actionButtons.filter((_, i) => i !== index),
		}))
	}

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()

		const payload: CreateCampaignNotificationConfigRequest | UpdateCampaignNotificationConfigRequest =
			{
				title: formState.title.trim(),
				body: formState.body.trim() || undefined,
				deepLinkUrl: formState.deepLinkUrl.trim() || undefined,
				imageUrl: formState.imageUrl.trim() || undefined,
				actionButtons:
					formState.actionButtons.length > 0
						? formState.actionButtons
						: undefined,
			}

		await onSave(payload)
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			<div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
				<div className="space-y-6">
					{/* Title Field */}
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<label
								htmlFor={titleId}
								className="text-xs uppercase tracking-wide text-slate-500"
							>
								Title <span className="text-red-400">*</span>
							</label>
							<button
								type="button"
								onClick={() => {
									titleInputRef.current?.focus()
								}}
								className="text-xs text-cyan-300 hover:text-cyan-200"
							>
								Insert variable
							</button>
						</div>
						<input
							ref={titleInputRef}
							id={titleId}
							name="title"
							value={formState.title}
							onChange={handleChange}
							required
							placeholder="e.g., {{campaignName}} - Special Offer"
							className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
						/>
					</div>

					{/* Body Field */}
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<label
								htmlFor={bodyId}
								className="text-xs uppercase tracking-wide text-slate-500"
							>
								Body (optional)
							</label>
							<button
								type="button"
								onClick={() => {
									bodyInputRef.current?.focus()
								}}
								className="text-xs text-cyan-300 hover:text-cyan-200"
							>
								Insert variable
							</button>
						</div>
						<textarea
							ref={bodyInputRef}
							id={bodyId}
							name="body"
							value={formState.body}
							onChange={handleChange}
							rows={4}
							placeholder="e.g., Visit {{venueName}} at {{venueAddress}} to claim your offer!"
							className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
						/>
					</div>

					{/* Deep Link URL Field */}
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<label
								htmlFor={deepLinkId}
								className="text-xs uppercase tracking-wide text-slate-500"
							>
								Deep Link URL (optional)
							</label>
							<button
								type="button"
								onClick={() => {
									deepLinkInputRef.current?.focus()
								}}
								className="text-xs text-cyan-300 hover:text-cyan-200"
							>
								Insert variable
							</button>
						</div>
						<input
							ref={deepLinkInputRef}
							id={deepLinkId}
							name="deepLinkUrl"
							value={formState.deepLinkUrl}
							onChange={handleChange}
							placeholder="app://campaign/{{campaignId}}?venue={{venueId}}"
							className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-mono text-slate-200 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
						/>
						<p className="text-xs text-slate-500">
							Default: app://campaign/{{campaignId}}?venue={{venueId}}
						</p>
					</div>

					{/* Image URL Field */}
					<div className="space-y-2">
						<label
							htmlFor={imageUrlId}
							className="text-xs uppercase tracking-wide text-slate-500"
						>
							Image URL (optional)
						</label>
						<input
							id={imageUrlId}
							name="imageUrl"
							type="url"
							value={formState.imageUrl}
							onChange={handleChange}
							placeholder="https://example.com/image.jpg"
							className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
						/>
					</div>

					{/* Action Buttons */}
					<div className="space-y-3">
						<label className="text-xs uppercase tracking-wide text-slate-500">
							Action Buttons (optional)
						</label>

						{formState.actionButtons.length > 0 && (
							<div className="space-y-2">
								{formState.actionButtons.map((button, index) => (
									<div
										key={index}
										className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 p-3"
									>
										<div className="flex-1 space-y-1">
											<div className="text-xs font-medium text-slate-300">
												{button.label}
											</div>
											<div className="text-xs font-mono text-slate-500">
												{button.action}
											</div>
										</div>
										<button
											type="button"
											onClick={() => handleRemoveActionButton(index)}
											className="text-xs text-red-400 hover:text-red-300"
										>
											Remove
										</button>
									</div>
								))}
							</div>
						)}

						<div className="grid gap-2 md:grid-cols-2">
							<input
								type="text"
								value={newActionButton.label}
								onChange={(e) =>
									setNewActionButton((prev) => ({
										...prev,
										label: e.target.value,
									}))
								}
								placeholder="Button label"
								className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
							/>
							<div className="flex gap-2">
								<input
									type="text"
									value={newActionButton.action}
									onChange={(e) =>
										setNewActionButton((prev) => ({
											...prev,
											action: e.target.value,
										}))
									}
									placeholder="Action URL or deep link"
									className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-mono text-slate-200 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
								/>
								<button
									type="button"
									onClick={handleAddActionButton}
									disabled={
										!newActionButton.label.trim() ||
										!newActionButton.action.trim()
									}
									className="rounded-lg border border-cyan-500/50 bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-300 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
								>
									Add
								</button>
							</div>
						</div>
					</div>
				</div>

				{/* Variable Picker Sidebar */}
				<div className="lg:sticky lg:top-4 lg:h-fit">
					<div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
						<TemplateVariablePicker
							onInsert={(variable) => {
								// Insert into the currently focused field
								if (document.activeElement === titleInputRef.current) {
									insertVariable(variable, titleInputRef)
								} else if (document.activeElement === bodyInputRef.current) {
									insertVariable(variable, bodyInputRef)
								} else if (
									document.activeElement === deepLinkInputRef.current
								) {
									insertVariable(variable, deepLinkInputRef)
								} else {
									// Default to title if nothing is focused
									insertVariable(variable, titleInputRef)
								}
							}}
						/>
					</div>
				</div>
			</div>

			{/* Form Actions */}
			<div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
				{onCancel && (
					<button
						type="button"
						onClick={onCancel}
						disabled={isLoading}
						className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
					>
						Cancel
					</button>
				)}
				<button
					type="submit"
					disabled={isLoading || !formState.title.trim()}
					className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 disabled:cursor-not-allowed disabled:bg-cyan-500/50"
				>
					{isLoading
						? 'Saving...'
						: initialData
							? 'Update Configuration'
							: 'Create Configuration'}
				</button>
			</div>
		</form>
	)
}

