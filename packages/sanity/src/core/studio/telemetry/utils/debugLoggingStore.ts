import {type CreateBatchedStoreOptions} from '@sanity/telemetry'

const TYPE_COLORS: Record<string, string> = {
  'log': '#4CAF50',
  'trace.start': '#2196F3',
  'trace.log': '#03A9F4',
  'trace.complete': '#9C27B0',
  'trace.error': '#F44336',
  'userProperties': '#FF9800',
}
// oxlint-disable no-console
function logTelemetryEvent(event: {
  type: string
  name?: string
  data?: unknown
  properties?: unknown
}) {
  const label = event.name || event.type
  const color = TYPE_COLORS[event.type] || '#999'
  const payload = event.data ?? event.properties
  const data = payload && typeof payload === 'object' ? payload : null

  console.log(`%c${event.type}%c ${label}`, `color: ${color}; font-weight: bold`, 'color: inherit')
  if (data && Object.keys(data).length > 0) {
    for (const [key, value] of Object.entries(data)) {
      const formatted = typeof value === 'object' && value !== null ? JSON.stringify(value) : value
      console.log(`  %c${key}:%c ${formatted}`, 'color: #999', 'color: inherit')
    }
  }
}
// oxlint-enable no-console

// oxlint-disable no-console
function logTelemetryBatch(batch: Array<{type: string; name?: string; data?: unknown}>) {
  if (batch.length === 0) return
  const counts = new Map<string, number>()
  for (const event of batch) {
    const name = event.name || event.type
    counts.set(name, (counts.get(name) || 0) + 1)
  }
  const names = [...counts.entries()]
    .map(([name, count]) => (count > 1 ? `${name} x${count}` : name))
    .join(', ')
  console.groupCollapsed(
    `%c[telemetry]%c ${batch.length} event${batch.length > 1 ? 's' : ''} %c${names}`,
    'color: #999; font-weight: normal',
    'color: inherit; font-weight: bold',
    'color: #999; font-weight: normal',
  )
  for (const event of batch) {
    logTelemetryEvent(event)
  }
  console.groupEnd()
}
// oxlint-enable no-console

export const debugLoggingStore: CreateBatchedStoreOptions = {
  flushInterval: 1000,
  resolveConsent: () => Promise.resolve({status: 'granted'}),
  sendEvents: async (batch) => {
    logTelemetryBatch(batch)
  },
  sendBeacon: (batch) => {
    logTelemetryBatch(batch)
    return true
  },
}
