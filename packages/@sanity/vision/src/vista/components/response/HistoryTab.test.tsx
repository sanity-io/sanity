import {LayerProvider, ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {cleanup, fireEvent, render, screen, within} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {type FetchHistoryEntry} from '../../store/types'
import {HistoryTab} from './HistoryTab'

const diffModule = vi.hoisted(() => ({loads: 0, throwOnRender: false, throwInEffect: false}))

vi.mock('./ResultDiff', async () => {
  diffModule.loads++
  const {useEffect} = await import('react')
  // The real diff draws in an effect, which throws there when drawing fails
  function MockResultDiff(props: {previous: unknown; next: unknown}) {
    useEffect(() => {
      if (diffModule.throwInEffect) throw new Error('Could not draw the diff')
    })
    if (diffModule.throwOnRender) throw new Error('Could not render the diff')
    return <pre data-testid="result-diff">{JSON.stringify(props)}</pre>
  }
  return {default: MockResultDiff}
})

vi.mock('sanity', () => ({
  defineLocaleResourceBundle: (bundle: unknown) => bundle,
  defineLocalesResources: (_namespace: string, resources: unknown) => resources,
  useDateTimeFormat: () => ({format: (date: Date) => date.toISOString().slice(11, 19)}),
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${JSON.stringify(options)}` : key,
  }),
}))

// @sanity/ui's ThemeProvider reads the color scheme preference
vi.stubGlobal(
  'matchMedia',
  vi.fn((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
)

const theme = buildTheme()
const URL = 'https://example.api.sanity.io/v2025-02-19/data/query/test?query=*'

function entry(id: string, second: number, overrides: Partial<FetchHistoryEntry> = {}) {
  return {
    id,
    requestedAt: `2026-10-15T10:00:0${second}.000Z`,
    reason: {type: 'manual'},
    url: URL,
    status: 'ok',
    ms: 3,
    e2eMs: 40,
    errorMessage: undefined,
    result: undefined,
    resultChange: undefined,
    ...overrides,
  } satisfies FetchHistoryEntry
}

const two = {value: [{title: 'Two'}], bytes: 17}
const three = {value: [{title: 'Three'}], bytes: 19}

// Newest first, as the runner keeps it
function createHistory(latest: Partial<FetchHistoryEntry> = {}): FetchHistoryEntry[] {
  return [
    entry('changed', 6, {
      reason: {type: 'live', matchedTags: ['s1:a']},
      result: three,
      resultChange: 'changed',
      ...latest,
    }),
    entry('failed', 5, {status: 'error', ms: undefined, errorMessage: 'Boom'}),
    entry('unchanged', 4, {result: two, resultChange: 'unchanged'}),
    // Its previous result is no longer kept, so the change cannot be shown
    entry('changed-dropped', 3, {result: two, resultChange: 'changed'}),
    entry('too-large', 2, {resultChange: 'too-large'}),
    entry('first', 1),
  ]
}

function renderTab(history = createHistory(), hiddenFields: string[] = []) {
  render(
    <ThemeProvider theme={theme}>
      <LayerProvider>
        <HistoryTab hiddenFields={hiddenFields} history={history} />
      </LayerProvider>
    </ThemeProvider>,
  )
  return screen.getAllByTestId('vista-history-entry')
}

function twoFetches(before: unknown, after: unknown): FetchHistoryEntry[] {
  return [
    entry('latest', 6, {result: {value: after, bytes: 1}, resultChange: 'changed'}),
    entry('previous', 5, {result: {value: before, bytes: 1}}),
  ]
}

async function diffedValues(row: HTMLElement) {
  return JSON.parse((await within(row).findByTestId('result-diff')).textContent) as unknown
}

describe('HistoryTab', () => {
  afterEach(() => cleanup())

  it('says how each result compares with the previous one, without loading the diff', () => {
    const [changed, failed, unchanged, changedDropped, tooLarge, first] = renderTab()
    const statuses = [
      'vista.history.changed',
      'vista.history.unchanged',
      'vista.history.too-large',
    ] as const
    const statusOf = (row: HTMLElement) =>
      statuses.filter((status) => row.textContent?.includes(status))

    expect(within(changed).getByTestId('vista-history-changes-toggle').textContent).toBe(
      'vista.history.changes',
    )
    expect(statusOf(changed)).toEqual([])
    expect(statusOf(failed)).toEqual([])
    expect(statusOf(unchanged)).toEqual(['vista.history.unchanged'])
    expect(statusOf(changedDropped)).toEqual(['vista.history.changed'])
    expect(statusOf(tooLarge)).toEqual(['vista.history.too-large'])
    expect(statusOf(first)).toEqual([])
    expect(screen.getAllByTestId('vista-history-changes-toggle')).toHaveLength(1)
    expect(diffModule.loads).toBe(0)
  })

  it('loads the diff when the changes are expanded, against the previous successful result', async () => {
    const [changed] = renderTab()
    const toggle = within(changed).getByTestId('vista-history-changes-toggle')
    expect(toggle.getAttribute('aria-expanded')).toBe('false')

    fireEvent.click(toggle)
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
    const changes = within(changed).getByTestId('vista-history-changes')
    expect(toggle.getAttribute('aria-controls')).toBe(changes.id)
    expect(changes.textContent).toContain('vista.history.compared-with:{"time":"10:00:04"}')
    // Compared across the failed fetch, with the last result there was
    expect(JSON.parse((await within(changes).findByTestId('result-diff')).textContent)).toEqual({
      next: three.value,
      previous: two.value,
    })
    expect(diffModule.loads).toBe(1)

    fireEvent.click(toggle)
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    expect(within(changed).queryByTestId('vista-history-changes')).toBeNull()
  })

  it('leaves the hidden fields out of the diff, and shows them on request', async () => {
    const [latest] = renderTab(
      twoFetches(
        [{_id: 'a', _rev: 'r1', _system: {base: {rev: 'b1'}}, title: 'Two'}],
        [{_id: 'a', _rev: 'r2', _system: {base: {rev: 'b2'}}, title: 'Three'}],
      ),
      ['_rev', '_system.base.rev'],
    )
    expect(latest.textContent).not.toContain('vista.history.only-hidden-changed')
    fireEvent.click(within(latest).getByTestId('vista-history-changes-toggle'))
    expect(await diffedValues(latest)).toEqual({
      previous: [{_id: 'a', _system: {base: {}}, title: 'Two'}],
      next: [{_id: 'a', _system: {base: {}}, title: 'Three'}],
    })
    expect(within(latest).getByTestId('vista-history-hidden-fields').textContent).toBe(
      'vista.history.hiding:{"fields":"_rev, _system.base.rev"}',
    )

    fireEvent.click(within(latest).getByTestId('vista-history-hidden-toggle'))
    expect(await diffedValues(latest)).toEqual({
      previous: [{_id: 'a', _rev: 'r1', _system: {base: {rev: 'b1'}}, title: 'Two'}],
      next: [{_id: 'a', _rev: 'r2', _system: {base: {rev: 'b2'}}, title: 'Three'}],
    })
    expect(within(latest).getByTestId('vista-history-hidden-fields').textContent).toBe(
      'vista.history.showing-hidden:{"fields":"_rev, _system.base.rev"}',
    )
  })

  it('says when only hidden fields changed, and diffs them all then', async () => {
    const before = [{_id: 'a', _rev: 'r1', _updatedAt: 't1', title: 'Same'}]
    const after = [{_id: 'a', _rev: 'r2', _updatedAt: 't2', title: 'Same'}]
    const [latest] = renderTab(twoFetches(before, after), ['_rev', '_updatedAt'])
    expect(latest.textContent).toContain('vista.history.only-hidden-changed')

    fireEvent.click(within(latest).getByTestId('vista-history-changes-toggle'))
    expect(await diffedValues(latest)).toEqual({previous: before, next: after})
    expect(within(latest).queryByTestId('vista-history-hidden-toggle')).toBeNull()
  })

  it('says when the previous result was fetched for another request', async () => {
    const [changed] = renderTab(createHistory({url: `${URL}&$type=%22author%22`}))
    fireEvent.click(within(changed).getByTestId('vista-history-changes-toggle'))
    expect(await within(changed).findByTestId('result-diff')).toBeTruthy()
    expect(within(changed).getByTestId('vista-history-changes').textContent).toContain(
      'vista.history.compared-with-other-request:{"time":"10:00:04"}',
    )
  })

  it('offers a retry when the diff cannot be shown', async () => {
    diffModule.throwOnRender = true
    // React reports the error it recovers from
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const [changed] = renderTab()
      fireEvent.click(within(changed).getByTestId('vista-history-changes-toggle'))
      expect(await within(changed).findByText('vista.history.changes-failed')).toBeTruthy()

      diffModule.throwOnRender = false
      fireEvent.click(within(changed).getByText('vista.history.changes-retry'))
      expect(await within(changed).findByTestId('result-diff')).toBeTruthy()
      expect(within(changed).queryByText('vista.history.changes-failed')).toBeNull()
    } finally {
      consoleError.mockRestore()
      diffModule.throwOnRender = false
    }
  })

  it('offers the same retry when drawing the diff fails after it rendered', async () => {
    diffModule.throwInEffect = true
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const [changed] = renderTab()
      fireEvent.click(within(changed).getByTestId('vista-history-changes-toggle'))
      expect(await within(changed).findByText('vista.history.changes-failed')).toBeTruthy()

      diffModule.throwInEffect = false
      fireEvent.click(within(changed).getByText('vista.history.changes-retry'))
      expect(await within(changed).findByTestId('result-diff')).toBeTruthy()
    } finally {
      consoleError.mockRestore()
      diffModule.throwInEffect = false
    }
  })
})
