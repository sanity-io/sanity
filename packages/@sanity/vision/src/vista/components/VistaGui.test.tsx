import {ClientError, type LiveEvent, type SanityClient} from '@sanity/client'
import {LayerProvider, ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {ToastProvider} from '@sanity/ui/toast'
import {act, cleanup, fireEvent, render, screen, waitFor, within} from '@testing-library/react'
import JSON5 from 'json5'
import {Activity, type ReactNode, type RefAttributes, useImperativeHandle, useRef} from 'react'
import {Subject} from 'rxjs'
import {type PerspectiveContextValue, useScheduledDraftsEnabled} from 'sanity'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {type VisionCodeMirrorHandle} from '../../codemirror/VisionCodeMirror'
import {QUERY_URL_SIZE_LIMIT} from '../../util/queryRequestMethod'
import {resetAiCredits} from '../hooks/useAiCredits'
import {
  createInitialState,
  createTab,
  getVistaStorageKey,
  saveVistaState,
} from '../store/vistaStorage'
import {parseQueryPaste} from '../util/parseQueryPaste'
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
    saveQuery: vi.fn((_query: {url: string}) => Promise.resolve('saved-key')),
    // What the mocked saved queries hook lists and reports as being moved
    savedQueries: {queries: [] as unknown[], moving: [] as string[]},
    // The workspace the tool runs in: variants on, as the tests of the variant option need
    workspace: {document: {drafts: {enabled: true}}, beta: {variants: {enabled: true}}},
    // The tool's router: its state as the URL gives it, and the navigations made
    router: {
      state: {} as {_searchParams?: [string, string][]},
      navigate: vi.fn(),
    },
  }
})

/**
 * What the mocked editors report as their width, in characters, optionally depending on the
 * line count asked about; `undefined` means no layout
 */
const editorMocks = vi.hoisted(() => ({
  visibleColumns: undefined as number | ((lines: number | undefined) => number) | undefined,
}))

/** The elements each mocked `ResizeObserver` watches, so a test can hand one a measurement */
const resizeObservers = new Set<{callback: ResizeObserverCallback; elements: Set<Element>}>()

class ResizeObserverMock {
  private entry: {callback: ResizeObserverCallback; elements: Set<Element>}
  constructor(callback: ResizeObserverCallback) {
    this.entry = {callback, elements: new Set()}
    resizeObservers.add(this.entry)
  }
  observe(element: Element) {
    this.entry.elements.add(element)
  }
  unobserve(element: Element) {
    this.entry.elements.delete(element)
  }
  disconnect() {
    resizeObservers.delete(this.entry)
  }
}

