import { useId } from 'react'

export interface TemplateVariable {
	name: string
	label: string
	description: string
	example: string
}

export const TEMPLATE_VARIABLES: TemplateVariable[] = [
	{
		name: 'campaignName',
		label: 'Campaign Name',
		description: 'The name of the campaign',
		example: 'Summer Sale 2025',
	},
	{
		name: 'campaignDescription',
		label: 'Campaign Description',
		description: 'The description of the campaign',
		example: 'Get 20% off all items',
	},
	{
		name: 'venueName',
		label: 'Venue Name',
		description: 'The name of the venue',
		example: 'Downtown Coffee Shop',
	},
	{
		name: 'venueAddress',
		label: 'Venue Address',
		description: 'Formatted venue address',
		example: '123 Main St, New York, NY 10001',
	},
	{
		name: 'venueCity',
		label: 'Venue City',
		description: 'The city where the venue is located',
		example: 'New York',
	},
	{
		name: 'venueType',
		label: 'Venue Type',
		description: 'The primary type of the venue',
		example: 'restaurant',
	},
	{
		name: 'offerTitle',
		label: 'Offer Title',
		description: 'First active offer title (if exists)',
		example: '20% Off All Items',
	},
	{
		name: 'offerSummary',
		label: 'Offer Summary',
		description: 'First active offer summary (if exists)',
		example: 'Valid until end of month',
	},
	{
		name: 'campaignId',
		label: 'Campaign ID',
		description: 'Campaign UUID',
		example: '550e8400-e29b-41d4-a716-446655440000',
	},
	{
		name: 'venueId',
		label: 'Venue ID',
		description: 'Venue UUID',
		example: '550e8400-e29b-41d4-a716-446655440001',
	},
]

interface TemplateVariablePickerProps {
	onInsert: (variable: string) => void
	className?: string
}

export function TemplateVariablePicker({
	onInsert,
	className = '',
}: TemplateVariablePickerProps) {
	const id = useId()

	const handleClick = (variable: TemplateVariable) => {
		onInsert(`{{${variable.name}}}`)
	}

	return (
		<div className={`space-y-3 ${className}`}>
			<div>
				<h3 className="text-sm font-semibold text-white">
					Available Variables
				</h3>
				<p className="mt-1 text-xs text-slate-400">
					Click a variable to insert it into your text
				</p>
			</div>
			<div className="flex flex-wrap gap-2">
				{TEMPLATE_VARIABLES.map((variable) => (
					<button
						key={`${id}-${variable.name}`}
						type="button"
						onClick={() => handleClick(variable)}
						title={`${variable.description}. Example: ${variable.example}`}
						className="group relative rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-cyan-500 hover:bg-slate-800 hover:text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
					>
						{`{{${variable.name}}}`}
						<div className="invisible absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-300 shadow-xl opacity-0 transition group-hover:visible group-hover:opacity-100 z-10 whitespace-nowrap">
							<div className="font-semibold text-white">
								{variable.label}
							</div>
							<div className="mt-1 text-slate-400">
								{variable.description}
							</div>
							<div className="mt-1 text-cyan-400">
								Example: {variable.example}
							</div>
							<div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r border-slate-700 bg-slate-950"></div>
						</div>
					</button>
				))}
			</div>
		</div>
	)
}

