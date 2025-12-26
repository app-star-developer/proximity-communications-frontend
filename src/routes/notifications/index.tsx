import { useId, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
// Route file - triggers route tree regeneration
import { useMutation } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import type { QueryClient } from '@tanstack/react-query'

import { requireAuth } from '../../utils/requireAuth'
import { notificationsApi } from '../../api/modules/notifications'
import type {
  ApiErrorResponse,
  NotificationSendRequest,
  // TODO: Uncomment when receipts functionality is needed
  // NotificationReceiptsRequest,
  // NotificationReceipt,
} from '../../api/types'
import { useUIStore } from '../../state/uiStore'
import { useCampaignList } from '../../hooks/useCampaigns'

export const Route = createFileRoute('/notifications/')({
  loader: async ({ context, location }) => {
    const { queryClient } = context as { queryClient: QueryClient }
    return requireAuth({
      queryClient,
      locationHref: location.href,
    })
  },
  component: NotificationsRoute,
})

function NotificationsRoute() {
  const campaignsQuery = useCampaignList({ limit: 100 })
  const campaigns = campaignsQuery.data?.data ?? []

  // const [activeTab, setActiveTab] = useState<'send' | 'receipts'>('send')
  // TODO: Uncomment when receipts functionality is needed

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-6 shadow-lg shadow-slate-950/30">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Notifications
          </p>
          <h1 className="text-2xl font-semibold text-white">
            Push notification management
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Send push notifications to Expo tokens.
            {/* and submit delivery receipts. */}
          </p>
        </div>
      </header>

      <div className="rounded-2xl border border-slate-800/60 bg-slate-950/60 shadow-lg shadow-slate-950/20">
        {/* TODO: Uncomment tabs when receipts functionality is needed */}
        {/* <div className="flex border-b border-slate-800/70">
          <button
            type="button"
            onClick={() => setActiveTab('send')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition ${
              activeTab === 'send'
                ? 'border-b-2 border-cyan-500 text-cyan-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Send notifications
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('receipts')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition ${
              activeTab === 'receipts'
                ? 'border-b-2 border-cyan-500 text-cyan-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Submit receipts
          </button>
        </div> */}

        <div className="p-6">
          <SendNotificationsForm campaigns={campaigns} />
          {/* TODO: Uncomment when receipts functionality is needed */}
          {/* {activeTab === 'send' ? (
            <SendNotificationsForm campaigns={campaigns} />
          ) : (
            <SubmitReceiptsForm />
          )} */}
        </div>
      </div>
    </div>
  )
}

