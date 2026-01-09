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

          {/* Device Hardware & Software */}
          <section>
            <h3 className="text-sm font-semibold text-slate-300 mb-3">
              Hardware & Software
            </h3>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {device.platform && (
                <div>
                  <dt className="text-xs text-slate-500">Platform</dt>
                  <dd className="mt-1">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      device.platform === 'ios'
                        ? 'bg-blue-500/20 text-blue-300'
                        : device.platform === 'android'
                        ? 'bg-green-500/20 text-green-300'
                        : 'bg-slate-500/20 text-slate-300'
                    }`}>
                      {device.platform === 'ios' && (
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                        </svg>
                      )}
                      {device.platform === 'android' && (
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.27-.85-.31-.16-.69-.04-.85.27l-1.89 3.27c-1.16-.5-2.47-.78-3.84-.78s-2.68.28-3.84.78l-1.89-3.27c-.16-.31-.54-.43-.85-.27-.31.16-.43.54-.27.85L8.4 9.48C4.17 11.5 1.5 15.8 1.5 21h21c0-5.2-2.67-9.5-6.9-11.52zM7 17c-.83 0-1.5-.67-1.5-1.5S6.17 14 7 14s1.5.67 1.5 1.5S7.83 17 7 17zm10 0c-.83 0-1.5-.67-1.5-1.5S16.17 14 17 14s1.5.67 1.5 1.5S17.83 17 17 17z"/>
                        </svg>
                      )}
                      {device.platform.toUpperCase()}
                    </span>
                  </dd>
                </div>
              )}
              {device.brand && (
                <div>
                  <dt className="text-xs text-slate-500">Brand</dt>
                  <dd className="mt-1 text-sm text-white">{device.brand}</dd>
                </div>
              )}
              {device.manufacturer && (
                <div>
                  <dt className="text-xs text-slate-500">Manufacturer</dt>
                  <dd className="mt-1 text-sm text-white">{device.manufacturer}</dd>
                </div>
              )}
              {device.modelName && (
                <div>
                  <dt className="text-xs text-slate-500">Model</dt>
                  <dd className="mt-1 text-sm text-white">{device.modelName}</dd>
                </div>
              )}
              {device.deviceType && (
                <div>
                  <dt className="text-xs text-slate-500">Device Type</dt>
                  <dd className="mt-1">
                    <span className="inline-flex items-center rounded-full bg-slate-700/50 px-2.5 py-0.5 text-xs font-medium text-slate-300 capitalize">
                      {device.deviceType}
                    </span>
                  </dd>
                </div>
              )}
              {device.isDevice !== undefined && (
                <div>
                  <dt className="text-xs text-slate-500">Physical Device</dt>
                  <dd className="mt-1">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      device.isDevice
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {device.isDevice ? 'Yes' : 'Simulator'}
                    </span>
                  </dd>
                </div>
              )}
              {(device.osName || device.osVersion) && (
                <div>
                  <dt className="text-xs text-slate-500">Operating System</dt>
                  <dd className="mt-1 text-sm text-white">
                    {device.osName || 'Unknown'} {device.osVersion && `v${device.osVersion}`}
                  </dd>
                </div>
              )}
              {device.appVersion && (
                <div>
                  <dt className="text-xs text-slate-500">App Version</dt>
                  <dd className="mt-1">
                    <span className="inline-flex items-center rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-xs font-medium text-cyan-300">
                      v{device.appVersion}
                    </span>
                  </dd>
                </div>
              )}
              {device.language && (
                <div>
                  <dt className="text-xs text-slate-500">Language</dt>
                  <dd className="mt-1 text-sm text-white">{device.language}</dd>
                </div>
              )}
              {device.timezone && (
                <div>
                  <dt className="text-xs text-slate-500">Timezone</dt>
                  <dd className="mt-1 text-sm text-white">{device.timezone}</dd>
                </div>
              )}
            </dl>
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

