import {Card} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {
  type RequestPerformanceEntry,
  type RequestPerformanceSnapshot,
} from '../../../../diagnostics/requestPerformance'
import {RequestPerformanceReport} from '../RequestPerformanceReport'

function entry(
  bucket: string,
  secondsOffset: number,
  durationMs: number,
  status: RequestPerformanceEntry['status'] = 'success',
): RequestPerformanceEntry {
  return {
    apiVersion: 'v2025-02-19',
    bucket,
    dataset: 'production',
    durationMs,
    projectId: 'storybook',
    startedAt: `2026-08-21T12:00:${String(secondsOffset).padStart(2, '0')}.000Z`,
    status,
  }
}

const ENTRIES: RequestPerformanceEntry[] = [
  entry('query', 0, 84),
  entry('doc', 2, 41),
  entry('query', 5, 132),
  entry('mutate', 8, 210),
  entry('query', 11, 96),
  entry('history', 14, 318),
  entry('query', 17, 1240, 'error'),
  entry('doc', 20, 37),
  entry('actions', 23, 265),
  entry('query', 26, 78),
  entry('doc', 29, 52, 'aborted'),
  entry('query', 32, 101),
]

const HISTORY: RequestPerformanceSnapshot = {
  dataset: 'production',
  entries: ENTRIES,
  maxEntries: 500,
  projectId: 'storybook',
  sessionSummary: {
    buckets: [
      {bucket: 'query', count: 6, maxMs: 1240, medianMs: 98, p95Ms: 1240},
      {bucket: 'doc', count: 2, maxMs: 41, medianMs: 39, p95Ms: 41},
      {bucket: 'mutate', count: 1, maxMs: 210, medianMs: 210, p95Ms: 210},
      {bucket: 'history', count: 1, maxMs: 318, medianMs: 318, p95Ms: 318},
      {bucket: 'actions', count: 1, maxMs: 265, medianMs: 265, p95Ms: 265},
    ],
    startedAt: '2026-08-21T11:30:00.000Z',
    totalRequests: 12,
  },
  totalRequests: 12,
  truncated: false,
}

/**
 * Chromatic sentinel for the request-timing chart inside the diagnostics
 * dialog: the scatter plot with one marker shape per bucket, the error marker
 * stroke, the aborted-sample note and the per-bucket summary table. The
 * `DiagnosticsReport` story renders this component with no entries, so the
 * chart itself is only snapshotted here. Fixed UTC timestamps; `useUtc` is the
 * default so the axis labels never depend on the renderer's timezone.
 */
const meta = {
  title: 'Studio/Request Performance Report',
  component: RequestPerformanceReport,
} satisfies Meta<typeof RequestPerformanceReport>

export default meta
type Story = StoryObj<typeof meta>

export const WithRequests: Story = {
  args: {history: HISTORY},
  render: (args) => (
    <Card padding={4} style={{maxWidth: 840}}>
      <RequestPerformanceReport {...args} />
    </Card>
  ),
}