function SendNotificationsForm({ campaigns }: { campaigns: Array<{ id: string; name: string }> }) {
  const { pushToast } = useUIStore()
  const toId = useId()
  const titleId = useId()
  const bodyId = useId()
  const campaignId = useId()

  const [formState, setFormState] = useState({
    to: '',
    title: '',
    body: '',
    campaignId: '',
  })

  // Dynamic key-value pairs for data payload
  const [dataFields, setDataFields] = useState<Array<{ id: string; key: string; value: string }>>([
    { id: crypto.randomUUID(), key: 'deepLinkUrl', value: '' },
  ])

  const sendMutation = useMutation({
    mutationFn: (payload: NotificationSendRequest) =>
      notificationsApi.send(payload),
    onSuccess: (response) => {
      pushToast({
        id: crypto.randomUUID(),
        title: 'Notifications sent',
        description: `${response.tickets} notification ticket(s) accepted for delivery.`,
        intent: 'success',
      })
      setFormState({
        to: '',
        title: '',
        body: '',
        campaignId: '',
      })
      setDataFields([{ id: crypto.randomUUID(), key: 'deepLinkUrl', value: '' }])
    },
    onError: (error) => {
      const axiosError = error as AxiosError<ApiErrorResponse>
      pushToast({
        id: crypto.randomUUID(),
        title: 'Failed to send notifications',
        description:
          axiosError.response?.data && 'message' in axiosError.response.data
            ? axiosError.response.data.message
            : 'Please check the input and try again.',
        intent: 'danger',
      })
    },
  })

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = event.target
    setFormState((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    // Parse tokens if provided, otherwise leave empty (backend will use campaign or all tokens)
    const tokens = formState.to
      .split(',')
      .map((token) => token.trim())
      .filter((token) => token.length > 0)

    // Build data payload from key-value fields
    const dataPayload: Record<string, unknown> | undefined = (() => {
      const data: Record<string, unknown> = {}
      let hasData = false

      for (const field of dataFields) {
        if (field.key.trim() && field.value.trim()) {
          data[field.key.trim()] = field.value.trim()
          hasData = true
        }
      }

      return hasData ? data : undefined
    })()

    const payload: NotificationSendRequest = {
      to: tokens.length > 0 ? tokens : [],
      title: formState.title,
      body: formState.body || undefined,
      campaignId: formState.campaignId || undefined,
      data: dataPayload,
    }

    sendMutation.mutate(payload)
  }

  const addDataField = () => {
    setDataFields([...dataFields, { id: crypto.randomUUID(), key: '', value: '' }])
  }

  const removeDataField = (id: string) => {
    setDataFields(dataFields.filter((field) => field.id !== id))
  }

  const updateDataField = (id: string, field: 'key' | 'value', value: string) => {
    setDataFields(
      dataFields.map((f) => (f.id === id ? { ...f, [field]: value } : f)),
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label
          htmlFor={toId}
          className="text-xs uppercase tracking-wide text-slate-500"
        >
          Recipient tokens (optional)
        </label>
        <textarea
          id={toId}
          name="to"
          value={formState.to}
          onChange={handleChange}
          rows={4}
          placeholder="ExpoPushToken[xxx], ExpoPushToken[yyy]"
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
        />
        <p className="text-xs text-slate-500">
          Leave blank to send to all tokens linked to the selected campaign, or all registered device tokens if no campaign is selected. Otherwise, provide a comma-separated list of Expo push notification tokens.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor={titleId}
            className="text-xs uppercase tracking-wide text-slate-500"
          >
            Title *
          </label>
          <input
            id={titleId}
            name="title"
            value={formState.title}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
          />
        </div>
        <div className="space-y-2">
          <label
            htmlFor={campaignId}
            className="text-xs uppercase tracking-wide text-slate-500"
          >
            Campaign (optional)
          </label>
          <select
            id={campaignId}
            name="campaignId"
            value={formState.campaignId}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
          >
            <option value="">None (send to all registered tokens)</option>
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500">
            If selected and no tokens provided, sends to all tokens linked to this campaign.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor={bodyId}
          className="text-xs uppercase tracking-wide text-slate-500"
        >
          Body (optional)
        </label>
        <textarea
          id={bodyId}
          name="body"
          value={formState.body}
          onChange={handleChange}
          rows={3}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs uppercase tracking-wide text-slate-500">
            Data payload (optional)
          </label>
          <button
            type="button"
            onClick={addDataField}
            className="flex items-center gap-1 rounded-lg border border-cyan-500/60 bg-cyan-500/10 px-2 py-1 text-xs font-medium text-cyan-200 transition hover:bg-cyan-500/20"
          >
            <span>+</span>
            <span>Add field</span>
          </button>
        </div>
        <div className="space-y-2">
          {dataFields.map((field) => (
            <div key={field.id} className="flex gap-2">
              <input
                type="text"
                value={field.key}
                onChange={(e) => updateDataField(field.id, 'key', e.target.value)}
                placeholder="Key"
                className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
              />
              <input
                type="text"
                value={field.value}
                onChange={(e) => updateDataField(field.id, 'value', e.target.value)}
                placeholder="Value"
                className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
              />
              {dataFields.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeDataField(field.id)}
                  className="rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-200 transition hover:bg-red-500/20"
                  aria-label="Remove field"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500">
          Add key-value pairs to include in the notification payload. Empty fields are ignored.
        </p>
      </div>

      <button
        type="submit"
        disabled={sendMutation.isPending}
        className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 disabled:cursor-not-allowed disabled:bg-cyan-500/50"
      >
        {sendMutation.isPending ? 'Sending…' : 'Send notifications'}
      </button>
    </form>
  )
}

// TODO: Uncomment when receipts functionality is needed
/*
function SubmitReceiptsForm() {
  const { pushToast } = useUIStore()
  const receiptsId = useId()

  const [formState, setFormState] = useState({
    receipts: '',
  })

  const receiptsMutation = useMutation({
    mutationFn: (payload: NotificationReceiptsRequest) =>
      notificationsApi.submitReceipts(payload),
    onSuccess: (response) => {
      pushToast({
        id: crypto.randomUUID(),
        title: 'Receipts submitted',
        description: `${response.received} receipt(s) accepted for processing.`,
        intent: 'success',
      })
      setFormState({ receipts: '' })
    },
    onError: (error) => {
      const axiosError = error as AxiosError<ApiErrorResponse>
      pushToast({
        id: crypto.randomUUID(),
        title: 'Failed to submit receipts',
        description:
          axiosError.response?.data && 'message' in axiosError.response.data
            ? axiosError.response.data.message
            : 'Please check the input and try again.',
        intent: 'danger',
      })
    },
  })

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = event.target
    setFormState({ receipts: value })
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!formState.receipts.trim()) {
      pushToast({
        id: crypto.randomUUID(),
        title: 'Invalid input',
        description: 'Please provide receipt data.',
        intent: 'warning',
      })
      return
    }

    let receipts: NotificationReceipt[]
    try {
      receipts = JSON.parse(formState.receipts)
      if (!Array.isArray(receipts)) {
        throw new Error('Receipts must be an array')
      }
    } catch {
      pushToast({
        id: crypto.randomUUID(),
        title: 'Invalid JSON',
        description:
          'The receipts field must be a valid JSON array of receipt objects.',
        intent: 'warning',
      })
      return
    }

    // Validate receipt structure
    for (const receipt of receipts) {
      if (!receipt.ticketId || !receipt.status) {
        pushToast({
          id: crypto.randomUUID(),
          title: 'Invalid receipt format',
          description:
            'Each receipt must have ticketId and status fields.',
          intent: 'warning',
        })
        return
      }
      if (receipt.status !== 'ok' && receipt.status !== 'error') {
        pushToast({
          id: crypto.randomUUID(),
          title: 'Invalid receipt status',
          description: 'Receipt status must be "ok" or "error".',
          intent: 'warning',
        })
        return
      }
    }

    const payload: NotificationReceiptsRequest = { receipts }
    receiptsMutation.mutate(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label
          htmlFor={receiptsId}
          className="text-xs uppercase tracking-wide text-slate-500"
        >
          Receipts (JSON array) *
        </label>
        <textarea
          id={receiptsId}
          name="receipts"
          value={formState.receipts}
          onChange={handleChange}
          required
          rows={12}
          placeholder='[{"ticketId": "xxx", "status": "ok"}, {"ticketId": "yyy", "status": "error", "details": {"error": "..."}}]'
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
        />
        <p className="text-xs text-slate-500">
          JSON array of receipt objects. Each receipt must have{' '}
          <code className="rounded bg-slate-800 px-1 py-0.5">ticketId</code> and{' '}
          <code className="rounded bg-slate-800 px-1 py-0.5">status</code>{' '}
          ("ok" or "error"). Optional <code className="rounded bg-slate-800 px-1 py-0.5">details</code> field.
        </p>
      </div>

      <button
        type="submit"
        disabled={receiptsMutation.isPending}
        className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 disabled:cursor-not-allowed disabled:bg-cyan-500/50"
      >
        {receiptsMutation.isPending ? 'Submitting…' : 'Submit receipts'}
      </button>
    </form>
  )
}
*/

