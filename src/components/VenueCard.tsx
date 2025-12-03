import type { Venue } from '../api/types'

interface VenueCardProps {
  venue: Venue
  onSelect?: (venue: Venue) => void
  selected?: boolean
  showCheckbox?: boolean
}

export function VenueCard({
  venue,
  onSelect,
  selected = false,
  showCheckbox = false,
}: VenueCardProps) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm transition ${
        selected
          ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200'
          : 'border-slate-800 bg-slate-950/50 text-slate-300 hover:border-cyan-500/40'
      } ${onSelect ? 'cursor-pointer' : ''}`}
      onClick={() => onSelect?.(venue)}
    >
      <div className="flex items-start gap-3">
        {showCheckbox && (
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onSelect?.(venue)}
            onClick={(e) => e.stopPropagation()}
            className="mt-1 h-4 w-4 rounded border border-slate-600 bg-slate-900 text-cyan-500 focus:ring-cyan-500/40"
          />
        )}
        <div className="flex-1">
          <h3 className="font-semibold text-white">{venue.name}</h3>
          {venue.addressLine1 && (
            <p className="mt-1 text-xs text-slate-400">{venue.addressLine1}</p>
          )}
          {(venue.city || venue.region || venue.countryCode) && (
            <p className="text-xs text-slate-500">
              {[venue.city, venue.region, venue.countryCode]
                .filter(Boolean)
                .join(', ')}
            </p>
          )}
          {venue.primaryType && (
            <span className="mt-1 inline-block rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
              {venue.primaryType}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

