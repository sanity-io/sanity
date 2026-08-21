import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {describe, expect, it, vi} from 'vitest'

import {
  type RequestPerformanceEntry,
  type RequestPerformanceSessionSummary,
} from '../../../diagnostics'
import {RequestPerformanceReport} from './RequestPerformanceReport'

describe('RequestPerformanceReport', () => {
  it('renders an empty state for a target without observed requests', () => {
    render(
      <ThemeProvider theme={buildTheme()}>
        <RequestPerformanceReport
          history={{
            dataset: 'production',
            entries: [],
            maxEntries: 500,
            projectId: 'test-project',
            sessionSummary: {
              buckets: [],
              startedAt: '2026-08-21T11:00:00.000Z',
              totalRequests: 0,
            },
            totalRequests: 0,
            truncated: false,
          }}
        />
      </ThemeProvider>,
    )

    expect(
      screen.getByText(
        'No data API requests have been observed for this workspace target in this browser session.',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('does not present aborted requests as errors or include them in bucket summaries', () => {
    render(
      <ThemeProvider theme={buildTheme()}>
        <RequestPerformanceReport
          history={{
            dataset: 'production',
            entries: [
              {
                apiVersion: 'v1',
                bucket: 'query',
                dataset: 'production',
                durationMs: 20,
                projectId: 'test-project',
                startedAt: '2026-08-21T12:00:00.000Z',
                status: 'success',
              },
              {
                apiVersion: 'v1',
                bucket: 'doc',
                dataset: 'production',
                durationMs: 10,
                projectId: 'test-project',
                startedAt: '2026-08-21T12:00:01.000Z',
                status: 'aborted',
              },
            ],
            maxEntries: 500,
            projectId: 'test-project',
            sessionSummary: {
              buckets: [{bucket: 'query', count: 1, maxMs: 20, medianMs: 20, p95Ms: 20}],
              startedAt: '2026-08-21T11:00:00.000Z',
              totalRequests: 2,
            },
            totalRequests: 2,
            truncated: false,
          }}
        />
      </ThemeProvider>,
    )

    const points = screen.getAllByTestId('diagnostics-request-history-point')
    expect(points[1]).toHaveAttribute('stroke', 'none')
    expect(screen.getByText('query')).toBeInTheDocument()
    expect(screen.queryByText('doc')).not.toBeInTheDocument()
    expect(
      screen.getByText(
        '1 aborted sample is included in copied output but excluded from summary statistics.',
      ),
    ).toBeInTheDocument()
  })

  it('uses a linear scale with a muted query series and distinct markers', () => {
    renderReport([
      createEntry({bucket: 'query'}),
      createEntry({bucket: 'actions', startedAt: '2026-08-21T12:00:01.000Z'}),
      createEntry({bucket: 'doc', startedAt: '2026-08-21T12:00:02.000Z'}),
    ])

    expect(screen.getByRole('img')).toHaveAttribute('data-duration-scale', 'linear')
    const points = screen.getAllByTestId('diagnostics-request-history-point')
    expect(points.map((point) => point.getAttribute('data-marker'))).toEqual([
      'circle',
      'diamond',
      'square',
    ])
    expect(points[0]).toHaveAttribute('fill', 'var(--card-muted-fg-color)')
    expect(screen.getAllByRole('columnheader')).toHaveLength(5)
  })

  it('shows the uncapped session summary instead of recomputing it from recent points', () => {
    renderReport([createEntry({durationMs: 20})], {
      sessionSummary: {
        buckets: [{bucket: 'query', count: 2_000, maxMs: 900, medianMs: 120, p95Ms: 480}],
        startedAt: '2026-08-21T08:00:00.000Z',
        totalRequests: 2_001,
      },
    })

    expect(screen.getByText('Full session summary (estimated percentiles)')).toBeInTheDocument()
    expect(screen.getByText('2,000')).toBeInTheDocument()
    expect(screen.getByText('120 ms')).toBeInTheDocument()
    expect(screen.getByText('480 ms')).toBeInTheDocument()
    expect(screen.getByText('900 ms')).toBeInTheDocument()
  })

  it('isolates a bucket when its series label is selected', async () => {
    const user = userEvent.setup()
    renderReport([
      createEntry({bucket: 'query'}),
      createEntry({bucket: 'actions', startedAt: '2026-08-21T12:00:01.000Z'}),
    ])

    const queryButton = screen.getByRole('button', {name: 'query'})
    await user.click(queryButton)

    expect(queryButton).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getAllByTestId('diagnostics-request-history-point')).toHaveLength(1)
    expect(screen.getByRole('button', {name: 'actions'}).closest('tr')).toHaveAttribute(
      'data-muted',
      'true',
    )

    await user.click(queryButton)
    expect(screen.getAllByTestId('diagnostics-request-history-point')).toHaveLength(2)
  })

  it('shows a custom tooltip for a point', async () => {
    const user = userEvent.setup()
    const entry = createEntry({bucket: 'query', durationMs: 283})
    renderReport([entry])

    await user.hover(screen.getByTestId('diagnostics-request-history-point'))

    const tooltip = screen.getByRole('tooltip')
    expect(tooltip).toHaveTextContent('query')
    expect(tooltip).toHaveTextContent('283 ms')
    expect(tooltip).toHaveTextContent('v2025-02-19')
    expect(tooltip).toHaveTextContent('Success')
    expect(tooltip).toHaveTextContent(formatUtcTime(entry.startedAt))
    expect(tooltip).not.toHaveTextContent(new Date(entry.startedAt).toLocaleDateString())

    await user.unhover(screen.getByTestId('diagnostics-request-history-point'))
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('focuses on a selected time range and can reset it', async () => {
    const user = userEvent.setup()
    renderReport([
      createEntry({bucket: 'query'}),
      createEntry({bucket: 'actions', startedAt: '2026-08-21T12:00:10.000Z'}),
      createEntry({bucket: 'doc', startedAt: '2026-08-21T12:00:20.000Z'}),
    ])

    const chart = screen.getByRole('img')
    vi.spyOn(chart, 'getBoundingClientRect').mockReturnValue({
      bottom: 240,
      height: 240,
      left: 0,
      right: 800,
      toJSON: () => ({}),
      top: 0,
      width: 800,
      x: 0,
      y: 0,
    })

    await user.pointer([
      {coords: {clientX: 72, clientY: 100}, keys: '[MouseLeft>]', target: chart},
      {coords: {clientX: 300, clientY: 100}, target: chart},
      {coords: {clientX: 300, clientY: 100}, keys: '[/MouseLeft]', target: chart},
    ])

    expect(screen.getAllByTestId('diagnostics-request-history-point')).toHaveLength(1)
    await user.click(screen.getByRole('button', {name: 'Reset time range'}))
    expect(screen.getAllByTestId('diagnostics-request-history-point')).toHaveLength(3)
  })

  it('uses the browser time format when UTC is disabled', async () => {
    const user = userEvent.setup()
    const entry = createEntry()
    renderReport([entry], {useUtc: false})

    await user.hover(screen.getByTestId('diagnostics-request-history-point'))

    expect(screen.getByRole('tooltip')).toHaveTextContent(
      new Date(entry.startedAt).toLocaleTimeString(),
    )
  })

  it('excludes requests started while diagnostics were being gathered', () => {
    renderReport(
      [
        createEntry({bucket: 'query', startedAt: '2026-08-21T11:59:59.000Z'}),
        createEntry({bucket: 'actions', startedAt: '2026-08-21T12:00:05.000Z'}),
        createEntry({bucket: 'doc', startedAt: '2026-08-21T12:00:11.000Z'}),
      ],
      {
        diagnosticsCompletedAt: '2026-08-21T12:00:10.000Z',
        diagnosticsStartedAt: '2026-08-21T12:00:00.000Z',
      },
    )

    expect(screen.getAllByTestId('diagnostics-request-history-point')).toHaveLength(2)
    expect(screen.queryByRole('button', {name: 'actions'})).not.toBeInTheDocument()
    expect(screen.getByRole('button', {name: 'query'})).toBeInTheDocument()
    expect(screen.getByRole('button', {name: 'doc'})).toBeInTheDocument()
  })

  it('explains when only diagnostics requests were observed', () => {
    renderReport([createEntry({startedAt: '2026-08-21T12:00:05.000Z'})], {
      diagnosticsCompletedAt: '2026-08-21T12:00:10.000Z',
      diagnosticsStartedAt: '2026-08-21T12:00:00.000Z',
    })

    expect(
      screen.getByText('No session requests outside this diagnostics run are available to plot.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})

function renderReport(
  entries: RequestPerformanceEntry[],
  options: {
    diagnosticsCompletedAt?: string
    diagnosticsStartedAt?: string
    sessionSummary?: RequestPerformanceSessionSummary
    useUtc?: boolean
  } = {},
) {
  const sessionEntries = entries.filter((entry) => {
    if (!options.diagnosticsStartedAt || !options.diagnosticsCompletedAt) return true
    const startedAt = new Date(entry.startedAt).getTime()
    return (
      startedAt < new Date(options.diagnosticsStartedAt).getTime() ||
      startedAt > new Date(options.diagnosticsCompletedAt).getTime()
    )
  })
  const sessionSummary = options.sessionSummary ?? summarizeSession(sessionEntries)

  return render(
    <ThemeProvider theme={buildTheme()}>
      <RequestPerformanceReport
        diagnosticsCompletedAt={options.diagnosticsCompletedAt}
        diagnosticsStartedAt={options.diagnosticsStartedAt}
        history={{
          dataset: 'production',
          entries,
          maxEntries: 500,
          projectId: 'test-project',
          sessionSummary,
          totalRequests: entries.length,
          truncated: false,
        }}
        useUtc={options.useUtc}
      />
    </ThemeProvider>,
  )
}

function summarizeSession(entries: RequestPerformanceEntry[]): RequestPerformanceSessionSummary {
  const buckets = new Map<string, number[]>()
  for (const entry of entries) {
    if (entry.status === 'aborted') continue
    const durations = buckets.get(entry.bucket) ?? []
    durations.push(entry.durationMs)
    buckets.set(entry.bucket, durations)
  }

  return {
    buckets: [...buckets.entries()].map(([bucket, durations]) => {
      const sorted = durations.toSorted((left, right) => left - right)
      return {
        bucket,
        count: sorted.length,
        maxMs: sorted.at(-1) ?? 0,
        medianMs: sorted[Math.ceil(sorted.length * 0.5) - 1] ?? 0,
        p95Ms: sorted[Math.ceil(sorted.length * 0.95) - 1] ?? 0,
      }
    }),
    startedAt: '2026-08-21T11:00:00.000Z',
    totalRequests: entries.length,
  }
}

function formatUtcTime(value: string): string {
  return new Date(value).toLocaleTimeString([], {
    hour: '2-digit',
    hourCycle: 'h23',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'UTC',
  })
}

function createEntry(overrides: Partial<RequestPerformanceEntry> = {}): RequestPerformanceEntry {
  return {
    apiVersion: 'v2025-02-19',
    bucket: 'query',
    dataset: 'production',
    durationMs: 20,
    projectId: 'test-project',
    startedAt: '2026-08-21T12:00:00.000Z',
    status: 'success',
    ...overrides,
  }
}
