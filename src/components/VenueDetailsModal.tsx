import type { Venue } from '../api/types'
import { VenueOwnersSection } from './VenueOwnersSection'

interface VenueDetailsModalProps {
  venue: Venue
  onClose: () => void
}

export function VenueDetailsModal({ venue, onClose }: VenueDetailsModalProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-slate-800/60 bg-slate-950 shadow-xl shadow-slate-950/40 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-800/60 bg-slate-900/60 px-6 py-4 backdrop-blur-sm">
          <h2 className="text-xl font-semibold text-white">Venue Details</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
            aria-label="Close"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <section>
            <h3 className="text-sm font-semibold text-slate-300 mb-3">
              Basic Information
            </h3>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-slate-500">Name</dt>
                <dd className="mt-1 text-sm text-white">{venue.name}</dd>
              </div>
              {venue.slug && (
                <div>
                  <dt className="text-xs text-slate-500">Slug</dt>
                  <dd className="mt-1 text-sm text-white font-mono">
                    {venue.slug}
                  </dd>
                </div>
              )}
              {venue.status && (
                <div>
                  <dt className="text-xs text-slate-500">Status</dt>
                  <dd className="mt-1">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        venue.status === 'active'
                          ? 'bg-green-500/20 text-green-300'
                          : venue.status === 'inactive'
                            ? 'bg-red-500/20 text-red-300'
                            : 'bg-slate-500/20 text-slate-300'
                      }`}
                    >
                      {venue.status}
                    </span>
                  </dd>
                </div>
              )}
            </dl>
            {venue.description && (
              <div className="mt-3">
                <dt className="text-xs text-slate-500">Description</dt>
                <dd className="mt-1 text-sm text-slate-300">{venue.description}</dd>
              </div>
            )}
          </section>

          {/* Location Information */}
          <section>
            <h3 className="text-sm font-semibold text-slate-300 mb-3">
              Location
            </h3>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {venue.addressLine1 && (
                <div className="sm:col-span-2">
                  <dt className="text-xs text-slate-500">Address Line 1</dt>
                  <dd className="mt-1 text-sm text-white">{venue.addressLine1}</dd>
                </div>
              )}
              {venue.addressLine2 && (
                <div className="sm:col-span-2">
                  <dt className="text-xs text-slate-500">Address Line 2</dt>
                  <dd className="mt-1 text-sm text-white">{venue.addressLine2}</dd>
                </div>
              )}
              {venue.city && (
                <div>
                  <dt className="text-xs text-slate-500">City</dt>
                  <dd className="mt-1 text-sm text-white">{venue.city}</dd>
                </div>
              )}
              {venue.region && (
                <div>
                  <dt className="text-xs text-slate-500">Region</dt>
                  <dd className="mt-1 text-sm text-white">{venue.region}</dd>
                </div>
              )}
              {venue.postalCode && (
                <div>
                  <dt className="text-xs text-slate-500">Postal Code</dt>
                  <dd className="mt-1 text-sm text-white font-mono">
                    {venue.postalCode}
                  </dd>
                </div>
              )}
              {venue.countryCode && (
                <div>
                  <dt className="text-xs text-slate-500">Country</dt>
                  <dd className="mt-1 text-sm text-white">{venue.countryCode}</dd>
                </div>
              )}
              {venue.timezone && (
                <div>
                  <dt className="text-xs text-slate-500">Timezone</dt>
                  <dd className="mt-1 text-sm text-white font-mono">
                    {venue.timezone}
                  </dd>
                </div>
              )}
            </dl>
          </section>

          {/* Coordinates */}
          {(venue.latitude !== undefined || venue.longitude !== undefined) && (
            <section>
              <h3 className="text-sm font-semibold text-slate-300 mb-3">
                Coordinates
              </h3>
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {venue.latitude !== undefined && (
                  <div>
                    <dt className="text-xs text-slate-500">Latitude</dt>
                    <dd className="mt-1 text-sm text-white font-mono">
                      {venue.latitude}
                    </dd>
                  </div>
                )}
                {venue.longitude !== undefined && (
                  <div>
                    <dt className="text-xs text-slate-500">Longitude</dt>
                    <dd className="mt-1 text-sm text-white font-mono">
                      {venue.longitude}
                    </dd>
                  </div>
                )}
              </dl>
              {venue.latitude !== undefined && venue.longitude !== undefined && (
                <div className="mt-3">
                  <a
                    href={`https://www.google.com/maps?q=${venue.latitude},${venue.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-cyan-300 hover:text-cyan-200 hover:underline"
                  >
                    View on Google Maps →
                  </a>
                </div>
              )}
            </section>
          )}

          {/* Additional Information */}
          <section>
            <h3 className="text-sm font-semibold text-slate-300 mb-3">
              Additional Information
            </h3>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {venue.externalId && (
                <div>
                  <dt className="text-xs text-slate-500">External ID</dt>
                  <dd className="mt-1 text-sm text-white font-mono">
                    {venue.externalId}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-slate-500">Venue ID</dt>
                <dd className="mt-1 text-sm text-white font-mono">{venue.id}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Organization ID</dt>
                <dd className="mt-1 text-sm text-white font-mono">
                  {venue.tenantId}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Created At</dt>
                <dd className="mt-1 text-sm text-white">
                  {formatDate(venue.createdAt)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Updated At</dt>
                <dd className="mt-1 text-sm text-white">
                  {formatDate(venue.updatedAt)}
                </dd>
              </div>
            </dl>
          </section>

          {/* Metadata */}
          {venue.metadata && Object.keys(venue.metadata).length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-slate-300 mb-3">
                Metadata
              </h3>
              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
                <pre className="text-xs text-slate-300 font-mono overflow-x-auto">
                  {JSON.stringify(venue.metadata, null, 2)}
                </pre>
              </div>
            </section>
          )}

          {/* Venue Owners */}
          <VenueOwnersSection venueId={venue.id} />
        </div>

        <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-slate-800/60 bg-slate-900/60 px-6 py-4 backdrop-blur-sm">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:text-slate-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

