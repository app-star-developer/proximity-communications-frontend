import type { Device, DeviceEngagement } from '../api/types'

interface DeviceDetailsModalProps {
  device: Device & {
    createdAt: string
    updatedAt: string
  }
  engagement: DeviceEngagement
  onClose: () => void
}

export function DeviceDetailsModal({
  device,
  engagement,
  onClose,
}: DeviceDetailsModalProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleString()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-2xl border border-slate-800/60 bg-slate-950 shadow-xl shadow-slate-950/40 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-800/60 bg-slate-900/60 px-6 py-4 backdrop-blur-sm">
          <h2 className="text-xl font-semibold text-white">Device Details</h2>
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
          {/* Device Information */}
          <section>
            <h3 className="text-sm font-semibold text-slate-300 mb-3">
              Device Information
            </h3>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-slate-500">Device ID</dt>
                <dd className="mt-1 text-sm text-white font-mono">{device.id}</dd>
              </div>
              {device.radarUserId && (
                <div>
                  <dt className="text-xs text-slate-500">Radar User ID</dt>
                  <dd className="mt-1 text-sm text-white font-mono">
                    {device.radarUserId}
                  </dd>
                </div>
              )}
              {device.name && (
                <div>
                  <dt className="text-xs text-slate-500">Name</dt>
                  <dd className="mt-1 text-sm text-white">{device.name}</dd>
                </div>
              )}
              {device.email && (
                <div>
                  <dt className="text-xs text-slate-500">Email</dt>
                  <dd className="mt-1 text-sm text-white">{device.email}</dd>
                </div>
              )}
              {device.expoPushToken && (
                <div className="sm:col-span-2">
                  <dt className="text-xs text-slate-500">Expo Push Token</dt>
                  <dd className="mt-1 text-sm text-white font-mono break-all">
                    {device.expoPushToken}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-slate-500">Created At</dt>
                <dd className="mt-1 text-sm text-white">{formatDate(device.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Updated At</dt>
                <dd className="mt-1 text-sm text-white">{formatDate(device.updatedAt)}</dd>
              </div>
            </dl>
            {device.metadata && Object.keys(device.metadata).length > 0 && (
              <div className="mt-3">
                <dt className="text-xs text-slate-500">Metadata</dt>
                <div className="mt-1 rounded-lg border border-slate-800 bg-slate-900/50 p-3">
                  <pre className="text-xs text-slate-300 font-mono overflow-x-auto">
                    {JSON.stringify(device.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </section>

          {/* Engagement Summary */}
          <section>
            <h3 className="text-sm font-semibold text-slate-300 mb-3">
              Engagement Summary
            </h3>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-slate-500">First Seen</dt>
                <dd className="mt-1 text-sm text-white">
                  {formatDate(engagement.firstSeen)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Last Seen</dt>
                <dd className="mt-1 text-sm text-white">
                  {formatDate(engagement.lastSeen)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Total Events</dt>
                <dd className="mt-1 text-lg font-semibold text-cyan-300">
                  {engagement.totalEvents.toLocaleString()}
                </dd>
              </div>
            </dl>
          </section>

          {/* Campaigns Engaged */}
          {engagement.campaigns.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-slate-300 mb-3">
                Campaigns Engaged ({engagement.campaigns.length})
              </h3>
              <div className="space-y-2">
                {engagement.campaigns.map((campaign) => (
                  <div
                    key={campaign.campaignId}
                    className="rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white font-mono">
                        {campaign.campaignId}
                      </span>
                      <span className="text-sm text-cyan-300 font-semibold">
                        {campaign.eventCount} events
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Venues Engaged */}
          {engagement.venues.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-slate-300 mb-3">
                Venues Engaged ({engagement.venues.length})
              </h3>
              <div className="space-y-2">
                {engagement.venues.map((venue) => (
                  <div
                    key={venue.venueId}
                    className="rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white font-mono">
                        {venue.venueId}
                      </span>
                      <span className="text-sm text-cyan-300 font-semibold">
                        {venue.eventCount} events
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Events by Type */}
          {engagement.eventsByType.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-slate-300 mb-3">
                Events by Type
              </h3>
              <div className="space-y-2">
                {engagement.eventsByType.map((event) => (
                  <div
                    key={event.eventType}
                    className="rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white capitalize">
                        {event.eventType.replace(/_/g, ' ')}
                      </span>
                      <span className="text-sm text-cyan-300 font-semibold">
                        {event.count.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
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

