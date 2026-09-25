import {type LiveEvent, type SanityClient} from '@sanity/client'
import {LayerProvider, ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {ToastProvider} from '@sanity/ui/toast'
import {act, cleanup, fireEvent, render, screen, waitFor, within} from '@testing-library/react'
import {type ReactNode, type RefAttributes, useImperativeHandle, useRef} from 'react'
import {Subject} from 'rxjs'
import {type PerspectiveContextValue} from 'sanity'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {type VisionCodeMirrorHandle} from '../../codemirror/VisionCodeMirror'
import {
  createInitialState,
  createTab,
  getVistaStorageKey,
  saveVistaState,
} from '../store/vistaStorage'
import {VistaGui} from './VistaGui'

const theme = buildTheme()

// `usePerspective` is backed by a tiny external store so that changing the navbar perspective
// re-renders subscribers, as the real context-based hook does
const sanityMocks = vi.hoisted(() => {
  let perspective: unknown = null
  const listeners = new Set<() => void>()
  return {
    setPerspective: (next: unknown) => {
      perspective = next
      listeners.forEach((listener) => listener())
    },
    subscribePerspective: (listener: () => void) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getPerspective: () => perspective,
    useClient: vi.fn(),
    clearQueries: vi.fn(() => Promise.resolve()),
  }
})

/**
 * What the mocked editors report as their width, in characters, optionally depending on the
 * line count asked about; `undefined` means no layout
 */
const editorMocks = vi.hoisted(() => ({
  visibleColumns: undefined as number | ((lines: number | undefined) => number) | undefined,
}))

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal('ResizeObserver', ResizeObserverMock)
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

vi.mock('sanity', async () => {
  const {useSyncExternalStore} = await import('react')
  return {
    usePerspective: () =>
      useSyncExternalStore(sanityMocks.subscribePerspective, sanityMocks.getPerspective),
    useClient: sanityMocks.useClient,
    useActiveReleases: vi.fn(() => ({data: [], loading: false})),
    useScheduledDraftsEnabled: vi.fn(() => false),
    useWorkspace: vi.fn(() => ({document: {drafts: {enabled: true}}})),
    useTranslation: () => ({
      t: (key: string, options?: {message?: string}) =>
        options?.message ? `${key}:${options.message}` : key,
    }),
    defineLocaleResourceBundle: (bundle: unknown) => bundle,
    defineLocalesResources: (_namespace: string, resources: unknown) => resources,
    VARIANTS_STUDIO_CLIENT_OPTIONS: {apiVersion: 'X'},
    RELEASES_STUDIO_CLIENT_OPTIONS: {apiVersion: '2025-02-19'},
    getReleaseIdFromReleaseDocumentId: (id: string) => id.replace(/^_.releases./, ''),
    isCardinalityOneRelease: () => false,
    sortReleases: <T,>(releases: T[]) => releases,
    getVariantTitle: (variant: {title?: string}) => variant.title,
    getDefaultVariant: <T,>(selected?: readonly T[]) => selected?.[0],
    useSchema: () => undefined,
    useKeyValueStore: () => ({getKey: vi.fn(), setKey: vi.fn()}),
    useCurrentUser: () => ({id: 'user-1'}),
    useDateTimeFormat: () => ({format: () => 'a date'}),
    ContextMenuButton: (props: Record<string, unknown>) => <button type="button" {...props} />,
    UserAvatar: () => null,
  }
})

vi.mock('sanity/router', () => ({
  IntentLink: ({children}: {children: ReactNode}) => <a href="#intent">{children}</a>,
}))

vi.mock('../../hooks/useSavedQueries', () => ({
  useSavedQueries: () => ({
    queries: [],
    saveQuery: vi.fn(),
    updateQuery: vi.fn(),
    deleteQuery: vi.fn(),
    shareQuery: vi.fn(),
    unshareQuery: vi.fn(),
    clearQueries: sanityMocks.clearQueries,
    saving: false,
    deleting: [],
    saveQueryError: undefined,
    deleteQueryError: undefined,
    error: undefined,
  }),
}))

vi.mock('../../components/ResultView', () => ({
  ResultView: ({data}: {data: unknown}) => (
    <pre data-testid="result-json">{JSON.stringify(data)}</pre>
  ),
}))

vi.mock('../../codemirror/VisionCodeMirror', () => ({
  VisionCodeMirror: function VisionCodeMirrorMock({
    initialValue,
    onChange,
    ref,
  }: {
    initialValue?: string
    onChange?: (value: string) => void
  } & RefAttributes<VisionCodeMirrorHandle>) {
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    useImperativeHandle(ref, () => ({
      resetEditorContent: (content: string) => {
        if (textareaRef.current) textareaRef.current.value = content
      },
      selectRange: (from: number, to: number) => {
        textareaRef.current?.setSelectionRange(from, to)
        textareaRef.current?.focus()
      },
      getVisibleColumns: (lines?: number) =>
        typeof editorMocks.visibleColumns === 'function'
          ? editorMocks.visibleColumns(lines)
          : editorMocks.visibleColumns,
    }))
    return (
      <textarea
        data-testid="codemirror-mock"
        defaultValue={initialValue}
        onChange={(event) => onChange?.(event.target.value)}
        ref={textareaRef}
      />
    )
  },
}))

vi.mock('@rexxars/react-split-pane', () => ({
  SplitPane: function SplitPaneMock({children}: {children: ReactNode}) {
    return <div>{children}</div>
  },
}))

const BASE_PERSPECTIVE: PerspectiveContextValue = {
  perspectiveStack: ['published'],
  excludedPerspectives: [],
  selectedPerspective: 'published',
  selectedPerspectiveName: 'published',
  selectedReleaseId: undefined,
  selectedVariantNames: [],
  selectedVariants: [],
  // oxlint-disable-next-line typescript/no-deprecated -- fixture fills the deprecated first-variant alias
  selectedVariantName: undefined,
  // oxlint-disable-next-line typescript/no-deprecated -- fixture fills the deprecated first-variant alias
  selectedVariant: undefined,
  bundle: 'published',
}

const PROJECT_ID = 'test-project'
const STORAGE_KEY = getVistaStorageKey(PROJECT_ID)
const DEFAULTS = {
  datasets: ['test', 'staging'],
  defaultDataset: 'test',
  defaultApiVersion: '2025-02-19',
}

type ClientConfig = Record<string, unknown>

interface FetchCall {
  config: ClientConfig
  query: string
  params: Record<string, unknown>
  options: Record<string, unknown>
}

function createMockClient(initial: ClientConfig = {apiVersion: 'v2025-02-19', dataset: 'test'}) {
  const fetchCalls: FetchCall[] = []
  const liveEvents = new Subject<LiveEvent>()
  let liveSubscriptions = 0
  let nextResponse: Record<string, unknown> = {
    result: [{title: 'Variant title'}],
    ms: 12,
    syncTags: ['s1:abc'],
  }
  let nextError: Error | undefined
  // While set, fetches wait for it before responding, so a test can look at the in-flight state
  let hold: Promise<void> | undefined

  const create = (config: ClientConfig): SanityClient =>
    ({
      config: () => config,
      withConfig: (next: ClientConfig) => create({...config, ...next}),
      getDataUrl: (operation: string, qs: string) =>
        `/${String(config.apiVersion)}/data/${operation}/${String(config.dataset)}${qs}`,
      getUrl: (path: string) => `https://test.api.sanity.io${path}`,
      fetch: (query: string, params: Record<string, unknown>, options: Record<string, unknown>) => {
        fetchCalls.push({config, query, params, options})
        const respond = () =>
          nextError ? Promise.reject(nextError) : Promise.resolve({query, ...nextResponse})
        return hold ? hold.then(respond) : respond()
      },
      live: {
        events: () => {
          liveSubscriptions++
          return liveEvents
        },
      },
    }) as unknown as SanityClient

  return {
    client: create(initial),
    fetchCalls,
    liveEvents,
    liveSubscriptionCount: () => liveSubscriptions,
    respondWith: (response: Record<string, unknown>) => {
      nextResponse = response
      nextError = undefined
    },
    failWith: (error: Error) => {
      nextError = error
    },
    /** Keeps the following fetches pending until the returned function is called */
    holdFetches: () => {
      let release = () => {}
      hold = new Promise<void>((resolve) => {
        release = resolve
      })
      return () => {
        hold = undefined
        release()
      }
    },
  }
}

function renderVista(perspective: PerspectiveContextValue = BASE_PERSPECTIVE) {
  const mockClient = createMockClient()
  sanityMocks.setPerspective(perspective)
  sanityMocks.useClient.mockReturnValue(mockClient.client)
  const onSwitchToClassic = vi.fn()

  const ui = () => (
    <ThemeProvider theme={theme}>
      <ToastProvider>
        <LayerProvider>
          <VistaGui
            config={{defaultApiVersion: '2025-02-19'}}
            datasets={DEFAULTS.datasets}
            projectId={PROJECT_ID}
            defaultDataset="test"
            onSwitchToClassic={onSwitchToClassic}
          />
        </LayerProvider>
      </ToastProvider>
    </ThemeProvider>
  )
  const view = render(ui())

  return {
    ...view,
    ...mockClient,
    onSwitchToClassic,
    setPerspective: (next: PerspectiveContextValue) => {
      act(() => sanityMocks.setPerspective(next))
    },
  }
}

function getQueryEditor(): HTMLTextAreaElement {
  return within(screen.getByTestId('vista-query-editor')).getByTestId(
    'codemirror-mock',
  ) as HTMLTextAreaElement
}

function typeQuery(query: string) {
  fireEvent.change(getQueryEditor(), {target: {value: query}})
}

function getStoredState() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
}

