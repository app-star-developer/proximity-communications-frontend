import { useId, useState, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
  BarChart,
  Pie,
  PieChart,
  Cell,
} from 'recharts'
import { subDays } from 'date-fns'

import {
  useAudienceMetrics,
  useAudienceGrowth,
  useAudienceDevices,
  useAudienceSegmentation,
  useAudienceDeviceDetails,
} from '../../hooks/useAudience'
import { useCampaignList } from '../../hooks/useCampaigns'
import { useVenueList } from '../../hooks/useVenues'
import { DeviceDetailsModal } from '../../components/DeviceDetailsModal'

const PAGE_SIZE = 20

export const Route = createFileRoute('/audience/')({
  component: AudienceRoute,
})

function AudienceRoute() {
  const searchId = useId()
  const campaignFilterId = useId()
  const venueFilterId = useId()
  const activeDaysFilterId = useId()

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('')
  const [selectedVenueId, setSelectedVenueId] = useState<string>('')
  const [activeDays, setActiveDays] = useState<number | undefined>(undefined)
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null)

  // Fetch data
  const metricsQuery = useAudienceMetrics()
  
  const growthParams = useMemo(() => {
    const end = new Date()
    const start = subDays(end, 30)
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    }
  }, [])
  
  const growthQuery = useAudienceGrowth(growthParams)
  const segmentationQuery = useAudienceSegmentation()
  const campaignsQuery = useCampaignList({ limit: 100 })
  const venuesQuery = useVenueList({ limit: 100 })

  const devicesQuery = useAudienceDevices({
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
    search: search.trim() || undefined,
    campaignId: selectedCampaignId || undefined,
    venueId: selectedVenueId || undefined,
    activeDays,
  })

  const deviceDetailsQuery = useAudienceDeviceDetails(selectedDeviceId ?? '')

  const devices = devicesQuery.data?.devices ?? []
  const pagination = devicesQuery.data?.pagination
  const totalPages = pagination
    ? Math.max(1, Math.ceil(pagination.total / pagination.limit))
    : 1

  // Create mapping for campaign names
  const campaignMap = new Map(
    campaignsQuery.data?.data.map((c) => [c.id, c.name]) ?? [],
  )

  // Transform segmentation data to include names
  const campaignSegmentationData = segmentationQuery.data?.byCampaign.map(
    (item) => ({
      ...item,
      campaignName: campaignMap.get(item.campaignId) || item.campaignId,
    }),
  ) ?? []

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(0)
  }

  const handleFilterChange = () => {
    setPage(0)
  }

  const COLORS = ['#2dd4bf', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899']

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-6 shadow-lg shadow-slate-950/30">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Audience
          </p>
          <h1 className="text-2xl font-semibold text-white">
            Audience management
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            View and manage registered devices, track audience growth, and analyze engagement.
          </p>
        </div>
      </header>

      {/* Metrics Cards */}
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800/60 bg-slate-950/60 p-6 shadow-lg shadow-slate-950/20">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Total devices
          </p>
          <p className="mt-2 text-3xl font-bold text-white">
            {metricsQuery.isLoading
              ? '...'
              : metricsQuery.data?.totalDevices.toLocaleString() ?? 0}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800/60 bg-slate-950/60 p-6 shadow-lg shadow-slate-950/20">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Active (7 days)
          </p>
          <p className="mt-2 text-3xl font-bold text-cyan-300">
            {metricsQuery.isLoading
              ? '...'
              : metricsQuery.data?.activeUsers.last7Days.toLocaleString() ?? 0}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800/60 bg-slate-950/60 p-6 shadow-lg shadow-slate-950/20">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Active (30 days)
          </p>
          <p className="mt-2 text-3xl font-bold text-cyan-300">
            {metricsQuery.isLoading
              ? '...'
              : metricsQuery.data?.activeUsers.last30Days.toLocaleString() ?? 0}
          </p>
        </div>
      </section>

      {/* Growth Chart */}
      <section className="rounded-2xl border border-slate-800/60 bg-slate-950/60 p-6 shadow-lg shadow-slate-950/20">
        <header className="mb-4">
          <h2 className="text-base font-semibold text-white">Audience growth</h2>
          <p className="text-xs text-slate-500">
            New devices registered over the last 30 days
          </p>
        </header>
        {growthQuery.isLoading ? (
          <div className="h-64 flex items-center justify-center text-slate-500">
            Loading growth data...
          </div>
        ) : growthQuery.isError ? (
          <div className="h-64 flex flex-col items-center justify-center gap-2 text-red-400">
            <p>Failed to load growth data</p>
            {growthQuery.error instanceof Error && (
              <p className="text-xs text-slate-500">{growthQuery.error.message}</p>
            )}
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer>
              <LineChart data={growthQuery.data?.data ?? []}>
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ stroke: '#2dd4bf', strokeWidth: 1 }}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    border: '1px solid rgba(148,163,184,0.2)',
                    color: '#e2e8f0',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#2dd4bf"
                  strokeWidth={2}
                  dot={{ fill: '#2dd4bf', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* Segmentation Charts */}
      {segmentationQuery.data && (
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-800/60 bg-slate-950/60 p-6 shadow-lg shadow-slate-950/20">
            <header className="mb-4">
              <h2 className="text-base font-semibold text-white">
                Devices by campaign
              </h2>
              <p className="text-xs text-slate-500">
                Unique devices engaged per campaign
              </p>
            </header>
            {campaignSegmentationData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
                No campaign data available
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer>
                  <BarChart data={campaignSegmentationData}>
                    <XAxis
                      dataKey="campaignName"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(45,212,191,0.1)' }}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderRadius: '12px',
                        border: '1px solid rgba(148,163,184,0.2)',
                        color: '#e2e8f0',
                      }}
                      formatter={(value: number) => [value.toLocaleString(), 'Devices']}
                      labelFormatter={(label) => `Campaign: ${label}`}
                    />
                    <Bar dataKey="deviceCount" fill="#2dd4bf" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-800/60 bg-slate-950/60 p-6 shadow-lg shadow-slate-950/20">
            <header className="mb-4">
              <h2 className="text-base font-semibold text-white">
                Active vs inactive
              </h2>
              <p className="text-xs text-slate-500">
                Device activity breakdown
              </p>
            </header>
            <div className="h-64 w-full">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={[
                      {
                        name: 'Active (7d)',
                        value: segmentationQuery.data.activeVsInactive.active7Days,
                      },
                      {
                        name: 'Active (30d)',
                        value:
                          segmentationQuery.data.activeVsInactive.active30Days -
                          segmentationQuery.data.activeVsInactive.active7Days,
                      },
                      {
                        name: 'Inactive',
                        value: segmentationQuery.data.activeVsInactive.inactive,
                      },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent as number * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[
                      segmentationQuery.data.activeVsInactive.active7Days,
                      segmentationQuery.data.activeVsInactive.active30Days -
                        segmentationQuery.data.activeVsInactive.active7Days,
                      segmentationQuery.data.activeVsInactive.inactive,
                    ].map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      border: '1px solid rgba(148,163,184,0.2)',
                      color: '#e2e8f0',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      )}

      {/* Devices List */}
      <section className="rounded-2xl border border-slate-800/60 bg-slate-950/60 p-6 shadow-lg shadow-slate-950/20 space-y-4">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Devices</h2>
            <p className="text-xs text-slate-500">
              {pagination
                ? `Showing ${devices.length} of ${pagination.total} devices`
                : `${devices.length} devices`}
            </p>
          </div>
        </header>

        {/* Filters */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label
              htmlFor={searchId}
              className="text-xs uppercase tracking-wide text-slate-500"
            >
              Search
            </label>
            <input
              id={searchId}
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Name, email, or Radar ID"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
            />
          </div>
          <div>
            <label
              htmlFor={campaignFilterId}
              className="text-xs uppercase tracking-wide text-slate-500"
            >
              Campaign
            </label>
            <select
              id={campaignFilterId}
              value={selectedCampaignId}
              onChange={(e) => {
                setSelectedCampaignId(e.target.value)
                handleFilterChange()
              }}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
            >
              <option value="">All campaigns</option>
              {campaignsQuery.data?.data.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor={venueFilterId}
              className="text-xs uppercase tracking-wide text-slate-500"
            >
              Venue
            </label>
            <select
              id={venueFilterId}
              value={selectedVenueId}
              onChange={(e) => {
                setSelectedVenueId(e.target.value)
                handleFilterChange()
              }}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
            >
              <option value="">All venues</option>
              {venuesQuery.data?.data.map((venue) => (
                <option key={venue.id} value={venue.id}>
                  {venue.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor={activeDaysFilterId}
              className="text-xs uppercase tracking-wide text-slate-500"
            >
              Active days
            </label>
            <select
              id={activeDaysFilterId}
              value={activeDays ?? ''}
              onChange={(e) => {
                const value = e.target.value
                setActiveDays(value ? Number(value) : undefined)
                handleFilterChange()
              }}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
            >
              <option value="">All devices</option>
              <option value="7">Active in last 7 days</option>
              <option value="30">Active in last 30 days</option>
            </select>
          </div>
        </div>

        {/* Devices Table */}
        <div className="overflow-hidden rounded-xl border border-slate-800/70 bg-slate-950/50">
          <table className="min-w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/70 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Device</th>
                <th className="px-4 py-3">First seen</th>
                <th className="px-4 py-3">Last seen</th>
                <th className="px-4 py-3">Events</th>
                <th className="px-4 py-3">Campaigns</th>
                <th className="px-4 py-3">Venues</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((device) => (
                <tr
                  key={device.id}
                  className="border-t border-slate-800/70 hover:bg-slate-900/30 transition cursor-pointer"
                  onClick={() => setSelectedDeviceId(device.id)}
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-white">
                        {device.name || device.email || 'Unknown'}
                      </p>
                      {device.radarUserId && (
                        <p className="text-xs text-slate-500 font-mono">
                          {device.radarUserId}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {device.firstSeen
                      ? new Date(device.firstSeen).toLocaleDateString()
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {device.lastSeen
                      ? new Date(device.lastSeen).toLocaleDateString()
                      : '—'}
                  </td>
                  <td className="px-4 py-3">{device.eventCount}</td>
                  <td className="px-4 py-3">
                    {device.campaignsEngaged.length}
                  </td>
                  <td className="px-4 py-3">{device.venuesEngaged.length}</td>
                </tr>
              ))}
              {devices.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    {devicesQuery.isLoading
                      ? 'Loading devices...'
                      : 'No devices found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-end gap-3 text-xs text-slate-400">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
              disabled={page === 0}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-200 transition hover:border-slate-600 disabled:opacity-50"
            >
              Previous
            </button>
            <span>
              Page {page + 1} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages - 1))}
              disabled={page >= totalPages - 1}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-200 transition hover:border-slate-600 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </section>

      {/* Device Details Modal */}
      {selectedDeviceId && deviceDetailsQuery.data && (
        <DeviceDetailsModal
          device={deviceDetailsQuery.data.device}
          engagement={deviceDetailsQuery.data.engagement}
          onClose={() => setSelectedDeviceId(null)}
        />
      )}
    </div>
  )
}