/** Reports `element` as measuring `width` × `height` to every observer watching it */
function resizeElement(element: Element, {width, height}: {width: number; height: number}) {
  act(() => {
    for (const {callback, elements} of resizeObservers) {
      if (!elements.has(element)) continue
      const contentRect = {width, height, x: 0, y: 0, top: 0, left: 0, right: width, bottom: height}
      callback(
        [{target: element, contentRect} as unknown as ResizeObserverEntry],
        {} as ResizeObserver,
      )
    }
  })
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
  const {of} = await import('rxjs')
  // The project store's organization ID, stable like the real store's
  const organizationId$ = of('org-1')
  return {
    usePerspective: () =>
      useSyncExternalStore(sanityMocks.subscribePerspective, sanityMocks.getPerspective),
    useClient: sanityMocks.useClient,
    useActiveReleases: vi.fn(() => ({data: [], loading: false})),
    useScheduledDraftsEnabled: vi.fn(() => false),
    useWorkspace: () => sanityMocks.workspace,
    useProjectStore: () => ({getOrganizationId: () => organizationId$}),
    useNumberFormat: () => new Intl.NumberFormat('en'),
    useTranslation: () => ({
      t: (
        key: string,
        options?: {message?: string; version?: string; quota?: string; used?: string},
      ) => {
        if (options?.message) return `${key}:${options.message}`
        // The AI credits notes carry numbers: shown as given, to read them back
        if (options?.quota !== undefined || options?.used !== undefined) {
          return `${key}:${JSON.stringify(options)}`
        }
        return options?.version ? `${key}:${options.version}` : key
      },
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
  useRouter: () => sanityMocks.router,
}))

vi.mock('../../hooks/useSavedQueries', () => ({
  useSavedQueries: () => ({
    queries: sanityMocks.savedQueries.queries,
    saveQuery: sanityMocks.saveQuery,
    updateQuery: vi.fn(),
    deleteQuery: vi.fn(),
    shareQuery: vi.fn(),
    unshareQuery: vi.fn(),
    clearQueries: sanityMocks.clearQueries,
    saving: false,
    deleting: [],
    moving: sanityMocks.savedQueries.moving,
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
      applyChanges: (changes) => {
        const textarea = textareaRef.current
        if (!textarea) return
        let value = textarea.value
        for (const change of changes.toSorted((a, b) => b.from - a.from)) {
          value = value.slice(0, change.from) + change.insert + value.slice(change.to)
        }
        textarea.value = value
        onChange?.(value)
      },
      runCommand: () => false,
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

interface RequestOptions {
  url: string
  method?: string
  body?: unknown
  query?: Record<string, string>
}

interface FetchCall {
  config: ClientConfig
  query: string
  params: Record<string, unknown>
  options: Record<string, unknown>
}

function createMockClient(
  initial: ClientConfig = {projectId: PROJECT_ID, apiVersion: 'v2025-02-19', dataset: 'test'},
) {
  const fetchCalls: FetchCall[] = []
  const promptCalls: {config: ClientConfig; request: Record<string, unknown>}[] = []
  const promptReplies: unknown[] = []
  const requestCalls: {config: ClientConfig; options: RequestOptions}[] = []
  let nextRequestResponse: unknown
  let requestResponder: ((url: string, options: RequestOptions) => unknown) | undefined
  // The AI credits every Agent Actions control reads when it opens, apart from the data requests
  const aiCreditsRequests: {config: ClientConfig; options: RequestOptions}[] = []
  let aiCreditsResponse: unknown
  // What `getDocuments` finds, by ID
  const documents = new Map<string, Record<string, unknown>>()
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
      // A path goes after a slash and a query string straight after the dataset, as in the client
      getDataUrl: (operation: string, path = '') =>
        `/${String(config.apiVersion)}/data/${operation}/${String(config.dataset)}${
          path && !path.startsWith('?') ? `/${path}` : path
        }`,
      getUrl: (path: string, canUseCdn?: boolean) =>
        `https://test.${canUseCdn ? 'apicdn' : 'api'}.sanity.io${path}`,
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
      request: (options: RequestOptions) => {
        if (options.url.endsWith('/resources/ai-usage')) {
          aiCreditsRequests.push({config, options})
          return Promise.resolve(aiCreditsResponse)
        }
        requestCalls.push({config, options})
        return Promise.resolve(
          requestResponder ? requestResponder(options.url, options) : nextRequestResponse,
        )
      },
      getDocuments: (ids: string[]) => Promise.resolve(ids.map((id) => documents.get(id) ?? null)),
      agent: {
        action: {
          prompt: (request: Record<string, unknown>) => {
            promptCalls.push({config, request})
            const reply = promptReplies.shift()
            return reply instanceof Error ? Promise.reject(reply) : Promise.resolve(reply)
          },
        },
      },
    }) as unknown as SanityClient

  return {
    client: create(initial),
    fetchCalls,
    promptCalls,
    /** Replies the Agent Actions prompt gives, one per call; an error rejects the call */
    replyToPrompts: (...replies: unknown[]) => promptReplies.push(...replies),
    requestCalls,
    aiCreditsRequests,
    /** What the project's `ai-usage` resource answers; a pending promise keeps a reading on its way */
    respondToAiCredits: (response: unknown) => {
      aiCreditsResponse = response
    },
    documents,
    /** `client.request` answers with what `responder` gives for the URL and the request */
    respondToRequestsBy: (responder: (url: string, options: RequestOptions) => unknown) => {
      requestResponder = responder
    },
    /** The body `client.request` resolves with */
    respondToRequests: (response: unknown) => {
      nextRequestResponse = response
    },
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

  // Inside an Activity boundary, as the studio keeps recent tools mounted (`beta.reactActivityMode`)
  const ui = (mode: 'visible' | 'hidden') => (
    <ThemeProvider theme={theme}>
      <ToastProvider>
        <LayerProvider>
          <Activity mode={mode}>
            <VistaGui
              config={{defaultApiVersion: '2025-02-19'}}
              datasets={DEFAULTS.datasets}
              projectId={PROJECT_ID}
              defaultDataset="test"
              onSwitchToClassic={onSwitchToClassic}
            />
          </Activity>
        </LayerProvider>
      </ToastProvider>
    </ThemeProvider>
  )
  const view = render(ui('visible'))

  return {
    ...view,
    ...mockClient,
    onSwitchToClassic,
    setPerspective: (next: PerspectiveContextValue) => {
      act(() => sanityMocks.setPerspective(next))
    },
    /** Hides the tool as leaving it for another tool does, keeping it mounted */
    hide: () => view.rerender(ui('hidden')),
    show: () => view.rerender(ui('visible')),
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

/** Asks the generate query bar for a query */
function generateFrom(description: string) {
  fireEvent.click(screen.getByTestId('vista-generate-query'))
  fireEvent.change(screen.getByTestId('vista-generate-request'), {target: {value: description}})
  fireEvent.click(screen.getByTestId('vista-generate-submit'))
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

/** The text of the element `aria-describedby` points at, or `null` without one */
function describedBy(element: HTMLElement): string | null {
  const id = element.getAttribute('aria-describedby')
  return id === null ? null : document.getElementById(id)?.textContent || ''
}

function selectValue(testId: string): string {
  return (screen.getByTestId(testId) as HTMLSelectElement).value
}

/** The response Agent Actions give once the organization has used all its AI credits */
function limitError(): ClientError {
  return new ClientError({
    statusCode: 429,
    statusMessage: 'Too Many Requests',
    headers: {},
    body: {
      statusCode: 429,
      error: 'MeteringLimitReached',
      message: 'The organization has used all its AI credits',
      reasonCode: 'default_budget_limit_reached',
      usageValue: 100,
      quota: 100,
    },
    url: 'https://test.api.sanity.io/vX/agent/action/prompt',
    method: 'POST',
  })
}

describe('VistaGui', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  beforeEach(() => {
    localStorage.clear()
    resetAiCredits()
    sanityMocks.setPerspective(BASE_PERSPECTIVE)
    sanityMocks.savedQueries = {queries: [], moving: []}
    sanityMocks.router.state = {}
    sanityMocks.workspace = {document: {drafts: {enabled: true}}, beta: {variants: {enabled: true}}}
    editorMocks.visibleColumns = undefined
  })

  it('starts with one empty tab and a disabled fetch button', () => {
    renderVista()

    expect(screen.getAllByTestId('vista-tab')).toHaveLength(1)
    expect(text(screen.getByTestId('vista-tab-button'))).toContain('vista.tabs.untitled')
    const fetchButton = screen.getByTestId('vista-fetch-button')
    expect(isDisabled(fetchButton)).toBe(true)
    expect(text(fetchButton)).toContain('action.query-execute')
    expect(
      within(screen.getByTestId('vista-query-actions')).getByTestId('vista-fetch-button'),
    ).toBe(fetchButton)
    expect(text(screen.getByTestId('vista-export-json'))).toContain('vista.result.export-json')
    expect(text(screen.getByTestId('vista-export-csv'))).toContain('vista.result.export-csv')
    expect(text(screen.getByTestId('vista-result'))).toContain('vista.result.empty')
  })

  it('fetches with Live and refetches until Stop live, with Fetch still fetching meanwhile', async () => {
    const {fetchCalls} = renderVista()
    const actions = screen.getByTestId('vista-query-actions')
    const live = within(actions).getByTestId('vista-auto-refetch')
    expect(text(live)).toBe('vista.live.button')
    // Like Fetch, it needs something to fetch
    expect(isDisabled(live)).toBe(true)
    // It replaces the menu item
    fireEvent.click(screen.getByTestId('vista-query-menu-button'))
    expect(document.querySelectorAll('[data-testid="vista-auto-refetch"]')).toHaveLength(1)

    typeQuery('{"now": now()}')
    await waitFor(() => expect(isDisabled(live)).toBe(false))
    fireEvent.click(live)
    await waitFor(() => expect(fetchCalls).toHaveLength(1))
    expect(text(live)).toBe('vista.live.stop')
    await waitFor(() => expect(getStoredState().tabs[0].autoRefetch).toBe(true))

    // Fetch still fetches on demand, for results no document change touches, like now()
    fireEvent.click(screen.getByTestId('vista-fetch-button'))
    await waitFor(() => expect(fetchCalls).toHaveLength(2))
    expect(text(live)).toBe('vista.live.stop')
    fireEvent.click(document.getElementById('vista-response-history-tab') as HTMLElement)
    await waitFor(() => expect(screen.getAllByTestId('vista-history-entry')).toHaveLength(2))
    const entries = screen.getAllByTestId('vista-history-entry')
    expect(text(entries[0])).toContain('vista.history.reason.manual')
    expect(text(entries[1])).toContain('vista.history.reason.live-start')

    fireEvent.click(live)
    expect(text(live)).toBe('vista.live.button')
    await waitFor(() => expect(getStoredState().tabs[0].autoRefetch).toBe(false))
    expect(fetchCalls).toHaveLength(2)
  })

  it('explains why Live is unavailable on an API version without sync tags', () => {
    const initial = createInitialState(DEFAULTS)
    // Sync tags arrived with v2021-03-25
    const tab = createTab(initial.settings, {id: 'old', options: {apiVersion: 'v2021-03-24'}})
    saveVistaState(PROJECT_ID, {...initial, tabs: [tab], activeTabId: 'old'})
    renderVista()

    const live = screen.getByTestId('vista-auto-refetch')
    expect(isDisabled(live)).toBe(true)
    expect(live.hasAttribute('aria-pressed')).toBe(false)
    const wrapper = live.parentElement as HTMLElement
    expect(wrapper.getAttribute('role')).toBe('button')
    expect(wrapper.getAttribute('tabindex')).toBe('0')
    expect(wrapper.getAttribute('aria-disabled')).toBe('true')
    expect(describedBy(wrapper)).toBe('vista.query.auto-refetch.unsupported')
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
    await waitFor(() =>
      expect(getStoredState().panels).toEqual({
        params: true,
        options: false,
        paramsView: 'json',
        resultView: 'tree',
      }),
    )

    unmount()
    renderVista()
    expect(screen.queryByTestId('vista-options')).toBeNull()
    expect(screen.getByTestId('vista-params-editor')).toBeTruthy()

    fireEvent.click(screen.getByTestId('vista-request-options-toggle'))
    expect(screen.getByTestId('vista-options')).toBeTruthy()
    fireEvent.click(screen.getByTestId('vista-request-params-toggle'))
    expect(screen.queryByTestId('vista-params-editor')).toBeNull()
    await waitFor(() =>
      expect(getStoredState().panels).toEqual({
        params: false,
        options: true,
        paramsView: 'json',
        resultView: 'tree',
      }),
    )

    // Params typed right before collapsing are still in the debounce; collapsing commits them,
    // so the editor that comes back with the panel shows them
    fireEvent.click(screen.getByTestId('vista-request-params-toggle'))
    const paramsEditor = () =>
      within(screen.getByTestId('vista-params-editor')).getByTestId(
        'codemirror-mock',
      ) as HTMLTextAreaElement
    fireEvent.change(paramsEditor(), {target: {value: '{"id": "pending"}'}})
    fireEvent.click(screen.getByTestId('vista-request-params-toggle'))
    await waitFor(() => expect(getStoredState().tabs[0].rawParams).toBe('{"id": "pending"}'))
    fireEvent.click(screen.getByTestId('vista-request-params-toggle'))
    expect(paramsEditor().value).toBe('{"id": "pending"}')
  })

  it('edits the params in the form inferred from the query', async () => {
    const {fetchCalls, unmount} = renderVista()
    const paramsEditor = () =>
      within(screen.getByTestId('vista-params-editor')).getByTestId(
        'codemirror-mock',
      ) as HTMLTextAreaElement
    const formInput = (name: string) =>
      screen.getByTestId(`vista-params-form-${name}`).querySelector('input') as HTMLInputElement

    typeQuery('*[_type == $type][0...$limit]')
    // An edit still waiting in the debounce comes along to the form
    fireEvent.change(paramsEditor(), {target: {value: '{"limit": 3}'}})
    fireEvent.click(document.getElementById('vista-params-view-form') as HTMLElement)
    expect(screen.queryByTestId('vista-params-editor')).toBeNull()
    expect(formInput('limit').value).toBe('3')
    expect(text(screen.getByTestId('vista-params-form-limit-type'))).toBe(
      'vista.params-form.type.integer',
    )

    fireEvent.change(formInput('type'), {target: {value: 'author'}})
    fireEvent.click(screen.getByTestId('vista-fetch-button'))
    await waitFor(() => expect(fetchCalls).toHaveLength(1))
    expect(fetchCalls[0].params).toEqual({limit: 3, type: 'author'})
    await waitFor(() => expect(getStoredState().panels.paramsView).toBe('form'))

    unmount()
    renderVista()
    expect(formInput('type').value).toBe('author')
    // The editor shows what the form wrote
    fireEvent.click(document.getElementById('vista-params-view-json') as HTMLElement)
    expect(JSON.parse(paramsEditor().value)).toEqual({limit: 3, type: 'author'})
  })

  it('prefills the JSON params editor with params the query references, keeping existing values', async () => {
    const {unmount} = renderVista()
    const paramsEditor = () =>
      within(screen.getByTestId('vista-params-editor')).getByTestId(
        'codemirror-mock',
      ) as HTMLTextAreaElement

    // An existing value for one of the two params the query below references is kept untouched;
    // the other, never seen before, is added as an empty placeholder
    fireEvent.change(paramsEditor(), {target: {value: '{\n  "limit": 3\n}'}})
    typeQuery('*[_type == $type][0...$limit]')

    await waitFor(() => expect(JSON5.parse(paramsEditor().value)).toEqual({limit: 3, type: ''}), {
      timeout: 2000,
    })
    // Written to the stored tab too, not just the live editor
    await waitFor(() =>
      expect(JSON5.parse(getStoredState().tabs[0].rawParams)).toEqual({limit: 3, type: ''}),
    )

    // A real value typed into the placeholder is never clobbered by a later prefill of the same
    // referenced params
    fireEvent.change(paramsEditor(), {target: {value: '{\n  "limit": 3,\n  "type": "author"\n}'}})
    await waitFor(() =>
      expect(getStoredState().tabs[0].rawParams).toBe('{\n  "limit": 3,\n  "type": "author"\n}'),
    )
    typeQuery('*[_type == $type][0...$limit]{_id}')
    await waitFor(() =>
      expect(getStoredState().tabs[0].query).toBe('*[_type == $type][0...$limit]{_id}'),
    )
    // The debounce settling afterwards finds nothing missing to add
    await new Promise((resolve) => setTimeout(resolve, 400))
    expect(JSON5.parse(paramsEditor().value)).toEqual({limit: 3, type: 'author'})

    unmount()
  })

  it('leaves the JSON params editor alone while the query does not parse', async () => {
    const {unmount} = renderVista()
    const paramsEditor = () =>
      within(screen.getByTestId('vista-params-editor')).getByTestId(
        'codemirror-mock',
      ) as HTMLTextAreaElement

    typeQuery('*[_type == $type][0...$limit')
    await waitFor(() => expect(getStoredState().tabs[0].query).toBe('*[_type == $type][0...$limit'))
    await new Promise((resolve) => setTimeout(resolve, 400))

    expect(JSON5.parse(paramsEditor().value)).toEqual({})

    unmount()
  })

  it('does not prefill the params form inferred from the query, only the JSON editor', async () => {
    const {unmount} = renderVista()
    const formInput = (name: string) =>
      screen.getByTestId(`vista-params-form-${name}`).querySelector('input') as HTMLInputElement

    fireEvent.click(document.getElementById('vista-params-view-form') as HTMLElement)
    typeQuery('*[_type == $type][0...$limit]')
    await waitFor(() =>
      expect(getStoredState().tabs[0].query).toBe('*[_type == $type][0...$limit]'),
    )
    await new Promise((resolve) => setTimeout(resolve, 400))

    // The form view already lists every referenced param on its own (groq-js based) inference;
    // paramsEditorRef is unset while it is mounted, so this feature leaves it alone
    expect(formInput('limit').value).toBe('')
    expect(JSON5.parse(getStoredState().tabs[0].rawParams)).toEqual({})

    unmount()
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
      config: {apiVersion: 'v2025-02-19', dataset: 'test', perspective: 'published'},
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

  it('tells in the history whether a refetch changed the result', async () => {
    const {respondWith} = renderVista()
    typeQuery('*[_type == "author"]')
    await waitFor(() => expect(isDisabled(screen.getByTestId('vista-fetch-button'))).toBe(false))
    fireEvent.click(screen.getByTestId('vista-fetch-button'))
    await waitFor(() => expect(screen.getByTestId('result-json')).toBeTruthy())
    fireEvent.click(document.getElementById('vista-response-history-tab') as HTMLElement)

    fireEvent.click(screen.getByTestId('vista-fetch-button'))
    await waitFor(() => expect(screen.getAllByTestId('vista-history-entry')).toHaveLength(2))
    expect(text(screen.getAllByTestId('vista-history-entry')[0])).toContain(
      'vista.history.unchanged',
    )
    expect(screen.queryByTestId('vista-history-changes-toggle')).toBeNull()

    respondWith({result: [{title: 'Newer'}], ms: 34, syncTags: ['s1:abc']})
    fireEvent.click(screen.getByTestId('vista-fetch-button'))
    await waitFor(() => expect(screen.getAllByTestId('vista-history-entry')).toHaveLength(3))
    const [latest] = screen.getAllByTestId('vista-history-entry')
    expect(
      within(latest).getByTestId('vista-history-changes-toggle').getAttribute('aria-expanded'),
    ).toBe('false')
  })

  it('keeps the active request in the tool URL once typing settles, replacing the entry', async () => {
    renderVista()
    typeQuery('*[_type == "post"]')
    await waitFor(
      () => {
        const [state] = sanityMocks.router.navigate.mock.lastCall ?? []
        const [[key, value]] = (state as {_searchParams: [string, string][]})._searchParams
        expect(key).toBe('url')
        expect(new URL(value).searchParams.get('query')).toBe('*[_type == "post"]')
      },
      {timeout: 2000},
    )
    expect(sanityMocks.router.navigate.mock.lastCall?.[1]).toEqual({replace: true})
  })

  it('opens the request a link to the tool names, in a tab of its own, and runs it', async () => {
    sanityMocks.router.state = {
      _searchParams: [
        [
          'url',
          `https://test.api.sanity.io/v2025-02-19/data/query/test?${new URLSearchParams({
            query: '*[_type == "movie"]',
            $limit: '3',
            perspective: 'drafts',
          })}`,
        ],
      ],
    }
    const {fetchCalls} = renderVista()

    await waitFor(() => expect(screen.getAllByTestId('vista-tab')).toHaveLength(2))
    expect(getQueryEditor().value).toBe('*[_type == "movie"]')
    await waitFor(() => expect(getStoredState()?.tabs).toHaveLength(2))
    expect(JSON.parse(getStoredState().tabs[1].rawParams)).toEqual({limit: 3})
    expect(getStoredState().tabs[1].options).toMatchObject({
      apiVersion: 'v2025-02-19',
      datasetMode: 'pinned',
      dataset: 'test',
      perspective: 'drafts',
    })

    // The query runs as the link wrote it, with its params and under its dataset, API version
    // and perspective, the way a pasted URL does
    await waitFor(() => expect(fetchCalls).toHaveLength(1))
    expect(fetchCalls[0]).toMatchObject({
      query: '*[_type == "movie"]',
      params: {limit: 3},
      config: {dataset: 'test', apiVersion: 'v2025-02-19', perspective: 'drafts'},
    })
    fireEvent.click(document.getElementById('vista-response-history-tab') as HTMLElement)
    expect(text(screen.getByTestId('vista-history-entry'))).toContain('vista.history.reason.link')
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(fetchCalls).toHaveLength(1)
  })

  it('keeps to the tab already showing the request a link names, without running it again', async () => {
    const first = renderVista()
    typeQuery('*[_type == "movie"]')
    await waitFor(() => expect(isDisabled(screen.getByTestId('vista-fetch-button'))).toBe(false))
    fireEvent.click(screen.getByTestId('vista-fetch-button'))
    await waitFor(() => expect(first.fetchCalls).toHaveLength(1))
    const activeUrl = (screen.getByTestId('vista-query-url') as HTMLInputElement).value
    first.unmount()

    // A reload: the address still names the restored tab's own request, as a bookmark of it would
    sanityMocks.router.state = {_searchParams: [['url', activeUrl]]}
    const second = renderVista()

    await waitFor(() => expect(getQueryEditor().value).toBe('*[_type == "movie"]'))
    expect(screen.getAllByTestId('vista-tab')).toHaveLength(1)
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(second.fetchCalls).toHaveLength(0)
  })

  it('shows the query plan and an explanation of the query in the Explain panel', async () => {
    const {promptCalls, replyToPrompts, requestCalls, respondToRequests} = renderVista()
    const plan =
      'Pipeline {\n  r1: StreamStep {\n    $0: Fetch {Filter: (_type == "post")}\n  }\n  r2: FilterStep {\n    Source: r1, Expr: eq($1.name, "x")\n  }\n}'
    respondToRequests({result: [], explain: plan})
    replyToPrompts(
      'It fetches every post.\n\nThe filter `_type == "post"` is applied while reading.',
    )

    fireEvent.click(document.getElementById('vista-response-explain-tab') as HTMLElement)
    expect(isDisabled(screen.getByTestId('vista-explain-button'))).toBe(true)
    expect(text(screen.getByTestId('vista-explain'))).toContain('vista.explain.empty')

    typeQuery('*[_type == "post"]')
    await waitFor(() => expect(isDisabled(screen.getByTestId('vista-explain-button'))).toBe(false))
    fireEvent.click(screen.getByTestId('vista-explain-plan-button'))
    await waitFor(() => expect(screen.getByTestId('vista-query-plan')).toBeTruthy())
    expect(text(screen.getByTestId('vista-query-plan'))).toContain(
      'Fetch {Filter: (_type == "post")}',
    )
    // What stands out in it: the filter evaluated in memory
    expect(text(screen.getByTestId('vista-plan-insight'))).toContain(
      'vista.explain.insight.filter-in-memory',
    )
    expect(text(screen.getByTestId('vista-plan-insight'))).toContain('eq($1.name, "x")')
    expect(new URL(requestCalls[0].options.url, 'https://x.io').searchParams.get('explain')).toBe(
      'true',
    )

    // The explanation reuses the plan it already has
    fireEvent.click(screen.getByTestId('vista-explain-button'))
    await waitFor(() => expect(screen.getByTestId('vista-explanation')).toBeTruthy())
    expect(requestCalls).toHaveLength(1)
    expect(promptCalls[0].config.apiVersion).toBe('vX')
    expect(promptCalls[0].request).toMatchObject({instructionParams: {plan}})
    const explanation = screen.getByTestId('vista-explanation')
    expect(
      [...explanation.querySelectorAll('[data-ui="Text"]')].map(
        (paragraph) => paragraph.textContent,
      ),
    ).toEqual(['It fetches every post.', 'The filter _type == "post" is applied while reading.'])
    // Quoted GROQ is shown as code
    expect(explanation.querySelector('code')?.textContent).toBe('_type == "post"')

    // Both belong to the query they were made for
    typeQuery('*[_type == "author"]')
    await waitFor(() => expect(screen.queryByTestId('vista-explanation')).toBeNull())
    expect(screen.queryByTestId('vista-query-plan')).toBeNull()
  })

  it('runs the query in delta mode against two documents, typed in or loaded from the history', async () => {
    const {respondToRequestsBy, requestCalls} = renderVista()
    typeQuery('_type == "post" && delta::changedAny(title)')
    fireEvent.click(screen.getByTestId('vista-sidebar-delta'))
    const editorIn = (testId: string) =>
      within(screen.getByTestId(testId)).getByRole('textbox') as HTMLTextAreaElement
    expect(text(screen.getByTestId('vista-delta-result'))).toContain('vista.delta.empty')

    fireEvent.change(editorIn('vista-delta-before'), {
      target: {value: '{"_id": "a", "_type": "post", "title": "Old"}'},
    })
    fireEvent.change(editorIn('vista-delta-after'), {
      target: {value: '{"_id": "a", "_type": "post", "title": "New"}'},
    })
    await waitFor(() =>
      expect(text(screen.getByTestId('vista-delta-match'))).toBe('vista.delta.matches'),
    )
    expect(text(screen.getByTestId('vista-delta-operation'))).toBe('update')

    // An empty side is no document: the change creates it
    fireEvent.change(editorIn('vista-delta-before'), {target: {value: ''}})
    await waitFor(() => expect(text(screen.getByTestId('vista-delta-operation'))).toBe('create'))
    fireEvent.change(editorIn('vista-delta-before'), {target: {value: '{"_id": '}})
    expect(text(screen.getByTestId('vista-delta-result'))).toContain('vista.delta.invalid-before')

    // From the History API: the latest revision as After, the one before it as Before
    respondToRequestsBy((url) =>
      url.includes('/transactions/')
        ? '{"id":"r2","timestamp":"2026-10-15T10:00:00Z"}\n{"id":"r1","timestamp":"2026-10-14T10:00:00Z"}\n'
        : {documents: [{_id: 'a', _type: 'post', title: 'Same'}]},
    )
    fireEvent.change(screen.getByTestId('vista-delta-document-id'), {target: {value: 'a'}})
    fireEvent.click(screen.getByTestId('vista-delta-load'))
    await waitFor(() => expect(editorIn('vista-delta-after').value).toContain('"Same"'))
    expect(requestCalls.map((call) => call.options.url)).toEqual([
      '/v2025-02-19/data/history/test/transactions/a?excludeContent=true&reverse=true&limit=20',
      '/v2025-02-19/data/history/test/documents/a?revision=r2',
      '/v2025-02-19/data/history/test/documents/a?revision=r1',
    ])
    expect((screen.getByTestId('vista-delta-before-revision') as HTMLSelectElement).value).toBe(
      'r1',
    )
    // Nothing changed between the two, so the filter does not match
    await waitFor(() =>
      expect(text(screen.getByTestId('vista-delta-match'))).toBe('vista.delta.no-match'),
    )
  })

  it('applies mutations a dry run showed, to the tab’s dataset, and fetches the query again', async () => {
    const {fetchCalls, documents, requestCalls, respondToRequestsBy} = renderVista()
    typeQuery('*[_type == "post"]')
    fireEvent.click(screen.getByTestId('vista-fetch-button'))
    await waitFor(() => expect(fetchCalls).toHaveLength(1))

    documents.set('a', {_id: 'a', _type: 'post', title: 'Old'})
    respondToRequestsBy((_url, options) =>
      options.query?.dryRun
        ? {
            results: [
              {id: 'a', operation: 'update', document: {_id: 'a', _type: 'post', title: 'New'}},
            ],
          }
        : {transactionId: 'tx-1', results: [{id: 'a', operation: 'update'}]},
    )
    fireEvent.click(screen.getByTestId('vista-sidebar-mutate'))
    fireEvent.change(within(screen.getByTestId('vista-mutate-editor')).getByRole('textbox'), {
      target: {value: '[{"patch": {"id": "a", "set": {"title": "New"}}}]'},
    })
    fireEvent.click(screen.getByTestId('vista-mutate-preview'))
    await screen.findByTestId('vista-mutate-preview-result')
    fireEvent.click(screen.getByTestId('vista-mutate-apply'))
    await screen.findByTestId('vista-mutate-applied')

    expect(
      requestCalls.map(({options}) => [options.url, options.method, options.query?.dryRun]),
    ).toEqual([
      ['/v2025-02-19/data/mutate/test', 'POST', 'true'],
      ['/v2025-02-19/data/mutate/test', 'POST', undefined],
    ])
    await waitFor(() => expect(fetchCalls).toHaveLength(2))
    fireEvent.click(document.getElementById('vista-response-history-tab') as HTMLElement)
    expect(text(screen.getAllByTestId('vista-history-entry')[0])).toContain(
      'vista.history.reason.mutation',
    )
  })

  it('offers WebMCP tools while it is open, which read and run queries and open them in tabs', async () => {
    interface Registered {
      tool: {
        name: string
        title?: string
        annotations?: {readOnlyHint?: boolean}
        execute: (input: Record<string, unknown>) => Promise<{
          content: {text: string}[]
          isError?: boolean
        }>
      }
      signal: AbortSignal | undefined
    }
    const registered: Registered[] = []
    Reflect.set(document, 'modelContext', {
      registerTool: (tool: Registered['tool'], options?: {signal?: AbortSignal}) => {
        registered.push({tool, signal: options?.signal})
        return Promise.resolve()
      },
    })
    try {
      const {fetchCalls, documents, requestCalls, respondToRequestsBy, unmount} = renderVista()
      await waitFor(() => expect(registered).toHaveLength(7))
      expect(registered.map(({tool}) => [tool.name, tool.annotations?.readOnlyHint])).toEqual([
        ['vision_get_state', true],
        ['vision_run_query', true],
        ['vision_open_query', false],
        ['vision_check_query', true],
        ['vision_explain_query', true],
        ['vision_describe_schema', true],
        ['vision_preview_mutations', true],
      ])
      expect(registered[0].tool.title).toBe('vista.webmcp.get-state')
      const tool = (name: string) =>
        registered.find((entry) => entry.tool.name === name)?.tool as Registered['tool']
      const read = async (name: string, input: Record<string, unknown> = {}) => {
        let output: Awaited<ReturnType<Registered['tool']['execute']>> | undefined
        await act(async () => {
          output = await tool(name).execute(input)
        })
        return output
      }

      typeQuery('*[_type == "post"]{title}')
      const state = JSON.parse((await read('vision_get_state'))?.content[0].text ?? '{}')
      expect(state).toMatchObject({
        query: '*[_type == "post"]{title}',
        dataset: 'test',
        status: 'idle',
      })

      // Runs with the tab's options, leaving the tab as it is
      const run = await read('vision_run_query', {
        query: '*[_type == "author"]',
        params: {limit: 3},
      })
      expect(fetchCalls.at(-1)).toMatchObject({query: '*[_type == "author"]', params: {limit: 3}})
      expect(JSON.parse(run?.content[0].text ?? '{}')).toEqual({
        ms: 12,
        result: [{title: 'Variant title'}],
      })
      expect(getQueryEditor().value).toBe('*[_type == "post"]{title}')

      // A missing query is an error the agent can read
      expect(await read('vision_run_query', {})).toEqual({
        content: [{type: 'text', text: 'A GROQ query is required'}],
        isError: true,
      })

      // Lints like the editor does
      const findings = JSON.parse(
        (await read('vision_check_query', {query: '*[_type == "post" && author->name == "x"]'}))
          ?.content[0].text ?? '[]',
      )
      expect(findings).toEqual([
        expect.objectContaining({
          line: 1,
          rule: 'groq-lint/unlimited-query',
          severity: 'warning',
          text: '[_type == "post" && author->name == "x"]',
        }),
        expect.objectContaining({line: 1, rule: 'groq-lint/join-in-filter', text: 'author->'}),
      ])

      // Opens a query in a tab of its own and runs it there, laid out for the width the new tab's
      // editor settles at rather than the narrower one it has while its panes settle
      const fetchesBefore = fetchCalls.length
      let readings = 0
      editorMocks.visibleColumns = () => (++readings <= 2 ? 30 : 80)
      await read('vision_open_query', {
        query: '*[_type == "book"] | order(_createdAt desc)[0...10]{_id, title}',
        title: 'From the agent',
      })
      await waitFor(() =>
        expect(getStoredState()?.tabs.map((tab: {title?: string}) => tab.title)).toContain(
          'From the agent',
        ),
      )
      await waitFor(() => expect(fetchCalls.length).toBeGreaterThan(fetchesBefore))
      expect(fetchCalls.at(-1)?.query).toBe(
        '*[_type == "book"] | order(_createdAt desc)[0...10] { _id, title }',
      )

      // Mutations only run as dry runs, each document compared with what they would make it
      documents.set('a', {_id: 'a', _type: 'post', title: 'Old'})
      respondToRequestsBy(() => ({
        results: [
          {id: 'a', operation: 'update', document: {_id: 'a', _type: 'post', title: 'New'}},
        ],
      }))
      const preview = await read('vision_preview_mutations', {
        mutations: [{patch: {id: 'a', set: {title: 'New'}}}],
      })
      expect(JSON.parse(preview?.content[0].text ?? '{}')).toEqual({
        dataset: 'test',
        documents: [
          {
            id: 'a',
            operation: 'update',
            before: {_id: 'a', _type: 'post', title: 'Old'},
            after: {_id: 'a', _type: 'post', title: 'New'},
          },
        ],
        notCompared: 0,
      })
      expect(requestCalls.at(-1)?.options).toMatchObject({
        url: '/v2025-02-19/data/mutate/test',
        method: 'POST',
        query: {dryRun: 'true', returnDocuments: 'true'},
      })
      expect(await read('vision_preview_mutations', {mutations: [{upsert: {}}]})).toMatchObject({
        isError: true,
      })

      unmount()
      expect(registered.every(({signal}) => signal?.aborted)).toBe(true)
    } finally {
      Reflect.deleteProperty(document, 'modelContext')
    }
  })

  it('sends queries to the API CDN when asked, unless the perspective is one it does not serve', async () => {
    const {fetchCalls} = renderVista()
    typeQuery('*[_type == "post"]')
    const perspectiveSelect = () =>
      screen.getByTestId('vista-option-perspective-select') as HTMLSelectElement
    const apiVersionButton = () => screen.getByTestId('vista-api-version-button')
    // Global with the navbar on published: the navbar's `['published']` stack is sent as the
    // published perspective, which the CDN serves
    expect(perspectiveSelect().value).toBe('global')
    fireEvent.click(screen.getByTestId('vista-option-use-cdn'))
    expect(text(apiVersionButton())).toBe('vista.api-version.button-cdn:v2025-02-19')
    expect(screen.queryByTestId('vista-option-use-cdn-blocked')).toBeNull()
    await waitFor(() => expect(isDisabled(screen.getByTestId('vista-fetch-button'))).toBe(false))
    fireEvent.click(screen.getByTestId('vista-fetch-button'))
    await waitFor(() => expect(fetchCalls).toHaveLength(1))
    expect(fetchCalls[0].options).toMatchObject({useCdn: true})
    expect(fetchCalls[0].config.perspective).toBe('published')
    await waitFor(() => expect(getStoredState()?.tabs[0].options.useCdn).toBe(true))
    await waitFor(() =>
      expect((screen.getByTestId('vista-query-url') as HTMLInputElement).value).toMatch(
        /^https:\/\/test\.apicdn\.sanity\.io\//,
      ),
    )

    // The CDN serves no drafts: the query goes to the API, the option says why and offers the
    // published perspective, and the API version button warns about it
    fireEvent.change(perspectiveSelect(), {target: {value: 'drafts'}})
    const notice = screen.getByTestId('vista-option-use-cdn-blocked')
    expect(text(notice)).toContain('vista.options.use-cdn.blocked.title')
    expect(text(notice)).toContain('vista.options.use-cdn.blocked')
    expect(text(apiVersionButton())).toBe('vista.api-version.button:v2025-02-19')
    expect(apiVersionButton().getAttribute('data-cdn-blocked')).toBe('true')
    fireEvent.click(screen.getByTestId('vista-fetch-button'))
    await waitFor(() => expect(fetchCalls).toHaveLength(2))
    expect(fetchCalls[1].options).toMatchObject({useCdn: false})

    // The button points at the perspective, and the notice switches it to published
    fireEvent.click(apiVersionButton())
    await waitFor(() => expect(document.activeElement).toBe(perspectiveSelect()))
    fireEvent.click(screen.getByTestId('vista-option-use-cdn-blocked-use-published'))
    expect(perspectiveSelect().value).toBe('published')
    expect(screen.queryByTestId('vista-option-use-cdn-blocked')).toBeNull()
    expect(text(apiVersionButton())).toBe('vista.api-version.button-cdn:v2025-02-19')
    expect(apiVersionButton().getAttribute('data-cdn-blocked')).toBeNull()
  })

  it('keeps the functions a query declares in a library, to declare in other queries', async () => {
    renderVista()
    const declaration = 'fn ex::author($ref) = $ref->{name}'
    typeQuery(`${declaration};\n\n*[_type == "post"]{"author": ex::author(author)}`)

    // The sidebar counts the declared functions and opens them in its drawer
    expect(text(screen.getByTestId('vista-sidebar-functions-badge'))).toBe('1')
    fireEvent.click(screen.getByTestId('vista-sidebar-functions'))
    const [declared] = within(screen.getByTestId('vista-drawer-functions')).getAllByTestId(
      'vista-declared-function',
    )
    expect(text(declared)).toContain('ex::author($ref)')
    fireEvent.click(within(declared).getByTestId('vista-function-save'))
    expect(within(declared).getByTestId('vista-function-saved')).toBeTruthy()
    await waitFor(() =>
      expect(getStoredState()?.functions).toEqual([{id: 'ex::author', declaration}]),
    )

    // Another tab declares it from the library: the drawer stays open and shows that tab's
    fireEvent.click(screen.getByTestId('vista-new-tab'))
    typeQuery('*[_type == "book"]{"author": ex::author(author)}')
    expect(screen.queryByTestId('vista-sidebar-functions-badge')).toBeNull()
    const [saved] = screen.getAllByTestId('vista-library-function')
    fireEvent.click(within(saved).getByTestId('vista-function-add'))
    expect(getQueryEditor().value).toBe(
      `${declaration};\n\n*[_type == "book"]{"author": ex::author(author)}`,
    )
    expect(within(saved).getByTestId('vista-function-declared')).toBeTruthy()
    await waitFor(() =>
      expect(getStoredState()?.tabs[1].query).toBe(
        `${declaration};\n\n*[_type == "book"]{"author": ex::author(author)}`,
      ),
    )
  })

  it('shows the result as JSON text to select and copy from, and remembers the choice', async () => {
    const {respondWith} = renderVista()
    const result = [{_id: 'a', title: 'Copy me'}]
    respondWith({result, ms: 3})
    typeQuery('*[_type == "post"]')
    await waitFor(() => expect(isDisabled(screen.getByTestId('vista-fetch-button'))).toBe(false))
    fireEvent.click(screen.getByTestId('vista-fetch-button'))
    await waitFor(() => expect(screen.getByTestId('result-json')).toBeTruthy())
    const writeText = vi.fn(() => Promise.resolve())
    const clipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
    Object.defineProperty(navigator, 'clipboard', {value: {writeText}, configurable: true})

    try {
      fireEvent.click(document.getElementById('vista-result-view-json') as HTMLElement)
      const json = await screen.findByTestId('vista-result-json')
      expect((within(json).getByTestId('codemirror-mock') as HTMLTextAreaElement).value).toBe(
        JSON.stringify(result, null, 2),
      )
      expect(screen.queryByTestId('result-json')).toBeNull()
      expect(document.getElementById('vista-result-view-json')?.getAttribute('aria-controls')).toBe(
        json.id,
      )
      await waitFor(() => expect(getStoredState().panels.resultView).toBe('json'))

      fireEvent.click(screen.getByTestId('vista-copy-result'))
      await waitFor(() => expect(writeText).toHaveBeenCalledWith(JSON.stringify(result, null, 2)))

      fireEvent.click(document.getElementById('vista-result-view-tree') as HTMLElement)
      expect(screen.getByTestId('result-json')).toBeTruthy()
      expect(screen.queryByTestId('vista-result-json')).toBeNull()
    } finally {
      if (clipboard) Object.defineProperty(navigator, 'clipboard', clipboard)
      else Reflect.deleteProperty(navigator, 'clipboard')
    }
  })

  it('shows the API version next to Fetch, and the field that changes it on request', async () => {
    renderVista()
    const button = screen.getByTestId('vista-api-version-button')
    expect(text(button)).toBe('vista.api-version.button:v2025-02-19')

    // With the Options panel collapsed, the button opens it and focuses the field
    fireEvent.click(screen.getByTestId('vista-request-options-toggle'))
    expect(screen.queryByTestId('vista-option-api-version-select')).toBeNull()
    fireEvent.click(button)
    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByTestId('vista-option-api-version-select')),
    )

    // An unfinished "Other" version is called out, since nothing can be fetched with it
    fireEvent.change(screen.getByTestId('vista-option-api-version-select'), {
      target: {value: 'other'},
    })
    expect(text(screen.getByTestId('vista-api-version-button'))).toBe(
      'vista.api-version.button-invalid',
    )
    fireEvent.click(screen.getByTestId('vista-api-version-button'))
    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByTestId('vista-option-api-version-custom')),
    )
  })

  it('says at every control that calls Agent Actions that it uses AI credits', async () => {
    renderVista()
    // Tooltips stay mounted while closed, so the note is in the document for every control shown:
    // Generate query over the query editor, then Explain this to me, then Generate mutations
    const notes = () => screen.queryAllByText('vista.agent-actions.credits')
    await waitFor(() => expect(notes()).toHaveLength(1))
    fireEvent.click(document.getElementById('vista-response-explain-tab') as HTMLElement)
    await waitFor(() => expect(notes()).toHaveLength(2))
    fireEvent.click(screen.getByTestId('vista-sidebar-mutate'))
    await waitFor(() => expect(notes()).toHaveLength(3))
    // The icon-only controls keep their name as the tooltip's first line; the Explain button
    // says what it does itself
    const tooltipTexts = notes().map((note) =>
      text(note.closest<HTMLElement>('[data-ui="Tooltip"]') as HTMLElement),
    )
    expect(tooltipTexts).toEqual([
      'vista.generate.buttonvista.agent-actions.credits',
      'vista.agent-actions.credits',
      'vista.mutate.generate.buttonvista.agent-actions.credits',
    ])
  })

  it('says under every Agent Actions control how many AI credits the organization has left', async () => {
    const {aiCreditsRequests, respondToAiCredits} = renderVista()
    respondToAiCredits({
      granted: true,
      reasonCode: null,
      subscription: {resourceId: 'ai-usage', quota: 1000},
      usage: {metric: 'ai-usage', value: 58},
    })

    fireEvent.click(screen.getByTestId('vista-generate-query'))
    const bar = screen.getByTestId('vista-generate-bar')
    const note = await within(bar).findByTestId('vista-ai-credits')
    expect(text(note)).toContain('vista.ai-credits.balance:{"balance":"942","quota":"1,000"}')
    // Read through the project, on the experimental API where the resource is
    expect(aiCreditsRequests).toHaveLength(1)
    expect(aiCreditsRequests[0].config.apiVersion).toBe('vX')
    expect(aiCreditsRequests[0].options.url).toBe(
      '/subscriptions/project/test-project/resources/ai-usage',
    )
    // The note leads to the organization's AI usage in Manage once the organization is known
    await waitFor(() =>
      expect(within(note).getByRole('link').getAttribute('href')).toBe(
        'https://www.sanity.io/organizations/org-1/usage/ai',
      ),
    )

    // The other controls share the reading
    fireEvent.click(document.getElementById('vista-response-explain-tab') as HTMLElement)
    const explainNote = await within(screen.getByTestId('vista-explain')).findByTestId(
      'vista-ai-credits',
    )
    expect(text(explainNote)).toContain('"balance":"942"')
    fireEvent.click(screen.getByTestId('vista-sidebar-mutate'))
    fireEvent.click(screen.getByTestId('vista-mutate-generate'))
    const mutateNote = await within(screen.getByTestId('vista-mutate-generate-bar')).findByTestId(
      'vista-ai-credits',
    )
    expect(text(mutateNote)).toContain('"balance":"942"')
    expect(aiCreditsRequests).toHaveLength(1)
  })

  it('offers more AI credits in place of a control description once the organization is out of them', async () => {
    const {respondToAiCredits} = renderVista()
    respondToAiCredits({
      granted: false,
      reasonCode: 'plan_limit_reached',
      subscription: {resourceId: 'ai-usage', quota: 100},
      usage: {metric: 'ai-usage', value: 100},
    })

    fireEvent.click(screen.getByTestId('vista-generate-query'))
    const bar = screen.getByTestId('vista-generate-bar')
    const card = await within(bar).findByTestId('vista-ai-credits-limit')
    expect(text(card)).toContain('vista.ai-credits.limit.title')
    expect(text(card)).toContain('vista.ai-credits.limit.description:{"used":"100","quota":"100"}')
    expect(within(bar).queryByText('vista.generate.description')).toBeNull()
    // The control itself stays: the API decides, and the limit may have been raised since
    expect(isDisabled(within(bar).getByTestId('vista-generate-request'))).toBe(false)
    await waitFor(() =>
      expect(within(card).getByTestId('vista-ai-credits-manage').getAttribute('href')).toBe(
        'https://www.sanity.io/organizations/org-1/settings#caps',
      ),
    )
    expect(
      within(card)
        .getByText('vista.ai-credits.limit.learn-more')
        .closest('a')
        ?.getAttribute('href'),
    ).toBe('https://www.sanity.io/docs/platform-management/how-ai-credits-work')
  })

  it('offers more AI credits, not an error, when Agent Actions turn a request down for them', async () => {
    const {aiCreditsRequests, promptCalls, replyToPrompts, respondToAiCredits} = renderVista()
    respondToAiCredits({
      granted: true,
      reasonCode: null,
      subscription: {resourceId: 'ai-usage', quota: 100},
      usage: {metric: 'ai-usage', value: 90},
    })
    replyToPrompts(limitError())

    generateFrom('Ten authors')
    const bar = screen.getByTestId('vista-generate-bar')
    const card = await within(bar).findByTestId('vista-ai-credits-limit')
    // The response says how the credits stand now, ahead of the metering the reading comes from
    expect(text(card)).toContain('vista.ai-credits.limit.description:{"used":"100","quota":"100"}')
    expect(within(bar).queryByTestId('vista-generate-error')).toBeNull()
    expect(promptCalls).toHaveLength(1)

    // Every control shows the limit from then on
    fireEvent.click(document.getElementById('vista-response-explain-tab') as HTMLElement)
    const explain = screen.getByTestId('vista-explain')
    expect(within(explain).getByTestId('vista-ai-credits-limit')).toBeTruthy()
    expect(within(explain).queryByTestId('vista-ai-credits')).toBeNull()

    // A request that goes through again means the limit was raised: the credits are read again
    respondToAiCredits({
      granted: true,
      reasonCode: null,
      subscription: {resourceId: 'ai-usage', quota: 1000},
      usage: {metric: 'ai-usage', value: 101},
    })
    replyToPrompts({query: '*[_type == "author"]', params: {}, title: 'Authors'})
    fireEvent.change(within(bar).getByTestId('vista-generate-request'), {
      target: {value: 'All authors'},
    })
    fireEvent.click(within(bar).getByTestId('vista-generate-submit'))
    await waitFor(() => expect(screen.queryByTestId('vista-generate-bar')).toBeNull())
    await waitFor(() =>
      expect(
        text(within(screen.getByTestId('vista-explain')).getByTestId('vista-ai-credits')),
      ).toContain('vista.ai-credits.balance:{"balance":"899","quota":"1,000"}'),
    )
    expect(aiCreditsRequests).toHaveLength(2)
  })

  it('keeps the limit a request was turned down for over a reading that started before it', async () => {
    const {replyToPrompts, respondToAiCredits} = renderVista()
    // The reading the bar starts when it opens is still on its way when the request is turned down
    let answer!: (response: unknown) => void
    respondToAiCredits(
      new Promise((resolve) => {
        answer = resolve
      }),
    )
    replyToPrompts(limitError())

    generateFrom('Ten authors')
    await within(screen.getByTestId('vista-generate-bar')).findByTestId('vista-ai-credits-limit')

    // The answer is from before the request hit the limit, so it does not stand
    await act(async () => {
      answer({
        granted: true,
        reasonCode: null,
        subscription: {resourceId: 'ai-usage', quota: 1000},
        usage: {metric: 'ai-usage', value: 58},
      })
    })
    fireEvent.click(document.getElementById('vista-response-explain-tab') as HTMLElement)
    const explain = screen.getByTestId('vista-explain')
    expect(within(explain).getByTestId('vista-ai-credits-limit')).toBeTruthy()
    expect(within(explain).queryByTestId('vista-ai-credits')).toBeNull()
  })

  it('keeps showing other failures as errors, a plain rate limit among them', async () => {
    const {replyToPrompts} = renderVista()
    replyToPrompts(
      new ClientError({
        statusCode: 429,
        statusMessage: 'Too Many Requests',
        headers: {},
        body: {statusCode: 429, error: 'Too Many Requests', message: 'Rate limit exceeded'},
        url: 'https://test.api.sanity.io/vX/agent/action/prompt',
        method: 'POST',
      }),
    )

    generateFrom('Ten authors')
    const error = await screen.findByTestId('vista-generate-error')
    expect(text(error)).toContain('Rate limit exceeded')
    expect(screen.queryByTestId('vista-ai-credits-limit')).toBeNull()
  })

  it('offers more AI credits in the Explain panel when the explanation is turned down for them', async () => {
    const {replyToPrompts, respondToRequests} = renderVista()
    respondToRequests({result: [], explain: 'Pipeline {}'})
    replyToPrompts(limitError())

    typeQuery('*[_type == "post"]')
    fireEvent.click(document.getElementById('vista-response-explain-tab') as HTMLElement)
    await waitFor(() => expect(isDisabled(screen.getByTestId('vista-explain-button'))).toBe(false))
    fireEvent.click(screen.getByTestId('vista-explain-button'))

    const explain = screen.getByTestId('vista-explain')
    const card = await within(explain).findByTestId('vista-ai-credits-limit')
    expect(text(card)).toContain('vista.ai-credits.limit.description:{"used":"100","quota":"100"}')
    expect(within(explain).queryByTestId('vista-explain-error')).toBeNull()
    // The plan costs nothing, so it still came
    expect(within(explain).getByTestId('vista-query-plan')).toBeTruthy()
  })

  it('generates a query from a description into the empty tab, and fetches it', async () => {
    const {fetchCalls, promptCalls, replyToPrompts} = renderVista()
    const generated = '*[_type == "author"] | order(_createdAt desc)[0...10]{_id, name}'
    replyToPrompts({query: generated, params: {}, title: 'Recent authors'})

    fireEvent.click(screen.getByTestId('vista-generate-query'))
    const bar = screen.getByTestId('vista-generate-bar')
    const submit = within(bar).getByTestId('vista-generate-submit')
    expect(isDisabled(submit)).toBe(true)
    const request = within(bar).getByTestId('vista-generate-request')
    expect(request.getAttribute('autocomplete')).toBe('off')
    expect(request.hasAttribute('data-1p-ignore')).toBe(true)
    fireEvent.change(request, {
      target: {value: 'The 10 most recent authors'},
    })
    fireEvent.keyDown(request, {key: 'Enter'})

    await waitFor(() => expect(screen.queryByTestId('vista-generate-bar')).toBeNull())
    expect(promptCalls).toHaveLength(1)
    expect(promptCalls[0].config.apiVersion).toBe('vX')
    expect(promptCalls[0].request).toMatchObject({
      format: 'json',
      instructionParams: {request: 'The 10 most recent authors'},
    })
    // Checked on the Content Lake without running it, with the tab's options
    expect(fetchCalls[0]).toMatchObject({
      config: {apiVersion: 'v2025-02-19', dataset: 'test'},
      query: `select(false => (\n${generated}\n))`,
    })

    // The tab had no query, so the generated one goes into it and runs, laid out for its editor
    await waitFor(() => expect(fetchCalls).toHaveLength(2))
    const tabs = screen.getAllByTestId('vista-tab')
    expect(tabs).toHaveLength(1)
    expect(text(tabs[0])).toContain('Recent authors')
    expect(fetchCalls[1].query).toBe(
      '*[_type == "author"] | order(_createdAt desc)[0...10] { _id, name }',
    )
    expect(getQueryEditor().value).toBe(fetchCalls[1].query)
    fireEvent.click(document.getElementById('vista-response-history-tab') as HTMLElement)
    expect(text(screen.getByTestId('vista-history-entry'))).toContain(
      'vista.history.reason.generated',
    )
  })

  it('replaces the query of a tab that has one, keeping its title, and closes on Escape', async () => {
    const {fetchCalls, replyToPrompts} = renderVista()
    typeQuery('*[_type == "post"]')
    replyToPrompts(
      {
        query: '*[_type == "author"] | order(_createdAt desc)[0...$limit]{_id, name}',
        params: {limit: 10},
        title: 'Authors',
      },
      {query: '*[_type == "book"]', params: {}, title: 'Books'},
    )

    fireEvent.click(screen.getByTestId('vista-generate-query'))
    fireEvent.keyDown(screen.getByTestId('vista-generate-request'), {key: 'Escape'})
    expect(screen.queryByTestId('vista-generate-bar')).toBeNull()

    generateFrom('Authors')
    await waitFor(() => expect(fetchCalls).toHaveLength(2))
    expect(screen.getAllByTestId('vista-tab')).toHaveLength(1)
    // Formatted for the editor, as Prettify would, before it replaced the query
    expect(fetchCalls[1].query).toBe(
      '*[_type == "author"] | order(_createdAt desc)[0...$limit] { _id, name }',
    )
    expect(fetchCalls[1].params).toEqual({limit: 10})
    expect(getQueryEditor().value).toBe(fetchCalls[1].query)
    // The title still comes from the query, so it follows an undo in the editor too
    expect(text(screen.getByTestId('vista-tab-button'))).toBe('author')

    // A title the tab was given stays
    fireEvent.keyDown(within(screen.getByTestId('vista-tab')).getByRole('tab'), {key: 'F2'})
    const titleInput = screen.getByTestId('vista-tab-title-input')
    fireEvent.change(titleInput, {target: {value: 'Reading list'}})
    fireEvent.keyDown(titleInput, {key: 'Enter'})
    generateFrom('Books')
    await waitFor(() => expect(fetchCalls).toHaveLength(4))
    expect(getQueryEditor().value).toBe('*[_type == "book"]')
    expect(text(screen.getByTestId('vista-tab-button'))).toBe('Reading list')
  })

  it('offers the last attempt when every generated query is rejected', async () => {
    const {fetchCalls, failWith, replyToPrompts} = renderVista()
    const rejected = '*[_type == "author"] limit 10'
    replyToPrompts(...Array.from({length: 3}, () => ({query: rejected, params: {}})))
    failWith(
      Object.assign(new Error('GROQ query parse error'), {
        details: {type: 'queryParseError', description: 'unexpected token "limit"'},
      }),
    )

    fireEvent.click(screen.getByTestId('vista-generate-query'))
    const bar = screen.getByTestId('vista-generate-bar')
    fireEvent.change(within(bar).getByTestId('vista-generate-request'), {
      target: {value: 'Ten authors'},
    })
    fireEvent.click(within(bar).getByTestId('vista-generate-submit'))

    const error = await within(bar).findByTestId('vista-generate-error')
    expect(text(error)).toContain('vista.generate.failed')
    expect(text(error)).toContain('unexpected token "limit"')
    expect(text(error)).toContain(rejected)
    expect(fetchCalls).toHaveLength(3)

    fireEvent.click(within(error).getByTestId('vista-generate-open-anyway'))
    await waitFor(() => expect(getQueryEditor().value).toContain('limit 10'))
    expect(screen.getAllByTestId('vista-tab')).toHaveLength(1)
    // Opened to be fixed by hand, not run
    expect(fetchCalls).toHaveLength(3)
  })

  it('keeps the shown result and its actions while a refetch is in flight', async () => {
    const {fetchCalls, holdFetches, respondWith} = renderVista()
    typeQuery('*[_type == "author"]')
    // Nothing to download yet: the export controls are disabled
    expect(isDisabled(screen.getByTestId('vista-export-json'))).toBe(true)
    fireEvent.click(screen.getByTestId('vista-fetch-button'))
    await waitFor(() => expect(screen.getByTestId('result-json')).toBeTruthy())
    // With a result they download it
    expect(isDisabled(screen.getByTestId('vista-export-json'))).toBe(false)

    const release = holdFetches()
    respondWith({result: [{title: 'Newer'}], ms: 34, syncTags: ['s1:abc']})
    fireEvent.click(screen.getByTestId('vista-fetch-button'))
    await waitFor(() => expect(fetchCalls).toHaveLength(2))

    // The previous result stays on screen until the new one arrives, and so does everything
    // that works on it
    expect(text(screen.getByTestId('result-json'))).toContain('Variant title')
    expect(isDisabled(screen.getByTestId('vista-export-json'))).toBe(false)
    expect(isDisabled(screen.getByTestId('vista-export-csv'))).toBe(false)
    // Fetch reads Stop meanwhile, named for what it stops next to Stop live
    const fetchButton = screen.getByTestId('vista-fetch-button')
    expect(text(fetchButton)).toBe('vista.query.stop')
    expect(fetchButton.getAttribute('aria-label')).toBe('vista.query.stop.description')

    release()
    await waitFor(() => expect(text(screen.getByTestId('result-json'))).toContain('Newer'))
    expect(text(fetchButton)).toBe('action.query-execute')
    expect(text(screen.getByTestId('vista-meta-execution'))).toContain('34ms')
    expect(isDisabled(screen.getByTestId('vista-export-json'))).toBe(false)
  })

  it('serializes the result for a download only when one is asked for', async () => {
    // Object URLs are stubbed so the files built can be counted, and the download link's click
    // is intercepted since jsdom cannot navigate
    const objectUrl = Object.getOwnPropertyDescriptor(URL, 'createObjectURL')
    const revokeUrl = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL')
    const createObjectURL = vi.fn((blob: Blob) => `blob:${blob.type}`)
    Object.defineProperty(URL, 'createObjectURL', {value: createObjectURL, configurable: true})
    Object.defineProperty(URL, 'revokeObjectURL', {value: vi.fn(), configurable: true})
    const anchorClick = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(function click() {})
    try {
      const {respondWith} = renderVista()
      typeQuery('*[_type == "lazy"]')
      respondWith({result: [{title: 'Lazy download'}], ms: 12, syncTags: []})
      fireEvent.click(screen.getByTestId('vista-fetch-button'))
      await waitFor(() =>
        expect(text(screen.getByTestId('result-json'))).toContain('Lazy download'),
      )

      // The response is on screen and both downloads are offered, but no file has been built
      expect(isDisabled(screen.getByTestId('vista-export-json'))).toBe(false)
      expect(isDisabled(screen.getByTestId('vista-export-csv'))).toBe(false)
      expect(createObjectURL).not.toHaveBeenCalled()
      // The buttons themselves are what a keyboard user reaches
      expect(screen.getByTestId('vista-export-csv').parentElement?.hasAttribute('tabindex')).toBe(
        false,
      )

      fireEvent.click(screen.getByTestId('vista-export-json'))
      expect(createObjectURL).toHaveBeenCalledTimes(1)
      expect(createObjectURL.mock.calls[0][0].type).toBe('application/json')
      expect(anchorClick).toHaveBeenCalledTimes(1)
      const [anchor] = anchorClick.mock.contexts as HTMLAnchorElement[]
      expect(anchor.download).toBe('query-result.json')
      expect(anchor.href).toBe('blob:application/json')
      // Asking for the same result again reuses the file
      fireEvent.click(screen.getByTestId('vista-export-json'))
      expect(createObjectURL).toHaveBeenCalledTimes(1)

      fireEvent.click(screen.getByTestId('vista-export-csv'))
      expect(createObjectURL).toHaveBeenCalledTimes(2)
      expect(createObjectURL.mock.calls[1][0].type).toBe('text/csv')
      expect((anchorClick.mock.contexts.at(-1) as HTMLAnchorElement).download).toBe(
        'query-result.csv',
      )

      // A result without objects has no CSV to offer, while the JSON stays available
      respondWith({result: [1, 2, 3], ms: 12, syncTags: []})
      fireEvent.click(screen.getByTestId('vista-fetch-button'))
      await waitFor(() => expect(text(screen.getByTestId('result-json'))).toBe('[1,2,3]'))
      expect(isDisabled(screen.getByTestId('vista-export-json'))).toBe(false)
      const csvButton = screen.getByTestId('vista-export-csv')
      expect(isDisabled(csvButton)).toBe(true)
      expect(createObjectURL).toHaveBeenCalledTimes(2)
      // The disabled button is out of the tab order, so its wrapper takes its place there, as a
      // disabled button described by the reason, for a keyboard user to reach the explanation
      const csvWrapper = csvButton.parentElement as HTMLElement
      expect(csvWrapper.getAttribute('tabindex')).toBe('0')
      expect(csvWrapper.getAttribute('role')).toBe('button')
      expect(csvWrapper.getAttribute('aria-disabled')).toBe('true')
      expect(csvWrapper.getAttribute('aria-label')).toBe('vista.result.export-csv')
      expect(describedBy(csvWrapper)).toBe('result.save-result-as-csv.not-csv-encodable')
      expect(csvButton.getAttribute('aria-hidden')).toBe('true')
    } finally {
      anchorClick.mockRestore()
      if (objectUrl) Object.defineProperty(URL, 'createObjectURL', objectUrl)
      else Reflect.deleteProperty(URL, 'createObjectURL')
      if (revokeUrl) Object.defineProperty(URL, 'revokeObjectURL', revokeUrl)
      else Reflect.deleteProperty(URL, 'revokeObjectURL')
    }
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

  it('explains a failure with the options the request went out with, not the tab’s current ones', async () => {
    const initial = createInitialState(DEFAULTS)
    // A release stack on an API version from before releases: the failure gets a capability hint
    const tab = createTab(initial.settings, {
      id: 'old',
      query: '*',
      options: {apiVersion: 'v2021-10-21', perspective: 'global'},
    })
    saveVistaState(PROJECT_ID, {...initial, tabs: [tab], activeTabId: 'old'})
    const {failWith, holdFetches, fetchCalls} = renderVista({
      ...BASE_PERSPECTIVE,
      perspectiveStack: ['rSummer', 'drafts'],
      selectedPerspectiveName: 'rSummer',
      selectedReleaseId: 'rSummer',
    })
    failWith(
      new ClientError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        headers: {},
        body: {message: 'Complex perspectives are not supported for this version'},
        url: 'https://test.api.sanity.io/v2021-10-21/data/query/test?query=*',
        method: 'GET',
      }),
    )
    const release = holdFetches()
    fireEvent.click(screen.getByTestId('vista-fetch-button'))
    await waitFor(() => expect(fetchCalls).toHaveLength(1))
    expect(fetchCalls[0].config.perspective).toEqual(['rSummer', 'drafts'])

    // The tab moves to a plain perspective while the request is still in flight
    fireEvent.change(screen.getByTestId('vista-option-perspective-select'), {
      target: {value: 'published'},
    })
    release()

    await waitFor(() =>
      expect(text(screen.getByTestId('vista-result'))).toContain('Complex perspectives'),
    )
    expect(text(screen.getByTestId('query-error-api-version-capability-hint'))).toContain(
      'query.error.unsupported-release-perspective',
    )
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
    // Live fetches like Fetch, then follows the response's sync tags
    fireEvent.click(screen.getByTestId('vista-auto-refetch'))
    await waitFor(() => expect(fetchCalls).toHaveLength(1))

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
    expect(text(entries[1])).toContain('vista.history.reason.live-start')

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
    // Measured for the query's one line, then for the 7 lines of the first pass and the 8 of the second
    expect(widthsAsked).toEqual([1, 7, 8])

    typeQuery('*[_type == "author"')
    fireEvent.click(screen.getByTestId('vista-query-menu-button'))
    fireEvent.click(screen.getByTestId('vista-prettify'))

    await screen.findByText('vista.query.prettify.failed', undefined, {timeout: 3000})
    expect(screen.getByText("expected ']' following expression")).toBeTruthy()
    expect(getQueryEditor().value).toBe('*[_type == "author"')
  })

  it('starts Live with a fetch of the current request, not the last fetched one', async () => {
    const {fetchCalls} = renderVista()
    typeQuery('*[_type == "author"]')
    fireEvent.click(screen.getByTestId('vista-fetch-button'))
    await waitFor(() => expect(fetchCalls).toHaveLength(1))

    // The dataset changes while refetching is off, so the runner still holds the old request
    fireEvent.click(screen.getByTestId('vista-option-dataset-pin'))
    fireEvent.change(screen.getByTestId('vista-option-dataset-select'), {
      target: {value: 'staging'},
    })
    fireEvent.click(screen.getByTestId('vista-auto-refetch'))

    await waitFor(() => expect(fetchCalls).toHaveLength(2))
    expect(fetchCalls[1].config.dataset).toBe('staging')

    // Like Fetch, starting it again fetches again
    fireEvent.click(screen.getByTestId('vista-auto-refetch'))
    fireEvent.click(screen.getByTestId('vista-auto-refetch'))
    await waitFor(() => expect(fetchCalls).toHaveLength(3))
    await waitFor(() => expect(getStoredState().tabs[0].autoRefetch).toBe(true))
  })

  it('fetches a query loaded into a tab that refetches automatically', async () => {
    sanityMocks.savedQueries = {
      queries: [
        {
          _key: 'saved-pages',
          shared: false,
          title: 'Pages',
          url: 'https://abc.api.sanity.io/v2025-02-19/data/query/staging?query=*%5B_type+%3D%3D+%22page%22%5D',
          savedAt: '2026-01-01T00:00:00Z',
        },
      ],
      moving: [],
    }
    const {fetchCalls} = renderVista()
    typeQuery('*[_type == "author"]')
    fireEvent.click(screen.getByTestId('vista-auto-refetch'))
    await waitFor(() => expect(fetchCalls).toHaveLength(1))

    // A pasted URL loads a new query and pins its dataset in one go, and runs it as pasted; live
    // refetches replay the runner's last request, which the load clears, so it is not fetched
    // again on top of that: once, and for the loaded options
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
      expect(text(entries[0])).toContain('vista.history.reason.paste')
    })
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(fetchCalls).toHaveLength(2)

    // A saved query loaded into the tab has no run of its own, so the live tab fetches it in place
    // of the runner's cleared request
    const loadSavedQuery = async () => {
      if (!screen.queryByTestId('vista-saved-query')) {
        fireEvent.click(screen.getByTestId('vista-sidebar-saved'))
      }
      const item = await screen.findByTestId('vista-saved-query')
      fireEvent.click(within(item).getByRole('button', {expanded: false}))
      const load = screen
        .getAllByRole('menuitem', {hidden: true})
        .find((menuItem) => text(menuItem) === 'vista.saved.load-in-current-tab')
      if (!load) throw new Error('The saved query menu has no load item')
      fireEvent.click(load)
    }
    await loadSavedQuery()
    await waitFor(() => expect(fetchCalls).toHaveLength(3))
    expect(fetchCalls[2].query).toBe('*[_type == "page"]')
    await waitFor(() => {
      const entries = screen.getAllByTestId('vista-history-entry')
      expect(entries).toHaveLength(3)
      expect(text(entries[0])).toContain('vista.history.reason.load')
    })

    // Without automatic refetching such a load only replaces the query
    fireEvent.click(screen.getByTestId('vista-auto-refetch'))
    await waitFor(() => expect(getStoredState().tabs[0].autoRefetch).toBe(false))
    typeQuery('*[_type == "person"]')
    await loadSavedQuery()
    await waitFor(() => expect(getQueryEditor().value).toBe('*[_type == "page"]'))
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(fetchCalls).toHaveLength(3)
  })

  it('resumes automatic refetching with a current result when a tab is shown again', async () => {
    // A restored tab that refetches automatically has a fresh runner with nothing to replay, so
    // it fetches when it mounts
    const initial = createInitialState(DEFAULTS)
    const tab = createTab(initial.settings, {
      id: 'live',
      query: '*[_type == "author"]',
      autoRefetch: true,
    })
    saveVistaState(PROJECT_ID, {...initial, tabs: [tab], activeTabId: 'live'})
    const {fetchCalls, liveSubscriptionCount} = renderVista()

    await waitFor(() => expect(fetchCalls).toHaveLength(1))
    expect(fetchCalls[0].config.perspective).toBe('published')
    await waitFor(() => expect(liveSubscriptionCount()).toBe(1))
    fireEvent.click(document.getElementById('vista-response-history-tab') as HTMLElement)
    expect(text(screen.getByTestId('vista-history-entry'))).toContain('vista.history.reason.resume')

    // While another tab is active the navbar perspective changes, which reaches every tab; the
    // live tab comes back with a request its runner has not fetched yet, so it fetches again
    fireEvent.click(screen.getByTestId('vista-new-tab'))
    await waitFor(() => expect(screen.getAllByTestId('vista-tab')).toHaveLength(2))
    act(() => {
      sanityMocks.setPerspective({
        ...BASE_PERSPECTIVE,
        perspectiveStack: ['drafts'],
        selectedPerspectiveName: 'drafts',
      })
    })
    fireEvent.click(within(screen.getAllByTestId('vista-tab')[0]).getByTestId('vista-tab-button'))
    await waitFor(() => expect(fetchCalls).toHaveLength(2))
    expect(fetchCalls[1].config.perspective).toEqual(['drafts'])

    // Shown again without any change, it has nothing new to fetch
    fireEvent.click(within(screen.getAllByTestId('vista-tab')[1]).getByTestId('vista-tab-button'))
    fireEvent.click(within(screen.getAllByTestId('vista-tab')[0]).getByTestId('vista-tab-button'))
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(fetchCalls).toHaveLength(2)

    // A query typed but never run is not a reason to fetch either: automatic refetching never
    // runs unsent edits, and coming back to the tab must not run them behind the user's back
    typeQuery('*[_type == "book"]')
    await waitFor(() => expect(getStoredState().tabs[0].query).toBe('*[_type == "book"]'))
    fireEvent.click(within(screen.getAllByTestId('vista-tab')[1]).getByTestId('vista-tab-button'))
    fireEvent.click(within(screen.getAllByTestId('vista-tab')[0]).getByTestId('vista-tab-button'))
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(fetchCalls).toHaveLength(2)
    expect(getQueryEditor().value).toBe('*[_type == "book"]')
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

    // The same goes for turning automatic refetching on: the session starts from the params
    // typed just before, not from the ones still waiting in the debounce
    fireEvent.change(paramsEditor, {target: {value: '{"id": "fresher"}'}})
    fireEvent.click(screen.getByTestId('vista-auto-refetch'))
    await waitFor(() => expect(fetchCalls).toHaveLength(2))
    expect(fetchCalls[1].params).toEqual({id: 'fresher'})

    // And for the fetch an option change starts while refetching automatically: it carries the
    // params typed just before the change, not the ones the previous fetch went out with
    fireEvent.change(paramsEditor, {target: {value: '{"id": "freshest"}'}})
    fireEvent.change(screen.getByTestId('vista-option-perspective-select'), {
      target: {value: 'drafts'},
    })
    await waitFor(() => expect(fetchCalls).toHaveLength(3))
    expect(fetchCalls[2].params).toEqual({id: 'freshest'})
    expect(fetchCalls[2].config.perspective).toBe('drafts')
    // The debounce settling afterwards has nothing left to fetch
    await new Promise((resolve) => setTimeout(resolve, 400))
    expect(fetchCalls).toHaveLength(3)
  })

  it('saves and exports params typed just before, ahead of the debounce', async () => {
    renderVista()
    typeQuery('*[_id == $id]')
    await waitFor(() => expect(isDisabled(screen.getByTestId('vista-fetch-button'))).toBe(false))
    const paramsEditor = within(screen.getByTestId('vista-params-editor')).getByTestId(
      'codemirror-mock',
    )
    const savedUrls = () => sanityMocks.saveQuery.mock.calls.map(([query]) => query.url)

    // Save from the query menu
    fireEvent.change(paramsEditor, {target: {value: '{"id": "saved"}'}})
    fireEvent.click(screen.getByTestId('vista-query-menu-button'))
    fireEvent.click(screen.getByTestId('vista-save-query'))
    await waitFor(() => expect(savedUrls()).toHaveLength(1))
    expect(savedUrls()[0]).toContain(
      `${encodeURIComponent('$id')}=${encodeURIComponent('"saved"')}`,
    )

    // Export shows the request built from the params just typed
    fireEvent.change(paramsEditor, {target: {value: '{"id": "exported"}'}})
    fireEvent.click(screen.getByTestId('vista-query-menu-button'))
    fireEvent.click(screen.getByTestId('vista-export-query'))
    const dialog = await screen.findByTestId('vista-export-query-dialog')
    expect(text(dialog)).toContain('"exported"')
    expect(text(dialog)).not.toContain('"saved"')

    // Save from the sidebar, which has no access to the tab's debounce of its own
    fireEvent.change(paramsEditor, {target: {value: '{"id": "sidebar"}'}})
    fireEvent.click(screen.getByTestId('vista-sidebar-saved'))
    fireEvent.click(await screen.findByTestId('vista-save-current-query'))
    await waitFor(() => expect(savedUrls()).toHaveLength(2))
    expect(savedUrls()[1]).toContain(
      `${encodeURIComponent('$id')}=${encodeURIComponent('"sidebar"')}`,
    )
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
    // The disabled select is out of the tab order, so its wrapper takes its place there, as a
    // group described by the reason for the lock, for a keyboard user to reach the explanation
    const apiVersionWrap = screen.getByTestId('vista-option-api-version-wrap')
    expect(apiVersionWrap.getAttribute('tabindex')).toBe('0')
    expect(apiVersionWrap.getAttribute('role')).toBe('group')
    expect(apiVersionWrap.getAttribute('aria-label')).toBe('settings.api-version-label')
    expect(describedBy(apiVersionWrap)).toBe('settings.api-version-locked-for-variant')
    // The action bar names the version requests actually use, and its button shows the lock
    expect(text(screen.getByTestId('vista-api-version-button'))).toBe('vista.api-version.button:vX')
    fireEvent.click(screen.getByTestId('vista-api-version-button'))
    await waitFor(() => expect(document.activeElement).toBe(apiVersionWrap))

    fireEvent.click(screen.getByTestId('vista-fetch-button'))
    await waitFor(() => expect(fetchCalls).toHaveLength(1))
    expect(fetchCalls[0].config).toMatchObject({
      apiVersion: 'vX',
      perspective: 'published',
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
    // The select itself is what a keyboard user reaches while it is not locked
    const apiVersionWrap = screen.getByTestId('vista-option-api-version-wrap')
    expect(apiVersionWrap.hasAttribute('tabindex')).toBe(false)
    expect(apiVersionWrap.hasAttribute('role')).toBe(false)

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

  it('offers no Variant option and sends no variant where the workspace has variants switched off', async () => {
    // The same flag the studio hides its own variant UI behind, the navbar's selector included
    sanityMocks.workspace = {
      document: {drafts: {enabled: true}},
      beta: {variants: {enabled: false}},
    }
    const initial = createInitialState(DEFAULTS)
    const tab = createTab(initial.settings, {id: 'pinned', query: '*[_id == "a"]'})
    saveVistaState(PROJECT_ID, {...initial, tabs: [tab], activeTabId: 'pinned'})

    // A variant the URL still carries for the navbar is not one the studio shows
    const {fetchCalls} = renderVista({...BASE_PERSPECTIVE, selectedVariantNames: ['french']})
    expect(screen.queryByTestId('vista-option-variant-select')).toBeNull()
    expect(selectValue('vista-option-perspective-select')).toBe('global')
    // Nothing locks the API version to vX
    const apiVersionSelect = screen.getByTestId(
      'vista-option-api-version-select',
    ) as HTMLSelectElement
    expect(apiVersionSelect.value).toBe('v2025-02-19')
    expect(apiVersionSelect.disabled).toBe(false)
    expect(text(screen.getByTestId('vista-api-version-button'))).toBe(
      'vista.api-version.button:v2025-02-19',
    )

    fireEvent.click(screen.getByTestId('vista-fetch-button'))
    await waitFor(() => expect(fetchCalls).toHaveLength(1))
    expect(fetchCalls[0].config).toMatchObject({
      apiVersion: 'v2025-02-19',
      perspective: 'published',
    })
    expect(fetchCalls[0].config.variant).toBeUndefined()
    const url = new URL((screen.getByTestId('vista-query-url') as HTMLInputElement).value)
    expect(url.pathname).toContain('/v2025-02-19/')
    expect(url.searchParams.get('variant')).toBeNull()

    // The settings for new tabs have no Variant option either
    fireEvent.click(screen.getByTestId('vista-sidebar-settings'))
    await screen.findByTestId('vista-settings-perspective-select')
    expect(screen.queryByTestId('vista-settings-variant-select')).toBeNull()
  })

  it('says a pasted or saved variant is not sent where the workspace has variants switched off', async () => {
    sanityMocks.workspace = {
      document: {drafts: {enabled: true}},
      beta: {variants: {enabled: false}},
    }
    const url = `https://${PROJECT_ID}.api.sanity.io/vX/data/query/test?query=*&variant=french`
    sanityMocks.savedQueries = {
      queries: [
        {
          _key: 'saved-french',
          shared: false,
          title: 'French',
          url,
          savedAt: '2026-01-01T00:00:00Z',
        },
      ],
      moving: [],
    }
    renderVista({...BASE_PERSPECTIVE, selectedVariantNames: ['french']})
    fireEvent.paste(document.body, {clipboardData: {getData: () => url}})
    await waitFor(() => expect(getQueryEditor().value).toBe('*'))
    // There is no navbar selector to select the variant with, so the toast does not point to it
    await screen.findByText('vista.paste.variants-disabled')
    expect(screen.queryByText('vista.paste.unavailable-variant')).toBeNull()

    fireEvent.click(screen.getByTestId('vista-sidebar-saved'))
    const open = await screen.findByTestId('vista-saved-query-open')
    // The pasted tab sends no variant, so it does not show this saved query
    expect(open.hasAttribute('data-selected')).toBe(false)
    fireEvent.click(open)
    await screen.findByText('vista.saved.variants-disabled')
    expect(screen.queryByText('vista.saved.unavailable-variant')).toBeNull()
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

  it('runs a stored scheduled drafts perspective as Global where the workspace has none, keeping the choice', async () => {
    const initial = createInitialState(DEFAULTS)
    const tab = createTab(initial.settings, {
      id: 'scheduled',
      query: '*',
      options: {perspective: 'scheduledDrafts'},
    })
    saveVistaState(PROJECT_ID, {...initial, tabs: [tab], activeTabId: 'scheduled'})

    // The project's tabs are shared by its workspaces; this one has no scheduled drafts
    const {fetchCalls, setPerspective, unmount} = renderVista()
    const perspectiveSelect = () =>
      screen.getByTestId('vista-option-perspective-select') as HTMLSelectElement
    expect(perspectiveSelect().value).toBe('global')
    expect(within(perspectiveSelect()).queryByRole('option', {name: /scheduled/i})).toBeNull()

    fireEvent.click(screen.getByTestId('vista-fetch-button'))
    await waitFor(() => expect(fetchCalls).toHaveLength(1))
    expect(fetchCalls[0].config.perspective).toBe('published')

    // The navbar changing leaves the stored choice alone too: the tab already follows it here
    setPerspective({
      ...BASE_PERSPECTIVE,
      perspectiveStack: ['drafts'],
      selectedPerspectiveName: 'drafts',
    })
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(perspectiveSelect().value).toBe('global')
    expect(getStoredState().tabs[0].options.perspective).toBe('scheduledDrafts')
    unmount()

    // In a workspace with scheduled drafts, the same stored tab uses them again
    vi.mocked(useScheduledDraftsEnabled).mockReturnValue(true)
    try {
      const enabled = renderVista()
      expect(perspectiveSelect().value).toBe('scheduledDrafts')
      fireEvent.click(screen.getByTestId('vista-fetch-button'))
      await waitFor(() => expect(enabled.fetchCalls).toHaveLength(1))
      // No scheduled releases in this test, so the stack is the workspace's default alone
      expect(enabled.fetchCalls[0].config.perspective).toEqual(['drafts'])
    } finally {
      vi.mocked(useScheduledDraftsEnabled).mockReturnValue(false)
    }
  })

  it('loads a pasted query URL into the active tab and runs it', async () => {
    const {fetchCalls} = renderVista()
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
    expect(screen.queryByText('vista.paste.unknown-dataset')).toBeNull()

    // The request runs as pasted, as it does in the classic tool: the query is left as it was
    // written, with the URL's params and under its dataset, API version and perspective
    await waitFor(() => expect(fetchCalls).toHaveLength(1))
    expect(fetchCalls[0]).toMatchObject({
      query: '*[_id == $id]',
      params: {id: 'a'},
      config: {dataset: 'staging', apiVersion: 'v2021-10-21', perspective: 'published'},
    })
    fireEvent.click(document.getElementById('vista-response-history-tab') as HTMLElement)
    expect(text(screen.getByTestId('vista-history-entry'))).toContain('vista.history.reason.paste')
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(fetchCalls).toHaveLength(1)
  })

  it('loads a pasted curl command, runs the query from its body, and shows that the request posts it', async () => {
    const {fetchCalls} = renderVista()
    // A query too long for a URL, which `@sanity/client` posts as a JSON body; copied from a
    // browser's network tab, token and all
    const query = `*[_id == $id] // ${'x'.repeat(QUERY_URL_SIZE_LIMIT)}`
    const body = JSON.stringify({query, params: {id: 'a'}})
    // The options in the URL: the ones a tab has a setting for, and two it has not
    const curl = [
      `curl 'https://abc.api.sanity.io/v2021-10-21/data/query/staging?perspective=published&tag=my.app&returnQuery=false' \\`,
      `  -H 'authorization: Bearer skSECRET' \\`,
      `  -H 'content-type: application/json' \\`,
      `  --data-raw '${body}' \\`,
      `  --compressed`,
    ].join('\n')

    fireEvent.paste(document.body, {clipboardData: {getData: () => curl}})

    await waitFor(() => expect(getQueryEditor().value).toBe(query))
    await screen.findByText('vista.paste.parsed-curl')
    expect(selectValue('vista-option-dataset-select')).toBe('staging')
    expect(selectValue('vista-option-api-version-select')).toBe('v2021-10-21')
    expect(selectValue('vista-option-perspective-select')).toBe('published')
    expect(document.body.textContent).not.toContain('skSECRET')
    // The tab is set up like the request: pinned to its dataset, on its API version and
    // perspective, with no variant and no source map, to the API; `tag` and `returnQuery` have
    // no setting and are passed over (the state is written behind a debounce)
    await waitFor(
      () =>
        expect(getStoredState().tabs[0].options).toEqual({
          datasetMode: 'pinned',
          dataset: 'staging',
          apiVersion: 'v2021-10-21',
          perspective: 'published',
          variant: 'none',
          includeSourceMap: false,
          useCdn: false,
        }),
      {timeout: 2_000},
    )

    // The request runs as pasted, like a pasted URL does: the body's query and params, under
    // the URL's dataset, API version and perspective
    await waitFor(() => expect(fetchCalls).toHaveLength(1))
    expect(fetchCalls[0]).toMatchObject({
      query,
      params: {id: 'a'},
      config: {dataset: 'staging', apiVersion: 'v2021-10-21', perspective: 'published'},
    })
    await waitFor(() => expect(screen.getByTestId('result-json')).toBeTruthy())

    // The URL field keeps the GET form, which pastes and saves; the note says how it was sent
    const url = new URL((screen.getByTestId('vista-query-url') as HTMLInputElement).value)
    expect(url.searchParams.get('query')).toBe(query)
    expect(screen.getByTestId('vista-query-url-posted')).toBeTruthy()
    fireEvent.click(document.getElementById('vista-response-network-tab') as HTMLElement)
    expect(text(screen.getByTestId('vista-network-method'))).toBe('vista.network.method.post')

    // The curl export writes the POST form back, so it pastes again
    fireEvent.click(screen.getByTestId('vista-query-menu-button'))
    fireEvent.click(screen.getByTestId('vista-export-query'))
    const dialog = await screen.findByTestId('vista-export-query-dialog')
    fireEvent.click(document.getElementById('vista-export-curl-tab') as HTMLElement)
    expect(screen.getByTestId('vista-export-post-note')).toBeTruthy()
    const exported = within(dialog).getByRole('tabpanel').textContent ?? ''
    expect(exported).toContain('--data-raw')
    expect(exported).not.toContain(`?query=`)
    expect(parseQueryPaste(exported, DEFAULTS.datasets)).toMatchObject({
      source: 'curl',
      query,
      params: {id: 'a'},
      dataset: 'staging',
      perspective: 'published',
    })
  })

  it('puts the tab on the API default when the pasted URL has no perspective', async () => {
    const {fetchCalls} = renderVista()
    expect(selectValue('vista-option-perspective-select')).toBe('global')

    fireEvent.paste(document.body, {
      clipboardData: {
        getData: () => `https://abc.api.sanity.io/v2021-10-21/data/query/test?query=*`,
      },
    })
    await waitFor(() => expect(getQueryEditor().value).toBe('*'))
    // The request ran without a perspective, so that is what the tab sends now, not the navbar's
    expect(selectValue('vista-option-perspective-select')).toBe('default')
    await waitFor(() => expect(fetchCalls).toHaveLength(1))
    expect(fetchCalls[0].config.perspective).toBeUndefined()
  })

  it('says so when a pasted URL used a variant the navbar does not have selected', async () => {
    const url = `https://${PROJECT_ID}.api.sanity.io/vX/data/query/test?query=*&variant=french`
    renderVista()
    fireEvent.paste(document.body, {clipboardData: {getData: () => url}})
    await waitFor(() => expect(getQueryEditor().value).toBe('*'))
    // A tab cannot pin a variant, so the request runs without the saved one
    await screen.findByText('vista.paste.unavailable-variant')
    cleanup()

    // With that variant selected in the navbar the tab sends it, and there is nothing to say
    renderVista({...BASE_PERSPECTIVE, selectedVariantNames: ['french']})
    fireEvent.paste(document.body, {clipboardData: {getData: () => url}})
    await waitFor(() => expect(getQueryEditor().value).toBe('*'))
    await screen.findByText('vista.paste.parsed')
    expect(screen.queryByText('vista.paste.unavailable-variant')).toBeNull()
  })

  it(
    'says so when an opened saved query used a variant the navbar does not have selected',
    {timeout: 15_000},
    async () => {
      sanityMocks.savedQueries = {
        queries: [
          {
            _key: 'saved-french',
            shared: false,
            title: 'French',
            url: `https://${PROJECT_ID}.api.sanity.io/vX/data/query/test?query=*&variant=french`,
            savedAt: '2026-01-01T00:00:00Z',
          },
        ],
        moving: [],
      }
      renderVista()
      fireEvent.click(screen.getByTestId('vista-sidebar-saved'))
      const open = await screen.findByTestId('vista-saved-query-open')
      // Not open anywhere: no tab sends the french variant
      expect(open.hasAttribute('data-selected')).toBe(false)
      fireEvent.click(open)
      await waitFor(() => expect(getQueryEditor().value).toBe('*'))
      await screen.findByText('vista.saved.unavailable-variant')
    },
  )

  it('says so when a pasted URL names a dataset that is not available here', async () => {
    renderVista()
    // Another project's URL, or a dataset this user cannot see: the query is loaded, but it runs
    // against the tab's own dataset, so the tab keeps following the workspace
    fireEvent.paste(document.body, {
      clipboardData: {
        getData: () => 'https://other.api.sanity.io/v2025-02-19/data/query/elsewhere?query=*',
      },
    })

    await waitFor(() => expect(getQueryEditor().value).toBe('*'))
    await screen.findByText('vista.paste.unknown-dataset')
    expect(selectValue('vista-option-dataset-select')).toBe('test')
    await waitFor(() =>
      expect(getStoredState().tabs[0].options).toMatchObject({datasetMode: 'workspace'}),
    )
  })

  it(
    'recognizes the tab showing a saved query through the request it sends',
    {timeout: 15_000},
    async () => {
      sanityMocks.savedQueries = {
        queries: [
          {
            _key: 'saved-1',
            shared: false,
            title: 'Everything',
            // Saved from a tab on the `global` perspective while the navbar was on `published`
            url: `https://${PROJECT_ID}.api.sanity.io/v2025-02-19/data/query/test?query=*&perspective=published`,
            savedAt: '2026-01-01T00:00:00Z',
          },
        ],
        moving: [],
      }
      renderVista()
      typeQuery('*')
      expect(selectValue('vista-option-perspective-select')).toBe('global')

      fireEvent.click(screen.getByTestId('vista-sidebar-saved'))
      const open = await screen.findByTestId('vista-saved-query-open')
      // The tab's options say `global`, but the request it sends is the saved one, so the query
      // shows as open and opening it selects the tab rather than adding one
      expect(open.hasAttribute('data-selected')).toBe(true)
      fireEvent.click(open)
      expect(screen.getAllByTestId('vista-tab')).toHaveLength(1)

      // Once the navbar moves to drafts the tab would send another request, so the saved query
      // is no longer open and opening it adds a tab of its own
      act(() => sanityMocks.setPerspective({...BASE_PERSPECTIVE, perspectiveStack: ['drafts']}))
      await waitFor(() => expect(open.hasAttribute('data-selected')).toBe(false))
      fireEvent.click(open)
      await waitFor(() => expect(screen.getAllByTestId('vista-tab')).toHaveLength(2))
    },
  )

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

  it('leaves a saved query alone while a share or unshare is moving it', async () => {
    const shared = {
      _key: 'shared-1',
      shared: true,
      authorId: 'user-1',
      isOwnedByCurrentUser: true,
      title: 'Authors',
      url: `https://${PROJECT_ID}.api.sanity.io/v2025-02-19/data/query/test?query=*`,
      savedAt: '2026-01-01T00:00:00Z',
    }
    sanityMocks.savedQueries = {queries: [shared], moving: ['shared-1']}
    renderVista()

    fireEvent.click(screen.getByTestId('vista-sidebar-shared'))
    const item = await screen.findByTestId('vista-saved-query')
    fireEvent.click(within(item).getByRole('button', {expanded: false}))

    // The menu is portaled, so its items are found from the one whose test id names the query
    const unshare = screen.getByTestId('vista-saved-query-unshare')
    const menu = unshare.closest<HTMLElement>('[role="menu"]')
    if (!menu) throw new Error('The unshare item is not inside a menu')
    const [open, load, rename, remove] = within(menu)
      .getAllByRole('menuitem', {hidden: true})
      .filter((menuItem) => menuItem !== unshare)

    // Opening and loading stay available; the mutations wait for the query to arrive in the
    // other list
    expect(text(open)).toBe('vista.saved.open-in-new-tab')
    expect(isDisabled(open)).toBe(false)
    expect(text(load)).toBe('vista.saved.load-in-current-tab')
    expect(isDisabled(load)).toBe(false)
    expect(text(rename)).toBe('vista.saved.rename')
    expect(isDisabled(rename)).toBe(true)
    expect(isDisabled(unshare)).toBe(true)
    expect(text(remove)).toBe('action.delete')
    expect(isDisabled(remove)).toBe(true)
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

  it('sets the fields hidden from history diffs in the settings', async () => {
    renderVista()
    // The settings open in the sidebar's drawer, and close from the same button
    fireEvent.click(screen.getByTestId('vista-sidebar-settings'))
    const drawer = screen.getByTestId('vista-drawer-settings')
    expect(within(drawer).getByTestId('vista-settings')).toBeTruthy()
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.click(screen.getByTestId('vista-sidebar-settings'))
    expect(screen.queryByTestId('vista-drawer-settings')).toBeNull()
    fireEvent.click(screen.getByTestId('vista-sidebar-settings'))
    const fields = (await screen.findByTestId(
      'vista-settings-hidden-diff-fields',
    )) as HTMLTextAreaElement
    const reset = screen.getByTestId('vista-settings-hidden-diff-fields-reset')
    expect(fields.value).toBe('_rev\n_updatedAt\n_system.base.rev')
    expect(isDisabled(reset)).toBe(true)

    // A line being started stays as typed while it lists the same fields
    fireEvent.change(fields, {target: {value: '_rev\n'}})
    expect(fields.value).toBe('_rev\n')
    fireEvent.change(fields, {target: {value: '_rev\n meta.version , _key'}})
    await waitFor(() =>
      expect(getStoredState().historyDiff).toEqual({
        hiddenFields: ['_rev', 'meta.version', '_key'],
      }),
    )

    fireEvent.click(reset)
    expect(fields.value).toBe('_rev\n_updatedAt\n_system.base.rev')
    await waitFor(() =>
      expect(getStoredState().historyDiff.hiddenFields).toEqual([
        '_rev',
        '_updatedAt',
        '_system.base.rev',
      ]),
    )
  })

  it('opens the phone drawer as a modal dialog: focus moves in, and back to the opener on Escape', async () => {
    // Without a measured root the layout follows the viewport; a phone one floats the drawer
    const {innerWidth} = window
    Object.defineProperty(window, 'innerWidth', {configurable: true, value: 500})
    try {
      const {hide, show} = renderVista()
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

      // Leaving for another tool hides the drawer along with the tool but does not close it:
      // focus must not jump back to the rail, and coming back keeps the opener for later
      hide()
      expect(document.activeElement).not.toBe(opener)
      show()
      await waitFor(() => expect(document.activeElement).toBe(closeButton))

      fireEvent.keyDown(drawer, {key: 'Escape'})
      await waitFor(() => expect(screen.queryByTestId('vista-drawer-saved')).toBeNull())
      await waitFor(() => expect(document.activeElement).toBe(opener))
    } finally {
      Object.defineProperty(window, 'innerWidth', {configurable: true, value: innerWidth})
    }
  })

  it('keeps both panes of the main split at their minimum size, from the keyboard as well', async () => {
    renderVista()
    const split = await screen.findByTestId('vista-split')
    // The tab container's size gives the default share, the split's own its bounds
    resizeElement(screen.getByTestId('vista-query-tab'), {width: 1200, height: 700})
    resizeElement(split, {width: 1200, height: 700})
    const handle = screen.getByTestId('vista-split-handle')
    const requestPane = split.firstElementChild as HTMLElement

    // The request pane starts with half the width; the divider is a separator that says so and
    // can take neither pane below 280px
    expect(requestPane.style.flex).toBe('0 0 600px')
    expect(handle.getAttribute('role')).toBe('separator')
    expect(handle.getAttribute('aria-orientation')).toBe('vertical')
    expect(handle.getAttribute('aria-label')).toBe('vista.split.request-response')
    expect(handle.getAttribute('aria-valuenow')).toBe('600')
    expect(handle.getAttribute('aria-valuemin')).toBe('280')
    expect(handle.getAttribute('aria-valuemax')).toBe('919')
    expect(handle.getAttribute('tabindex')).toBe('0')

    // Arrow keys move the divider by a step, five with Shift; Home and End go to the bounds
    fireEvent.keyDown(handle, {key: 'ArrowRight'})
    expect(requestPane.style.flex).toBe('0 0 616px')
    fireEvent.keyDown(handle, {key: 'ArrowLeft', shiftKey: true})
    expect(requestPane.style.flex).toBe('0 0 536px')
    fireEvent.keyDown(handle, {key: 'End'})
    expect(requestPane.style.flex).toBe('0 0 919px')
    fireEvent.keyDown(handle, {key: 'Home'})
    expect(requestPane.style.flex).toBe('0 0 280px')
    expect(handle.getAttribute('aria-valuenow')).toBe('280')

    // Sized to 900px, then the container shrinks to 1000px: the response pane keeps its 280px
    // rather than the 100px the size would leave it...
    fireEvent.keyDown(handle, {key: 'End'})
    resizeElement(split, {width: 1200, height: 700})
    fireEvent.keyDown(handle, {key: 'ArrowLeft', shiftKey: true})
    expect(requestPane.style.flex).toBe('0 0 839px')
    resizeElement(split, {width: 1000, height: 700})
    expect(requestPane.style.flex).toBe('0 0 719px')
    expect(handle.getAttribute('aria-valuemax')).toBe('719')
    // ...and the chosen size comes back once there is room for it again
    resizeElement(split, {width: 1200, height: 700})
    expect(requestPane.style.flex).toBe('0 0 839px')
    // Enter goes back to the default share
    fireEvent.keyDown(handle, {key: 'Enter'})
    expect(requestPane.style.flex).toBe('0 0 600px')
  })
})
