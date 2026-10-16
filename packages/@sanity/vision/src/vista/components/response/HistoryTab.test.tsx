import {LayerProvider, ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {cleanup, fireEvent, render, screen, within} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {type FetchHistoryEntry} from '../../store/types'
import {HistoryTab} from './HistoryTab'

const diffModule = vi.hoisted(() => ({loads: 0, throwOnRender: false, throwInEffect: false}))

vi.mock('./CodeDiff', async () => {
  diffModule.loads++
  const {useEffect} = await import('react')
  // The real diff draws in an effect, which throws there when drawing fails
  function MockCodeDiff(props: {previous: string; next: string; lang: string}) {
    useEffect(() => {
      if (diffModule.throwInEffect) throw new Error('Could not draw the diff')
    })
    if (diffModule.throwOnRender) throw new Error('Could not render the diff')
    return (
      <pre data-lang={props.lang} data-testid="code-diff">
        {JSON.stringify({previous: props.previous, next: props.next})}
      </pre>
    )
  }
  return {default: MockCodeDiff}
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
    query: '*',
    params: {},
    status: 'ok',
    ms: 3,
    e2eMs: 40,
    errorMessage: undefined,
    network: undefined,
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

async function diffedTexts(section: HTMLElement) {
  const diff = await within(section).findByTestId('code-diff')
  return {
    lang: diff.dataset.lang,
    ...(JSON.parse(diff.textContent) as {previous: string; next: string}),
  }
}

async function diffedValues(row: HTMLElement) {
  const {previous, next} = await diffedTexts(
    await within(row).findByTestId('vista-history-diff-result'),
  )
  return {previous: JSON.parse(previous) as unknown, next: JSON.parse(next) as unknown}
}

describe('HistoryTab', () => {
  afterEach(() => cleanup())

  it('says how each result compares with the previous one, without loading the diff', () => {
    const [changed, failed, unchanged, changedDropped, tooLarge, first] = renderTab()
    const statuses = [
      'vista.history.changed',
      'vista.history.unchanged',
      'vista.history.same-result',
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

  it('marks the fetches the API CDN answered, and its cache hits', () => {
    const network = {
      viaCdn: true,
      cacheHit: false,
      shard: undefined,
      traceId: 't',
      cacheControl: undefined,
    }
    renderTab([
      entry('hit', 3, {network: {...network, cacheHit: true}}),
      entry('miss', 2, {network}),
      entry('api', 1, {network: {...network, viaCdn: false}}),
    ])
    expect(screen.getAllByTestId('vista-history-cdn').map((badge) => badge.textContent)).toEqual([
      'vista.history.cdn-cache-hit',
      'vista.history.cdn',
    ])
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
    expect(await diffedValues(changed)).toEqual({next: three.value, previous: two.value})
    // The request did not change, so only the result is diffed
    expect(within(changes).getAllByTestId('code-diff')).toHaveLength(1)
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

  it('says nothing about hidden fields when neither result has any', async () => {
    const [latest] = renderTab(twoFetches([{title: 'Two'}], [{title: 'Three'}]), ['_rev'])
    fireEvent.click(within(latest).getByTestId('vista-history-changes-toggle'))
    expect(await diffedValues(latest)).toEqual({
      previous: [{title: 'Two'}],
      next: [{title: 'Three'}],
    })
    expect(within(latest).queryByTestId('vista-history-hidden-fields')).toBeNull()
    expect(within(latest).queryByTestId('vista-history-hidden-toggle')).toBeNull()
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

  it('diffs the query, params and request URL that changed, before the result', async () => {
    const [changed] = renderTab(
      createHistory({
        query: '*[_type == $type]',
        params: {type: 'author'},
        url: 'https://example.api.sanity.io/v2025-02-19/data/query/production?query=*%5B_type+%3D%3D+%24type%5D&%24type=%22author%22&perspective=drafts&resultSourceMap=true',
      }),
    )
    fireEvent.click(within(changed).getByTestId('vista-history-changes-toggle'))
    const changes = within(changed).getByTestId('vista-history-changes')
    expect(changes.textContent).toContain('vista.history.compared-with:{"time":"10:00:04"}')

    const query = await within(changes).findByTestId('vista-history-diff-query')
    expect(within(query).getByText('vista.history.diff.query')).toBeTruthy()
    expect(await diffedTexts(query)).toEqual({
      lang: 'text',
      previous: '*\n',
      next: '*[_type == $type]\n',
    })
    expect(await diffedTexts(within(changes).getByTestId('vista-history-diff-params'))).toEqual({
      lang: 'json',
      previous: '{}\n',
      next: '{\n  "type": "author"\n}\n',
    })
    // The query and params have diffs of their own, and a source map does not change the result
    expect(await diffedTexts(within(changes).getByTestId('vista-history-diff-url'))).toEqual({
      lang: 'text',
      previous: 'https://example.api.sanity.io/v2025-02-19/data/query/test\n',
      next: 'https://example.api.sanity.io/v2025-02-19/data/query/production\nperspective=drafts\n',
    })
    expect(await diffedValues(changed)).toEqual({next: three.value, previous: two.value})

    const sections = within(changes)
      .getAllByTestId(/^vista-history-diff-/)
      .map((section) => section.dataset.testid)
    expect(sections).toEqual([
      'vista-history-diff-query',
      'vista-history-diff-params',
      'vista-history-diff-url',
      'vista-history-diff-result',
    ])
  })

  it('lays the queries out for the diff, one projection attribute per line', async () => {
    const [latest] = renderTab([
      entry('latest', 6, {query: '*[_type == "author"]{_id, name, bio}', result: two}),
      entry('previous', 5, {query: '*[_type == "author"]{_id, name}', result: two}),
    ])
    fireEvent.click(within(latest).getByTestId('vista-history-changes-toggle'))
    expect(
      await diffedTexts(await within(latest).findByTestId('vista-history-diff-query')),
    ).toEqual({
      lang: 'text',
      previous: '*[_type == "author"] {\n  _id,\n  name\n}\n',
      next: '*[_type == "author"] {\n  _id,\n  name,\n  bio\n}\n',
    })
  })

  it('says when the queries only differ in their formatting', async () => {
    const [latest] = renderTab([
      entry('latest', 6, {query: '*[_type == "author"] {\n  _id,\n  name\n}', result: two}),
      entry('previous', 5, {query: '*[_type == "author"]{_id,name}', result: two}),
    ])
    fireEvent.click(within(latest).getByTestId('vista-history-changes-toggle'))
    const query = await within(latest).findByTestId('vista-history-diff-query')
    expect(
      (await within(query).findByTestId('vista-history-query-formatting-only')).textContent,
    ).toBe('vista.history.diff.query-formatting-only')
    expect(within(query).queryByTestId('code-diff')).toBeNull()
  })

  it('offers the request changes of a fetch whose result stayed the same', async () => {
    const [latest] = renderTab([
      entry('latest', 6, {params: {limit: 5}, result: two, resultChange: 'unchanged'}),
      entry('previous', 5, {params: {limit: 10}, result: two}),
    ])
    expect(latest.textContent).toContain('vista.history.same-result')
    expect(latest.textContent).not.toContain('vista.history.unchanged')

    fireEvent.click(within(latest).getByTestId('vista-history-changes-toggle'))
    const changes = within(latest).getByTestId('vista-history-changes')
    expect(await diffedTexts(within(changes).getByTestId('vista-history-diff-params'))).toEqual({
      lang: 'json',
      previous: '{\n  "limit": 10\n}\n',
      next: '{\n  "limit": 5\n}\n',
    })
    expect(within(changes).queryByTestId('vista-history-diff-result')).toBeNull()
  })

  it('shows what changed in the request of a failed fetch since the last successful one', async () => {
    const [failed] = renderTab([
      entry('failed', 6, {
        query: '*[',
        status: 'error',
        ms: undefined,
        errorMessage: 'Parse error',
      }),
      entry('previous', 5, {result: two}),
    ])
    fireEvent.click(within(failed).getByTestId('vista-history-changes-toggle'))
    const changes = within(failed).getByTestId('vista-history-changes')
    expect(
      await diffedTexts(await within(changes).findByTestId('vista-history-diff-query')),
    ).toEqual({
      lang: 'text',
      previous: '*\n',
      next: '*[\n',
    })
    expect(within(changes).getAllByTestId('code-diff')).toHaveLength(1)
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
      expect(await within(changed).findByTestId('code-diff')).toBeTruthy()
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
      expect(await within(changed).findByTestId('code-diff')).toBeTruthy()
    } finally {
      consoleError.mockRestore()
      diffModule.throwInEffect = false
    }
  })
})