function text(element: HTMLElement): string {
  return element.textContent || ''
}

function isDisabled(element: HTMLElement): boolean {
  return (element as HTMLButtonElement).disabled
}

function selectValue(testId: string): string {
  return (screen.getByTestId(testId) as HTMLSelectElement).value
}

describe('VistaGui', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  beforeEach(() => {
    localStorage.clear()
    sanityMocks.setPerspective(BASE_PERSPECTIVE)
    editorMocks.visibleColumns = undefined
  })

  it('starts with one empty tab and a disabled fetch button', () => {
    renderVista()

    expect(screen.getAllByTestId('vista-tab')).toHaveLength(1)
    expect(text(screen.getByTestId('vista-tab-button'))).toContain('vista.tabs.untitled')
    expect(isDisabled(screen.getByTestId('vista-fetch-button'))).toBe(true)
    expect(text(screen.getByTestId('vista-result'))).toContain('vista.result.empty')
  })

  it('shows the query, params and options panels at once, and remembers collapsed ones', async () => {
    const {unmount} = renderVista()

    expect(screen.getByTestId('vista-query-editor')).toBeTruthy()
    expect(screen.getByTestId('vista-params-editor')).toBeTruthy()
    expect(screen.getByTestId('vista-options')).toBeTruthy()
    const optionsToggle = () => screen.getByTestId('vista-request-options-toggle')
    expect(optionsToggle().getAttribute('aria-expanded')).toBe('true')

    fireEvent.click(optionsToggle())
    expect(screen.queryByTestId('vista-options')).toBeNull()
    expect(optionsToggle().getAttribute('aria-expanded')).toBe('false')
    // Collapsing one panel leaves the other alone, and the query editor stays put
    expect(screen.getByTestId('vista-params-editor')).toBeTruthy()
    expect(screen.getByTestId('vista-query-editor')).toBeTruthy()
    await waitFor(() => expect(getStoredState().panels).toEqual({params: true, options: false}))

    unmount()
    renderVista()
    expect(screen.queryByTestId('vista-options')).toBeNull()
    expect(screen.getByTestId('vista-params-editor')).toBeTruthy()

    fireEvent.click(screen.getByTestId('vista-request-options-toggle'))
    expect(screen.getByTestId('vista-options')).toBeTruthy()
    fireEvent.click(screen.getByTestId('vista-request-params-toggle'))
    expect(screen.queryByTestId('vista-params-editor')).toBeNull()
    await waitFor(() => expect(getStoredState().panels).toEqual({params: false, options: true}))
  })

  it('fetches the raw response, shows its metadata and records the history', async () => {
    const {fetchCalls} = renderVista()

    typeQuery('*[_type == "author"]')
    await waitFor(() => expect(isDisabled(screen.getByTestId('vista-fetch-button'))).toBe(false))
    expect(text(screen.getByTestId('vista-tab-button'))).toContain('author')

    fireEvent.click(screen.getByTestId('vista-fetch-button'))

    await waitFor(() => expect(screen.getByTestId('result-json')).toBeTruthy())
    expect(fetchCalls).toHaveLength(1)
    expect(fetchCalls[0]).toMatchObject({
      query: '*[_type == "author"]',
      params: {},
      options: {filterResponse: false, tag: 'vista'},
      // New tabs follow the workspace dataset and the navbar perspective (published here)
      config: {apiVersion: 'v2025-02-19', dataset: 'test', perspective: ['published']},
    })
    expect(text(screen.getByTestId('result-json'))).toContain('[{"title":"Variant title"}]')

    expect(text(screen.getByTestId('vista-meta-execution'))).toContain('12ms')
    expect(text(screen.getByTestId('vista-meta-sync-tags'))).toContain('s1:abc')
    const url = new URL((screen.getByTestId('vista-query-url') as HTMLInputElement).value)
    expect(url.pathname).toBe('/v2025-02-19/data/query/test')
    expect(url.searchParams.get('query')).toBe('*[_type == "author"]')
    expect(url.searchParams.get('perspective')).toBe('published')

    fireEvent.click(document.getElementById('vista-response-history-tab') as HTMLElement)
    const entries = screen.getAllByTestId('vista-history-entry')
    expect(entries).toHaveLength(1)
    expect(text(entries[0])).toContain('vista.history.reason.manual')
  })

  it('keeps the shown result and its actions while a refetch is in flight', async () => {
    const {fetchCalls, holdFetches, respondWith} = renderVista()
    typeQuery('*[_type == "author"]')
    // Nothing to download yet: the export controls are disabled buttons
    expect(isDisabled(screen.getByTestId('vista-export-json'))).toBe(true)
    fireEvent.click(screen.getByTestId('vista-fetch-button'))
    await waitFor(() => expect(screen.getByTestId('result-json')).toBeTruthy())
    // With a result they are download links
    expect(screen.getByTestId('vista-export-json').getAttribute('href')).toBeTruthy()

    const release = holdFetches()
    respondWith({result: [{title: 'Newer'}], ms: 34, syncTags: ['s1:abc']})
    fireEvent.click(screen.getByTestId('vista-fetch-button'))
    await waitFor(() => expect(fetchCalls).toHaveLength(2))

    // The previous result stays on screen until the new one arrives, and so does everything
    // that works on it
    expect(text(screen.getByTestId('result-json'))).toContain('Variant title')
    expect(screen.getByTestId('vista-export-json').getAttribute('href')).toBeTruthy()
    expect(screen.getByTestId('vista-export-csv').getAttribute('href')).toBeTruthy()

    release()
    await waitFor(() => expect(text(screen.getByTestId('result-json'))).toContain('Newer'))
    expect(text(screen.getByTestId('vista-meta-execution'))).toContain('34ms')
    expect(screen.getByTestId('vista-export-json').getAttribute('href')).toBeTruthy()
  })

  it('runs the query with the keyboard shortcut and marks the reason', async () => {
    const {fetchCalls} = renderVista()
    typeQuery('*')

    fireEvent.keyDown(getQueryEditor(), {key: 'Enter', ctrlKey: true, which: 13, keyCode: 13})

    await waitFor(() => expect(fetchCalls).toHaveLength(1))
    fireEvent.click(document.getElementById('vista-response-history-tab') as HTMLElement)
    await waitFor(() =>
      expect(text(screen.getByTestId('vista-history-entry'))).toContain(
        'vista.history.reason.shortcut',
      ),
    )
  })

  it('shows fetch errors in the result panel and the history', async () => {
    const {failWith} = renderVista()
    failWith(new Error('Syntax error in GROQ query'))
    typeQuery('*[')

    fireEvent.click(screen.getByTestId('vista-fetch-button'))

    await waitFor(() =>
      expect(text(screen.getByTestId('vista-result'))).toContain('Syntax error in GROQ query'),
    )
    fireEvent.click(document.getElementById('vista-response-history-tab') as HTMLElement)
    expect(text(screen.getByTestId('vista-history-entry'))).toContain('vista.history.failed')
  })

  it('opens, switches, renames and closes tabs, and persists them', async () => {
    renderVista()
    typeQuery('*[_type == "author"]')

    fireEvent.click(screen.getByTestId('vista-new-tab'))
    let tabs = screen.getAllByTestId('vista-tab')
    expect(tabs).toHaveLength(2)
    expect(within(tabs[1]).getByRole('tab').getAttribute('aria-selected')).toBe('true')
    expect(within(tabs[1]).getByRole('tab').getAttribute('aria-controls')).toBe(
      screen.getByTestId('vista-query-tab').id,
    )
    expect(screen.getByTestId('vista-query-tab').getAttribute('role')).toBe('tabpanel')
    expect(getQueryEditor().value).toBe('')

    const selectedTab = () =>
      screen
        .getAllByTestId('vista-tab')
        .findIndex((tab) => within(tab).getByRole('tab').getAttribute('aria-selected') === 'true')
    fireEvent.click(within(tabs[0]).getByTestId('vista-tab-button'))
    expect(selectedTab()).toBe(0)
    expect(getQueryEditor().value).toBe('*[_type == "author"]')

    // Arrow keys move between tabs and activate them
    fireEvent.keyDown(within(screen.getAllByTestId('vista-tab')[0]).getByRole('tab'), {
      key: 'ArrowRight',
    })
    expect(selectedTab()).toBe(1)
    fireEvent.keyDown(within(screen.getAllByTestId('vista-tab')[1]).getByRole('tab'), {key: 'Home'})
    expect(selectedTab()).toBe(0)
    expect(getQueryEditor().value).toBe('*[_type == "author"]')

    // F2 renames from the keyboard, double-click with the pointer; leaving the input with the
    // keyboard puts focus back on the tab
    fireEvent.keyDown(within(screen.getAllByTestId('vista-tab')[0]).getByRole('tab'), {key: 'F2'})
    const titleInput = screen.getByTestId('vista-tab-title-input')
    titleInput.focus()
    fireEvent.keyDown(titleInput, {key: 'Escape'})
    expect(screen.queryByTestId('vista-tab-title-input')).toBeNull()
    await waitFor(() =>
      expect(document.activeElement).toBe(
        within(screen.getAllByTestId('vista-tab')[0]).getByRole('tab'),
      ),
    )
    fireEvent.doubleClick(
      within(screen.getAllByTestId('vista-tab')[0]).getByTestId('vista-tab-button'),
    )
    const input = screen.getByTestId('vista-tab-title-input') as HTMLInputElement
    // The rename starts from the current, query-derived title
    expect(input.value).toBe('author')
    fireEvent.change(input, {target: {value: 'Authors'}})
    fireEvent.keyDown(input, {key: 'Enter'})
    expect(
      text(within(screen.getAllByTestId('vista-tab')[0]).getByTestId('vista-tab-button')),
    ).toContain('Authors')

    await waitFor(() => {
      const stored = getStoredState()
      expect(stored.tabs).toHaveLength(2)
      expect(stored.tabs[0]).toMatchObject({title: 'Authors', query: '*[_type == "author"]'})
      expect(stored.activeTabId).toBe(stored.tabs[0].id)
    })

    fireEvent.click(within(screen.getAllByTestId('vista-tab')[1]).getByTestId('vista-tab-close'))
    tabs = screen.getAllByTestId('vista-tab')
    expect(tabs).toHaveLength(1)
    expect(text(tabs[0])).toContain('Authors')

    // Shift with an arrow moves the focused tab, the keyboard counterpart of dragging it
    fireEvent.click(screen.getByTestId('vista-new-tab'))
    expect(screen.getAllByTestId('vista-tab').map(text)).toEqual([
      expect.stringContaining('Authors'),
      expect.stringContaining('vista.tabs.untitled'),
    ])
    fireEvent.keyDown(within(screen.getAllByTestId('vista-tab')[1]).getByRole('tab'), {
      key: 'ArrowLeft',
      shiftKey: true,
    })
    expect(screen.getAllByTestId('vista-tab').map(text)).toEqual([
      expect.stringContaining('vista.tabs.untitled'),
      expect.stringContaining('Authors'),
    ])
    expect(selectedTab()).toBe(0)
    // Moving past the edge is a no-op
    fireEvent.keyDown(within(screen.getAllByTestId('vista-tab')[0]).getByRole('tab'), {
      key: 'ArrowLeft',
      shiftKey: true,
    })
    expect(text(screen.getAllByTestId('vista-tab')[0])).toContain('vista.tabs.untitled')
    await waitFor(() =>
      expect(getStoredState().tabs.map((stored: {title?: string}) => stored.title)).toEqual([
        undefined,
        'Authors',
      ]),
    )
    fireEvent.keyDown(within(screen.getAllByTestId('vista-tab')[0]).getByRole('tab'), {
      key: 'ArrowRight',
      shiftKey: true,
    })
    expect(text(screen.getAllByTestId('vista-tab')[0])).toContain('Authors')
    expect(
      within(screen.getByTestId('vista-tab-bar')).getByRole('tablist').getAttribute('aria-label'),
    ).toBe('vista.tabs.label')

    // Delete closes the focused tab (the close button is not a tab stop); the last tab is
    // replaced by a fresh one
    expect(screen.getAllByTestId('vista-tab')).toHaveLength(2)
    fireEvent.keyDown(within(screen.getAllByTestId('vista-tab')[1]).getByRole('tab'), {
      key: 'Delete',
    })
    tabs = screen.getAllByTestId('vista-tab')
    expect(tabs).toHaveLength(1)
    expect(text(tabs[0])).toContain('Authors')

    fireEvent.click(within(tabs[0]).getByTestId('vista-tab-close'))
    expect(screen.getAllByTestId('vista-tab')).toHaveLength(1)
    expect(text(screen.getByTestId('vista-tab-button'))).toContain('vista.tabs.untitled')
  })

  it('only derives types from a result that was fetched for the current query', async () => {
    renderVista()
    typeQuery('*[_type == "author"]')
    await waitFor(() => expect(isDisabled(screen.getByTestId('vista-fetch-button'))).toBe(false))
    fireEvent.click(screen.getByTestId('vista-fetch-button'))
    await waitFor(() => expect(screen.getByTestId('result-json')).toBeTruthy())

    fireEvent.click(screen.getByTestId('vista-result-menu-button'))
    fireEvent.click(await screen.findByTestId('vista-export-typescript'))
    // No schema in the test studio mock, so the fetched result is what the types come from
    await waitFor(() =>
      expect(text(screen.getByTestId('vista-export-types-source'))).toContain(
        'vista.export-types.source.result',
      ),
    )
    expect(text(screen.getByTestId('vista-export-types-code'))).toContain(
      'export type AuthorQueryResult = Array<{\n  title: string;\n}>;',
    )
    fireEvent.keyDown(screen.getByTestId('vista-export-types-dialog'), {key: 'Escape'})

    // The shown result no longer belongs to the edited query
    typeQuery('*[_type == "book"]')
    fireEvent.click(screen.getByTestId('vista-result-menu-button'))
    fireEvent.click(await screen.findByTestId('vista-export-typescript'))
    await waitFor(() =>
      expect(text(screen.getByTestId('vista-export-types-source'))).toContain(
        'vista.export-types.stale-result',
      ),
    )
    expect(screen.queryByTestId('vista-export-types-code')).toBeNull()
  })

  it('restores persisted tabs and settings on mount', () => {
    const initial = createInitialState(DEFAULTS)
    const tab = createTab(initial.settings, {
      id: 'restored',
      title: 'Restored',
      query: '*[_type == "book"]',
      options: {datasetMode: 'pinned', dataset: 'staging', perspective: 'drafts'},
    })
    saveVistaState(PROJECT_ID, {
      ...initial,
      tabs: [tab],
      activeTabId: 'restored',
      sidebar: {expanded: true, drawer: null},
    })

    renderVista()

    expect(text(screen.getByTestId('vista-tab-button'))).toContain('Restored')
    expect(getQueryEditor().value).toBe('*[_type == "book"]')
    expect(selectValue('vista-option-dataset-select')).toBe('staging')
    expect(selectValue('vista-option-perspective-select')).toBe('drafts')
    expect(text(screen.getByTestId('vista-sidebar-toggle'))).toContain('vista.sidebar.collapse')
  })

  it('refetches from live events that carry one of the response sync tags', async () => {
    const {fetchCalls, liveEvents, liveSubscriptionCount, respondWith} = renderVista()
    typeQuery('*[_type == "author"]')
    fireEvent.click(screen.getByTestId('vista-fetch-button'))
    await waitFor(() => expect(fetchCalls).toHaveLength(1))

    fireEvent.click(screen.getByTestId('vista-query-menu-button'))
    fireEvent.click(screen.getByTestId('vista-auto-refetch'))

    await waitFor(() => expect(liveSubscriptionCount()).toBe(1))
    // Both the tab and the result carry the badge while the subscription is up
    expect(screen.getAllByText('vista.live.active')).toHaveLength(2)
    const tabBadge = () =>
      within(screen.getByTestId('vista-tab-bar')).queryByText('vista.live.active')
    expect(tabBadge()).not.toBeNull()

    respondWith({result: [{title: 'Updated'}], ms: 3, syncTags: ['s1:def']})
    act(() => {
      liveEvents.next({type: 'message', id: '1', tags: ['s1:nope']})
    })
    expect(fetchCalls).toHaveLength(1)

    act(() => {
      liveEvents.next({type: 'message', id: '2', tags: ['s1:abc']})
    })
    await waitFor(() => expect(fetchCalls).toHaveLength(2))
    await waitFor(() => expect(text(screen.getByTestId('result-json'))).toContain('Updated'))

    fireEvent.click(document.getElementById('vista-response-history-tab') as HTMLElement)
    const entries = screen.getAllByTestId('vista-history-entry')
    expect(text(entries[0])).toContain('vista.history.reason.live')
    expect(text(entries[0])).toContain('s1:abc')
    expect(text(entries[1])).toContain('vista.history.reason.manual')

    // The next response's tags are the ones that count now
    act(() => {
      liveEvents.next({type: 'message', id: '3', tags: ['s1:abc']})
    })
    expect(fetchCalls).toHaveLength(2)
    act(() => {
      liveEvents.next({type: 'message', id: '4', tags: ['s1:def']})
    })
    await waitFor(() => expect(fetchCalls).toHaveLength(3))

    // A background tab does not keep refetching: switching away ends the subscription (and the
    // tab's badge with it), and coming back restarts it
    fireEvent.click(screen.getByTestId('vista-new-tab'))
    await waitFor(() => expect(liveEvents.observed).toBe(false))
    expect(tabBadge()).toBeNull()
    act(() => {
      liveEvents.next({type: 'message', id: '5', tags: ['s1:def']})
    })
    expect(fetchCalls).toHaveLength(3)
    fireEvent.click(within(screen.getAllByTestId('vista-tab')[0]).getByTestId('vista-tab-button'))
    await waitFor(() => expect(liveSubscriptionCount()).toBe(2))
    expect(tabBadge()).not.toBeNull()
  })

  it('prettifies the query with groq-format and reports queries that do not parse', async () => {
    renderVista()
    const compact =
      '*[_type=="author"&&name match $q]{_id,name,"posts":*[references(^._id)]{title}}'
    typeQuery(compact)

    // Without a laid-out editor to measure, lines wrap at the formatter's default width
    fireEvent.click(screen.getByTestId('vista-query-menu-button'))
    fireEvent.click(screen.getByTestId('vista-prettify'))

    const formatted = [
      '*[_type == "author" && name match $q] {',
      '  _id,',
      '  name,',
      '  "posts": *[references(^._id)] { title }',
      '}',
    ].join('\n')
    await waitFor(() => expect(getQueryEditor().value).toBe(formatted))
    await waitFor(() => expect(getStoredState().tabs[0].query).toBe(formatted))

    // A narrow editor wraps at its own width, so the result needs no sideways scrolling. The
    // width is measured again for the formatted line count: here the one-line query measures
    // 40 columns, but the seven lines that gives leave only 30 (a wider gutter, a scrollbar),
    // so the query is formatted once more at 30
    typeQuery(compact)
    const widthsAsked: (number | undefined)[] = []
    editorMocks.visibleColumns = (lines) => {
      widthsAsked.push(lines)
      return (lines ?? 1) > 5 ? 30 : 40
    }
    fireEvent.click(screen.getByTestId('vista-query-menu-button'))
    fireEvent.click(screen.getByTestId('vista-prettify'))

    const narrow = [
      '*[_type == "author"',
      '  && name match $q] {',
      '  _id,',
      '  name,',
      '  "posts": *[references(^._id)] {',
      '    title',
      '  }',
      '}',
    ].join('\n')
    await waitFor(() => expect(getQueryEditor().value).toBe(narrow))
    // Measured for the current document, then for the 7 lines of the first pass and the 8 of the second
    expect(widthsAsked).toEqual([undefined, 7, 8])

    typeQuery('*[_type == "author"')
    fireEvent.click(screen.getByTestId('vista-query-menu-button'))
    fireEvent.click(screen.getByTestId('vista-prettify'))

    await screen.findByText('vista.query.prettify.failed', undefined, {timeout: 3000})
    expect(screen.getByText("expected ']' following expression")).toBeTruthy()
    expect(getQueryEditor().value).toBe('*[_type == "author"')
  })

  it('starts automatic refetching from the current request, not the last fetched one', async () => {
    const {fetchCalls} = renderVista()
    typeQuery('*[_type == "author"]')
    fireEvent.click(screen.getByTestId('vista-fetch-button'))
    await waitFor(() => expect(fetchCalls).toHaveLength(1))

    // The dataset changes while refetching is off, so the runner still holds the old request
    fireEvent.click(screen.getByTestId('vista-option-dataset-pin'))
    fireEvent.change(screen.getByTestId('vista-option-dataset-select'), {
      target: {value: 'staging'},
    })
    fireEvent.click(screen.getByTestId('vista-query-menu-button'))
    fireEvent.click(screen.getByTestId('vista-auto-refetch'))

    await waitFor(() => expect(fetchCalls).toHaveLength(2))
    expect(fetchCalls[1].config.dataset).toBe('staging')

    // Turning it off and on again without changes does not fetch again
    fireEvent.click(screen.getByTestId('vista-query-menu-button'))
    fireEvent.click(screen.getByTestId('vista-auto-refetch'))
    fireEvent.click(screen.getByTestId('vista-query-menu-button'))
    fireEvent.click(screen.getByTestId('vista-auto-refetch'))
    await waitFor(() => expect(getStoredState().tabs[0].autoRefetch).toBe(true))
    expect(fetchCalls).toHaveLength(2)
  })

  it('fetches a query loaded into a tab that refetches automatically', async () => {
    const {fetchCalls} = renderVista()
    typeQuery('*[_type == "author"]')
    fireEvent.click(screen.getByTestId('vista-query-menu-button'))
    fireEvent.click(screen.getByTestId('vista-auto-refetch'))
    await waitFor(() => expect(fetchCalls).toHaveLength(1))

    // A pasted URL loads a new query and pins its dataset in one go; live refetches replay the
    // runner's last request, which the load clears, so the loaded query is fetched right away,
    // once, and for the loaded options
    const url =
      'https://abc.api.sanity.io/v2025-02-19/data/query/staging?query=*%5B_type+%3D%3D+%22post%22%5D&perspective=published'
    fireEvent.paste(document.body, {clipboardData: {getData: () => url}})
    await waitFor(() => expect(fetchCalls).toHaveLength(2))
    expect(fetchCalls[1]).toMatchObject({
      query: '*[_type == "post"]',
      config: {dataset: 'staging', perspective: 'published'},
    })
    fireEvent.click(document.getElementById('vista-response-history-tab') as HTMLElement)
    await waitFor(() => {
      const entries = screen.getAllByTestId('vista-history-entry')
      expect(entries).toHaveLength(2)
      expect(text(entries[0])).toContain('vista.history.reason.load')
    })
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(fetchCalls).toHaveLength(2)

    // Without automatic refetching a load only replaces the query
    fireEvent.click(screen.getByTestId('vista-query-menu-button'))
    fireEvent.click(screen.getByTestId('vista-auto-refetch'))
    await waitFor(() => expect(getStoredState().tabs[0].autoRefetch).toBe(false))
    fireEvent.paste(document.body, {clipboardData: {getData: () => url.replace('post', 'page')}})
    await waitFor(() => expect(getQueryEditor().value).toBe('*[_type == "page"]'))
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(fetchCalls).toHaveLength(2)
  })

  it('fetches with params typed just before running, ahead of the debounce', async () => {
    const {fetchCalls} = renderVista()
    typeQuery('*[_id == $id]')
    await waitFor(() => expect(isDisabled(screen.getByTestId('vista-fetch-button'))).toBe(false))

    const paramsEditor = within(screen.getByTestId('vista-params-editor')).getByTestId(
      'codemirror-mock',
    )
    fireEvent.change(paramsEditor, {target: {value: '{"id": "fresh"}'}})
    fireEvent.click(screen.getByTestId('vista-fetch-button'))

    await waitFor(() => expect(fetchCalls).toHaveLength(1))
    expect(fetchCalls[0].params).toEqual({id: 'fresh'})
  })

  it('locks the API version to vX and sends the navbar variant with the global perspective', async () => {
    const initial = createInitialState(DEFAULTS)
    const tab = createTab(initial.settings, {id: 'pinned', query: '*[_id == "a"]'})
    saveVistaState(PROJECT_ID, {...initial, tabs: [tab], activeTabId: 'pinned'})

    const {fetchCalls} = renderVista({...BASE_PERSPECTIVE, selectedVariantNames: ['french']})
    expect(selectValue('vista-option-perspective-select')).toBe('global')
    expect(selectValue('vista-option-variant-select')).toBe('global')

    const apiVersionSelect = screen.getByTestId(
      'vista-option-api-version-select',
    ) as HTMLSelectElement
    expect(apiVersionSelect.value).toBe('vX')
    expect(apiVersionSelect.disabled).toBe(true)

    fireEvent.click(screen.getByTestId('vista-fetch-button'))
    await waitFor(() => expect(fetchCalls).toHaveLength(1))
    expect(fetchCalls[0].config).toMatchObject({
      apiVersion: 'vX',
      perspective: ['published'],
      variant: 'french',
    })
    const url = new URL((screen.getByTestId('vista-query-url') as HTMLInputElement).value)
    expect(url.pathname).toContain('/vX/')
    expect(url.searchParams.get('variant')).toBe('french')
    expect(url.searchParams.get('perspective')).toBe('published')
  })

  it('leaves the variant out when the variant option is None, whatever the perspective', async () => {
    const initial = createInitialState(DEFAULTS)
    const tab = createTab(initial.settings, {
      id: 'no-variant',
      query: '*',
      options: {perspective: 'raw', variant: 'none'},
    })
    saveVistaState(PROJECT_ID, {...initial, tabs: [tab], activeTabId: 'no-variant'})
    const {fetchCalls} = renderVista({...BASE_PERSPECTIVE, selectedVariantNames: ['french']})
    expect(selectValue('vista-option-perspective-select')).toBe('raw')
    expect(selectValue('vista-option-variant-select')).toBe('none')
    expect(isDisabled(screen.getByTestId('vista-option-api-version-select'))).toBe(false)

    fireEvent.click(screen.getByTestId('vista-fetch-button'))
    await waitFor(() => expect(fetchCalls).toHaveLength(1))
    expect(fetchCalls[0].config.perspective).toBe('raw')
    expect(fetchCalls[0].config.variant).toBeUndefined()
    const url = new URL((screen.getByTestId('vista-query-url') as HTMLInputElement).value)
    expect(url.searchParams.get('variant')).toBeNull()

    // The variant option is independent of the perspective
    fireEvent.change(screen.getByTestId('vista-option-variant-select'), {
      target: {value: 'global'},
    })
    await waitFor(() =>
      expect(isDisabled(screen.getByTestId('vista-option-api-version-select'))).toBe(true),
    )
    fireEvent.click(screen.getByTestId('vista-fetch-button'))
    await waitFor(() => expect(fetchCalls).toHaveLength(2))
    expect(fetchCalls[1].config).toMatchObject({
      apiVersion: 'vX',
      perspective: 'raw',
      variant: 'french',
    })
  })

  it('follows the workspace dataset until one is pinned, and back', async () => {
    const {fetchCalls} = renderVista()
    typeQuery('*')
    const datasetSelect = () =>
      screen.getByTestId('vista-option-dataset-select') as HTMLSelectElement
    expect(datasetSelect().value).toBe('test')
    expect(datasetSelect().disabled).toBe(true)

    fireEvent.click(screen.getByTestId('vista-option-dataset-pin'))
    expect(datasetSelect().disabled).toBe(false)
    fireEvent.change(datasetSelect(), {target: {value: 'staging'}})
    fireEvent.click(screen.getByTestId('vista-fetch-button'))
    await waitFor(() => expect(fetchCalls).toHaveLength(1))
    expect(fetchCalls[0].config.dataset).toBe('staging')
    await waitFor(() =>
      expect(getStoredState().tabs[0].options).toMatchObject({
        datasetMode: 'pinned',
        dataset: 'staging',
      }),
    )

    fireEvent.click(screen.getByTestId('vista-option-dataset-follow'))
    expect(datasetSelect().value).toBe('test')
    expect(datasetSelect().disabled).toBe(true)
    fireEvent.click(screen.getByTestId('vista-fetch-button'))
    await waitFor(() => expect(fetchCalls).toHaveLength(2))
    expect(fetchCalls[1].config.dataset).toBe('test')
  })

  it('switches a tab on its own perspective back to the global one when the navbar changes', async () => {
    const initial = createInitialState(DEFAULTS)
    const tab = createTab(initial.settings, {id: 'own', options: {perspective: 'raw'}})
    saveVistaState(PROJECT_ID, {...initial, tabs: [tab], activeTabId: 'own'})
    const {setPerspective} = renderVista()
    expect(selectValue('vista-option-perspective-select')).toBe('raw')

    setPerspective({
      ...BASE_PERSPECTIVE,
      perspectiveStack: ['rSummer', 'drafts'],
      selectedPerspectiveName: 'rSummer',
      selectedReleaseId: 'rSummer',
    })

    await waitFor(() => expect(selectValue('vista-option-perspective-select')).toBe('global'))
  })

  it('loads a pasted query URL into the active tab', async () => {
    renderVista()
    const url =
      'https://abc.api.sanity.io/v2021-10-21/data/query/staging?query=*%5B_id+%3D%3D+%24id%5D&%24id=%22a%22&perspective=published'

    fireEvent.paste(document.body, {clipboardData: {getData: () => url}})

    await waitFor(() => expect(getQueryEditor().value).toBe('*[_id == $id]'))
    expect(text(screen.getByTestId('vista-tab-button'))).toContain('*[_id == $id]')
    expect(selectValue('vista-option-dataset-select')).toBe('staging')
    expect(selectValue('vista-option-api-version-select')).toBe('v2021-10-21')
    expect(selectValue('vista-option-perspective-select')).toBe('published')
    // The URL names its dataset, so the tab stops following the workspace's
    await waitFor(() =>
      expect(getStoredState().tabs[0].options).toMatchObject({
        datasetMode: 'pinned',
        dataset: 'staging',
      }),
    )
  })

  it('clears the storage from the settings dialog', {timeout: 15_000}, async () => {
    const {onSwitchToClassic} = renderVista()
    typeQuery('*[_type == "author"]')
    fireEvent.click(screen.getByTestId('vista-new-tab'))
    await waitFor(() => expect(getStoredState().tabs).toHaveLength(2))

    fireEvent.click(screen.getByTestId('vista-sidebar-settings'))
    fireEvent.click(await screen.findByTestId('vista-clear-storage'))
    fireEvent.click(screen.getByTestId('vista-clear-storage-confirm'))

    await waitFor(() => expect(screen.getAllByTestId('vista-tab')).toHaveLength(1))
    expect(getQueryEditor().value).toBe('')
    expect(sanityMocks.clearQueries).toHaveBeenCalledTimes(1)
    await waitFor(() => {
      const stored = getStoredState()
      expect(stored.tabs).toHaveLength(1)
      expect(stored.tabs[0].query).toBe('')
    })
    expect(onSwitchToClassic).toHaveBeenCalledTimes(1)
  })

  it('switches back to the classic tool from the sidebar and from the settings dialog', async () => {
    const {onSwitchToClassic} = renderVista()

    fireEvent.click(screen.getByTestId('vista-sidebar-classic'))
    expect(onSwitchToClassic).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByTestId('vista-sidebar-settings'))
    fireEvent.click(await screen.findByTestId('vista-settings-classic'))
    expect(onSwitchToClassic).toHaveBeenCalledTimes(2)
    // Switching back keeps the stored tabs for the next visit
    await waitFor(() => expect(getStoredState().tabs).toHaveLength(1))
  })

  it('opens the phone drawer as a modal dialog: focus moves in, and back to the opener on Escape', async () => {
    // Without a measured root the layout follows the viewport; a phone one floats the drawer
    const {innerWidth} = window
    Object.defineProperty(window, 'innerWidth', {configurable: true, value: 500})
    try {
      renderVista()
      const opener = screen.getByTestId('vista-sidebar-saved')
      opener.focus()
      fireEvent.click(opener)

      const drawer = await screen.findByTestId('vista-drawer-saved')
      expect(drawer.getAttribute('role')).toBe('dialog')
      expect(drawer.getAttribute('aria-modal')).toBe('true')
      // The rail behind the drawer is inert; the drawer's close button takes focus
      expect(screen.getByTestId('vista-sidebar').hasAttribute('inert')).toBe(true)
      const closeButton = within(drawer).getByRole('button', {name: 'vista.drawer.close'})
      await waitFor(() => expect(document.activeElement).toBe(closeButton))

      fireEvent.keyDown(drawer, {key: 'Escape'})
      await waitFor(() => expect(screen.queryByTestId('vista-drawer-saved')).toBeNull())
      await waitFor(() => expect(document.activeElement).toBe(opener))
    } finally {
      Object.defineProperty(window, 'innerWidth', {configurable: true, value: innerWidth})
    }
  })
})
