import { useState, useMemo } from 'react'
import { useVenueList } from '../hooks/useVenues'
import { VenueCard } from './VenueCard'
import type { Venue } from '../api/types'

interface VenueSelectorProps {
  selectedVenueIds: string[]
  onSelectionChange: (venueIds: string[]) => void
  search?: string
}

export function VenueSelector({
  selectedVenueIds,
  onSelectionChange,
  search = '',
}: VenueSelectorProps) {
  const [localSearch, setLocalSearch] = useState(search)
  const venueListQuery = useVenueList({
    search: localSearch || undefined,
    limit: 100,
    offset: 0,
  })

  const venues = venueListQuery.data?.data ?? []
  const selectedSet = useMemo(
    () => new Set(selectedVenueIds),
    [selectedVenueIds],
  )

  const handleToggleVenue = (venue: Venue) => {
    const isSelected = selectedSet.has(venue.id)
    if (isSelected) {
      onSelectionChange(selectedVenueIds.filter((id) => id !== venue.id))
    } else {
      onSelectionChange([...selectedVenueIds, venue.id])
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs uppercase tracking-wide text-slate-500">
          Search venues
        </label>
        <input
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder="Search by name, city, or address..."
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
        />
      </div>
      {venueListQuery.isLoading ? (
        <p className="text-xs text-slate-500">Loading venues...</p>
      ) : venues.length === 0 ? (
        <p className="text-xs text-slate-500">
          No venues found. Try adjusting your search.
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {venues.map((venue) => (
            <VenueCard
              key={venue.id}
              venue={venue}
              selected={selectedSet.has(venue.id)}
              showCheckbox
              onSelect={handleToggleVenue}
            />
          ))}
        </div>
      )}
      {selectedVenueIds.length > 0 && (
        <div className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-xs text-cyan-200">
          {selectedVenueIds.length} venue{selectedVenueIds.length !== 1 ? 's' : ''}{' '}
          selected
        </div>
      )}
    </div>
  )
}

