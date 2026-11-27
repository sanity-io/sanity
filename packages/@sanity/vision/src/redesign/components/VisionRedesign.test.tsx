import {EditorState, type Extension} from '@codemirror/state'
import {ClientError, type LiveEvent, type SanityClient} from '@sanity/client'
import {LayerProvider, ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {ToastProvider} from '@sanity/ui/toast'
import {
  act,
  cleanup,
  createEvent,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import {
  Activity,
  type ReactNode,
  type RefAttributes,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react'
import {defer, type Observable, of, Subject} from 'rxjs'
import {type PerspectiveContextValue} from 'sanity'
import {
  type UpsellDataResult,
  type UpsellDialogProps,
  useScheduledDraftsEnabled,
} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver'
import {afterEach, beforeEach, describe, expect, it, onTestFinished, vi} from 'vitest'

import {
  VisionAgentActionInvoked,
  VisionApiVersionChanged,
  VisionClosedTabsSearched,
  VisionClosedTabUsed,
  VisionCopied,
  VisionDatasetChanged,
  VisionLintUsed,
  VisionParamsUsed,
  VisionPerspectiveChanged,
  VisionQueryPrettified,
  VisionQueryRun,
  VisionSavedQueriesFiltered,
  VisionSavedQueryUsed,
  VisionSharedTabsSearched,
  VisionSharedTabUsed,
  VisionShortcutUsed,
  VisionSnippetCopied,
  VisionTabsChanged,
  VisionTabUsed,
} from '../../__telemetry__/vision.telemetry'
import {editorContentPaddingTop, editorLineHeight} from '../../codemirror/editorMetrics'
import {type VisionCodeMirrorHandle} from '../../codemirror/VisionCodeMirror'
import visionLocaleStrings from '../../i18n/resources'
import {type VisionAiConfig} from '../../types'
import {QUERY_URL_SIZE_LIMIT} from '../../util/queryRequestMethod'
import {VISION_VERSION} from '../../version'
import {resetAiCredits} from '../hooks/useAiCredits'
import {
  createInitialState,
  DEFAULT_PARAMS,
  createTab,
  getVisionStorageKey,
  saveVisionState,
} from '../store/visionStorage'
import type * as groqLintModule from '../util/groqLint'
import {type QueryLintFinding} from '../util/groqLint'
import {parseQueryPaste} from '../util/parseQueryPaste'
import {queryEndSlotElement} from '../util/queryEndSlot'
import * as styles from './redesign.module.css'
import {QUERY_TAB_PANEL_ID} from './tabs/QueryTabBar'
import {VisionRedesign} from './VisionRedesign'

const telemetry = vi.hoisted(() => ({log: vi.fn()}))

vi.mock('@sanity/telemetry/react', () => ({
  useTelemetry: () => telemetry,
}))

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
    shareQuery: vi.fn((_query: {url: string; title?: string}) => Promise.resolve('shared-key')),
    updateSharedQuery: vi.fn((_query: {_key: string; url: string}) => Promise.resolve()),
    unshareQuery: vi.fn((_key: string) => Promise.resolve()),
    // What the mocked saved queries hook lists
    savedQueries: {queries: [] as unknown[]},
    // The workspace the tool runs in: variants on, as the tests of the variant option need
    workspace: {document: {drafts: {enabled: true}}, beta: {variants: {enabled: true}}},
    // The tool's router: its state as the URL gives it, and the navigations made
    router: {
      state: {} as {_searchParams?: [string, string][]},
      navigate: vi.fn(),
    },
  }
})

/** The studio's upsell infrastructure, as the AI credits upsell sees it */
const upsellMocks = vi.hoisted(() => ({
  /**
   * What the upsell content request settles to; an observable of its own per test, since react-rx
   * caches the answer by the observable's identity
   */
  content$: undefined as Observable<UpsellDataResult> | undefined,
  /** How often the content was requested */
  requests: 0,
  telemetryLogs: {
    dialogViewed: vi.fn(),
    dialogDismissed: vi.fn(),
    dialogPrimaryClicked: vi.fn(),
    dialogSecondaryClicked: vi.fn(),
    panelViewed: vi.fn(),
    panelDismissed: vi.fn(),
    panelPrimaryClicked: vi.fn(),
    panelSecondaryClicked: vi.fn(),
  },
}))

/** The content `/journey/ai-credits` answers with */
const UPSELL_CONTENT: UpsellDataResult = {
  upsellData: {
    _createdAt: '2026-10-01T00:00:00Z',
    _id: 'journey.ai-credits',
    _rev: 'rev-1',
    _type: 'journey',
    _updatedAt: '2026-10-01T00:00:00Z',
    id: 'ai-credits',
    image: null,
    descriptionText: [],
    ctaButton: {text: 'Upgrade to Growth', url: 'https://www.sanity.io/manage/plan'},
    secondaryButton: {text: 'About AI credits', url: 'https://www.sanity.io/docs/ai-credits'},
  },
  hasError: false,
}

/** The content request, answering with `result` and counting how often it was made */
function upsellContent(result: UpsellDataResult): Observable<UpsellDataResult> {
  return defer(() => {
    upsellMocks.requests++
    return of(result)
  })
}

/**
 * What the mocked editors report as their width, in characters, optionally depending on the
 * line count asked about; `undefined` means no layout
 */
const editorMocks = vi.hoisted(() => ({
  visibleColumns: undefined as number | ((lines: number | undefined) => number) | undefined,
}))

/** Reports lint findings for the shown query editor, as its linter would once it has run */
const lintMocks = vi.hoisted(() => ({
  report: undefined as ((findings: QueryLintFinding[]) => void) | undefined,
}))

vi.mock('../util/groqLint', async (importOriginal) => {
  const actual = await importOriginal<typeof groqLintModule>()
  return {
    ...actual,
    createGroqLintExtensions: (onFindings: (findings: QueryLintFinding[]) => void) => {
      lintMocks.report = onFindings
      return actual.createGroqLintExtensions(onFindings)
    },
  }
})

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
  return {
    usePerspective: () =>
      useSyncExternalStore(sanityMocks.subscribePerspective, sanityMocks.getPerspective),
    useClient: sanityMocks.useClient,
    useWorkspace: () => sanityMocks.workspace,
    useNumberFormat: () => new Intl.NumberFormat('en'),
    useCurrentUser: () => ({id: 'user-1'}),
    useDateTimeFormat: () => ({format: () => 'a date'}),
  }
})
vi.mock('sanity/i18n', () => ({
  InlineCode: ({children}: {children?: ReactNode}) => <code>{children}</code>,
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
}))

// Internals that Vision imports from the internals entry; mocked without the real barrel so the
// structure modules it re-exports do not load against the partial `sanity` mock above. The upsell
// content request and dialog are stood in for here too: a test can answer and read them back.
vi.mock('sanity/_dangerously_use_private_internals_that_do_not_follow_semver', async () => {
  const {of} = await import('rxjs')
  // The project store's organization ID, stable like the real store's
  const organizationId$ = of('org-1')
  return {
    useProjectStore: () => ({getOrganizationId: () => organizationId$}),
    getReleaseIdFromReleaseDocumentId: (id: string) => id.replace(/^_.releases./, ''),
    UserAvatar: () => null,
    ReleaseAvatarIcon: () => null,
    useActiveReleases: vi.fn(() => ({data: [], loading: false})),
    useScheduledDraftsEnabled: vi.fn(() => false),
    defineLocalesResources: (_namespace: string, resources: unknown) => resources,
    VARIANTS_STUDIO_CLIENT_OPTIONS: {apiVersion: 'v2025-08-18'},
    RELEASES_STUDIO_CLIENT_OPTIONS: {apiVersion: '2025-02-19'},
    isCardinalityOneRelease: () => false,
    sortReleases: <T,>(releases: T[]) => releases,
    getVariantTitle: (variant: {title?: string}) => variant.title,
    getDefaultVariant: <T,>(selected?: readonly T[]) => selected?.[0],
    useKeyValueStore: () => ({getKey: vi.fn(), setKey: vi.fn()}),
    useWorkspaces: () => [
      {name: 'default', title: 'Test', projectId: 'test-project', dataset: 'test'},
      {name: 'staging', title: 'Staging', projectId: 'test-project', dataset: 'staging'},
    ],
    ContextMenuButton: ({tooltipProps, ...props}: {tooltipProps?: {content?: string}}) => (
      <button data-tooltip={tooltipProps?.content} type="button" {...props} />
    ),
    NO_UPSELL_DATA: {upsellData: null, hasError: false},
    useUpsellData: () => ({
      upsellData$: upsellMocks.content$,
      telemetryLogs: upsellMocks.telemetryLogs,
    }),
    UpsellDialog: ({data, onClose, onPrimaryClick, onSecondaryClick}: UpsellDialogProps) =>
      data ? (
        <div aria-label={data.id} data-testid="upsell-dialog" role="dialog">
          <a href={data.ctaButton.url} onClick={onPrimaryClick}>
            {data.ctaButton.text}
          </a>
          <a href={data.secondaryButton.url} onClick={onSecondaryClick}>
            {data.secondaryButton.text}
          </a>
          <button data-testid="upsell-dialog-close" onClick={onClose} type="button">
            Close
          </button>
        </div>
      ) : null,
  }
})
vi.mock('sanity/_dangerously_use_private_internals_that_do_not_follow_semver-1', () => ({
  STUDIO_RESIZE_TRANSITION_TYPE: 'sanity-studio-resize',
  STUDIO_SKIP_TRANSITION_TYPE: 'sanity-studio-skip',
  useSchema: () => undefined,
}))

vi.mock('sanity/router', () => ({
  IntentLink: ({children}: {children: ReactNode}) => <a href="#intent">{children}</a>,
  useRouter: () => sanityMocks.router,
}))

vi.mock('../../hooks/useSavedQueries', () => ({
  useSavedQueries: () => ({
    queries: sanityMocks.savedQueries.queries,
    sharedQueriesLoaded: true,
    shareQuery: sanityMocks.shareQuery,
    updateSharedQuery: sanityMocks.updateSharedQuery,
    unshareQuery: sanityMocks.unshareQuery,
    saving: false,
    error: undefined,
  }),
}))

vi.mock('../../components/ResultView', () => ({
  ResultView: ({data}: {data: unknown}) => (
    <pre data-testid="result-json">{JSON.stringify(data)}</pre>
  ),
}))

vi.mock('./response/documentList/DocumentListView', () => ({
  DocumentListView: ({
    parsed,
  }: {
    parsed: {ok: true; documents: {_id: string}[]} | {ok: false; problem: {kind: string}}
  }) => (
    <div data-testid="vision-document-list-mock">
      {parsed.ok ? parsed.documents.map((document) => document._id).join(',') : parsed.problem.kind}
    </div>
  ),
}))

vi.mock('../../codemirror/VisionCodeMirror', () => ({
  VisionCodeMirror: function VisionCodeMirrorMock({
    initialValue,
    onChange,
    extensions,
    ref,
  }: {
    initialValue?: string
    onChange?: (value: string) => void
    extensions?: Extension[]
  } & RefAttributes<VisionCodeMirrorHandle>) {
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    // The slot the real editor shows under the query's last line goes after the textarea
    const slot = EditorState.create({extensions}).facet(queryEndSlotElement)
    const queryEndRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
      const container = queryEndRef.current
      if (!slot || !container) return undefined
      container.append(slot)
      return () => slot.remove()
    }, [slot])
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
      reformat: (formatted: string) => {
        if (textareaRef.current) textareaRef.current.value = formatted
        onChange?.(formatted)
      },
      isEditing: () => false,
    }))
    return (
      <>
        <textarea
          // The class of the real editor's content element, which the focus is moved into
          className="cm-content"
          data-testid="codemirror-mock"
          defaultValue={initialValue}
          onChange={(event) => onChange?.(event.target.value)}
          ref={textareaRef}
        />
        <div ref={queryEndRef} />
      </>
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
const STORAGE_KEY = getVisionStorageKey(PROJECT_ID)
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
  // The Response panel's sync tag lookup, apart from the fetches of the query itself
  const syncTagLookupCalls: FetchCall[] = []
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
        if (options?.tag === 'vision.sync-tags') {
          syncTagLookupCalls.push({config, query, params, options})
          return Promise.resolve({result: 0, syncTags: [], ms: 1})
        }
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
    syncTagLookupCalls,
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

function renderRedesign(
  perspective: PerspectiveContextValue = BASE_PERSPECTIVE,
  {ai}: {ai?: VisionAiConfig} = {},
) {
  const mockClient = createMockClient()
  sanityMocks.setPerspective(perspective)
  sanityMocks.useClient.mockReturnValue(mockClient.client)

  // Inside an Activity boundary, as the studio keeps recent tools mounted (`reactActivityMode`)
  const ui = (mode: 'visible' | 'hidden') => (
    <ThemeProvider theme={theme}>
      <ToastProvider>
        <LayerProvider>
          <Activity mode={mode}>
            <VisionRedesign
              config={{defaultApiVersion: '2025-02-19', ai}}
              datasets={DEFAULTS.datasets}
              projectId={PROJECT_ID}
              defaultDataset="test"
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
    setPerspective: (next: PerspectiveContextValue) => {
      act(() => sanityMocks.setPerspective(next))
    },
    /** Hides the tool as leaving it for another tool does, keeping it mounted */
    hide: () => view.rerender(ui('hidden')),
    show: () => view.rerender(ui('visible')),
  }
}

/**
 * The shown query tab. Every open tab stays mounted, the others hidden, so a query for an element
 * every tab renders is scoped to this one
 */
function shownTab(): HTMLElement {
  const tab = screen
    .getAllByTestId('vision-query-tab')
    .find((candidate) => !candidate.closest('[style*="display: none"]'))
  if (!tab) throw new Error('No query tab is shown')
  return tab
}

interface ViewTransitionCall {
  update?: () => unknown
  types?: string[]
}

/**
 * A browser's view transitions, which jsdom lacks, so React takes the path it takes in a browser:
 * the update runs on the next microtask and the animations end at once. `onPicture` is called where
 * the browser pictures the page: as the transition starts (the old state) and once its update has
 * run (the new state). Returns the `document.startViewTransition` spy, whose calls carry the
 * transition types
 */
function stubViewTransitions(onPicture?: (state: 'old' | 'new') => void) {
  const root = document.documentElement
  const startViewTransition = vi.fn((options: ViewTransitionCall) => {
    onPicture?.('old')
    const updateCallbackDone = (async () => {
      await Promise.resolve()
      await options.update?.()
      onPicture?.('new')
    })()
    const ready = updateCallbackDone.then(() => undefined)
    return {updateCallbackDone, ready, finished: ready, skipTransition: () => {}}
  })
  const stubs: [object, string, unknown][] = [
    [document, 'startViewTransition', startViewTransition],
    [document, 'fonts', {status: 'loaded', ready: Promise.resolve()}],
    [root, 'getAnimations', () => []],
    [root, 'animate', () => ({cancel: () => {}, finished: Promise.resolve()})],
  ]
  for (const [target, key, value] of stubs) {
    Object.defineProperty(target, key, {configurable: true, value})
  }
  onTestFinished(() => {
    for (const [target, key] of stubs) Reflect.deleteProperty(target, key)
  })
  return startViewTransition
}

function getQueryEditor(): HTMLTextAreaElement {
  return within(within(shownTab()).getByTestId('vision-query-editor')).getByTestId(
    'codemirror-mock',
  ) as HTMLTextAreaElement
}

/** The keys of the Copy shortcut, Cmd/Ctrl+Shift+C (`mod` is Ctrl in jsdom) */
const COPY_KEYS = {key: 'c', ctrlKey: true, shiftKey: true, which: 67, keyCode: 67}
/** The keys of the Format shortcut, Cmd/Ctrl+Shift+P */
const FORMAT_KEYS = {key: 'p', ctrlKey: true, shiftKey: true, which: 80, keyCode: 80}
/** The New tab keys browsers leave to the page, Cmd/Ctrl+Alt+N */
const NEW_TAB_KEYS = {key: 'n', ctrlKey: true, altKey: true, which: 78, keyCode: 78}
/** The Close tab keys browsers leave to the page, Cmd/Ctrl+Alt+W */
const CLOSE_TAB_KEYS = {key: 'w', ctrlKey: true, altKey: true, which: 87, keyCode: 87}
/** Ctrl+Tab, VS Code's key for the next tab */
const NEXT_TAB_KEYS = {key: 'Tab', ctrlKey: true, which: 9, keyCode: 9}

/** The shown tab's params JSON editor */
function getParamsEditor(): HTMLTextAreaElement {
  return within(within(shownTab()).getByTestId('vision-params-editor')).getByTestId(
    'codemirror-mock',
  ) as HTMLTextAreaElement
}

function typeQuery(query: string) {
  fireEvent.change(getQueryEditor(), {target: {value: query}})
}

/** Asks the generate query bar for a query */
function generateFrom(description: string) {
  fireEvent.click(screen.getByTestId('vision-generate-query'))
  fireEvent.change(screen.getByTestId('vision-generate-request'), {target: {value: description}})
  fireEvent.click(screen.getByTestId('vision-generate-submit'))
}

function editFrom(description: string) {
  fireEvent.click(screen.getByTestId('vision-edit-query'))
  fireEvent.change(screen.getByTestId('vision-edit-request'), {target: {value: description}})
  fireEvent.click(screen.getByTestId('vision-edit-submit'))
}

/** Shows results as the tree, which renders them as text the tests can read */
function preferTreeView() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({version: 1, panels: {resultViewer: 'tree'}}))
}

/** Clicks a menu button, and returns the open menu among the mounted copies of `menuTestId` */
async function openMenu(buttonTestId: string, menuTestId: string): Promise<HTMLElement> {
  fireEvent.click(screen.getByTestId(buttonTestId))
  let menu: HTMLElement | undefined
  await waitFor(() => {
    menu = screen
      .getAllByTestId(menuTestId)
      .find((candidate) => !candidate.closest('[style*="display: none"]'))
    expect(menu).toBeTruthy()
  })
  return menu as HTMLElement
}

/** Opens the result header's "More actions" menu */
function openExportMenu(): Promise<HTMLElement> {
  return openMenu('vision-result-menu-button', 'vision-result-menu')
}

/** Picks a result view from the result header's view dropdown */
async function pickResultView(view: string) {
  const menu = await openMenu('vision-result-view-button', 'vision-result-view-menu')
  fireEvent.click(within(menu).getByTestId(`vision-result-view-${view}`))
}

/** Picks JSON or Form from the params header's view dropdown */
async function pickParamsView(view: 'json' | 'form') {
  const menu = await openMenu('vision-params-view-button', 'vision-params-view-menu')
  fireEvent.click(within(menu).getByTestId(`vision-params-view-${view}`))
}

function isItemDisabled(element: HTMLElement): boolean {
  return isDisabled(element) || element.getAttribute('aria-disabled') === 'true'
}

function getStoredState() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
}

/** A personal saved query of a request to the `staging` dataset on the `published` perspective */
function personalSavedQuery(key: string, title: string, query: string, savedAt: string) {
  const search = new URLSearchParams({query, perspective: 'published'})
  return {
    _key: key,
    shared: false,
    title,
    url: `https://${PROJECT_ID}.api.sanity.io/v2025-02-19/data/query/staging?${search}`,
    savedAt,
  }
}

/** A shared query on the same request, as the saved queries hook lists `vision.sharedQuery` documents */
function sharedSavedQuery(key: string, title: string, query: string, own: boolean) {
  return {
    ...personalSavedQuery(key, title, query, '2026-01-01T00:00:00Z'),
    shared: true,
    authorId: own ? 'user-1' : 'user-2',
    isOwnedByCurrentUser: own,
  }
}

/** Stores one tab on the request of `personalSavedQuery`, shared as `sharedId`, before rendering */
function storeTabSharedAs(sharedId: string, title: string, query: string) {
  const initial = createInitialState(DEFAULTS)
  const tab = createTab(initial.settings, {
    id: 'shared-tab',
    title,
    query,
    options: {
      datasetMode: 'override',
      dataset: 'staging',
      apiVersion: 'v2025-02-19',
      perspective: 'published',
      variant: 'none',
    },
    sharedId,
  })
  saveVisionState(PROJECT_ID, {...initial, tabs: [tab], activeTabId: tab.id})
}

/** Opens the menu of a drawer item, by the id of the button that opens it */
async function openMenuOfButton(id: string): Promise<HTMLElement> {
  fireEvent.click(document.getElementById(id) as HTMLElement)
  let menu: HTMLElement | null = null
  await waitFor(() => {
    menu = document.querySelector<HTMLElement>(`[aria-labelledby="${id}"]`)
    expect(menu).toBeTruthy()
  })
  return menu as unknown as HTMLElement
}

/** Opens the menu of a query in the Shared tabs drawer, which names its button by the query's key */
function openDrawerItemMenu(key: string): Promise<HTMLElement> {
  return openMenuOfButton(`vision-saved-query-menu-${key}`)
}

/** Opens the menu of a tab in the Restore tabs drawer, which names its button by the tab's id */
function openClosedTabMenu(id: string): Promise<HTMLElement> {
  return openMenuOfButton(`vision-closed-tab-menu-${id}`)
}

function menuItemLabels(menu: HTMLElement): string[] {
  return within(menu)
    .getAllByRole('menuitem', {hidden: true})
    .map((menuItem) => text(menuItem))
}

/** Switches the Content Source Map features on in the stored settings, before rendering */
function enableSourceMaps(response: Record<string, unknown> = {}) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...getStoredState(),
      version: 1,
      response: {sourceMapEnabled: true, ...response},
    }),
  )
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

/** Picks a dataset in the Options panel's dataset menu */
function pickDataset(dataset: string) {
  fireEvent.click(screen.getByTestId('vision-option-dataset-select'))
  fireEvent.click(screen.getByTestId(`vision-option-dataset-item-${dataset}`))
}

/** Picks an item in one of the Options or Settings menus. The id is the trigger's test id. */
function pickMenuItem(selectTestId: string, item: string) {
  const id = selectTestId.replace(/-select$/, '')
  fireEvent.click(screen.getByTestId(selectTestId))
  fireEvent.click(screen.getByTestId(`${id}-item-${item}`))
}

/** The request column shows one tab at a time; Params is the one open at first */
function openRequestTab(id: 'params' | 'options' | 'lint' | 'functions') {
  fireEvent.click(document.getElementById(`vision-request-${id}-tab`) as HTMLElement)
}

/**
 * The response Agent Actions give once the organization has used all its AI credits: by default
 * for a spending limit the organization set, or for the quota its plan includes
 */
function limitError(reasonCode = 'default_budget_limit_reached'): ClientError {
  return new ClientError({
    statusCode: 429,
    statusMessage: 'Too Many Requests',
    headers: {},
    body: {
      statusCode: 429,
      error: 'MeteringLimitReached',
      message: 'The organization has used all its AI credits',
      reasonCode,
      usageValue: 100,
      quota: 100,
    },
    url: 'https://test.api.sanity.io/vX/agent/action/prompt',
    method: 'POST',
  })
}

/** Writes one patch in the Mutate panel, dry runs it and applies it */
async function applyPatchFromMutatePanel(
  respondToRequestsBy: ReturnType<typeof renderRedesign>['respondToRequestsBy'],
) {
  respondToRequestsBy((_url, options) =>
    options.query?.dryRun
      ? {
          results: [
            {id: 'a', operation: 'update', document: {_id: 'a', _type: 'post', title: 'New'}},
          ],
        }
      : {transactionId: 'tx-1', results: [{id: 'a', operation: 'update'}]},
  )
  fireEvent.click(screen.getByTestId('vision-sidebar-mutate'))
  fireEvent.change(within(screen.getByTestId('vision-mutate-editor')).getByRole('textbox'), {
    target: {value: '[{"patch": {"id": "a", "set": {"title": "New"}}}]'},
  })
  fireEvent.click(screen.getByTestId('vision-mutate-preview'))
  await screen.findByTestId('vision-mutate-preview-result')
  fireEvent.click(screen.getByTestId('vision-mutate-apply'))
  await screen.findByTestId('vision-mutate-applied')
}

describe('VisionRedesign', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  beforeEach(() => {
    localStorage.clear()
    resetAiCredits()
    sanityMocks.setPerspective(BASE_PERSPECTIVE)
    sanityMocks.savedQueries = {queries: []}
    sanityMocks.router.state = {}
    sanityMocks.workspace = {document: {drafts: {enabled: true}}, beta: {variants: {enabled: true}}}
    editorMocks.visibleColumns = undefined
    upsellMocks.requests = 0
    upsellMocks.content$ = upsellContent(UPSELL_CONTENT)
  })

  it('starts with one empty tab and a disabled fetch button', () => {
    renderRedesign()

    expect(screen.getAllByTestId('vision-tab')).toHaveLength(1)
    expect(text(screen.getByTestId('vision-tab-button'))).toContain('vision.tabs.untitled')
    const fetchButton = screen.getByTestId('vision-fetch-button')
    expect(isDisabled(fetchButton)).toBe(true)
    expect(text(fetchButton)).toContain('action.query-execute')
    expect(
      within(screen.getByTestId('vision-query-actions')).getByTestId('vision-fetch-button'),
    ).toBe(fetchButton)
    // The result's controls sit in its header, and nothing is left below the panel
    const actions = screen.getByTestId('vision-result-actions')
    expect(screen.getByTestId('vision-result').contains(actions)).toBe(true)
    const copy = within(actions).getByTestId('vision-copy-result')
    expect(isDisabled(copy)).toBe(true)
    expect(isDisabled(within(actions).getByTestId('vision-result-menu-button'))).toBe(false)
    expect(text(screen.getByTestId('vision-result'))).toContain('vision.result.empty')
  })

  it('sets the empty result in the box of the query editor first line', () => {
    renderRedesign()
    const empty = within(screen.getByTestId('vision-result')).getByTestId('vision-result-empty')
    expect(empty.style.paddingTop).toBe(editorContentPaddingTop([], true))
    expect(empty.style.lineHeight).toBe(editorLineHeight)
  })

  it('turns Live on and off without fetching, with Fetch still fetching meanwhile', async () => {
    const {fetchCalls, liveEvents} = renderRedesign()
    const actions = screen.getByTestId('vision-query-actions')
    const live = within(actions).getByTestId('vision-auto-refetch')
    expect(text(live)).toBe('vision.live.button')
    expect(live.hasAttribute('data-live-status')).toBe(false)
    // Like Fetch, it needs something to fetch
    expect(isDisabled(live)).toBe(true)
    // It replaces the menu item
    fireEvent.click(screen.getByTestId('vision-query-menu-button'))
    expect(document.querySelectorAll('[data-testid="vision-auto-refetch"]')).toHaveLength(1)

    typeQuery('{"now": now()}')
    await waitFor(() => expect(isDisabled(live)).toBe(false))
    // Turning it on only starts listening: nothing is fetched and the result stays empty
    fireEvent.click(live)
    expect(text(live)).toBe('vision.live.stop')
    // Stop live shows at once, while the subscription is still connecting
    await waitFor(() => expect(live.getAttribute('data-live-status')).toBe('connecting'))
    act(() => {
      liveEvents.next({type: 'welcome'})
    })
    expect(live.getAttribute('data-live-status')).toBe('connected')
    await waitFor(() => expect(getStoredState().tabs[0].autoRefetch).toBe(true))
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(fetchCalls).toHaveLength(0)
    expect(text(screen.getByTestId('vision-result'))).toContain('vision.result.empty')

    // Fetch still fetches on demand, for results no document change touches, like now()
    fireEvent.click(screen.getByTestId('vision-fetch-button'))
    await waitFor(() => expect(fetchCalls).toHaveLength(1))
    expect(text(live)).toBe('vision.live.stop')
    fireEvent.click(document.getElementById('vision-response-history-tab') as HTMLElement)
    await waitFor(() => expect(screen.getAllByTestId('vision-history-entry')).toHaveLength(1))
    expect(text(screen.getByTestId('vision-history-entry'))).toContain(
      'vision.history.reason.manual',
    )

    // Turning it off fetches nothing either
    fireEvent.click(live)
    expect(text(live)).toBe('vision.live.button')
    await waitFor(() => expect(live.hasAttribute('data-live-status')).toBe(false))
    await waitFor(() => expect(getStoredState().tabs[0].autoRefetch).toBe(false))
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(fetchCalls).toHaveLength(1)
    // On again, after a fetch, it still leaves the shown result alone
    fireEvent.click(live)
    await waitFor(() => expect(getStoredState().tabs[0].autoRefetch).toBe(true))
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(fetchCalls).toHaveLength(1)
    expect(screen.getAllByTestId('vision-history-entry')).toHaveLength(1)
  })

  it('explains why Live is unavailable on an API version without sync tags', () => {
    const initial = createInitialState(DEFAULTS)
    // Sync tags arrived with v2021-03-25
    const tab = createTab(initial.settings, {id: 'old', options: {apiVersion: 'v2021-03-24'}})
    saveVisionState(PROJECT_ID, {...initial, tabs: [tab], activeTabId: 'old'})
    renderRedesign()

    const live = within(shownTab()).getByTestId('vision-auto-refetch')
    expect(isDisabled(live)).toBe(true)
    expect(live.hasAttribute('aria-pressed')).toBe(false)
    const wrapper = live.parentElement as HTMLElement
    expect(wrapper.getAttribute('role')).toBe('button')
    expect(wrapper.getAttribute('tabindex')).toBe('0')
    expect(wrapper.getAttribute('aria-disabled')).toBe('true')
    expect(describedBy(wrapper)).toBe('vision.query.auto-refetch.unsupported')
  })

  it('shows the query editor over the request tabs, with Params open and the fetch actions under them', async () => {
    renderRedesign()

    const queryEditor = screen.getByTestId('vision-query-editor')
    expect(queryEditor).toBeTruthy()
    const header = within(queryEditor).getByText('query.label')
    expect(header.closest('[data-ui="Label"]')?.getAttribute('aria-label')).toBe('query.label')
    expect(visionLocaleStrings['query.label']).toBe('Query')
    expect(screen.getByTestId('vision-params-editor')).toBeTruthy()
    expect(screen.queryByTestId('vision-options')).toBeNull()
    expect(screen.queryByTestId('vision-sidebar-lint')).toBeNull()
    expect(screen.queryByTestId('vision-sidebar-functions')).toBeNull()
    // The fetch actions stay under the tabbed panel
    const actions = screen.getByTestId('vision-query-actions')
    expect(within(actions).getByTestId('vision-api-version-button')).toBeTruthy()
    expect(within(actions).getByTestId('vision-fetch-button')).toBeTruthy()

    openRequestTab('options')
    expect(screen.getByTestId('vision-options')).toBeTruthy()
    expect(screen.queryByTestId('vision-params-editor')).toBeNull()
    expect(screen.getByTestId('vision-query-editor')).toBeTruthy()

    openRequestTab('lint')
    expect(screen.getByText('vision.lint.empty')).toBeTruthy()

    // Closing the panel unmounts the params editor. An edit still in the debounce is committed,
    // so the editor that comes back shows it
    openRequestTab('params')
    const paramsEditor = () =>
      within(screen.getByTestId('vision-params-editor')).getByTestId(
        'codemirror-mock',
      ) as HTMLTextAreaElement
    fireEvent.change(paramsEditor(), {target: {value: '{"id": "pending"}'}})
    fireEvent.click(screen.getByTestId('vision-request-panel-toggle'))
    expect(screen.queryByTestId('vision-params-editor')).toBeNull()
    await waitFor(() => expect(getStoredState().tabs[0].rawParams).toBe('{"id": "pending"}'))
    fireEvent.click(screen.getByTestId('vision-request-panel-toggle'))
    expect(paramsEditor().value).toBe('{"id": "pending"}')
  })

  it('edits the params in the form inferred from the query', async () => {
    const {fetchCalls, unmount} = renderRedesign()
    const paramsEditor = () =>
      within(screen.getByTestId('vision-params-editor')).getByTestId(
        'codemirror-mock',
      ) as HTMLTextAreaElement
    const formInput = (name: string) =>
      screen.getByTestId(`vision-params-form-${name}`).querySelector('input') as HTMLInputElement

    typeQuery('*[_type == $type][0...$limit]')
    // An edit still waiting in the debounce comes along to the form
    fireEvent.change(paramsEditor(), {target: {value: '{"limit": 3}'}})
    await pickParamsView('form')
    expect(screen.queryByTestId('vision-params-editor')).toBeNull()
    expect(formInput('limit').value).toBe('3')
    expect(text(screen.getByTestId('vision-params-form-limit-type'))).toBe(
      'vision.params-form.type-detail',
    )

    fireEvent.change(formInput('type'), {target: {value: 'author'}})
    fireEvent.click(screen.getByTestId('vision-fetch-button'))
    await waitFor(() => expect(fetchCalls).toHaveLength(1))
    expect(fetchCalls[0].params).toEqual({limit: 3, type: 'author'})
    await waitFor(() => expect(getStoredState().panels.paramsView).toBe('form'))

    unmount()
    renderRedesign()
    expect(formInput('type').value).toBe('author')
    // The editor shows what the form wrote
    await pickParamsView('json')
    expect(JSON.parse(paramsEditor().value)).toEqual({limit: 3, type: 'author'})
  })

  it('fetches on Enter in a params form field, as the fetch shortcut does', async () => {
    const {fetchCalls} = renderRedesign()
    const formInput = (name: string) =>
      screen.getByTestId(`vision-params-form-${name}`).querySelector('input') as HTMLInputElement
    typeQuery('*[description match $description][0...$limit]')
    await pickParamsView('form')

    fireEvent.change(formInput('description'), {target: {value: 'electric'}})
    // Enter that ends an IME composition belongs to the composition
    fireEvent.keyDown(formInput('description'), {key: 'Enter', isComposing: true})
    fireEvent.keyDown(formInput('description'), {key: 'Enter', keyCode: 229})
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(fetchCalls).toHaveLength(0)

    const enter = createEvent.keyDown(formInput('description'), {key: 'Enter', keyCode: 13})
    fireEvent(formInput('description'), enter)
    expect(enter.defaultPrevented).toBe(true)
    await waitFor(() => expect(fetchCalls).toHaveLength(1))
    expect(fetchCalls[0].params).toEqual({description: 'electric'})

    fireEvent.change(formInput('limit'), {target: {value: '5'}})
    fireEvent.keyDown(formInput('limit'), {key: 'Enter', keyCode: 13})
    await waitFor(() => expect(fetchCalls).toHaveLength(2))
    expect(fetchCalls[1].params).toEqual({description: 'electric', limit: 5})

    // Mod+Enter stays the tool-wide shortcut, which fetches once
    fireEvent.keyDown(formInput('limit'), {key: 'Enter', ctrlKey: true, which: 13, keyCode: 13})
    await waitFor(() => expect(fetchCalls).toHaveLength(3))
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(fetchCalls).toHaveLength(3)

    fireEvent.click(document.getElementById('vision-response-history-tab') as HTMLElement)
    const reasons = screen.getAllByTestId('vision-history-entry').map((entry) => text(entry))
    expect(reasons).toHaveLength(3)
    for (const reason of reasons) expect(reason).toContain('vision.history.reason.shortcut')
  })

  it(
    'leaves the JSON params alone when the query editor blurs or idles',
    {timeout: 15_000},
    async () => {
      const {unmount} = renderRedesign()
      const paramsEditor = () =>
        within(screen.getByTestId('vision-params-editor')).getByTestId(
          'codemirror-mock',
        ) as HTMLTextAreaElement

      fireEvent.change(paramsEditor(), {target: {value: '{\n  "limit": 3\n}'}})
      typeQuery('*[_type == $type][0...$limit]')
      await waitFor(() =>
        expect(getStoredState().tabs[0].query).toBe('*[_type == $type][0...$limit]'),
      )
      fireEvent.focusOut(getQueryEditor())
      // Longer than the query used to have to be idle before its params were written
      await new Promise((resolve) => setTimeout(resolve, 3_500))

      expect(paramsEditor().value).toBe('{\n  "limit": 3\n}')
      expect(getStoredState().tabs[0].rawParams).toBe('{\n  "limit": 3\n}')

      unmount()
    },
  )

  it('shows a params syntax error under the editor and marks the Params tab', async () => {
    const {unmount} = renderRedesign()
    const paramsTab = () => document.getElementById('vision-request-params-tab') as HTMLElement
    const editorRoot = screen.getByTestId('vision-params-editor')
    expect(paramsTab().getAttribute('data-tone')).toBeNull()

    fireEvent.change(within(editorRoot).getByTestId('codemirror-mock'), {
      target: {value: '{"limit": '},
    })
    const error = await screen.findByTestId('vision-params-error')
    // After the editor, so the editor does not move when the error appears
    expect(editorRoot.lastElementChild).toBe(error)
    await waitFor(() => expect(paramsTab().getAttribute('data-tone')).toBe('critical'))

    fireEvent.change(within(editorRoot).getByTestId('codemirror-mock'), {
      target: {value: '{"limit": 1}'},
    })
    await waitFor(() => expect(screen.queryByTestId('vision-params-error')).toBeNull())
    expect(paramsTab().getAttribute('data-tone')).toBeNull()

    unmount()
  })

  it('fetches the raw response, shows its metadata and records the history', async () => {
    preferTreeView()
    const {fetchCalls, syncTagLookupCalls} = renderRedesign()

    typeQuery('*[_type == "author"]')
    await waitFor(() => expect(isDisabled(screen.getByTestId('vision-fetch-button'))).toBe(false))
    expect(text(screen.getByTestId('vision-tab-button'))).toContain('author')
    expect(syncTagLookupCalls).toHaveLength(0)

    fireEvent.click(screen.getByTestId('vision-fetch-button'))

    await waitFor(() => expect(screen.getByTestId('result-json')).toBeTruthy())
    expect(fetchCalls).toHaveLength(1)
    expect(fetchCalls[0]).toMatchObject({
      query: '*[_type == "author"]',
      params: {},
      options: {filterResponse: false, tag: 'vision'},
      // New tabs follow the workspace dataset and the navbar perspective (published here)
      config: {apiVersion: 'v2025-02-19', dataset: 'test', perspective: 'published'},
    })
    expect(text(screen.getByTestId('result-json'))).toContain('[{"title":"Variant title"}]')

    expect(text(screen.getByTestId('vision-meta-execution'))).toContain('12ms')
    expect(text(screen.getByTestId('vision-meta-sync-tags'))).toContain('s1:abc')
    // Sync tags are resolved without being asked, as the setting is on for a new user
    expect(screen.getByTestId('vision-meta-sync-tags-toggle').getAttribute('aria-pressed')).toBe(
      'true',
    )
    await waitFor(() => expect(syncTagLookupCalls.length).toBeGreaterThan(0))
    expect(syncTagLookupCalls[0].config).toMatchObject({dataset: 'test'})
    const url = new URL((screen.getByTestId('vision-query-url') as HTMLInputElement).value)
    expect(url.pathname).toBe('/v2025-02-19/data/query/test')
    expect(url.searchParams.get('query')).toBe('*[_type == "author"]')
    expect(url.searchParams.get('perspective')).toBe('published')

    fireEvent.click(document.getElementById('vision-response-history-tab') as HTMLElement)
    const entries = screen.getAllByTestId('vision-history-entry')
    expect(entries).toHaveLength(1)
    expect(text(entries[0])).toContain('vision.history.reason.manual')
  })

  it('tells in the history whether a refetch changed the result', async () => {
    preferTreeView()
    const {respondWith} = renderRedesign()
    typeQuery('*[_type == "author"]')
    await waitFor(() => expect(isDisabled(screen.getByTestId('vision-fetch-button'))).toBe(false))
    fireEvent.click(screen.getByTestId('vision-fetch-button'))
    await waitFor(() => expect(screen.getByTestId('result-json')).toBeTruthy())
    fireEvent.click(document.getElementById('vision-response-history-tab') as HTMLElement)

    fireEvent.click(screen.getByTestId('vision-fetch-button'))
    await waitFor(() => expect(screen.getAllByTestId('vision-history-entry')).toHaveLength(2))
    expect(text(screen.getAllByTestId('vision-history-entry')[0])).toContain(
      'vision.history.unchanged',
    )
    expect(screen.queryByTestId('vision-history-changes-toggle')).toBeNull()

    respondWith({result: [{title: 'Newer'}], ms: 34, syncTags: ['s1:abc']})
    fireEvent.click(screen.getByTestId('vision-fetch-button'))
    await waitFor(() => expect(screen.getAllByTestId('vision-history-entry')).toHaveLength(3))
    const [latest] = screen.getAllByTestId('vision-history-entry')
    expect(
      within(latest).getByTestId('vision-history-changes-toggle').getAttribute('aria-expanded'),
    ).toBe('false')
  })

  it('keeps the active request in the tool URL once typing settles, replacing the entry', async () => {
    renderRedesign()
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
    const {fetchCalls} = renderRedesign()

    await waitFor(() => expect(screen.getAllByTestId('vision-tab')).toHaveLength(2))
    expect(getQueryEditor().value).toBe('*[_type == "movie"]')
    await waitFor(() => expect(getStoredState()?.tabs).toHaveLength(2))
    expect(JSON.parse(getStoredState().tabs[1].rawParams)).toEqual({limit: 3})
    expect(getStoredState().tabs[1].options).toMatchObject({
      apiVersion: 'v2025-02-19',
      datasetMode: 'override',
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
    fireEvent.click(document.getElementById('vision-response-history-tab') as HTMLElement)
    expect(text(screen.getByTestId('vision-history-entry'))).toContain('vision.history.reason.link')
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(fetchCalls).toHaveLength(1)
  })

  it('keeps to the tab already showing the request a link names, without running it again', async () => {
    const first = renderRedesign()
    typeQuery('*[_type == "movie"]')
    await waitFor(() => expect(isDisabled(screen.getByTestId('vision-fetch-button'))).toBe(false))
    fireEvent.click(screen.getByTestId('vision-fetch-button'))
    await waitFor(() => expect(first.fetchCalls).toHaveLength(1))
    const activeUrl = (screen.getByTestId('vision-query-url') as HTMLInputElement).value
    first.unmount()

    // A reload: the address still names the restored tab's own request, as a bookmark of it would
    sanityMocks.router.state = {_searchParams: [['url', activeUrl]]}
    const second = renderRedesign()

    await waitFor(() => expect(getQueryEditor().value).toBe('*[_type == "movie"]'))
    expect(screen.getAllByTestId('vision-tab')).toHaveLength(1)
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(second.fetchCalls).toHaveLength(0)
  })

  it('shows the query plan and an explanation of the query in the Explain panel', async () => {
    const {promptCalls, replyToPrompts, requestCalls, respondToRequests} = renderRedesign()
    const plan =
      'Pipeline {\n  r1: StreamStep {\n    $0: Fetch {Filter: (_type == "post")}\n  }\n  r2: FilterStep {\n    Source: r1, Expr: eq($1.name, "x")\n  }\n}'
    respondToRequests({result: [], explain: plan})
    replyToPrompts({
      summary: 'It fetches every post.\n\nThe filter `_type == "post"` is applied while reading.',
      verdict: 'performant',
      verdictReason: 'The index does the work.',
      suggestions: [],
      details: 'The Fetch reads posts.\n\nA FilterStep compares names.',
    })

    fireEvent.click(document.getElementById('vision-response-explain-tab') as HTMLElement)
    expect(isDisabled(screen.getByTestId('vision-explain-button'))).toBe(true)
    expect(text(screen.getByTestId('vision-explain'))).toContain('vision.explain.empty')

    typeQuery('*[_type == "post"]')
    await waitFor(() => expect(isDisabled(screen.getByTestId('vision-explain-button'))).toBe(false))
    fireEvent.click(screen.getByTestId('vision-explain-plan-button'))
    await waitFor(() => expect(screen.getByTestId('vision-query-plan')).toBeTruthy())
    expect(text(screen.getByTestId('vision-query-plan'))).toContain(
      'Fetch {Filter: (_type == "post")}',
    )
    // What stands out in it: the filter evaluated in memory
    expect(text(screen.getByTestId('vision-plan-insight'))).toContain(
      'vision.explain.insight.filter-in-memory',
    )
    expect(text(screen.getByTestId('vision-plan-insight'))).toContain('eq($1.name, "x")')
    expect(new URL(requestCalls[0].options.url, 'https://x.io').searchParams.get('explain')).toBe(
      'true',
    )

    // The explanation reuses the plan it already has
    fireEvent.click(screen.getByTestId('vision-explain-button'))
    await waitFor(() => expect(screen.getByTestId('vision-explanation')).toBeTruthy())
    expect(requestCalls).toHaveLength(1)
    expect(promptCalls[0].config.apiVersion).toBe('vX')
    expect(promptCalls[0].request).toMatchObject({instructionParams: {plan}})
    // The plain explanation leads, then the verdict
    const summary = screen.getByTestId('vision-explanation-summary')
    expect(
      [...summary.querySelectorAll('[data-ui="Text"]')].map((paragraph) => paragraph.textContent),
    ).toEqual(['It fetches every post.', 'The filter _type == "post" is applied while reading.'])
    // Quoted GROQ is shown as code
    expect(summary.querySelector('code')?.textContent).toBe('_type == "post"')
    expect(text(screen.getByTestId('vision-explain-verdict'))).toBe(
      'vision.explain.verdict.performantThe index does the work.',
    )
    // The verdict says the query is fast, so the warning that the filter gets slow is gone
    expect(screen.queryByTestId('vision-plan-insight')).toBeNull()
    expect(screen.queryByText('vision.explain.insights.guide')).toBeNull()
    // The technical walkthrough waits behind a toggle
    expect(screen.queryByTestId('vision-explanation-details')).toBeNull()
    const details = screen.getByTestId('vision-explanation-details-toggle')
    expect(details.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(details)
    expect(details.getAttribute('aria-expanded')).toBe('true')
    expect(text(screen.getByTestId('vision-explanation-details'))).toBe(
      'The Fetch reads posts.A FilterStep compares names.',
    )

    // Both belong to the query they were made for
    typeQuery('*[_type == "author"]')
    await waitFor(() => expect(screen.queryByTestId('vision-explanation')).toBeNull())
    expect(screen.queryByTestId('vision-query-plan')).toBeNull()
  })

  describe('the explanation verdict', () => {
    /** Explains a query with the given reply from Agent Actions, and waits for the explanation */
    async function explain(view: ReturnType<typeof renderRedesign>, reply: unknown) {
      view.respondToRequests({result: [], explain: 'Pipeline {}'})
      view.replyToPrompts(reply)
      typeQuery('*[_type == "post"]')
      fireEvent.click(document.getElementById('vision-response-explain-tab') as HTMLElement)
      await waitFor(() =>
        expect(isDisabled(screen.getByTestId('vision-explain-button'))).toBe(false),
      )
      fireEvent.click(screen.getByTestId('vision-explain-button'))
      return screen.findByTestId('vision-explanation')
    }

    it.each([
      ['performant', 'positive'],
      ['cannot-improve', 'neutral'],
      ['improvable', 'caution'],
    ] as const)('shows the %s verdict', async (verdict, tone) => {
      const view = renderRedesign()
      await explain(view, {
        summary: 'It finds posts.',
        verdict,
        verdictReason: 'Because.',
        suggestions: verdict === 'improvable' ? ['Add a slice.'] : [],
        details: '',
      })
      const card = screen.getByTestId('vision-explain-verdict')
      expect(card.getAttribute('data-verdict')).toBe(verdict)
      expect(card.getAttribute('data-tone')).toBe(tone)
      expect(text(card)).toBe(`vision.explain.verdict.${verdict}Because.`)
      // Nothing to show for the plan's detail without a walkthrough
      expect(screen.queryByTestId('vision-explanation-details-toggle')).toBeNull()
    })

    it.each([
      ['performant', 'positive', 'vision.explain.insight.index-sort-limit', false],
      [
        'cannot-improve',
        'neutral',
        'vision.explain.insight.filter-in-memory.cannot-improve',
        false,
      ],
      ['improvable', 'caution', 'vision.explain.insight.filter-in-memory', true],
    ] as const)(
      'does not let What stands out contradict a %s verdict',
      async (verdict, tone, message, guide) => {
        const view = renderRedesign()
        const plan = [
          'Pipeline {',
          '  r1: StreamStep {',
          '    $0: Fetch {',
          '      Sort: _createdAt desc',
          '      Limit: 10',
          '    }',
          '  }',
          '  r3: FilterStep {',
          '    Source: r2, Expr: eq($1.name, "x")',
          '  }',
          '}',
        ].join('\n')
        view.respondToRequests({result: [], explain: plan})
        view.replyToPrompts({
          summary: 'It finds books.',
          verdict,
          verdictReason: 'Because.',
          suggestions: [],
          details: '',
        })
        typeQuery('*[_type == "book"]')
        fireEvent.click(document.getElementById('vision-response-explain-tab') as HTMLElement)
        await waitFor(() =>
          expect(isDisabled(screen.getByTestId('vision-explain-button'))).toBe(false),
        )
        // No verdict yet: the heuristic stands, warning included
        fireEvent.click(screen.getByTestId('vision-explain-plan-button'))
        await waitFor(() => expect(screen.getByTestId('vision-query-plan')).toBeTruthy())
        const before = screen.getAllByTestId('vision-plan-insight')[0]
        expect(before.getAttribute('data-tone')).toBe('caution')
        expect(before.querySelector('[data-ui="Text"]')?.textContent).toBe(
          'vision.explain.insight.filter-in-memory',
        )
        expect(screen.getByText('vision.explain.insights.guide')).toBeTruthy()

        fireEvent.click(screen.getByTestId('vision-explain-button'))
        await screen.findByTestId('vision-explain-verdict')
        const [card] = screen.getAllByTestId('vision-plan-insight')
        expect(card.getAttribute('data-tone')).toBe(tone)
        expect(card.querySelector('[data-ui="Text"]')?.textContent).toBe(message)
        expect(card.textContent).not.toContain('gets slow')
        if (guide) {
          expect(screen.getByText('vision.explain.insights.guide')).toBeTruthy()
        } else {
          expect(screen.queryByText('vision.explain.insights.guide')).toBeNull()
        }
      },
    )

    it('offers no suggestions and no Improve query when there is nothing to change', async () => {
      const view = renderRedesign()
      await explain(view, {summary: 'It finds posts.', verdict: 'cannot-improve', suggestions: []})
      expect(screen.queryByTestId('vision-explain-suggestions')).toBeNull()
      expect(screen.queryByTestId('vision-improve-query')).toBeNull()
    })

    it('lists the suggestions and improves the query with them', async () => {
      const view = renderRedesign()
      const suggestions = ['Filter on `_type` before the join.', 'Add a slice such as `[0...10]`.']
      await explain(view, {
        summary: 'It finds posts.',
        verdict: 'improvable',
        verdictReason: 'It reads every post.',
        suggestions,
      })
      const list = screen.getByTestId('vision-explain-suggestions')
      expect(text(list)).toContain('vision.explain.suggestions.title')
      expect(
        within(list)
          .getAllByTestId('vision-explain-suggestion')
          .map((item) => item.tagName),
      ).toEqual(['LI', 'LI'])
      expect(
        within(list)
          .getAllByTestId('vision-explain-suggestion')
          .map((item) => item.textContent),
      ).toEqual(['1.Filter on _type before the join.', '2.Add a slice such as [0...10].'])
      // The button costs AI credits like the other Agent Actions controls
      expect(text(within(list).getByTestId('vision-improve-query-panel'))).toContain(
        'vision.explain.improve.description',
      )

      const improved = '*[_type == "post"][0...10]'
      view.replyToPrompts({query: improved, params: {}})
      fireEvent.click(within(list).getByTestId('vision-improve-query'))
      await waitFor(() => expect(getQueryEditor().value).toBe(improved))
      expect(view.promptCalls).toHaveLength(2)
      expect(view.promptCalls[1].config.apiVersion).toBe('vX')
      expect(view.promptCalls[1].request).toMatchObject({
        format: 'json',
        instructionParams: {
          query: '*[_type == "post"]',
          params: '{}',
          suggestions: '- Filter on `_type` before the join.\n- Add a slice such as `[0...10]`.',
        },
      })
      expect(String(view.promptCalls[1].request.instruction)).toContain('$suggestions')
      // Checked without running, then run as the new query
      await waitFor(() => expect(view.fetchCalls).toHaveLength(2))
      // The explanation was for the query that was there
      await waitFor(() => expect(screen.queryByTestId('vision-explanation')).toBeNull())
      // History keeps the explanation the improvement followed
      fireEvent.click(document.getElementById('vision-response-history-tab') as HTMLElement)
      const [entry] = screen.getAllByTestId('vision-history-entry')
      expect(text(entry)).toContain('vision.history.reason.ai.improve')
      expect(text(entry)).toContain('It finds posts.')
      expect(
        within(within(entry).getByTestId('vision-history-ai-suggestions'))
          .getAllByRole('listitem')
          .map((item) => item.textContent),
      ).toEqual(['1.Filter on _type before the join.', '2.Add a slice such as [0...10].'])
    })

    it('shows the verdict and suggestions but no Improve query with editQuery off', async () => {
      const view = renderRedesign(BASE_PERSPECTIVE, {ai: {editQuery: false}})
      await explain(view, {
        summary: 'It finds posts.',
        verdict: 'improvable',
        suggestions: ['Add a slice.'],
      })
      expect(screen.getByTestId('vision-explain-verdict').getAttribute('data-verdict')).toBe(
        'improvable',
      )
      expect(screen.getByTestId('vision-explain-suggestions')).toBeTruthy()
      expect(screen.queryByTestId('vision-improve-query')).toBeNull()
    })

    it('shows the error and keeps the suggestions when the improvement fails', async () => {
      const view = renderRedesign()
      await explain(view, {
        summary: 'It finds posts.',
        verdict: 'improvable',
        suggestions: ['Add a slice.'],
      })
      view.replyToPrompts(new Error('The model is unavailable'))
      fireEvent.click(screen.getByTestId('vision-improve-query'))
      const error = await screen.findByTestId('vision-improve-query-error')
      expect(text(error)).toContain('vision.explain.improve.failed')
      expect(text(error)).toContain('The model is unavailable')
      expect(getQueryEditor().value).toBe('*[_type == "post"]')
      expect(screen.getByTestId('vision-explain-suggestions')).toBeTruthy()
    })
  })

  it('runs the query in delta mode against two documents, typed in or loaded from the history', async () => {
    const {respondToRequestsBy, requestCalls} = renderRedesign()
    typeQuery('_type == "post" && delta::changedAny(title)')
    fireEvent.click(screen.getByTestId('vision-sidebar-delta'))
    const editorIn = (testId: string) =>
      within(screen.getByTestId(testId)).getByRole('textbox') as HTMLTextAreaElement
    expect(text(screen.getByTestId('vision-delta-result'))).toContain('vision.delta.empty')

    fireEvent.change(editorIn('vision-delta-before'), {
      target: {value: '{"_id": "a", "_type": "post", "title": "Old"}'},
    })
    fireEvent.change(editorIn('vision-delta-after'), {
      target: {value: '{"_id": "a", "_type": "post", "title": "New"}'},
    })
    await waitFor(() =>
      expect(text(screen.getByTestId('vision-delta-match'))).toBe('vision.delta.matches'),
    )
    expect(text(screen.getByTestId('vision-delta-operation'))).toBe('update')

    // An empty side is no document: the change creates it
    fireEvent.change(editorIn('vision-delta-before'), {target: {value: ''}})
    await waitFor(() => expect(text(screen.getByTestId('vision-delta-operation'))).toBe('create'))
    fireEvent.change(editorIn('vision-delta-before'), {target: {value: '{"_id": '}})
    expect(text(screen.getByTestId('vision-delta-result'))).toContain('vision.delta.invalid-before')

    // From the History API: the latest revision as After, the one before it as Before
    respondToRequestsBy((url) =>
      url.includes('/transactions/')
        ? '{"id":"r2","timestamp":"2026-10-15T10:00:00Z"}\n{"id":"r1","timestamp":"2026-10-14T10:00:00Z"}\n'
        : {documents: [{_id: 'a', _type: 'post', title: 'Same'}]},
    )
    fireEvent.change(screen.getByTestId('vision-delta-document-id'), {target: {value: 'a'}})
    fireEvent.click(screen.getByTestId('vision-delta-load'))
    await waitFor(() => expect(editorIn('vision-delta-after').value).toContain('"Same"'))
    expect(requestCalls.map((call) => call.options.url)).toEqual([
      '/v2025-02-19/data/history/test/transactions/a?excludeContent=true&reverse=true&limit=20',
      '/v2025-02-19/data/history/test/documents/a?revision=r2',
      '/v2025-02-19/data/history/test/documents/a?revision=r1',
    ])
    expect((screen.getByTestId('vision-delta-before-revision') as HTMLSelectElement).value).toBe(
      'r1',
    )
    // Nothing changed between the two, so the filter does not match
    await waitFor(() =>
      expect(text(screen.getByTestId('vision-delta-match'))).toBe('vision.delta.no-match'),
    )
  })

  it('applies mutations a dry run showed, to the tab’s dataset, without fetching the query again', async () => {
    preferTreeView()
    const {fetchCalls, documents, requestCalls, respondToRequestsBy, respondWith} = renderRedesign()
    typeQuery('*[_type == "post"]')
    fireEvent.click(screen.getByTestId('vision-fetch-button'))
    await waitFor(() => expect(fetchCalls).toHaveLength(1))
    await waitFor(() => expect(text(screen.getByTestId('result-json'))).toContain('Variant title'))

    // A refetch would show this; neither the dry run nor applying makes one
    respondWith({result: [{title: 'New'}], ms: 3, syncTags: ['s1:abc']})
    documents.set('a', {_id: 'a', _type: 'post', title: 'Old'})
    await applyPatchFromMutatePanel(respondToRequestsBy)

    expect(
      requestCalls.map(({options}) => [options.url, options.method, options.query?.dryRun]),
    ).toEqual([
      ['/v2025-02-19/data/mutate/test', 'POST', 'true'],
      ['/v2025-02-19/data/mutate/test', 'POST', undefined],
    ])
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(fetchCalls).toHaveLength(1)
    expect(text(screen.getByTestId('result-json'))).toContain('Variant title')
    expect(text(screen.getByTestId('result-json'))).not.toContain('New')
    fireEvent.click(document.getElementById('vision-response-history-tab') as HTMLElement)
    expect(screen.getAllByTestId('vision-history-entry')).toHaveLength(1)
  })

  it('leaves refetching after applied mutations to Live, through its listener', async () => {
    preferTreeView()
    const {
      fetchCalls,
      documents,
      liveEvents,
      liveSubscriptionCount,
      respondToRequestsBy,
      respondWith,
    } = renderRedesign()
    typeQuery('*[_type == "post"]')
    fireEvent.click(screen.getByTestId('vision-fetch-button'))
    await waitFor(() => expect(fetchCalls).toHaveLength(1))
    fireEvent.click(within(shownTab()).getByTestId('vision-auto-refetch'))
    await waitFor(() => expect(liveSubscriptionCount()).toBe(1))
    expect(fetchCalls).toHaveLength(1)

    respondWith({result: [{title: 'New'}], ms: 3, syncTags: ['s1:abc']})
    documents.set('a', {_id: 'a', _type: 'post', title: 'Old'})
    await applyPatchFromMutatePanel(respondToRequestsBy)
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(fetchCalls).toHaveLength(1)
    expect(text(screen.getByTestId('result-json'))).toContain('Variant title')

    // The change reaches the listener, which refetches
    act(() => {
      liveEvents.next({type: 'message', id: 'tx-1', tags: ['s1:abc']})
    })
    await waitFor(() => expect(fetchCalls).toHaveLength(2))
    await waitFor(() => expect(text(screen.getByTestId('result-json'))).toContain('New'))
    fireEvent.click(document.getElementById('vision-response-history-tab') as HTMLElement)
    const entries = screen.getAllByTestId('vision-history-entry')
    expect(entries).toHaveLength(2)
    expect(text(entries[0])).toContain('vision.history.reason.live')
    expect(text(entries[1])).toContain('vision.history.reason.manual')
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
      const {fetchCalls, documents, requestCalls, respondToRequestsBy, unmount} = renderRedesign()
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
      expect(registered[0].tool.title).toBe('vision.webmcp.get-state')
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

  it('orders the options in the DOM as they read, so tabbing follows the grid', () => {
    renderRedesign()
    openRequestTab('options')
    const grid = screen.getByTestId('vision-options-grid')
    const order = [
      'vision-option-api-version-select',
      'vision-option-dataset-select',
      'vision-option-perspective-select',
      'vision-option-variant-select',
      'vision-option-use-cdn',
      'vision-option-source-map',
    ]
    const rendered = [...grid.querySelectorAll<HTMLElement>('[data-testid]')]
      .map((element) => element.dataset.testid)
      .filter((testId): testId is string => order.includes(testId ?? ''))
    expect(rendered).toEqual(order.filter((testId) => rendered.includes(testId)))
    expect(rendered.slice(0, 3)).toEqual(order.slice(0, 3))
    expect(rendered).toContain('vision-option-use-cdn')
    // Tab order is DOM order only while nothing jumps the queue with a positive tabindex
    const tabbable = grid.querySelectorAll<HTMLElement>('select, input, button, [tabindex]')
    expect([...tabbable].filter((element) => element.tabIndex > 0)).toEqual([])
  })

  it('sends queries to the API CDN when asked, unless the perspective is one it does not serve', async () => {
    const {fetchCalls} = renderRedesign()
    typeQuery('*[_type == "post"]')
    openRequestTab('options')
    const perspectiveSelect = () =>
      screen.getByTestId('vision-option-perspective-select') as HTMLSelectElement
    const apiVersionButton = () => screen.getByTestId('vision-api-version-button')
    // Published, the default, which the CDN serves
    expect(perspectiveSelect().value).toBe('published')
    fireEvent.click(screen.getByTestId('vision-option-use-cdn'))
    expect(text(apiVersionButton())).toBe('vision.api-version.button-cdn:v2025-02-19')
    expect(screen.queryByTestId('vision-option-use-cdn-blocked')).toBeNull()
    await waitFor(() => expect(isDisabled(screen.getByTestId('vision-fetch-button'))).toBe(false))
    fireEvent.click(screen.getByTestId('vision-fetch-button'))
    await waitFor(() => expect(fetchCalls).toHaveLength(1))
    expect(fetchCalls[0].options).toMatchObject({useCdn: true})
    expect(fetchCalls[0].config.perspective).toBe('published')
    await waitFor(() => expect(getStoredState()?.tabs[0].options.useCdn).toBe(true))
    await waitFor(() =>
      expect((screen.getByTestId('vision-query-url') as HTMLInputElement).value).toMatch(
        /^https:\/\/test\.apicdn\.sanity\.io\//,
      ),
    )

    // The CDN serves no drafts: the query goes to the API, the option says why and offers the
    // published perspective, and the API version button warns about it
    pickMenuItem('vision-option-perspective-select', 'drafts')
    const notice = screen.getByTestId('vision-option-use-cdn-blocked')
    expect(text(notice)).toContain('vision.options.use-cdn.blocked.title')
    expect(text(notice)).toContain('vision.options.use-cdn.blocked')
    expect(text(apiVersionButton())).toBe('vision.api-version.button:v2025-02-19')
    expect(apiVersionButton().getAttribute('data-cdn-blocked')).toBe('true')
    fireEvent.click(screen.getByTestId('vision-fetch-button'))
    await waitFor(() => expect(fetchCalls).toHaveLength(2))
    expect(fetchCalls[1].options).toMatchObject({useCdn: false})

    // The button points at the notice and focuses its action, scrolling the whole notice into
    // view without the focus call scrolling the button alone
    const scrolled: Element[] = []
    Object.defineProperty(Element.prototype, 'scrollIntoView', {
      configurable: true,
      value(this: Element, arg?: boolean | ScrollIntoViewOptions) {
        expect(arg).toEqual({block: 'nearest'})
        scrolled.push(this)
      },
    })
    const focusSpy = vi.spyOn(HTMLElement.prototype, 'focus')
    try {
      fireEvent.click(apiVersionButton())
      const usePublished = screen.getByTestId('vision-option-use-cdn-blocked-use-published')
      await waitFor(() => expect(document.activeElement).toBe(usePublished))
      expect(focusSpy.mock.contexts).toContain(usePublished)
      expect(focusSpy.mock.calls[focusSpy.mock.contexts.indexOf(usePublished)]).toEqual([
        {preventScroll: true},
      ])
      expect(scrolled).toEqual([notice])
    } finally {
      focusSpy.mockRestore()
      Reflect.deleteProperty(Element.prototype, 'scrollIntoView')
    }
    fireEvent.click(screen.getByTestId('vision-option-use-cdn-blocked-use-published'))
    expect(perspectiveSelect().value).toBe('published')
    expect(screen.queryByTestId('vision-option-use-cdn-blocked')).toBeNull()
    expect(text(apiVersionButton())).toBe('vision.api-version.button-cdn:v2025-02-19')
    expect(apiVersionButton().getAttribute('data-cdn-blocked')).toBeNull()
  })

  it('keeps the functions a query declares in a library, to declare in other queries', async () => {
    renderRedesign()
    const declaration = 'fn ex::author($ref) = $ref->{name}'
    typeQuery(`${declaration};\n\n*[_type == "post"]{"author": ex::author(author)}`)

    // The Functions tab counts the declared functions
    const functionsTab = () =>
      document.getElementById('vision-request-functions-tab') as HTMLElement
    expect(text(functionsTab())).toContain('1')
    fireEvent.click(functionsTab())
    const functionsPanel = () =>
      document.getElementById('vision-request-functions-panel') as HTMLElement
    const [declared] = within(functionsPanel()).getAllByTestId('vision-declared-function')
    expect(text(declared)).toContain('ex::author($ref)')
    fireEvent.click(within(declared).getByTestId('vision-function-save'))
    expect(within(declared).getByTestId('vision-function-saved')).toBeTruthy()
    await waitFor(() =>
      expect(getStoredState()?.functions).toEqual([{id: 'ex::author', declaration}]),
    )

    // Another tab declares it from the library: the Functions tab stays open and shows that tab's
    fireEvent.click(screen.getByTestId('vision-new-tab'))
    typeQuery('*[_type == "book"]{"author": ex::author(author)}')
    expect(text(functionsTab())).not.toContain('1')
    expect(functionsPanel()).toBeTruthy()
    const [saved] = within(functionsPanel()).getAllByTestId('vision-library-function')
    fireEvent.click(within(saved).getByTestId('vision-function-add'))
    expect(getQueryEditor().value).toBe(
      `${declaration};\n\n*[_type == "book"]{"author": ex::author(author)}`,
    )
    expect(within(saved).getByTestId('vision-function-declared')).toBeTruthy()
    await waitFor(() =>
      expect(getStoredState()?.tabs[1].query).toBe(
        `${declaration};\n\n*[_type == "book"]{"author": ex::author(author)}`,
      ),
    )
  })

  it('shows the result as JSON text by default, copies it from the header, and remembers another view picked from the dropdown', async () => {
    const {respondWith} = renderRedesign()
    const result = {title: 'Copy me'}
    respondWith({result, ms: 3})
    typeQuery('*[_type == "post"]')
    await waitFor(() => expect(isDisabled(screen.getByTestId('vision-fetch-button'))).toBe(false))
    fireEvent.click(screen.getByTestId('vision-fetch-button'))
    const json = await screen.findByTestId('vision-result-json')
    const writeText = vi.fn(() => Promise.resolve())
    const clipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
    Object.defineProperty(navigator, 'clipboard', {value: {writeText}, configurable: true})

    try {
      expect((within(json).getByTestId('codemirror-mock') as HTMLTextAreaElement).value).toBe(
        JSON.stringify(result, null, 2),
      )
      expect(screen.queryByTestId('result-json')).toBeNull()
      // The view dropdown names the shown view, and the menu lists every view with it checked
      const viewButton = screen.getByTestId('vision-result-view-button')
      expect(text(viewButton)).toBe('vision.result.view.json')
      expect(viewButton.getAttribute('aria-controls')).toBe(json.id)
      expect(within(screen.getByTestId('vision-result')).queryAllByRole('tab')).toHaveLength(0)
      const viewMenu = await openMenu('vision-result-view-button', 'vision-result-view-menu')
      const views = within(viewMenu).getAllByRole('menuitemradio', {hidden: true})
      expect(views.map((view) => view.getAttribute('data-testid'))).toEqual([
        'vision-result-view-json',
        'vision-result-view-tree',
        'vision-result-view-graph',
        'vision-result-view-documents',
      ])
      expect(views.map((view) => view.getAttribute('aria-checked'))).toEqual([
        'true',
        'false',
        'false',
        'false',
      ])
      fireEvent.keyDown(viewMenu, {key: 'Escape'})
      await waitFor(() => expect(getStoredState()?.panels.resultViewer).toBe('json'))

      // Copy, the view dropdown and the "More actions" menu, in that order
      const actions = screen.getByTestId('vision-result-actions')
      expect(
        Array.from(actions.querySelectorAll('[data-testid]'), (el) =>
          el.getAttribute('data-testid'),
        ).filter((id) =>
          ['vision-result-view-button', 'vision-copy-result', 'vision-result-menu-button'].includes(
            id ?? '',
          ),
        ),
      ).toEqual(['vision-copy-result', 'vision-result-view-button', 'vision-result-menu-button'])
      const copy = within(actions).getByTestId('vision-copy-result')
      fireEvent.click(copy)
      await waitFor(() => expect(writeText).toHaveBeenCalledWith(JSON.stringify(result, null, 2)))
      // It confirms the copy itself rather than with a toast
      await waitFor(() => expect(copy.getAttribute('data-copied')).toBe('true'))
      expect(screen.queryByText('vision.result.copied')).toBeNull()

      await pickResultView('tree')
      expect(screen.getByTestId('result-json')).toBeTruthy()
      expect(screen.queryByTestId('vision-result-json')).toBeNull()
      expect(text(screen.getByTestId('vision-result-view-button'))).toBe('vision.result.view.tree')
      await waitFor(() => expect(getStoredState().panels.resultViewer).toBe('tree'))

      await pickResultView('graph')
      expect(screen.queryByTestId('result-json')).toBeNull()
      await waitFor(() => expect(getStoredState().panels.resultViewer).toBe('graph'))
    } finally {
      if (clipboard) Object.defineProperty(navigator, 'clipboard', clipboard)
      else Reflect.deleteProperty(navigator, 'clipboard')
    }
  })

  it('shows a document list result as JSON, and remembers Documents once it is picked', async () => {
    const {respondWith} = renderRedesign()
    respondWith({
      result: [
        {_id: 'a', _type: 'author', title: 'Ada'},
        {_id: 'drafts.b', title: 'Bea'},
      ],
      ms: 3,
    })
    typeQuery('*[_type == "author"]{_id, _type, title}')
    await waitFor(() => expect(isDisabled(screen.getByTestId('vision-fetch-button'))).toBe(false))
    fireEvent.click(screen.getByTestId('vision-fetch-button'))

    // The result's shape never picks the view
    await waitFor(() => expect(screen.getByTestId('vision-result-json')).toBeTruthy())
    expect(screen.queryByTestId('vision-document-list-mock')).toBeNull()
    expect(text(screen.getByTestId('vision-result-view-button'))).toBe('vision.result.view.json')

    await pickResultView('documents')
    expect(text(screen.getByTestId('vision-document-list-mock'))).toBe('a,drafts.b')
    await waitFor(() => expect(getStoredState().panels.resultViewer).toBe('documents'))

    // A new tab opens on the remembered view
    fireEvent.click(screen.getByTestId('vision-new-tab'))
    respondWith({result: [{_id: 'c', _type: 'author'}], ms: 3})
    typeQuery('*[_type == "author"]{_id, _type}')
    await waitFor(() =>
      expect(isDisabled(within(shownTab()).getByTestId('vision-fetch-button'))).toBe(false),
    )
    fireEvent.click(within(shownTab()).getByTestId('vision-fetch-button'))
    await waitFor(() =>
      expect(text(within(shownTab()).getByTestId('vision-document-list-mock'))).toBe('c'),
    )

    // Another view picked is remembered in its place
    fireEvent.click(within(shownTab()).getByTestId('vision-result-view-button'))
    let menu: HTMLElement | undefined
    await waitFor(() => {
      menu = screen
        .getAllByTestId('vision-result-view-menu')
        .find((candidate) => !candidate.closest('[style*="display: none"]'))
      expect(menu).toBeTruthy()
    })
    fireEvent.click(within(menu as HTMLElement).getByTestId('vision-result-view-tree'))
    await waitFor(() => expect(within(shownTab()).getByTestId('result-json')).toBeTruthy())
    await waitFor(() => expect(getStoredState().panels.resultViewer).toBe('tree'))
  })

  it('opens on the remembered Documents view after a reload, and shows other results as JSON without forgetting it', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({version: 1, panels: {resultViewer: 'documents'}}),
    )
    const {respondWith} = renderRedesign()
    respondWith({result: [{_id: 'a', _type: 'author', title: 'Ada'}], ms: 3})
    typeQuery('*[_type == "author"]{_id, _type, title}')
    await waitFor(() => expect(isDisabled(screen.getByTestId('vision-fetch-button'))).toBe(false))
    fireEvent.click(screen.getByTestId('vision-fetch-button'))
    await waitFor(() => expect(text(screen.getByTestId('vision-document-list-mock'))).toBe('a'))

    respondWith({result: {count: 1}, ms: 3})
    typeQuery('count(*[_type == "author"])')
    fireEvent.click(screen.getByTestId('vision-fetch-button'))
    await waitFor(() => expect(screen.getByTestId('vision-result-json')).toBeTruthy())
    expect(screen.queryByTestId('vision-document-list-mock')).toBeNull()
    expect(text(screen.getByTestId('vision-result-view-button'))).toBe('vision.result.view.json')
    expect(getStoredState()?.panels?.resultViewer ?? 'documents').toBe('documents')

    respondWith({result: [{_id: 'b', _type: 'author'}], ms: 3})
    typeQuery('*[_type == "author"]{_id, _type}')
    fireEvent.click(screen.getByTestId('vision-fetch-button'))
    await waitFor(() => expect(text(screen.getByTestId('vision-document-list-mock'))).toBe('b'))
  })

  it('shows the content source map as JSON, Tree, Graph or Documents from its toolbar row', async () => {
    enableSourceMaps()
    const {respondWith} = renderRedesign()
    const resultSourceMap = {
      documents: [
        {_id: 'drafts.a', _type: 'author'},
        {_id: 'b', _type: 'book', _projectId: 'other-project', _dataset: 'other-dataset'},
      ],
      paths: ["$['title']"],
      mappings: {
        "$[0]['name']": {type: 'value', source: {type: 'documentValue', document: 0, path: 0}},
      },
    }
    // The result projects neither `_id` nor `_type`, and Documents still lists the mapped documents
    respondWith({result: [{name: 'Ada'}], ms: 3, resultSourceMap})
    typeQuery('*[_type == "author"]{name}')
    await waitFor(() => expect(isDisabled(screen.getByTestId('vision-fetch-button'))).toBe(false))
    fireEvent.click(screen.getByTestId('vision-fetch-button'))
    await screen.findByTestId('vision-result-json')

    fireEvent.click(document.getElementById('vision-response-source-map-tab') as HTMLElement)
    const sourceMap = await screen.findByTestId('vision-source-map')
    // The tree it always showed comes first, with the switcher on a row above it in the tab body
    expect(within(sourceMap).getByTestId('result-json').textContent).toBe(
      JSON.stringify(resultSourceMap),
    )
    const viewButton = within(screen.getByTestId('vision-source-map-toolbar')).getByTestId(
      'vision-source-map-view-button',
    )
    expect(document.getElementById('vision-response-source-map-panel')?.contains(viewButton)).toBe(
      true,
    )
    expect(text(viewButton)).toBe('vision.result.view.tree')
    expect(viewButton.getAttribute('aria-controls')).toBe(sourceMap.id)
    const menu = await openMenu('vision-source-map-view-button', 'vision-source-map-view-menu')
    expect(
      within(menu)
        .getAllByRole('menuitemradio', {hidden: true})
        .map((item) => item.getAttribute('data-testid')),
    ).toEqual([
      'vision-source-map-view-json',
      'vision-source-map-view-tree',
      'vision-source-map-view-graph',
      'vision-source-map-view-documents',
    ])

    fireEvent.click(within(menu).getByTestId('vision-source-map-view-documents'))
    expect((await screen.findAllByTestId('vision-document-list-mock')).at(-1)?.textContent).toBe(
      'drafts.a,b',
    )

    const pickSourceMapView = async (view: string) => {
      const viewMenu = await openMenu(
        'vision-source-map-view-button',
        'vision-source-map-view-menu',
      )
      fireEvent.click(within(viewMenu).getByTestId(`vision-source-map-view-${view}`))
    }
    await pickSourceMapView('json')
    const json = within(screen.getByTestId('vision-source-map')).getByTestId('vision-result-json')
    expect((within(json).getByTestId('codemirror-mock') as HTMLTextAreaElement).value).toBe(
      JSON.stringify(resultSourceMap, null, 2),
    )

    await pickSourceMapView('graph')
    expect(
      screen
        .getByTestId('vision-source-map')
        .querySelector('#' + CSS.escape(viewButton.getAttribute('aria-controls') ?? '')),
    ).toBeTruthy()
    expect(
      within(screen.getByTestId('vision-source-map')).queryByTestId('vision-result-json'),
    ).toBeNull()
    // The result keeps its own view
    expect(text(screen.getByTestId('vision-result-view-button'))).toBe('vision.result.view.json')
  })

  describe('content source maps', () => {
    function openSettings() {
      fireEvent.click(screen.getByTestId('vision-sidebar-settings'))
      return within(screen.getByTestId('vision-drawer-settings'))
    }

    function openOptions() {
      fireEvent.click(document.getElementById('vision-request-options-tab') as HTMLElement)
    }

    const sourceMapTab = () => document.getElementById('vision-response-source-map-tab')

    async function fetchQuery() {
      typeQuery('*[_type == "author"]{name}')
      await waitFor(() => expect(isDisabled(screen.getByTestId('vision-fetch-button'))).toBe(false))
      fireEvent.click(screen.getByTestId('vision-fetch-button'))
      await screen.findByTestId('vision-result-json')
    }

    /** The curl and @sanity/client snippets of the Export query dialog */
    async function exportedQuery(): Promise<string> {
      fireEvent.click(screen.getByTestId('vision-query-menu-button'))
      fireEvent.click(screen.getByTestId('vision-export-query'))
      const dialog = await screen.findByTestId('vision-export-query-dialog')
      const snippet = (id: string) => {
        fireEvent.click(document.getElementById(`vision-export-${id}-tab`) as HTMLElement)
        return text(document.getElementById(`vision-export-${id}-panel`) as HTMLElement)
      }
      const code = `${snippet('curl')}\n${snippet('client')}`
      fireEvent.keyDown(dialog, {key: 'Escape'})
      await waitFor(() => expect(screen.queryByTestId('vision-export-query-dialog')).toBeNull())
      return code
    }

    it('are off by default: no option, no tab, and no source map asked for', async () => {
      const {fetchCalls} = renderRedesign()
      openOptions()
      expect(screen.getByTestId('vision-options')).toBeTruthy()
      expect(screen.queryByTestId('vision-option-source-map')).toBeNull()
      expect(sourceMapTab()).toBeNull()

      await fetchQuery()
      expect(fetchCalls.at(-1)?.options.resultSourceMap).toBeUndefined()
      expect(await exportedQuery()).not.toContain('resultSourceMap')

      // Only the opt-in shows in the settings until it is switched on
      const settings = openSettings()
      expect(settings.queryByTestId('vision-settings-include-source-map')).toBeNull()
      expect(settings.queryByTestId('vision-settings-source-map-format')).toBeNull()
      fireEvent.click(settings.getByTestId('vision-settings-source-map-enabled'))
      await waitFor(() => expect(getStoredState().response).toMatchObject({sourceMapEnabled: true}))
      expect(settings.getByTestId('vision-settings-include-source-map')).toBeTruthy()
      expect(settings.getByTestId('vision-settings-source-map-format')).toBeTruthy()
      expect(screen.getByTestId('vision-option-source-map')).toBeTruthy()
      expect(sourceMapTab()).toBeTruthy()
    })

    it('ask for none once switched off, whatever the tab option says', async () => {
      enableSourceMaps()
      const {fetchCalls} = renderRedesign()
      openOptions()
      fireEvent.click(screen.getByTestId('vision-option-source-map'))
      await fetchQuery()
      expect(fetchCalls.at(-1)?.options.resultSourceMap).toBe(true)
      const exported = await exportedQuery()
      expect(exported).toContain('resultSourceMap=true')
      expect(exported).toContain('filterResponse: false')
      expect(exported).toContain('resultSourceMap: true')

      fireEvent.click(openSettings().getByTestId('vision-settings-source-map-enabled'))
      await waitFor(() => expect(screen.queryByTestId('vision-option-source-map')).toBeNull())
      await waitFor(() => expect(getStoredState().tabs?.[0].options.includeSourceMap).toBe(true))
      expect(sourceMapTab()).toBeNull()

      const fetches = fetchCalls.length
      fireEvent.click(screen.getByTestId('vision-fetch-button'))
      await waitFor(() => expect(fetchCalls.length).toBeGreaterThan(fetches))
      expect(fetchCalls.at(-1)?.options.resultSourceMap).toBeUndefined()
      expect(await exportedQuery()).not.toContain('resultSourceMap')
    })

    it('fall back to the Response tab when the Content Source Map tab was open', async () => {
      enableSourceMaps()
      renderRedesign()
      await fetchQuery()
      fireEvent.click(sourceMapTab() as HTMLElement)
      expect(await screen.findByTestId('vision-source-map-empty')).toBeTruthy()

      fireEvent.click(openSettings().getByTestId('vision-settings-source-map-enabled'))
      await waitFor(() => expect(sourceMapTab()).toBeNull())
      expect(screen.queryByTestId('vision-source-map-empty')).toBeNull()
      const responseTab = document.getElementById('vision-response-response-tab') as HTMLElement
      expect(responseTab.getAttribute('aria-selected')).toBe('true')
      expect(document.getElementById('vision-response-response-panel')?.textContent).not.toBe('')
    })

    it('fetches a source map once from the empty tab, leaving the result and the option alone', async () => {
      enableSourceMaps({resultSourceMap: 'withKeyArraySelector'})
      const {fetchCalls, respondWith} = renderRedesign()
      respondWith({result: [{name: 'Ada'}], ms: 3})
      await fetchQuery()
      fireEvent.click(sourceMapTab() as HTMLElement)
      const empty = await screen.findByTestId('vision-source-map-empty')
      const fetches = fetchCalls.length

      const resultSourceMap = {documents: [{_id: 'a', _type: 'author'}], paths: [], mappings: {}}
      respondWith({result: [{name: 'Grace'}], ms: 4, resultSourceMap})
      fireEvent.click(within(empty).getByTestId('vision-source-map-fetch'))
      const sourceMap = await screen.findByTestId('vision-source-map')
      expect(fetchCalls).toHaveLength(fetches + 1)
      expect(fetchCalls.at(-1)?.options).toMatchObject({
        filterResponse: false,
        resultSourceMap: 'withKeyArraySelector',
      })
      expect(within(sourceMap).getByTestId('result-json').textContent).toBe(
        JSON.stringify(resultSourceMap),
      )
      expect(screen.getByTestId('vision-source-map-one-off')).toBeTruthy()
      // The result still shows the response it had, and the option stays off
      expect(
        (
          within(screen.getByTestId('vision-result-json')).getByTestId(
            'codemirror-mock',
          ) as HTMLTextAreaElement
        ).value,
      ).toContain('Ada')
      await waitFor(() => expect(getStoredState().tabs?.[0].options.includeSourceMap).toBe(false))

      // The next fetch drops the source map it fetched
      respondWith({result: [{name: 'Ada'}], ms: 3})
      fireEvent.click(screen.getByTestId('vision-fetch-button'))
      expect(await screen.findByTestId('vision-source-map-empty')).toBeTruthy()
      expect(fetchCalls.at(-1)?.options.resultSourceMap).toBeUndefined()
    })

    it('opens Options on the include switch from the empty tab', async () => {
      enableSourceMaps()
      renderRedesign()
      await fetchQuery()
      fireEvent.click(sourceMapTab() as HTMLElement)
      const empty = await screen.findByTestId('vision-source-map-empty')
      fireEvent.click(within(empty).getByTestId('vision-source-map-show-option'))
      await waitFor(() =>
        expect(document.activeElement).toBe(screen.getByTestId('vision-option-source-map')),
      )
      expect(
        document.getElementById('vision-request-options-tab')?.getAttribute('aria-selected'),
      ).toBe('true')
    })

    it('send the source map format picked in the settings, to fetches and exports', async () => {
      enableSourceMaps()
      const {fetchCalls} = renderRedesign()
      openOptions()
      fireEvent.click(screen.getByTestId('vision-option-source-map'))
      const format = openSettings().getByTestId(
        'vision-settings-source-map-format',
      ) as HTMLSelectElement
      expect(format.value).toBe('true')
      fireEvent.change(format, {target: {value: 'withKeyArraySelector'}})
      await waitFor(() =>
        expect(getStoredState().response).toMatchObject({resultSourceMap: 'withKeyArraySelector'}),
      )

      await fetchQuery()
      expect(fetchCalls.at(-1)?.options.resultSourceMap).toBe('withKeyArraySelector')
      const exported = await exportedQuery()
      expect(exported).toContain('resultSourceMap=withKeyArraySelector')
      expect(exported).toContain("resultSourceMap: 'withKeyArraySelector'")
    })
  })

  it('keeps JSON for a result that is not a document list, and explains it from Documents', async () => {
    const {respondWith} = renderRedesign()
    respondWith({result: {count: 1}, ms: 3})
    typeQuery('count(*[_type == "author"])')
    await waitFor(() => expect(isDisabled(screen.getByTestId('vision-fetch-button'))).toBe(false))
    fireEvent.click(screen.getByTestId('vision-fetch-button'))
    await waitFor(() => expect(screen.getByTestId('vision-result-json')).toBeTruthy())
    expect(text(screen.getByTestId('vision-result-view-button'))).toBe('vision.result.view.json')

    await pickResultView('documents')
    expect(text(screen.getByTestId('vision-document-list-mock'))).toBe('not-array')
    expect(screen.queryByTestId('vision-result-json')).toBeNull()
  })

  it('stays on Documents when a refetch of an open document list returns an empty array', async () => {
    const {respondWith} = renderRedesign()
    respondWith({result: [{_id: 'a', _type: 'author', title: 'Ada'}], ms: 3})
    typeQuery('*[_type == "author"]{_id, _type, title}')
    await waitFor(() => expect(isDisabled(screen.getByTestId('vision-fetch-button'))).toBe(false))
    fireEvent.click(screen.getByTestId('vision-fetch-button'))
    await waitFor(() => expect(screen.getByTestId('vision-result-json')).toBeTruthy())
    await pickResultView('documents')
    await waitFor(() => expect(text(screen.getByTestId('vision-document-list-mock'))).toBe('a'))

    respondWith({result: [], ms: 3})
    fireEvent.click(screen.getByTestId('vision-fetch-button'))
    await waitFor(() => expect(text(screen.getByTestId('vision-document-list-mock'))).toBe(''))
    expect(text(screen.getByTestId('vision-result-view-button'))).toBe(
      'vision.result.view.documents',
    )
  })

  it('keeps the current view for an empty array, and shows the empty list from Documents', async () => {
    const {respondWith} = renderRedesign()
    respondWith({result: [], ms: 3})
    typeQuery('*[_type == "nothing"]{_id, _type, title}')
    await waitFor(() => expect(isDisabled(screen.getByTestId('vision-fetch-button'))).toBe(false))
    fireEvent.click(screen.getByTestId('vision-fetch-button'))
    await waitFor(() => expect(screen.getByTestId('vision-result-json')).toBeTruthy())
    expect(text(screen.getByTestId('vision-result-view-button'))).toBe('vision.result.view.json')
    expect(screen.queryByTestId('vision-document-list-mock')).toBeNull()

    await pickResultView('documents')
    expect(text(screen.getByTestId('vision-document-list-mock'))).toBe('')
  })

  it('shows the API version next to Fetch, and the field that changes it on request', async () => {
    renderRedesign()
    const button = screen.getByTestId('vision-api-version-button')
    expect(text(button)).toBe('vision.api-version.button:v2025-02-19')

    // Options is not the open tab, so the button opens it and focuses the field
    expect(screen.queryByTestId('vision-option-api-version-select')).toBeNull()
    fireEvent.click(button)
    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByTestId('vision-option-api-version-select')),
    )

    // A version that is not a version is called out, since nothing can be fetched with it
    fireEvent.change(screen.getByTestId('vision-option-api-version-select'), {
      target: {value: 'nope'},
    })
    expect(text(screen.getByTestId('vision-api-version-button'))).toBe(
      'vision.api-version.button-invalid',
    )
    fireEvent.click(screen.getByTestId('vision-api-version-button'))
    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByTestId('vision-option-api-version-select')),
    )
  })

  it('narrows the API version list to what was typed', () => {
    renderRedesign()
    openRequestTab('options')
    fireEvent.change(screen.getByTestId('vision-option-api-version-select'), {
      target: {value: '2021'},
    })

    expect(screen.getByTestId('vision-option-api-version-option-v2021-10-21')).toBeTruthy()
    expect(screen.getByTestId('vision-option-api-version-option-v2021-03-25')).toBeTruthy()
    expect(screen.queryByTestId('vision-option-api-version-option-v1')).toBeNull()
    expect(screen.queryByTestId('vision-option-api-version-option-vX')).toBeNull()
  })

  it('orders the chips like the Options fields, API version first, with fetch actions outside the chip strip', () => {
    const initial = createInitialState(DEFAULTS)
    const tab = createTab(initial.settings, {
      id: 'overrides',
      query: '*',
      options: {
        datasetMode: 'override',
        dataset: 'staging',
        perspective: 'raw',
        variant: 'none',
        useCdn: true,
      },
    })
    saveVisionState(PROJECT_ID, {...initial, tabs: [tab], activeTabId: 'overrides'})
    renderRedesign({...BASE_PERSPECTIVE, selectedVariantNames: ['french']})

    // The strip is what scrolls when the bar is narrow; Live fetch, Fetch and the menu stay after it
    const actions = screen.getByTestId('vision-query-actions')
    const chips = within(actions).getByTestId('vision-query-action-chips')
    const chipOrder = [...chips.querySelectorAll('button')].map((button) =>
      button.getAttribute('data-testid'),
    )
    expect(chipOrder).toEqual([
      'vision-api-version-button',
      'vision-override-dataset-button',
      'vision-override-perspective-button',
      'vision-override-variant-button',
    ])

    // The fields each chip reveals, in the order the Options panel lists them
    openRequestTab('options')
    const fieldOfChip: Record<string, string> = {
      'vision-api-version-button': 'vision-option-api-version-select',
      'vision-override-dataset-button': 'vision-option-dataset-select',
      'vision-override-perspective-button': 'vision-option-perspective-select',
      'vision-override-variant-button': 'vision-option-variant-select',
    }
    const chipFields = new Set(Object.values(fieldOfChip))
    const fieldOrder = [
      ...screen.getByTestId('vision-options-grid').querySelectorAll<HTMLElement>('[data-testid]'),
    ]
      .map((element) => element.dataset.testid ?? '')
      .filter((testId) => chipFields.has(testId))
    expect(chipOrder.map((testId) => fieldOfChip[testId ?? ''])).toEqual(fieldOrder)
    expect(text(within(chips).getByTestId('vision-api-version-button'))).toBe(
      'vision.api-version.button-cdn:v2025-02-19',
    )

    const fetchButton = within(actions).getByTestId('vision-fetch-button')
    const liveButton = within(actions).getByTestId('vision-auto-refetch')
    expect(chips.contains(fetchButton)).toBe(false)
    expect(chips.contains(liveButton)).toBe(false)
    expect(chips.compareDocumentPosition(liveButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
    expect(chips.compareDocumentPosition(fetchButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
  })

  it('says at every control that calls Agent Actions that it uses AI credits', async () => {
    renderRedesign()
    // Tooltips stay mounted while closed, so the note is in the document for every control shown:
    // Generate query over the query editor, then Explain this to me, then Generate mutations
    const notes = () => screen.queryAllByText('vision.agent-actions.credits')
    await waitFor(() => expect(notes()).toHaveLength(1))
    fireEvent.click(document.getElementById('vision-response-explain-tab') as HTMLElement)
    await waitFor(() => expect(notes()).toHaveLength(2))
    fireEvent.click(screen.getByTestId('vision-sidebar-mutate'))
    await waitFor(() => expect(notes()).toHaveLength(3))
    // Labelled controls (Generate, Explain) say what they do themselves; the icon-only
    // Generate mutations control keeps its name as the tooltip's first line
    const tooltipTexts = notes().map((note) =>
      text(note.closest<HTMLElement>('[data-ui="Tooltip"]') as HTMLElement),
    )
    expect(tooltipTexts).toEqual([
      'vision.agent-actions.credits',
      'vision.agent-actions.credits',
      'vision.mutate.generate.buttonvision.agent-actions.credits',
    ])
  })

  it('says under every Agent Actions control how many AI credits the organization has left', async () => {
    const {aiCreditsRequests, respondToAiCredits} = renderRedesign()
    respondToAiCredits({
      granted: true,
      reasonCode: null,
      subscription: {resourceId: 'ai-usage', quota: 1000},
      usage: {metric: 'ai-usage', value: 58},
    })

    fireEvent.click(screen.getByTestId('vision-generate-query'))
    const bar = screen.getByTestId('vision-generate-bar')
    const note = await within(bar).findByTestId('vision-ai-credits')
    expect(text(note)).toContain('vision.ai-credits.balance:{"balance":"942","quota":"1,000"}')
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
    fireEvent.click(document.getElementById('vision-response-explain-tab') as HTMLElement)
    const explainNote = await within(screen.getByTestId('vision-explain')).findByTestId(
      'vision-ai-credits',
    )
    expect(text(explainNote)).toContain('"balance":"942"')
    fireEvent.click(screen.getByTestId('vision-sidebar-mutate'))
    fireEvent.click(screen.getByTestId('vision-mutate-generate'))
    const mutateNote = await within(screen.getByTestId('vision-mutate-generate-bar')).findByTestId(
      'vision-ai-credits',
    )
    expect(text(mutateNote)).toContain('"balance":"942"')
    expect(aiCreditsRequests).toHaveLength(1)
  })

  it('offers a bigger plan in place of a control description once the credits the plan includes are used up', async () => {
    const {respondToAiCredits} = renderRedesign()
    respondToAiCredits({
      granted: false,
      reasonCode: 'plan_limit_reached',
      subscription: {resourceId: 'ai-usage', quota: 100},
      usage: {metric: 'ai-usage', value: 100},
    })

    fireEvent.click(screen.getByTestId('vision-generate-query'))
    const bar = screen.getByTestId('vision-generate-bar')
    const card = await within(bar).findByTestId('vision-ai-credits-limit')
    expect(text(card)).toContain('vision.ai-credits.limit.title')
    expect(within(bar).queryByText('vision.generate.description')).toBeNull()
    // The control itself stays: the API decides, and the plan may have been upgraded since
    expect(isDisabled(within(bar).getByTestId('vision-generate-request'))).toBe(false)
    // The reading alone opens nothing: the dialog is for a request that was turned down
    expect(screen.queryByTestId('upsell-dialog')).toBeNull()

    // Once the upsell content has come, the card leads to the plan upgrade rather than to Manage
    const upgrade = await within(bar).findByTestId('vision-ai-credits-upgrade')
    expect(upsellMocks.requests).toBe(1)
    const upgradeCard = within(bar).getByTestId('vision-ai-credits-limit')
    expect(text(upgradeCard)).toContain(
      'vision.ai-credits.limit.description-upgrade:{"used":"100","quota":"100"}',
    )
    expect(within(upgradeCard).queryByTestId('vision-ai-credits-manage')).toBeNull()
    expect(
      within(upgradeCard)
        .getByText('vision.ai-credits.limit.learn-more')
        .closest('a')
        ?.getAttribute('href'),
    ).toBe('https://www.sanity.io/docs/platform-management/how-ai-credits-work')
    expect(upsellMocks.telemetryLogs.dialogViewed).not.toHaveBeenCalled()

    fireEvent.click(upgrade)
    const dialog = await screen.findByTestId('upsell-dialog')
    expect(upsellMocks.telemetryLogs.dialogViewed).toHaveBeenCalledExactlyOnceWith(
      'ai_credits_card',
    )
    const cta = within(dialog).getByText('Upgrade to Growth')
    expect(cta.getAttribute('href')).toBe('https://www.sanity.io/manage/plan')
    fireEvent.click(cta)
    expect(upsellMocks.telemetryLogs.dialogPrimaryClicked).toHaveBeenCalledOnce()
    fireEvent.click(within(dialog).getByText('About AI credits'))
    expect(upsellMocks.telemetryLogs.dialogSecondaryClicked).toHaveBeenCalledOnce()

    fireEvent.click(within(dialog).getByTestId('upsell-dialog-close'))
    await waitFor(() => expect(screen.queryByTestId('upsell-dialog')).toBeNull())
    expect(upsellMocks.telemetryLogs.dialogDismissed).toHaveBeenCalledOnce()
    // The content was asked for once, when the credits turned out to call for it
    expect(upsellMocks.requests).toBe(1)
  })

  it('leads to the spending limit in Manage where a bigger plan would not help', async () => {
    const {respondToAiCredits} = renderRedesign()
    respondToAiCredits({
      granted: false,
      reasonCode: 'default_budget_limit_reached',
      subscription: {resourceId: 'ai-usage', quota: 100},
      usage: {metric: 'ai-usage', value: 100},
    })

    fireEvent.click(screen.getByTestId('vision-generate-query'))
    const bar = screen.getByTestId('vision-generate-bar')
    const card = await within(bar).findByTestId('vision-ai-credits-limit')
    expect(text(card)).toContain('vision.ai-credits.limit.description:{"used":"100","quota":"100"}')
    await waitFor(() =>
      expect(within(card).getByTestId('vision-ai-credits-manage').getAttribute('href')).toBe(
        'https://www.sanity.io/organizations/org-1/settings#caps',
      ),
    )
    // Nothing to upsell, so the content is not even asked for
    await act(async () => {})
    expect(within(bar).queryByTestId('vision-ai-credits-upgrade')).toBeNull()
    expect(upsellMocks.requests).toBe(0)
    expect(screen.queryByTestId('upsell-dialog')).toBeNull()
  })

  it('keeps the way into Manage when the upsell content does not come', async () => {
    upsellMocks.content$ = upsellContent({upsellData: null, hasError: true})
    const {replyToPrompts, respondToAiCredits} = renderRedesign()
    respondToAiCredits({
      granted: false,
      reasonCode: 'plan_limit_reached',
      subscription: {resourceId: 'ai-usage', quota: 100},
      usage: {metric: 'ai-usage', value: 100},
    })
    replyToPrompts(limitError('plan_limit_reached'))

    // Neither the reading nor a turned-down request opens a dialog there is no content for
    generateFrom('Ten authors')
    const bar = screen.getByTestId('vision-generate-bar')
    const card = await within(bar).findByTestId('vision-ai-credits-limit')
    await waitFor(() => expect(upsellMocks.requests).toBe(1))
    await act(async () => {})
    expect(screen.queryByTestId('upsell-dialog')).toBeNull()
    expect(upsellMocks.telemetryLogs.dialogViewed).not.toHaveBeenCalled()
    expect(upsellMocks.telemetryLogs.dialogDismissed).not.toHaveBeenCalled()
    expect(within(card).queryByTestId('vision-ai-credits-upgrade')).toBeNull()
    expect(text(card)).toContain('vision.ai-credits.limit.description:{"used":"100","quota":"100"}')
    expect(within(card).getByTestId('vision-ai-credits-manage').getAttribute('href')).toBe(
      'https://www.sanity.io/organizations/org-1/settings#caps',
    )
    expect(within(bar).queryByTestId('vision-generate-error')).toBeNull()
  })

  it('opens the upsell dialog when Agent Actions turn a request down for the credits a bigger plan comes with', async () => {
    const {promptCalls, replyToPrompts, respondToAiCredits, respondToRequests} = renderRedesign()
    respondToAiCredits({
      granted: true,
      reasonCode: null,
      subscription: {resourceId: 'ai-usage', quota: 100},
      usage: {metric: 'ai-usage', value: 99},
    })
    respondToRequests({result: [], explain: 'Pipeline {}'})
    replyToPrompts(limitError('plan_limit_reached'), limitError('plan_limit_reached'))

    generateFrom('Ten authors')
    const dialog = await screen.findByTestId('upsell-dialog')
    expect(upsellMocks.telemetryLogs.dialogViewed).toHaveBeenCalledExactlyOnceWith('agent_action')
    expect(within(dialog).getByText('Upgrade to Growth').getAttribute('href')).toBe(
      'https://www.sanity.io/manage/plan',
    )
    // The card stands under the control as well, for after the dialog is closed
    const bar = screen.getByTestId('vision-generate-bar')
    await within(bar).findByTestId('vision-ai-credits-upgrade')
    expect(within(bar).queryByTestId('vision-generate-error')).toBeNull()
    expect(promptCalls).toHaveLength(1)

    fireEvent.click(within(dialog).getByTestId('upsell-dialog-close'))
    await waitFor(() => expect(screen.queryByTestId('upsell-dialog')).toBeNull())
    expect(upsellMocks.telemetryLogs.dialogDismissed).toHaveBeenCalledOnce()

    // Every Agent Actions control opens it: the explanation as well
    typeQuery('*[_type == "post"]')
    fireEvent.click(document.getElementById('vision-response-explain-tab') as HTMLElement)
    await waitFor(() => expect(isDisabled(screen.getByTestId('vision-explain-button'))).toBe(false))
    fireEvent.click(screen.getByTestId('vision-explain-button'))
    await screen.findByTestId('upsell-dialog')
    expect(upsellMocks.telemetryLogs.dialogViewed).toHaveBeenCalledTimes(2)
    expect(upsellMocks.telemetryLogs.dialogViewed).toHaveBeenLastCalledWith('agent_action')
    expect(promptCalls).toHaveLength(2)
    expect(upsellMocks.requests).toBe(1)
  })

  it('offers more AI credits, not an error, when Agent Actions turn a request down for them', async () => {
    const {aiCreditsRequests, promptCalls, replyToPrompts, respondToAiCredits} = renderRedesign()
    respondToAiCredits({
      granted: true,
      reasonCode: null,
      subscription: {resourceId: 'ai-usage', quota: 100},
      usage: {metric: 'ai-usage', value: 90},
    })
    replyToPrompts(limitError())

    generateFrom('Ten authors')
    const bar = screen.getByTestId('vision-generate-bar')
    const card = await within(bar).findByTestId('vision-ai-credits-limit')
    // The response says how the credits stand now, ahead of the metering the reading comes from
    expect(text(card)).toContain('vision.ai-credits.limit.description:{"used":"100","quota":"100"}')
    expect(within(bar).queryByTestId('vision-generate-error')).toBeNull()
    expect(promptCalls).toHaveLength(1)
    // A spending limit the organization set is raised in Manage, not with a bigger plan
    expect(screen.queryByTestId('upsell-dialog')).toBeNull()
    expect(upsellMocks.requests).toBe(0)

    // Every control shows the limit from then on
    fireEvent.click(document.getElementById('vision-response-explain-tab') as HTMLElement)
    const explain = screen.getByTestId('vision-explain')
    expect(within(explain).getByTestId('vision-ai-credits-limit')).toBeTruthy()
    expect(within(explain).queryByTestId('vision-ai-credits')).toBeNull()

    // A request that goes through again means the limit was raised: the credits are read again
    respondToAiCredits({
      granted: true,
      reasonCode: null,
      subscription: {resourceId: 'ai-usage', quota: 1000},
      usage: {metric: 'ai-usage', value: 101},
    })
    replyToPrompts({query: '*[_type == "author"]', params: {}, title: 'Authors'})
    fireEvent.change(within(bar).getByTestId('vision-generate-request'), {
      target: {value: 'All authors'},
    })
    fireEvent.click(within(bar).getByTestId('vision-generate-submit'))
    await waitFor(() => expect(screen.queryByTestId('vision-generate-bar')).toBeNull())
    await waitFor(() =>
      expect(
        text(within(screen.getByTestId('vision-explain')).getByTestId('vision-ai-credits')),
      ).toContain('vision.ai-credits.balance:{"balance":"899","quota":"1,000"}'),
    )
    expect(aiCreditsRequests).toHaveLength(2)
  })

  it('keeps the limit a request was turned down for over a reading that started before it', async () => {
    const {replyToPrompts, respondToAiCredits} = renderRedesign()
    // The reading the bar starts when it opens is still on its way when the request is turned down
    let answer!: (response: unknown) => void
    respondToAiCredits(
      new Promise((resolve) => {
        answer = resolve
      }),
    )
    replyToPrompts(limitError())

    generateFrom('Ten authors')
    await within(screen.getByTestId('vision-generate-bar')).findByTestId('vision-ai-credits-limit')

    // The answer is from before the request hit the limit, so it does not stand
    await act(async () => {
      answer({
        granted: true,
        reasonCode: null,
        subscription: {resourceId: 'ai-usage', quota: 1000},
        usage: {metric: 'ai-usage', value: 58},
      })
    })
    fireEvent.click(document.getElementById('vision-response-explain-tab') as HTMLElement)
    const explain = screen.getByTestId('vision-explain')
    expect(within(explain).getByTestId('vision-ai-credits-limit')).toBeTruthy()
    expect(within(explain).queryByTestId('vision-ai-credits')).toBeNull()
  })

  it('keeps showing other failures as errors, a plain rate limit among them', async () => {
    const {replyToPrompts} = renderRedesign()
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
    const error = await screen.findByTestId('vision-generate-error')
    expect(text(error)).toContain('Rate limit exceeded')
    expect(screen.queryByTestId('vision-ai-credits-limit')).toBeNull()
    expect(screen.queryByTestId('upsell-dialog')).toBeNull()
    expect(upsellMocks.requests).toBe(0)
  })

  it('offers more AI credits in the Explain panel when the explanation is turned down for them', async () => {
    const {replyToPrompts, respondToRequests} = renderRedesign()
    respondToRequests({result: [], explain: 'Pipeline {}'})
    replyToPrompts(limitError())

    typeQuery('*[_type == "post"]')
    fireEvent.click(document.getElementById('vision-response-explain-tab') as HTMLElement)
    await waitFor(() => expect(isDisabled(screen.getByTestId('vision-explain-button'))).toBe(false))
    fireEvent.click(screen.getByTestId('vision-explain-button'))

    const explain = screen.getByTestId('vision-explain')
    const card = await within(explain).findByTestId('vision-ai-credits-limit')
    expect(text(card)).toContain('vision.ai-credits.limit.description:{"used":"100","quota":"100"}')
    expect(within(explain).queryByTestId('vision-explain-error')).toBeNull()
    // The plan costs nothing, so it still came
    expect(within(explain).getByTestId('vision-query-plan')).toBeTruthy()
  })

  describe('the ai option', () => {
    /** What a test registers as WebMCP tools; removed again when the test finishes */
    function captureWebMcpTools(): string[] {
      const names: string[] = []
      Reflect.set(document, 'modelContext', {
        registerTool: (tool: {name: string}) => {
          names.push(tool.name)
          return Promise.resolve()
        },
      })
      onTestFinished(() => {
        Reflect.deleteProperty(document, 'modelContext')
      })
      return names
    }

    /** Which AI controls a configuration shows, after visiting every panel that has one */
    async function shownAiControls(ai: VisionAiConfig | undefined) {
      const tools = captureWebMcpTools()
      const view = renderRedesign(BASE_PERSPECTIVE, {ai})
      // Generate is offered for an empty query, Edit once it has text in it
      const generateQuery = screen.queryByTestId('vision-generate-query') !== null
      typeQuery('*[_type == "post"]')
      fireEvent.click(document.getElementById('vision-response-explain-tab') as HTMLElement)
      // The query plan is no AI feature: it is there in every configuration
      await waitFor(() =>
        expect(isDisabled(screen.getByTestId('vision-explain-plan-button'))).toBe(false),
      )
      const explainDescription = text(screen.getByTestId('vision-explain'))
      fireEvent.click(screen.getByTestId('vision-sidebar-mutate'))
      await waitFor(() => expect(screen.getByTestId('vision-mutate-add')).toBeTruthy())
      // Registration is asynchronous; give it the turn it takes when it happens
      await act(async () => {})
      return {
        view,
        shown: {
          generateQuery,
          editQuery: screen.queryByTestId('vision-edit-query') !== null,
          generateMutations: screen.queryByTestId('vision-mutate-generate') !== null,
          explainQuery: screen.queryByTestId('vision-explain-button') !== null,
        },
        webMcpTools: tools.length,
        explainDescription,
        creditNotes: screen.queryAllByText('vision.agent-actions.credits').length,
      }
    }

    it.each([
      ['omitted', undefined],
      ['true', true],
      ['an empty object', {}],
    ] as const)('keeps every AI feature on when it is %s', async (_label, ai) => {
      const {shown, explainDescription, creditNotes, webMcpTools} = await shownAiControls(ai)
      expect(shown).toEqual({
        generateQuery: true,
        editQuery: true,
        generateMutations: true,
        explainQuery: true,
      })
      expect(webMcpTools).toBe(7)
      expect(explainDescription).toContain('vision.explain.description')
      expect(explainDescription).not.toContain('vision.explain.description-plan')
      expect(creditNotes).toBe(3)
    })

    it('hides every AI feature with false, reads no AI credits and calls no Agent Actions', async () => {
      const {shown, explainDescription, creditNotes, view, webMcpTools} =
        await shownAiControls(false)
      expect(shown).toEqual({
        generateQuery: false,
        editQuery: false,
        generateMutations: false,
        explainQuery: false,
      })
      // The WebMCP tools spend no AI credits and stay registered
      expect(webMcpTools).toBe(7)
      // The plan stays, described without the explanation
      expect(explainDescription).toContain('vision.explain.description-plan')
      expect(creditNotes).toBe(0)
      expect(screen.queryByText(/vision\.ai-credits\./)).toBeNull()
      expect(view.aiCreditsRequests).toHaveLength(0)

      view.respondToRequests({result: [], explain: 'Pipeline {}'})
      fireEvent.click(document.getElementById('vision-response-explain-tab') as HTMLElement)
      fireEvent.click(screen.getByTestId('vision-explain-plan-button'))
      await waitFor(() => expect(screen.getByTestId('vision-query-plan')).toBeTruthy())
      expect(view.promptCalls).toHaveLength(0)
    })

    it.each([
      ['generateQuery', {generateQuery: false}],
      ['editQuery', {editQuery: false}],
      ['generateMutations', {generateMutations: false}],
      ['explainQuery', {explainQuery: false}],
    ] as const)('switches off only %s when it alone is false', async (key, ai) => {
      const {shown} = await shownAiControls(ai)
      expect(shown).toEqual({
        generateQuery: true,
        editQuery: true,
        generateMutations: true,
        explainQuery: true,
        [key]: false,
      })
    })

    it('keeps the features an object sets to true or leaves out, and turns off the rest', async () => {
      const {shown, creditNotes} = await shownAiControls({
        generateQuery: true,
        generateMutations: false,
      })
      expect(shown).toEqual({
        generateQuery: true,
        editQuery: true,
        generateMutations: false,
        explainQuery: true,
      })
      // Edit under the query and Explain this to me
      expect(creditNotes).toBe(2)
    })

    function openSettings() {
      fireEvent.click(screen.getByTestId('vision-sidebar-settings'))
      return within(screen.getByTestId('vision-drawer-settings'))
    }

    function isChecked(element: HTMLElement): boolean {
      return (element as HTMLInputElement).checked
    }

    it('turns off the AI features the user switches off in the settings, and remembers it', async () => {
      renderRedesign()
      const settings = openSettings()
      expect(settings.getByTestId('vision-settings-ai')).toBeTruthy()
      for (const id of [
        'enabled',
        'generateQuery',
        'editQuery',
        'fixLint',
        'generateMutations',
        'explainQuery',
      ]) {
        expect(isChecked(settings.getByTestId(`vision-settings-ai-${id}`))).toBe(true)
      }
      expect(screen.getByTestId('vision-generate-query')).toBeTruthy()

      fireEvent.click(settings.getByTestId('vision-settings-ai-generateQuery'))
      await waitFor(() => expect(screen.queryByTestId('vision-generate-query')).toBeNull())
      await waitFor(() =>
        expect(getStoredState().ai).toEqual({
          enabled: true,
          generateQuery: false,
          editQuery: true,
          fixLint: true,
          generateMutations: true,
          explainQuery: true,
        }),
      )
      cleanup()

      const {shown, webMcpTools} = await shownAiControls(undefined)
      expect(shown).toEqual({
        generateQuery: false,
        editQuery: true,
        generateMutations: true,
        explainQuery: true,
      })
      // The WebMCP tools spend no AI credits and stay registered
      expect(webMcpTools).toBe(7)
    })

    it('has sync tag lookup on at first, and keeps it off once switched off', async () => {
      const view = renderRedesign()
      const toggle = openSettings().getByTestId('vision-settings-resolve-sync-tags')
      expect(isChecked(toggle)).toBe(true)
      fireEvent.click(toggle)
      await waitFor(() => expect(getStoredState().response).toMatchObject({resolveSyncTags: false}))
      expect(isChecked(toggle)).toBe(false)

      view.unmount()
      renderRedesign()
      // The sidebar comes back as it was left, with the settings open
      const restored = within(screen.getByTestId('vision-drawer-settings'))
      expect(isChecked(restored.getByTestId('vision-settings-resolve-sync-tags'))).toBe(false)
    })

    it('turns off every AI feature with the switch for all of them, and reads no AI credits', async () => {
      const view = renderRedesign()
      const settings = openSettings()
      fireEvent.click(settings.getByTestId('vision-settings-ai-enabled'))
      await waitFor(() => expect(getStoredState().ai.enabled).toBe(false))
      // The per-feature switches read as off and wait for the switch for all of them
      for (const id of [
        'generateQuery',
        'editQuery',
        'fixLint',
        'generateMutations',
        'explainQuery',
      ]) {
        const toggle = settings.getByTestId(`vision-settings-ai-${id}`)
        expect(isChecked(toggle)).toBe(false)
        expect(isDisabled(toggle)).toBe(true)
      }
      expect(getStoredState().ai.generateQuery).toBe(true)
      view.unmount()

      const {shown, webMcpTools, creditNotes, view: next} = await shownAiControls(undefined)
      expect(shown).toEqual({
        generateQuery: false,
        editQuery: false,
        generateMutations: false,
        explainQuery: false,
      })
      expect(webMcpTools).toBe(7)
      expect(creditNotes).toBe(0)
      expect(next.aiCreditsRequests).toHaveLength(0)
    })

    it('never turns on a feature the config turns off, and gives it no switch', async () => {
      const initial = createInitialState(DEFAULTS)
      saveVisionState(PROJECT_ID, {
        ...initial,
        ai: {
          enabled: true,
          generateQuery: true,
          editQuery: true,
          fixLint: true,
          generateMutations: false,
          explainQuery: true,
        },
      })
      const {shown} = await shownAiControls({explainQuery: false, fixLint: false})
      expect(shown).toEqual({
        generateQuery: true,
        editQuery: true,
        generateMutations: false,
        explainQuery: false,
      })

      const settings = openSettings()
      expect(settings.getByTestId('vision-settings-ai-enabled')).toBeTruthy()
      expect(settings.getByTestId('vision-settings-ai-generateQuery')).toBeTruthy()
      expect(settings.getByTestId('vision-settings-ai-generateMutations')).toBeTruthy()
      expect(settings.getByTestId('vision-settings-ai-editQuery')).toBeTruthy()
      expect(settings.queryByTestId('vision-settings-ai-explainQuery')).toBeNull()
      expect(settings.queryByTestId('vision-settings-ai-fixLint')).toBeNull()
    })

    it('shows no AI settings when the config turns every AI feature off', () => {
      renderRedesign(BASE_PERSPECTIVE, {ai: false})
      const settings = openSettings()
      expect(settings.getByTestId('vision-settings')).toBeTruthy()
      expect(settings.queryByTestId('vision-settings-ai')).toBeNull()
    })
  })

  it('generates a query from a description into the empty tab, and fetches it', async () => {
    const {fetchCalls, promptCalls, replyToPrompts} = renderRedesign()
    const generated = '*[_type == "author"] | order(_createdAt desc)[0...10]{_id, name}'
    replyToPrompts({query: generated, params: {}, title: 'Recent authors'})

    fireEvent.click(screen.getByTestId('vision-generate-query'))
    const bar = screen.getByTestId('vision-generate-bar')
    const submit = within(bar).getByTestId('vision-generate-submit')
    expect(isDisabled(submit)).toBe(true)
    const request = within(bar).getByTestId('vision-generate-request')
    expect(request.getAttribute('autocomplete')).toBe('off')
    expect(request.hasAttribute('data-1p-ignore')).toBe(true)
    fireEvent.change(request, {
      target: {value: 'The 10 most recent authors'},
    })
    fireEvent.keyDown(request, {key: 'Enter'})

    await waitFor(() => expect(screen.queryByTestId('vision-generate-bar')).toBeNull())
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
    const tabs = screen.getAllByTestId('vision-tab')
    expect(tabs).toHaveLength(1)
    expect(text(tabs[0])).toContain('Recent authors')
    // Under a comment that keeps the description the query was generated from
    expect(fetchCalls[1].query).toBe(
      '// Generated with the prompt: The 10 most recent authors\n' +
        '*[_type == "author"] | order(_createdAt desc)[0...10] { _id, name }',
    )
    expect(getQueryEditor().value).toBe(fetchCalls[1].query)
    // The query has text in it now, so Edit takes Generate's place
    expect(screen.queryByTestId('vision-generate-query')).toBeNull()
    expect(screen.getByTestId('vision-edit-query')).toBeTruthy()
    // History keeps the action and the prompt, which the bar no longer shows
    fireEvent.click(document.getElementById('vision-response-history-tab') as HTMLElement)
    const entry = screen.getByTestId('vision-history-entry')
    expect(text(entry)).toContain('vision.history.reason.ai.generate')
    expect(text(within(entry).getByTestId('vision-history-ai-prompt'))).toBe(
      'The 10 most recent authors',
    )
  })

  it('shows the result of a generated query as JSON, also when it lists documents', async () => {
    const {fetchCalls, replyToPrompts, respondWith} = renderRedesign()
    replyToPrompts({query: '*[_type == "author"]{_id, _type}', params: {}, title: 'Authors'})
    respondWith({result: [{_id: 'a', _type: 'author'}], ms: 3})
    generateFrom('All authors')

    await waitFor(() => expect(fetchCalls).toHaveLength(2))
    await waitFor(() => expect(screen.getByTestId('vision-result-json')).toBeTruthy())
    expect(screen.queryByTestId('vision-document-list-mock')).toBeNull()
    expect(text(screen.getByTestId('vision-result-view-button'))).toBe('vision.result.view.json')
  })

  it('offers Generate only while the query is empty, and Edit once it has text in it', () => {
    renderRedesign()
    expect(screen.getByTestId('vision-generate-query')).toBeTruthy()
    expect(screen.queryByTestId('vision-edit-query')).toBeNull()

    typeQuery('*[_type == "post"]')
    expect(screen.queryByTestId('vision-generate-query')).toBeNull()
    expect(screen.getByTestId('vision-edit-query')).toBeTruthy()

    // Whitespace alone counts as empty
    typeQuery('  \n ')
    expect(screen.getByTestId('vision-generate-query')).toBeTruthy()
    expect(screen.queryByTestId('vision-edit-query')).toBeNull()
  })

  it('keeps the comment on one line for a description with a line separator in it', async () => {
    const {fetchCalls, replyToPrompts} = renderRedesign()
    replyToPrompts({query: '*[_type == "author"]', params: {}})

    generateFrom('Authors\u2028newest first')
    await waitFor(() => expect(fetchCalls).toHaveLength(2))
    expect(getQueryEditor().value).toBe(
      '// Generated with the prompt: Authors\\u2028newest first\n*[_type == "author"]',
    )
  })

  it('edits the query of the tab with Agent Actions, keeping its title, and closes on Escape', async () => {
    const {fetchCalls, promptCalls, replyToPrompts} = renderRedesign()
    typeQuery('// Posts\n*[_type == "post"][0...$limit]')
    openRequestTab('params')
    fireEvent.change(
      within(screen.getByTestId('vision-params-editor')).getByTestId('codemirror-mock'),
      {target: {value: '{"limit": 5}'}},
    )
    await waitFor(() => expect(getStoredState().tabs[0].rawParams).toBe('{"limit": 5}'))
    replyToPrompts(
      {
        query: '// Posts\n*[_type == "post"] | order(_createdAt desc)[0...$limit]{_id, title}',
        params: {limit: 5},
        title: 'Posts',
      },
      {query: '*[_type == "book"]', params: {}, title: 'Books'},
    )

    fireEvent.click(screen.getByTestId('vision-edit-query'))
    fireEvent.keyDown(screen.getByTestId('vision-edit-request'), {key: 'Escape'})
    expect(screen.queryByTestId('vision-edit-bar')).toBeNull()

    editFrom('Newest first, with their titles')
    await waitFor(() => expect(fetchCalls).toHaveLength(2))
    expect(promptCalls[0].request).toMatchObject({
      format: 'json',
      instructionParams: {
        query: '// Posts\n*[_type == "post"][0...$limit]',
        params: '{"limit":5}',
        request: 'Newest first, with their titles',
      },
    })
    expect(screen.getAllByTestId('vision-tab')).toHaveLength(1)
    // Formatted for the editor, with the comments the model kept and none added
    expect(fetchCalls[1].query).toBe(
      '// Posts\n*[_type == "post"] | order(_createdAt desc)[0...$limit] { _id, title }',
    )
    expect(fetchCalls[1].params).toEqual({limit: 5})
    expect(getQueryEditor().value).toBe(fetchCalls[1].query)
    // The title still comes from the query, so it follows an undo in the editor too
    expect(text(screen.getByTestId('vision-tab-button'))).toBe('post')

    // A title the tab was given stays
    fireEvent.keyDown(within(screen.getByTestId('vision-tab')).getByRole('tab'), {key: 'F2'})
    const titleInput = screen.getByTestId('vision-tab-title-input')
    fireEvent.change(titleInput, {target: {value: 'Reading list'}})
    fireEvent.keyDown(titleInput, {key: 'Enter'})
    editFrom('Books instead')
    await waitFor(() => expect(fetchCalls).toHaveLength(4))
    expect(getQueryEditor().value).toBe('*[_type == "book"]')
    expect(text(screen.getByTestId('vision-tab-button'))).toBe('Reading list')
  })

  it('keeps params that do not parse when Agent Actions edit or fix the query', async () => {
    const {promptCalls, replyToPrompts} = renderRedesign()
    const halfTyped = '{"limit": '
    typeQuery('*[_type == "post"][0...$limit]')
    openRequestTab('params')
    fireEvent.change(
      within(screen.getByTestId('vision-params-editor')).getByTestId('codemirror-mock'),
      {target: {value: halfTyped}},
    )
    await waitFor(() => expect(getStoredState().tabs[0].rawParams).toBe(halfTyped))
    replyToPrompts({query: '*[_type == "post"][0...$limit]{_id}', params: {limit: 5}})

    editFrom('Only the IDs')
    await waitFor(() => expect(getQueryEditor().value).toContain('_id'))
    expect(promptCalls[0].request).toMatchObject({instructionParams: {params: '{}'}})
    expect(getStoredState().tabs[0].rawParams).toBe(halfTyped)

    openRequestTab('lint')
    act(() =>
      lintMocks.report?.([
        {
          from: 0,
          to: 1,
          line: 1,
          column: 1,
          severity: 'warning',
          message: 'A problem',
          source: 'groq-lint/example',
        },
      ]),
    )
    replyToPrompts({query: '*[_type == "page"][0...$limit]', params: {limit: 5}})
    fireEvent.click(screen.getByTestId('vision-lint-fix'))
    await waitFor(() => expect(getQueryEditor().value).toContain('"page"'))
    expect(promptCalls[1].request).toMatchObject({instructionParams: {params: '{}'}})
    expect(getStoredState().tabs[0].rawParams).toBe(halfTyped)
  })

  it('fixes the lint findings with Agent Actions from the Lint panel', async () => {
    const {fetchCalls, promptCalls, replyToPrompts} = renderRedesign()
    const query = '*[_type == "post" && author->name == "x"]'
    typeQuery(query)
    openRequestTab('lint')
    expect(screen.queryByTestId('vision-lint-fix')).toBeNull()

    act(() =>
      lintMocks.report?.([
        {
          from: 21,
          to: 29,
          line: 1,
          column: 22,
          severity: 'warning',
          message: 'Avoid `->` in a filter',
          source: 'groq-lint/join-in-filter',
        },
      ]),
    )
    replyToPrompts({query: '*[_type == "post" && author._ref in *[name == "x"]._id]', params: {}})
    fireEvent.click(screen.getByTestId('vision-lint-fix'))

    await waitFor(() => expect(fetchCalls).toHaveLength(2))
    expect(promptCalls[0].request).toMatchObject({
      format: 'json',
      instructionParams: {
        query,
        params: '{}',
        diagnostics:
          '- Line 1, column 22 (warning, groq-lint/join-in-filter): Avoid `->` in a filter',
      },
    })
    // No comment is added: the fix is made to the query that was there
    expect(getQueryEditor().value).toBe('*[_type == "post" && author._ref in *[name == "x"]._id]')
  })

  it('loads the fixed query when the Lint tab closes while the fix is running', async () => {
    const {fetchCalls, replyToPrompts} = renderRedesign()
    const query = '*[_type == "post" && author->name == "x"]'
    const fixed = '*[_type == "post" && author._ref in *[name == "x"]._id]'
    typeQuery(query)
    openRequestTab('lint')
    act(() =>
      lintMocks.report?.([
        {
          from: 21,
          to: 29,
          line: 1,
          column: 22,
          severity: 'warning',
          message: 'Avoid `->` in a filter',
          source: 'groq-lint/join-in-filter',
        },
      ]),
    )
    let answer: (reply: {query: string; params: Record<string, never>}) => void = () => {}
    replyToPrompts(
      new Promise((resolve) => {
        answer = resolve
      }),
    )
    fireEvent.click(screen.getByTestId('vision-lint-fix'))

    // Another tab takes the request panel, unmounting the Lint tab's content
    openRequestTab('params')
    expect(screen.queryByTestId('vision-lint-fix')).toBeNull()

    await act(async () => answer({query: fixed, params: {}}))
    await waitFor(() => expect(fetchCalls).toHaveLength(2))
    expect(getQueryEditor().value).toBe(fixed)
  })

  it('resets Fix with AI when the query tab is hidden while a fix is running', async () => {
    const {replyToPrompts} = renderRedesign()
    const query = '*[_type == "post" && author->name == "x"]'
    typeQuery(query)
    openRequestTab('lint')
    act(() =>
      lintMocks.report?.([
        {
          from: 21,
          to: 29,
          line: 1,
          column: 22,
          severity: 'warning',
          message: 'Avoid `->` in a filter',
          source: 'groq-lint/join-in-filter',
        },
      ]),
    )
    // Never settles: the abort has to clear the running status on its own
    replyToPrompts(new Promise(() => {}))
    fireEvent.click(screen.getByTestId('vision-lint-fix'))
    expect(screen.getByTestId('vision-lint-fix-progress')).toBeTruthy()
    expect(isDisabled(screen.getByTestId('vision-lint-fix'))).toBe(true)

    // Another query tab hides this one in an Activity boundary: effects clean up and abort, state stays
    fireEvent.click(screen.getByTestId('vision-new-tab'))
    fireEvent.click(within(screen.getAllByTestId('vision-tab')[0]).getByTestId('vision-tab-button'))
    openRequestTab('lint')
    expect(screen.getByTestId('vision-lint-fix')).toBeTruthy()
    expect(screen.queryByTestId('vision-lint-fix-progress')).toBeNull()
    expect(isDisabled(screen.getByTestId('vision-lint-fix'))).toBe(false)
  })

  it('offers no Fix with AI when the config turns it off', () => {
    renderRedesign(BASE_PERSPECTIVE, {ai: {fixLint: false}})
    typeQuery('*[_type == "post" && author->name == "x"]')
    openRequestTab('lint')
    act(() =>
      lintMocks.report?.([
        {
          from: 21,
          to: 29,
          line: 1,
          column: 22,
          severity: 'warning',
          message: 'Avoid `->` in a filter',
          source: 'groq-lint/join-in-filter',
        },
      ]),
    )
    expect(screen.getByTestId('vision-lint-finding')).toBeTruthy()
    expect(screen.queryByTestId('vision-lint-fix')).toBeNull()
  })

  it('offers the last attempt when every generated query is rejected', async () => {
    const {fetchCalls, failWith, replyToPrompts} = renderRedesign()
    const rejected = '*[_type == "author"] limit 10'
    replyToPrompts(...Array.from({length: 3}, () => ({query: rejected, params: {}})))
    failWith(
      Object.assign(new Error('GROQ query parse error'), {
        details: {type: 'queryParseError', description: 'unexpected token "limit"'},
      }),
    )

    fireEvent.click(screen.getByTestId('vision-generate-query'))
    const bar = screen.getByTestId('vision-generate-bar')
    fireEvent.change(within(bar).getByTestId('vision-generate-request'), {
      target: {value: 'Ten authors'},
    })
    fireEvent.click(within(bar).getByTestId('vision-generate-submit'))

    const error = await within(bar).findByTestId('vision-generate-error')
    expect(text(error)).toContain('vision.generate.failed')
    expect(text(error)).toContain('unexpected token "limit"')
    expect(text(error)).toContain(rejected)
    expect(fetchCalls).toHaveLength(3)

    fireEvent.click(within(error).getByTestId('vision-generate-open-anyway'))
    await waitFor(() => expect(getQueryEditor().value).toContain('limit 10'))
    expect(screen.getAllByTestId('vision-tab')).toHaveLength(1)
    // Opened to be fixed by hand, not run
    expect(fetchCalls).toHaveLength(3)
  })

  it('keeps the shown result and its actions while a refetch is in flight', async () => {
    preferTreeView()
    const {fetchCalls, holdFetches, respondWith} = renderRedesign()
    typeQuery('*[_type == "author"]')
    // Nothing to copy yet
    expect(isDisabled(screen.getByTestId('vision-copy-result'))).toBe(true)
    fireEvent.click(screen.getByTestId('vision-fetch-button'))
    await waitFor(() => expect(screen.getByTestId('result-json')).toBeTruthy())
    // With a result there is
    expect(isDisabled(screen.getByTestId('vision-copy-result'))).toBe(false)

    const release = holdFetches()
    respondWith({result: [{title: 'Newer'}], ms: 34, syncTags: ['s1:abc']})
    fireEvent.click(screen.getByTestId('vision-fetch-button'))
    await waitFor(() => expect(fetchCalls).toHaveLength(2))

    // The previous result stays on screen until the new one arrives, and so does everything
    // that works on it
    expect(text(screen.getByTestId('result-json'))).toContain('Variant title')
    expect(isDisabled(screen.getByTestId('vision-copy-result'))).toBe(false)
    const menu = await openExportMenu()
    expect(isItemDisabled(within(menu).getByTestId('vision-export-json'))).toBe(false)
    expect(isItemDisabled(within(menu).getByTestId('vision-export-csv'))).toBe(false)
    fireEvent.keyDown(menu, {key: 'Escape'})
    // Fetch reads Stop meanwhile, named for what it stops next to Stop live
    const fetchButton = screen.getByTestId('vision-fetch-button')
    expect(text(fetchButton)).toBe('vision.query.stop')
    expect(fetchButton.getAttribute('aria-label')).toBe('vision.query.stop.description')

    release()
    await waitFor(() => expect(text(screen.getByTestId('result-json'))).toContain('Newer'))
    expect(text(fetchButton)).toBe('action.query-execute')
    expect(text(screen.getByTestId('vision-meta-execution'))).toContain('34ms')
    expect(isDisabled(screen.getByTestId('vision-copy-result'))).toBe(false)
  })

  it('serializes the result for a download only when one is asked for', async () => {
    preferTreeView()
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
      const {respondWith} = renderRedesign()
      typeQuery('*[_type == "lazy"]')
      respondWith({result: [{title: 'Lazy download'}], ms: 12, syncTags: []})
      fireEvent.click(screen.getByTestId('vision-fetch-button'))
      await waitFor(() =>
        expect(text(screen.getByTestId('result-json'))).toContain('Lazy download'),
      )

      // The response is on screen and both downloads are offered, but no file has been built
      let menu = await openExportMenu()
      expect(isItemDisabled(within(menu).getByTestId('vision-export-json'))).toBe(false)
      expect(isItemDisabled(within(menu).getByTestId('vision-export-csv'))).toBe(false)
      expect(createObjectURL).not.toHaveBeenCalled()

      fireEvent.click(within(menu).getByTestId('vision-export-json'))
      expect(createObjectURL).toHaveBeenCalledTimes(1)
      expect(createObjectURL.mock.calls[0][0].type).toBe('application/json')
      expect(anchorClick).toHaveBeenCalledTimes(1)
      const [anchor] = anchorClick.mock.contexts as HTMLAnchorElement[]
      expect(anchor.download).toBe('query-result.json')
      expect(anchor.href).toBe('blob:application/json')
      // Asking for the same result again reuses the file
      menu = await openExportMenu()
      fireEvent.click(within(menu).getByTestId('vision-export-json'))
      expect(createObjectURL).toHaveBeenCalledTimes(1)

      menu = await openExportMenu()
      fireEvent.click(within(menu).getByTestId('vision-export-csv'))
      expect(createObjectURL).toHaveBeenCalledTimes(2)
      expect(createObjectURL.mock.calls[1][0].type).toBe('text/csv')
      expect((anchorClick.mock.contexts.at(-1) as HTMLAnchorElement).download).toBe(
        'query-result.csv',
      )

      // A result without objects has no CSV to offer, and the item says why, while the JSON
      // stays available
      respondWith({result: [1, 2, 3], ms: 12, syncTags: []})
      fireEvent.click(screen.getByTestId('vision-fetch-button'))
      await waitFor(() => expect(text(screen.getByTestId('result-json'))).toBe('[1,2,3]'))
      menu = await openExportMenu()
      expect(isItemDisabled(within(menu).getByTestId('vision-export-json'))).toBe(false)
      const csvItem = within(menu).getByTestId('vision-export-csv')
      expect(isItemDisabled(csvItem)).toBe(true)
      expect(text(csvItem)).toContain('vision.result.export-csv')
      expect(text(csvItem)).toContain('result.save-result-as-csv.not-csv-encodable')
      // The hint is a sibling of the ellipsized label, so the menu does not clip it to one line
      const csvLabel = within(csvItem).getByText('vision.result.export-csv')
      const csvHint = within(csvItem).getByText('result.save-result-as-csv.not-csv-encodable')
      const hintText = csvHint.closest('[data-ui="Text"]')
      expect(csvLabel.closest('[data-ui="Text"]')).not.toBe(hintText)
      expect(hintText?.classList.contains(styles.exportUnavailableHint)).toBe(true)
      fireEvent.click(csvItem)
      expect(createObjectURL).toHaveBeenCalledTimes(2)
    } finally {
      anchorClick.mockRestore()
      if (objectUrl) Object.defineProperty(URL, 'createObjectURL', objectUrl)
      else Reflect.deleteProperty(URL, 'createObjectURL')
      if (revokeUrl) Object.defineProperty(URL, 'revokeObjectURL', revokeUrl)
      else Reflect.deleteProperty(URL, 'revokeObjectURL')
    }
  })

  it('offers the file exports first in the More actions menu, then the type exports', async () => {
    const {respondWith} = renderRedesign()
    typeQuery('*[_type == "author"]')
    respondWith({result: [{title: 'Exported'}], ms: 5, syncTags: []})
    await waitFor(() => expect(isDisabled(screen.getByTestId('vision-fetch-button'))).toBe(false))
    fireEvent.click(screen.getByTestId('vision-fetch-button'))
    await screen.findByTestId('vision-result-json')

    // An icon button, named by its tooltip
    const actions = screen.getByTestId('vision-result-actions')
    const menuButton = within(actions).getByTestId('vision-result-menu-button')
    expect(text(menuButton)).toBe('')
    expect(menuButton.querySelectorAll('svg')).toHaveLength(1)
    expect(menuButton.getAttribute('aria-label')).toBe('vision.result.more-actions')
    expect(visionLocaleStrings['vision.result.more-actions']).toBe('More actions')
    fireEvent.mouseEnter(screen.getByTestId('vision-result-menu-tooltip-target'))
    expect(await screen.findByText('vision.result.more-actions')).toBeTruthy()

    const menu = await openExportMenu()
    const entries = Array.from(menu.querySelectorAll('[data-testid^="vision-export-"], hr'), (el) =>
      el.tagName === 'HR' ? 'divider' : el.getAttribute('data-testid'),
    )
    expect(entries).toEqual([
      'vision-export-json',
      'vision-export-csv',
      'divider',
      'vision-export-typescript',
      'vision-export-zod',
    ])
    expect(visionLocaleStrings['vision.result.export-json']).toBe('Save as JSON…')
    expect(visionLocaleStrings['vision.result.export-csv']).toBe('Save as CSV…')
    expect(text(within(menu).getByTestId('vision-export-json'))).toBe('vision.result.export-json')
    expect(text(within(menu).getByTestId('vision-export-csv'))).toBe('vision.result.export-csv')
    expect(within(menu).queryByText('vision.result.copy')).toBeNull()
  })

  it('runs the query with the keyboard shortcut and marks the reason', async () => {
    const {fetchCalls} = renderRedesign()
    typeQuery('*')

    fireEvent.keyDown(getQueryEditor(), {key: 'Enter', ctrlKey: true, which: 13, keyCode: 13})

    await waitFor(() => expect(fetchCalls).toHaveLength(1))
    fireEvent.click(document.getElementById('vision-response-history-tab') as HTMLElement)
    await waitFor(() =>
      expect(text(screen.getByTestId('vision-history-entry'))).toContain(
        'vision.history.reason.shortcut',
      ),
    )
  })

  it('shows fetch errors in the result panel and the history', async () => {
    const {failWith} = renderRedesign()
    failWith(new Error('Syntax error in GROQ query'))
    typeQuery('*[')

    fireEvent.click(screen.getByTestId('vision-fetch-button'))

    await waitFor(() =>
      expect(text(screen.getByTestId('vision-result'))).toContain('Syntax error in GROQ query'),
    )
    fireEvent.click(document.getElementById('vision-response-history-tab') as HTMLElement)
    expect(text(screen.getByTestId('vision-history-entry'))).toContain('vision.history.failed')
  })

  it('explains a failure with the options the request went out with, not the tab’s current ones', async () => {
    const initial = createInitialState(DEFAULTS)
    // A release stack on an API version from before releases: the failure gets a capability hint
    const tab = createTab(initial.settings, {
      id: 'old',
      query: '*',
      options: {apiVersion: 'v2021-10-21', perspective: 'global'},
    })
    saveVisionState(PROJECT_ID, {...initial, tabs: [tab], activeTabId: 'old'})
    const {failWith, holdFetches, fetchCalls} = renderRedesign({
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
    fireEvent.click(screen.getByTestId('vision-fetch-button'))
    await waitFor(() => expect(fetchCalls).toHaveLength(1))
    expect(fetchCalls[0].config.perspective).toEqual(['rSummer', 'drafts'])

    // The tab moves to a plain perspective while the request is still in flight
    openRequestTab('options')
    pickMenuItem('vision-option-perspective-select', 'published')
    release()

    await waitFor(() =>
      expect(text(screen.getByTestId('vision-result'))).toContain('Complex perspectives'),
    )
    expect(text(screen.getByTestId('query-error-api-version-capability-hint'))).toContain(
      'query.error.unsupported-release-perspective',
    )
  })

  it('animates in only the tabs a click adds', () => {
    renderRedesign()
    const entering = () =>
      screen.getAllByTestId('vision-tab').map((tab) => tab.getAttribute('data-entering'))
    // The tabs the strip mounts with are already in place
    expect(entering()).toEqual([null])

    fireEvent.click(screen.getByTestId('vision-new-tab'))
    expect(entering()).toEqual([null, 'true'])

    // Closing from the keyboard, including the last tab's replacement, settles at once
    fireEvent.keyDown(within(screen.getAllByTestId('vision-tab')[1]).getByRole('tab'), {
      key: 'Delete',
    })
    expect(entering()).toEqual([null])
    const replaced = screen.getByTestId('vision-tab-button').id
    fireEvent.keyDown(screen.getByTestId('vision-tab-button'), {key: 'Delete'})
    expect(screen.getByTestId('vision-tab-button').id).not.toBe(replaced)
    expect(entering()).toEqual([null])

    // The pointer is back in charge
    fireEvent.pointerDown(screen.getByTestId('vision-new-tab'))
    fireEvent.click(screen.getByTestId('vision-new-tab'))
    expect(entering()).toEqual([null, 'true'])
  })

  it('opens, switches, renames and closes tabs, and persists them', async () => {
    renderRedesign()
    typeQuery('*[_type == "author"]')

    fireEvent.click(screen.getByTestId('vision-new-tab'))
    let tabs = screen.getAllByTestId('vision-tab')
    expect(tabs).toHaveLength(2)
    expect(within(tabs[1]).getByRole('tab').getAttribute('aria-selected')).toBe('true')
    expect(within(tabs[1]).getByRole('tab').getAttribute('aria-controls')).toBe(shownTab().id)
    expect(shownTab().getAttribute('role')).toBe('tabpanel')
    expect(getQueryEditor().value).toBe('')

    const selectedTab = () =>
      screen
        .getAllByTestId('vision-tab')
        .findIndex((tab) => within(tab).getByRole('tab').getAttribute('aria-selected') === 'true')
    fireEvent.click(within(tabs[0]).getByTestId('vision-tab-button'))
    expect(selectedTab()).toBe(0)
    expect(getQueryEditor().value).toBe('*[_type == "author"]')

    // Arrow keys move between tabs and activate them
    fireEvent.keyDown(within(screen.getAllByTestId('vision-tab')[0]).getByRole('tab'), {
      key: 'ArrowRight',
    })
    expect(selectedTab()).toBe(1)
    fireEvent.keyDown(within(screen.getAllByTestId('vision-tab')[1]).getByRole('tab'), {
      key: 'Home',
    })
    expect(selectedTab()).toBe(0)
    expect(getQueryEditor().value).toBe('*[_type == "author"]')

    // F2 renames from the keyboard, double-click with the pointer; leaving the input with the
    // keyboard puts focus back on the tab
    fireEvent.keyDown(within(screen.getAllByTestId('vision-tab')[0]).getByRole('tab'), {key: 'F2'})
    const titleInput = screen.getByTestId('vision-tab-title-input')
    titleInput.focus()
    fireEvent.keyDown(titleInput, {key: 'Escape'})
    expect(screen.queryByTestId('vision-tab-title-input')).toBeNull()
    await waitFor(() =>
      expect(document.activeElement).toBe(
        within(screen.getAllByTestId('vision-tab')[0]).getByRole('tab'),
      ),
    )
    fireEvent.doubleClick(
      within(screen.getAllByTestId('vision-tab')[0]).getByTestId('vision-tab-button'),
    )
    const input = screen.getByTestId('vision-tab-title-input') as HTMLInputElement
    // The rename starts from the current, query-derived title
    expect(input.value).toBe('author')
    fireEvent.change(input, {target: {value: 'Authors'}})
    fireEvent.keyDown(input, {key: 'Enter'})
    expect(
      text(within(screen.getAllByTestId('vision-tab')[0]).getByTestId('vision-tab-button')),
    ).toContain('Authors')

    await waitFor(() => {
      const stored = getStoredState()
      expect(stored.tabs).toHaveLength(2)
      expect(stored.tabs[0]).toMatchObject({title: 'Authors', query: '*[_type == "author"]'})
      expect(stored.activeTabId).toBe(stored.tabs[0].id)
    })

    fireEvent.click(within(screen.getAllByTestId('vision-tab')[1]).getByTestId('vision-tab-close'))
    tabs = screen.getAllByTestId('vision-tab')
    expect(tabs).toHaveLength(1)
    expect(text(tabs[0])).toContain('Authors')

    // Shift with an arrow moves the focused tab, the keyboard counterpart of dragging it
    fireEvent.click(screen.getByTestId('vision-new-tab'))
    expect(screen.getAllByTestId('vision-tab').map(text)).toEqual([
      expect.stringContaining('Authors'),
      expect.stringContaining('vision.tabs.untitled'),
    ])
    fireEvent.keyDown(within(screen.getAllByTestId('vision-tab')[1]).getByRole('tab'), {
      key: 'ArrowLeft',
      shiftKey: true,
    })
    expect(screen.getAllByTestId('vision-tab').map(text)).toEqual([
      expect.stringContaining('vision.tabs.untitled'),
      expect.stringContaining('Authors'),
    ])
    expect(selectedTab()).toBe(0)
    // Moving past the edge is a no-op
    fireEvent.keyDown(within(screen.getAllByTestId('vision-tab')[0]).getByRole('tab'), {
      key: 'ArrowLeft',
      shiftKey: true,
    })
    expect(text(screen.getAllByTestId('vision-tab')[0])).toContain('vision.tabs.untitled')
    await waitFor(() =>
      expect(getStoredState().tabs.map((stored: {title?: string}) => stored.title)).toEqual([
        undefined,
        'Authors',
      ]),
    )
    fireEvent.keyDown(within(screen.getAllByTestId('vision-tab')[0]).getByRole('tab'), {
      key: 'ArrowRight',
      shiftKey: true,
    })
    expect(text(screen.getAllByTestId('vision-tab')[0])).toContain('Authors')
    expect(
      within(screen.getByTestId('vision-tab-bar')).getByRole('tablist').getAttribute('aria-label'),
    ).toBe('vision.tabs.label')

    // Delete closes the focused tab (the close button is not a tab stop); the last tab is
    // replaced by a fresh one
    expect(screen.getAllByTestId('vision-tab')).toHaveLength(2)
    fireEvent.keyDown(within(screen.getAllByTestId('vision-tab')[1]).getByRole('tab'), {
      key: 'Delete',
    })
    tabs = screen.getAllByTestId('vision-tab')
    expect(tabs).toHaveLength(1)
    expect(text(tabs[0])).toContain('Authors')

    fireEvent.click(within(tabs[0]).getByTestId('vision-tab-close'))
    expect(screen.getAllByTestId('vision-tab')).toHaveLength(1)
    expect(text(screen.getByTestId('vision-tab-button'))).toContain('vision.tabs.untitled')
  })

  it('opens, switches and closes tabs with the VS Code shortcuts wherever the focus is in the tool', async () => {
    renderRedesign()
    const tabButtons = () => screen.getAllByTestId('vision-tab-button')
    const selectedTab = () =>
      tabButtons().findIndex((button) => button.getAttribute('aria-selected') === 'true')
    typeQuery('*[_type == "author"]')

    // The browser's own action for the keys is cancelled
    expect(fireEvent.keyDown(getQueryEditor(), NEW_TAB_KEYS)).toBe(false)
    expect(tabButtons()).toHaveLength(2)
    expect(selectedTab()).toBe(1)
    expect(getQueryEditor().value).toBe('')
    // The focus moves into the tab shown now, so the next shortcut lands in the tool too
    await waitFor(() => expect(document.activeElement).toBe(getQueryEditor()))

    // Switching wraps around at either end. Pressed in the strip, the focus stays on the tabs as
    // it does with the arrow keys; pressed anywhere else, it goes into the shown tab's editor
    fireEvent.keyDown(tabButtons()[1], NEXT_TAB_KEYS)
    expect(selectedTab()).toBe(0)
    expect(getQueryEditor().value).toBe('*[_type == "author"]')
    await waitFor(() => expect(document.activeElement).toBe(tabButtons()[0]))
    fireEvent.keyDown(getParamsEditor(), {...NEXT_TAB_KEYS, shiftKey: true})
    expect(selectedTab()).toBe(1)
    await waitFor(() => expect(document.activeElement).toBe(getQueryEditor()))
    fireEvent.keyDown(getQueryEditor(), {
      key: 'PageUp',
      ctrlKey: true,
      altKey: true,
      which: 33,
      keyCode: 33,
    })
    expect(selectedTab()).toBe(0)
    fireEvent.keyDown(getQueryEditor(), {
      key: 'PageDown',
      ctrlKey: true,
      altKey: true,
      which: 34,
      keyCode: 34,
    })
    expect(selectedTab()).toBe(1)

    // Closing does what the tab's close button does, down to replacing the last tab
    fireEvent.keyDown(getQueryEditor(), CLOSE_TAB_KEYS)
    expect(tabButtons()).toHaveLength(1)
    expect(getQueryEditor().value).toBe('*[_type == "author"]')
    const last = tabButtons()[0].id
    fireEvent.keyDown(getQueryEditor(), {key: 'w', ctrlKey: true, which: 87, keyCode: 87})
    expect(tabButtons()).toHaveLength(1)
    expect(tabButtons()[0].id).not.toBe(last)
    expect(getQueryEditor().value).toBe('')
    await waitFor(() => expect(document.activeElement).toBe(getQueryEditor()))
    await waitFor(() => expect(getStoredState().tabs).toHaveLength(1))

    // Keys pressed outside the tool are left to the rest of the studio, and to the browser
    expect(fireEvent.keyDown(document.body, NEW_TAB_KEYS)).toBe(true)
    expect(tabButtons()).toHaveLength(1)
  })

  it('leaves the focus where it is when the tab shortcuts have no other tab to switch to', async () => {
    renderRedesign()
    const params = getParamsEditor()
    act(() => params.focus())
    expect(document.activeElement).toBe(params)

    expect(fireEvent.keyDown(params, NEXT_TAB_KEYS)).toBe(false)
    fireEvent.keyDown(params, {...NEXT_TAB_KEYS, shiftKey: true})
    // A switch moves the focus on the next frame
    await act(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())))
    expect(screen.getAllByTestId('vision-tab-button')).toHaveLength(1)
    expect(document.activeElement).toBe(params)
  })

  it('puts the focus on the tab when its editor cannot take it, as in the phone layout with the result shown', async () => {
    renderRedesign()
    const root = await screen.findByTestId('vision-root')
    resizeElement(root, {width: 560, height: 800})
    expect(root.dataset.visionLayout).toBe('mobile')
    fireEvent.click(within(shownTab()).getByRole('tab', {name: 'result.label'}))

    // A new tab shows its query, so its editor takes the focus
    fireEvent.keyDown(getQueryEditor(), NEW_TAB_KEYS)
    await waitFor(() => expect(document.activeElement).toBe(getQueryEditor()))
    // The first tab still shows its result, with the query editor hidden behind it
    fireEvent.keyDown(getQueryEditor(), NEXT_TAB_KEYS)
    const firstTab = screen.getAllByTestId('vision-tab-button')[0]
    expect(firstTab.getAttribute('aria-selected')).toBe('true')
    await waitFor(() => expect(document.activeElement).toBe(firstTab))
  })

  it('keeps every tab pane in place, without moving its DOM node, when the tabs are reordered', () => {
    renderRedesign()
    fireEvent.click(screen.getByTestId('vision-new-tab'))
    fireEvent.click(screen.getByTestId('vision-new-tab'))
    const tabIds = () =>
      screen.getAllByTestId('vision-tab-button').map((button) => button.getAttribute('id'))
    const initialOrder = tabIds()
    const panes = screen.getAllByTestId('vision-query-tab')
    expect(panes).toHaveLength(3)
    const shown = shownTab()

    // A node React moves is removed and inserted again, which is what resets a pane's scroll
    const observer = new MutationObserver(() => {})
    observer.observe(document.body, {childList: true, subtree: true})
    const moveActiveTab = (key: 'ArrowLeft' | 'ArrowRight') =>
      fireEvent.keyDown(
        screen.getAllByRole('tab').find((tab) => tab.getAttribute('aria-selected') === 'true')!,
        {key, shiftKey: true},
      )
    // The keyboard sends the same reorder a drag does, one swap at a time
    moveActiveTab('ArrowLeft')
    moveActiveTab('ArrowLeft')
    expect(tabIds()).toEqual([initialOrder[2], initialOrder[0], initialOrder[1]])
    moveActiveTab('ArrowRight')
    expect(tabIds()).toEqual([initialOrder[0], initialOrder[2], initialOrder[1]])
    const moved = observer
      .takeRecords()
      .flatMap((record) => [...record.removedNodes, ...record.addedNodes])
      .filter((node) => panes.some((pane) => node === pane || node.contains(pane)))
    observer.disconnect()

    expect(moved).toEqual([])
    expect(screen.getAllByTestId('vision-query-tab')).toEqual(panes)
    expect(shownTab()).toBe(shown)
  })

  it('keeps the query, params, result and panel state of each tab apart', async () => {
    const {fetchCalls} = renderRedesign()
    const paramsEditor = () =>
      within(within(shownTab()).getByTestId('vision-params-editor')).getByTestId(
        'codemirror-mock',
      ) as HTMLTextAreaElement
    const tabButton = (index: number) =>
      within(screen.getAllByTestId('vision-tab')[index]).getByTestId('vision-tab-button')

    typeQuery('*[_type == $type]')
    fireEvent.change(paramsEditor(), {target: {value: '{"type": "author"}'}})
    await waitFor(() =>
      expect(isDisabled(within(shownTab()).getByTestId('vision-fetch-button'))).toBe(false),
    )
    fireEvent.click(within(shownTab()).getByTestId('vision-fetch-button'))
    await waitFor(() => expect(within(shownTab()).getByTestId('vision-result-json')).toBeTruthy())
    expect(fetchCalls).toHaveLength(1)

    // The new tab starts empty, in editors of its own
    fireEvent.click(screen.getByTestId('vision-new-tab'))
    expect(getQueryEditor().value).toBe('')
    expect(paramsEditor().value).toBe(DEFAULT_PARAMS)
    expect(within(shownTab()).queryByTestId('vision-result-json')).toBeNull()
    expect(text(within(shownTab()).getByTestId('vision-result'))).toContain('vision.result.empty')
    expect(isDisabled(within(shownTab()).getByTestId('vision-fetch-button'))).toBe(true)
    expect(fetchCalls).toHaveLength(1)
    // The debounced params edit of the first tab was committed to that tab, not this one
    await waitFor(() => {
      const stored = getStoredState()
      expect(stored.tabs[0].rawParams).toBe('{"type": "author"}')
      expect(stored.tabs[1].rawParams).toBe(DEFAULT_PARAMS)
    })

    typeQuery('*[_type == "book"]')
    fireEvent.change(paramsEditor(), {target: {value: '{"limit": 2}'}})

    // Back on the first tab: its query, params and result are shown again, without refetching
    fireEvent.click(tabButton(0))
    expect(getQueryEditor().value).toBe('*[_type == $type]')
    expect(within(shownTab()).getByTestId('vision-result-json')).toBeTruthy()
    expect(fetchCalls).toHaveLength(1)
    expect(paramsEditor().value).toBe('{"type": "author"}')
    await waitFor(() => expect(getStoredState().tabs[1].rawParams).toBe('{"limit": 2}'))

    fireEvent.click(tabButton(1))
    expect(getQueryEditor().value).toBe('*[_type == "book"]')
    expect(paramsEditor().value).toBe('{"limit": 2}')
    expect(within(shownTab()).queryByTestId('vision-result-json')).toBeNull()

    // Running the second tab's query reads that tab's params
    await waitFor(() =>
      expect(isDisabled(within(shownTab()).getByTestId('vision-fetch-button'))).toBe(false),
    )
    fireEvent.click(within(shownTab()).getByTestId('vision-fetch-button'))
    await waitFor(() => expect(fetchCalls).toHaveLength(2))
    expect(fetchCalls[1]).toMatchObject({query: '*[_type == "book"]', params: {limit: 2}})
  })

  it('keeps every open tab mounted, hiding the others, with the element ids in the shown one only', async () => {
    const {fetchCalls} = renderRedesign()
    typeQuery('*[_type == "author"]')
    const firstEditor = getQueryEditor()

    fireEvent.click(screen.getByTestId('vision-new-tab'))
    typeQuery('*[_type == "book"]')
    expect(screen.getAllByTestId('vision-query-tab')).toHaveLength(2)
    expect(getQueryEditor()).not.toBe(firstEditor)
    expect(firstEditor.isConnected).toBe(true)
    expect(firstEditor.closest('[style*="display: none"]')).not.toBeNull()
    // Labels, tab panels and the code that looks elements up by id reach the shown tab's
    for (const id of [QUERY_TAB_PANEL_ID, 'vision-request-params-tab', 'vision-result-content']) {
      expect(document.querySelectorAll(`[id="${id}"]`)).toHaveLength(1)
      expect(shownTab().contains(document.getElementById(id))).toBe(true)
    }

    // Only the shown tab answers the keyboard shortcuts
    fireEvent.keyDown(getQueryEditor(), {key: 'Enter', ctrlKey: true, which: 13, keyCode: 13})
    await waitFor(() => expect(fetchCalls).toHaveLength(1))
    expect(fetchCalls[0]).toMatchObject({query: '*[_type == "book"]'})

    // Switching back shows the same elements again rather than new ones
    fireEvent.click(within(screen.getAllByTestId('vision-tab')[0]).getByTestId('vision-tab-button'))
    expect(getQueryEditor()).toBe(firstEditor)
    expect(getQueryEditor().value).toBe('*[_type == "author"]')
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(fetchCalls).toHaveLength(1)
  })

  it('only derives types from a result that was fetched for the current query', async () => {
    preferTreeView()
    renderRedesign()
    typeQuery('*[_type == "author"]')
    await waitFor(() => expect(isDisabled(screen.getByTestId('vision-fetch-button'))).toBe(false))
    fireEvent.click(screen.getByTestId('vision-fetch-button'))
    await waitFor(() => expect(screen.getByTestId('result-json')).toBeTruthy())

    fireEvent.click(within(await openExportMenu()).getByTestId('vision-export-typescript'))
    // No schema in the test studio mock, so the fetched result is what the types come from
    await waitFor(() =>
      expect(text(screen.getByTestId('vision-export-types-source'))).toContain(
        'vision.export-types.source.result',
      ),
    )
    expect(text(screen.getByTestId('vision-export-types-code'))).toContain(
      'export type AuthorQueryResult = Array<{\n  title: string;\n}>;',
    )
    fireEvent.keyDown(screen.getByTestId('vision-export-types-dialog'), {key: 'Escape'})

    // The shown result no longer belongs to the edited query
    typeQuery('*[_type == "book"]')
    fireEvent.click(within(await openExportMenu()).getByTestId('vision-export-typescript'))
    await waitFor(() =>
      expect(text(screen.getByTestId('vision-export-types-source'))).toContain(
        'vision.export-types.stale-result',
      ),
    )
    expect(screen.queryByTestId('vision-export-types-code')).toBeNull()
  })

  it('exports types for the params the query uses from the params menu', async () => {
    renderRedesign()
    const openParamsMenu = () => openMenu('vision-params-menu-button', 'vision-params-menu')

    // A query without params has nothing to type
    typeQuery('*[_type == "author"]')
    let menu = await openParamsMenu()
    expect(isItemDisabled(within(menu).getByTestId('vision-params-export-typescript'))).toBe(true)
    expect(isItemDisabled(within(menu).getByTestId('vision-params-export-zod'))).toBe(true)
    fireEvent.keyDown(menu, {key: 'Escape'})

    typeQuery('*[_type == "author" && name == $name][0...$limit]')
    menu = await openParamsMenu()
    fireEvent.click(within(menu).getByTestId('vision-params-export-typescript'))
    await waitFor(() =>
      expect(text(screen.getByTestId('vision-export-params-code'))).toContain(
        'export type AuthorQueryParams = {\n  /** Could not be inferred because `name`, which it is compared with, needs the workspace schema to be typed */\n  name: unknown;\n  limit: number;\n};',
      ),
    )
    fireEvent.keyDown(screen.getByTestId('vision-export-params-dialog'), {key: 'Escape'})

    fireEvent.click(within(await openParamsMenu()).getByTestId('vision-params-export-zod'))
    await waitFor(() =>
      expect(text(screen.getByTestId('vision-export-params-code'))).toContain(
        'export const AuthorQueryParamsSchema = z.object({',
      ),
    )
  })

  it('restores persisted tabs and settings on mount', () => {
    const initial = createInitialState(DEFAULTS)
    const tab = createTab(initial.settings, {
      id: 'restored',
      title: 'Restored',
      query: '*[_type == "book"]',
      options: {datasetMode: 'override', dataset: 'staging', perspective: 'drafts'},
    })
    saveVisionState(PROJECT_ID, {
      ...initial,
      tabs: [tab],
      activeTabId: 'restored',
      sidebar: {expanded: true, drawer: null},
    })

    renderRedesign()

    expect(text(screen.getByTestId('vision-tab-button'))).toContain('Restored')
    expect(getQueryEditor().value).toBe('*[_type == "book"]')
    openRequestTab('options')
    expect(selectValue('vision-option-dataset-select')).toBe('staging')
    expect(selectValue('vision-option-perspective-select')).toBe('drafts')
    expect(text(screen.getByTestId('vision-sidebar-toggle'))).toContain('vision.sidebar.collapse')
  })

  it('refetches from live events that carry one of the response sync tags', async () => {
    preferTreeView()
    const {fetchCalls, liveEvents, liveSubscriptionCount, respondWith} = renderRedesign()
    typeQuery('*[_type == "author"]')
    fireEvent.click(screen.getByTestId('vision-fetch-button'))
    await waitFor(() => expect(fetchCalls).toHaveLength(1))
    // Live follows the shown response's sync tags, without fetching on its own
    fireEvent.click(within(shownTab()).getByTestId('vision-auto-refetch'))
    await waitFor(() => expect(liveSubscriptionCount()).toBe(1))
    expect(fetchCalls).toHaveLength(1)

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

    fireEvent.click(document.getElementById('vision-response-history-tab') as HTMLElement)
    const entries = screen.getAllByTestId('vision-history-entry')
    expect(text(entries[0])).toContain('vision.history.reason.live')
    expect(text(entries[0])).toContain('s1:abc')
    expect(text(entries[1])).toContain('vision.history.reason.manual')

    // The next response's tags are the ones that count now
    act(() => {
      liveEvents.next({type: 'message', id: '3', tags: ['s1:abc']})
    })
    expect(fetchCalls).toHaveLength(2)
    act(() => {
      liveEvents.next({type: 'message', id: '4', tags: ['s1:def']})
    })
    await waitFor(() => expect(fetchCalls).toHaveLength(3))

    // A background tab does not refetch, but its paused subscription stays up and remembers
    // relevant events
    const firstTab = () => within(screen.getAllByTestId('vision-tab')[0])
    fireEvent.click(screen.getByTestId('vision-new-tab'))
    await waitFor(() => expect(screen.getAllByTestId('vision-tab')).toHaveLength(2))
    respondWith({result: [{title: 'Caught up'}], ms: 3, syncTags: ['s1:def']})
    act(() => {
      liveEvents.next({type: 'message', id: '5', tags: ['s1:def']})
      liveEvents.next({type: 'message', id: '6', tags: ['s1:nope']})
      liveEvents.next({type: 'message', id: '7', tags: ['s1:def']})
    })
    expect(liveEvents.observed).toBe(true)
    expect(fetchCalls).toHaveLength(3)

    // Coming back catches up with one refetch, on the same subscription
    fireEvent.click(firstTab().getByTestId('vision-tab-button'))
    await waitFor(() => expect(fetchCalls).toHaveLength(4))
    await waitFor(() => expect(text(screen.getByTestId('result-json'))).toContain('Caught up'))
    expect(liveSubscriptionCount()).toBe(1)
    expect(within(shownTab()).getByTestId('vision-auto-refetch').textContent).toContain(
      'vision.live.stop',
    )

    // Nothing relevant while away: back to live without a refetch
    fireEvent.click(within(screen.getAllByTestId('vision-tab')[1]).getByTestId('vision-tab-button'))
    act(() => {
      liveEvents.next({type: 'message', id: '8', tags: ['s1:nope']})
    })
    fireEvent.click(firstTab().getByTestId('vision-tab-button'))
    await waitFor(() => expect(screen.getByTestId('result-json')).toBeTruthy())
    expect(fetchCalls).toHaveLength(4)
    act(() => {
      liveEvents.next({type: 'message', id: '9', tags: ['s1:def']})
    })
    await waitFor(() => expect(fetchCalls).toHaveLength(5))

    // The History tab still says which fetches live made
    fireEvent.click(document.getElementById('vision-response-history-tab') as HTMLElement)
    expect(text(screen.getAllByTestId('vision-history-entry')[1])).toContain(
      'vision.history.reason.live',
    )
  })

  it('prettifies the query with groq-format and reports queries that do not parse', async () => {
    renderRedesign()
    const compact =
      '*[_type=="author"&&name match $q]{_id,name,"posts":*[references(^._id)]{title}}'
    typeQuery(compact)

    // Without a laid-out editor to measure, lines wrap at the formatter's default width
    fireEvent.click(await screen.findByTestId('vision-query-format'))

    const formatted = [
      '*[_type == "author" && name match $q] {',
      '  _id,',
      '  name,',
      '  "posts": *[references(^._id)] { title }',
      '}',
    ].join('\n')
    await waitFor(() => expect(getQueryEditor().value).toBe(formatted))
    await waitFor(() => expect(getStoredState().tabs[0].query).toBe(formatted))
    // A formatted query has nothing left to format
    await waitFor(() => expect(screen.queryByTestId('vision-query-format')).toBeNull())

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
    const formatButton = await screen.findByTestId('vision-query-format')
    // Deciding whether to offer Format measures too; only the click's measuring counts here
    widthsAsked.length = 0
    fireEvent.click(formatButton)

    const narrow = [
      '*[',
      '  _type == "author"',
      '  && name match $q',
      '] {',
      '  _id,',
      '  name,',
      '  "posts": *[',
      '    references(^._id)',
      '  ] { title }',
      '}',
    ].join('\n')
    await waitFor(() => expect(getQueryEditor().value).toBe(narrow))
    // Measured for the query's one line, then for the 7 lines of the first pass and the 10 of the
    // second. Offering Format again measures the formatted query, and auto-formatting on resize
    // measures the editor as it is (no line count)
    await waitFor(() => expect(screen.queryByTestId('vision-query-format')).toBeNull())
    expect(widthsAsked.filter((lines) => lines !== undefined)).toEqual([1, 7, 10, 10, 10])

    // A query that does not parse offers no Format button; the shortcut says why it cannot format
    typeQuery('*[_type == "author"')
    fireEvent.keyDown(getQueryEditor(), FORMAT_KEYS)

    await screen.findByText('vision.query.prettify.failed', undefined, {timeout: 3000})
    expect(screen.getByText("expected ']' following expression")).toBeTruthy()
    expect(getQueryEditor().value).toBe('*[_type == "author"')
    expect(screen.queryByTestId('vision-query-format')).toBeNull()
  })

  describe('Format while the query editor is resized', () => {
    const COMPACT =
      '*[_type=="author"&&name match $q]{_id,name,"posts":*[references(^._id)]{title}}'
    /** Long enough for the resize to settle, Format's recheck to run, and the reformat to land */
    const SETTLED_MS = 800

    /** Counts the renders in which the query's Format button is on the page */
    function watchFormatButton() {
      const sightings = {count: 0}
      const look = () => {
        if (screen.queryByTestId('vision-query-format')) sightings.count++
      }
      const observer = new MutationObserver(look)
      observer.observe(document.body, {childList: true, subtree: true})
      return {sightings, stop: () => observer.disconnect()}
    }

    async function renderFormattedForWidth(width: number) {
      const rendered = renderRedesign()
      editorMocks.visibleColumns = width
      typeQuery(COMPACT)
      fireEvent.click(await screen.findByTestId('vision-query-format'))
      await waitFor(() => expect(getQueryEditor().value).toContain('\n'))
      await waitFor(() => expect(screen.queryByTestId('vision-query-format')).toBeNull())
      const editorElement = within(shownTab()).getByTestId('vision-query-editor')
      resizeElement(editorElement, {width: 600, height: 400})
      await new Promise((resolve) => setTimeout(resolve, SETTLED_MS))
      expect(screen.queryByTestId('vision-query-format')).toBeNull()
      return {...rendered, editorElement}
    }

    it('never offers Format for a query that auto-format is about to reformat', async () => {
      const {editorElement} = await renderFormattedForWidth(80)
      const before = getQueryEditor().value
      const {sightings, stop} = watchFormatButton()

      // Dragging a handle: the editor narrows in steps, with pauses longer than Format's recheck
      editorMocks.visibleColumns = 30
      for (const width of [500, 400, 300]) {
        resizeElement(editorElement, {width, height: 400})
        await new Promise((resolve) => setTimeout(resolve, 150))
      }
      await new Promise((resolve) => setTimeout(resolve, SETTLED_MS))
      stop()

      expect(getQueryEditor().value).not.toBe(before)
      expect(screen.queryByTestId('vision-query-format')).toBeNull()
      expect(sightings.count).toBe(0)
    })

    it('offers Format again for a query that was laid out by hand, also while it is resized', async () => {
      const {editorElement} = await renderFormattedForWidth(80)
      typeQuery('*[_type=="author"]')
      await screen.findByTestId('vision-query-format')

      editorMocks.visibleColumns = 30
      resizeElement(editorElement, {width: 300, height: 400})
      await new Promise((resolve) => setTimeout(resolve, SETTLED_MS))
      expect(getQueryEditor().value).toBe('*[_type=="author"]')
      expect(screen.getByTestId('vision-query-format')).toBeTruthy()
    })

    it('offers Format for a formatted query when auto-format on resize is off', async () => {
      const {editorElement} = await renderFormattedForWidth(80)
      fireEvent.click(screen.getByTestId('vision-sidebar-settings'))
      fireEvent.click(await screen.findByTestId('vision-settings-auto-format-on-resize'))
      await waitFor(() => expect(getStoredState().editor.autoFormatOnResize).toBe(false))
      const before = getQueryEditor().value

      editorMocks.visibleColumns = 30
      resizeElement(editorElement, {width: 300, height: 400})
      await screen.findByTestId('vision-query-format', undefined, {timeout: 2000})
      expect(getQueryEditor().value).toBe(before)
    })
  })

  it('offers Format on the query only when formatting would change it, and Copy always', async () => {
    renderRedesign()
    const tab = () => within(shownTab())

    typeQuery('*[_type=="author"]')
    expect(tab().getByTestId('vision-query-copy')).toBeTruthy()
    await waitFor(() => expect(tab().queryByTestId('vision-query-format')).not.toBeNull())
    expect(tab().getByTestId('vision-query-format').getAttribute('aria-label')).toBe(
      'vision.query.format',
    )
    expect(
      tab().getByTestId('vision-query-format').querySelector('[data-sanity-icon="prettify"]'),
    ).not.toBeNull()

    // Already formatted
    typeQuery('*[_type == "author"]')
    await waitFor(() => expect(tab().queryByTestId('vision-query-format')).toBeNull())

    // Does not parse
    typeQuery('*[_type=="author"')
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(tab().queryByTestId('vision-query-format')).toBeNull()
    expect(tab().getByTestId('vision-query-copy')).toBeTruthy()
  })

  it('offers Format on the JSON params only when it would change them, and only Copy in the form', async () => {
    renderRedesign()
    const tab = () => within(shownTab())

    // The default, empty params have nothing to format
    expect(tab().getByTestId('vision-params-copy')).toBeTruthy()
    expect(tab().queryByTestId('vision-params-format')).toBeNull()

    fireEvent.change(getParamsEditor(), {target: {value: '{"id":"a"}'}})
    const format = await tab().findByTestId('vision-params-format', undefined, {timeout: 3000})
    expect(format.getAttribute('aria-label')).toBe('vision.params.format')
    fireEvent.click(format)
    expect(getParamsEditor().value).toBe('{\n  "id": "a"\n}')
    await waitFor(() => expect(getStoredState().tabs[0].rawParams).toBe('{\n  "id": "a"\n}'))
    await waitFor(() => expect(tab().queryByTestId('vision-params-format')).toBeNull())

    // Formatting would drop the comment, so it is not offered
    fireEvent.change(getParamsEditor(), {target: {value: '{"id":"a" /* keep */}'}})
    await waitFor(() => expect(getStoredState().tabs[0].rawParams).toBe('{"id":"a" /* keep */}'))
    expect(tab().queryByTestId('vision-params-format')).toBeNull()

    fireEvent.change(getParamsEditor(), {target: {value: '{"id":"a"}'}})
    await tab().findByTestId('vision-params-format', undefined, {timeout: 3000})
    await pickParamsView('form')
    expect(tab().queryByTestId('vision-params-format')).toBeNull()
    expect(tab().getByTestId('vision-params-copy')).toBeTruthy()
  })

  it('shows Copy as an icon that turns into a check labelled Copied for a moment, without a toast, and only once it copied', async () => {
    renderRedesign()
    const writeText = vi.fn(() => Promise.resolve())
    const clipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
    Object.defineProperty(navigator, 'clipboard', {value: {writeText}, configurable: true})
    try {
      typeQuery('*[_type == "author"]')
      const copy = () => within(shownTab()).getByTestId('vision-query-copy')
      expect(text(copy())).toBe('')
      expect(copy().getAttribute('aria-label')).toBe('vision.query.copy')

      fireEvent.click(copy())
      await waitFor(() => expect(copy().getAttribute('aria-label')).toBe('vision.editor.copied'))
      expect(writeText).toHaveBeenCalledWith('*[_type == "author"]')
      expect(text(copy())).toBe('')
      expect(copy().querySelector('[data-sanity-icon="checkmark"]')).not.toBeNull()
      // The params' Copy button is not the one that copied
      expect(within(shownTab()).getByTestId('vision-params-copy').getAttribute('aria-label')).toBe(
        'vision.params.copy',
      )

      await waitFor(() => expect(copy().getAttribute('aria-label')).toBe('vision.query.copy'), {
        timeout: 3000,
      })
      expect(copy().querySelector('[data-sanity-icon="copy"]')).not.toBeNull()

      writeText.mockRejectedValueOnce(new Error('denied'))
      fireEvent.click(copy())
      await waitFor(() => expect(writeText).toHaveBeenCalledTimes(2))
      await new Promise((resolve) => setTimeout(resolve, 50))
      expect(copy().getAttribute('aria-label')).toBe('vision.query.copy')
    } finally {
      if (clipboard) Object.defineProperty(navigator, 'clipboard', clipboard)
      else Reflect.deleteProperty(navigator, 'clipboard')
    }
  })

  it('copies and formats the params with the shortcuts while they have focus, and the query otherwise', async () => {
    renderRedesign()
    const writeText = vi.fn(() => Promise.resolve())
    const clipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
    Object.defineProperty(navigator, 'clipboard', {value: {writeText}, configurable: true})
    try {
      const query = '*[_type=="author"&&_id==$id]'
      typeQuery(query)
      // Still in the debounce: the shortcuts act on what the editor shows
      fireEvent.change(getParamsEditor(), {target: {value: '{"id":"a"}'}})

      fireEvent.keyDown(getParamsEditor(), COPY_KEYS)
      await waitFor(() => expect(writeText).toHaveBeenLastCalledWith('{"id":"a"}'))
      await waitFor(() =>
        expect(
          within(shownTab()).getByTestId('vision-params-copy').getAttribute('aria-label'),
        ).toBe('vision.editor.copied'),
      )
      expect(within(shownTab()).getByTestId('vision-query-copy').getAttribute('aria-label')).toBe(
        'vision.query.copy',
      )

      fireEvent.keyDown(getParamsEditor(), FORMAT_KEYS)
      expect(getParamsEditor().value).toBe('{\n  "id": "a"\n}')
      await waitFor(() => expect(getStoredState().tabs[0].rawParams).toBe('{\n  "id": "a"\n}'))
      expect(getQueryEditor().value).toBe(query)

      fireEvent.keyDown(getQueryEditor(), COPY_KEYS)
      await waitFor(() => expect(writeText).toHaveBeenLastCalledWith(query))
      await waitFor(() =>
        expect(within(shownTab()).getByTestId('vision-query-copy').getAttribute('aria-label')).toBe(
          'vision.editor.copied',
        ),
      )

      fireEvent.keyDown(getQueryEditor(), FORMAT_KEYS)
      await waitFor(() => expect(getQueryEditor().value).toBe('*[_type == "author" && _id == $id]'))
      expect(getParamsEditor().value).toBe('{\n  "id": "a"\n}')
    } finally {
      if (clipboard) Object.defineProperty(navigator, 'clipboard', clipboard)
      else Reflect.deleteProperty(navigator, 'clipboard')
    }
  })

  it('keeps Export and Share tab in the query actions menu, behind a More actions tooltip', async () => {
    renderRedesign()
    const button = within(shownTab()).getByTestId('vision-query-menu-button')
    expect(button.getAttribute('aria-label')).toBe('vision.query.actions')
    // It sits in the query pane's toolbar, after Copy, like the result's menu; not in the bottom bar
    const toolbarActions = within(shownTab()).getByTestId('vision-query-toolbar-actions')
    expect(toolbarActions.contains(button)).toBe(true)
    const copy = within(toolbarActions).getByTestId('vision-query-copy')
    expect(copy.compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(within(shownTab()).getByTestId('vision-query-actions').contains(button)).toBe(false)

    fireEvent.mouseEnter(within(shownTab()).getByTestId('vision-query-menu-tooltip-target'))
    // The params menu's closed tooltip stays mounted with the same text
    await waitFor(() =>
      expect(
        screen
          .getAllByText('vision.actions.more')
          .some((element) => !element.closest('[style*="display: none"]')),
      ).toBe(true),
    )

    fireEvent.click(button)
    await screen.findByTestId('vision-export-query')
    expect(screen.getByTestId('vision-share-tab')).toBeTruthy()
    // A query is kept in its tab, which closing lists in Restore tabs; there is no Save
    expect(screen.queryByTestId('vision-save-query')).toBeNull()
    expect(screen.queryByTestId('vision-copy-query')).toBeNull()
    expect(screen.queryByTestId('vision-prettify')).toBeNull()
  })

  it('starts Live without fetching, then refetches the last fetched request on a relevant change', async () => {
    const {fetchCalls, liveEvents, liveSubscriptionCount} = renderRedesign()
    typeQuery('*[_type == "author"]')
    fireEvent.click(screen.getByTestId('vision-fetch-button'))
    await waitFor(() => expect(fetchCalls).toHaveLength(1))

    // Turning Live on, off and on again fetches nothing
    fireEvent.click(within(shownTab()).getByTestId('vision-auto-refetch'))
    fireEvent.click(within(shownTab()).getByTestId('vision-auto-refetch'))
    fireEvent.click(within(shownTab()).getByTestId('vision-auto-refetch'))
    await waitFor(() => expect(getStoredState().tabs[0].autoRefetch).toBe(true))
    await waitFor(() => expect(liveSubscriptionCount()).toBeGreaterThan(0))
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(fetchCalls).toHaveLength(1)

    // A relevant change replays the request that was fetched, query edits typed since included
    typeQuery('*[_type == "book"]')
    act(() => {
      liveEvents.next({type: 'message', id: '1', tags: ['s1:abc']})
    })
    await waitFor(() => expect(fetchCalls).toHaveLength(2))
    expect(fetchCalls[1].query).toBe('*[_type == "author"]')
  })

  it('fetches a query loaded into a tab that refetches automatically', async () => {
    sanityMocks.savedQueries = {
      queries: [sharedSavedQuery('shared-pages', 'Pages', '*[_type == "page"]', false)],
    }
    const {fetchCalls} = renderRedesign()
    typeQuery('*[_type == "author"]')
    fireEvent.click(screen.getByTestId('vision-fetch-button'))
    await waitFor(() => expect(fetchCalls).toHaveLength(1))
    fireEvent.click(within(shownTab()).getByTestId('vision-auto-refetch'))
    await waitFor(() => expect(getStoredState().tabs[0].autoRefetch).toBe(true))

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
    fireEvent.click(document.getElementById('vision-response-history-tab') as HTMLElement)
    await waitFor(() => {
      const entries = screen.getAllByTestId('vision-history-entry')
      expect(entries).toHaveLength(2)
      expect(text(entries[0])).toContain('vision.history.reason.paste')
    })
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(fetchCalls).toHaveLength(2)

    // A shared tab loaded into the tab has no run of its own, so the live tab fetches it in place
    // of the runner's cleared request
    const loadSharedTab = async () => {
      if (!screen.queryByTestId('vision-saved-query')) {
        fireEvent.click(screen.getByTestId('vision-sidebar-shared'))
      }
      const item = await screen.findByTestId('vision-saved-query')
      fireEvent.click(within(item).getByRole('button', {expanded: false}))
      const load = screen
        .getAllByRole('menuitem', {hidden: true})
        .find((menuItem) => text(menuItem) === 'vision.saved.load-in-current-tab')
      if (!load) throw new Error('The shared tab menu has no load item')
      fireEvent.click(load)
    }
    await loadSharedTab()
    await waitFor(() => expect(fetchCalls).toHaveLength(3))
    expect(fetchCalls[2].query).toBe('*[_type == "page"]')
    await waitFor(() => {
      const entries = screen.getAllByTestId('vision-history-entry')
      expect(entries).toHaveLength(3)
      expect(text(entries[0])).toContain('vision.history.reason.load')
    })

    // Without automatic refetching such a load only replaces the query
    fireEvent.click(within(shownTab()).getByTestId('vision-auto-refetch'))
    await waitFor(() => expect(getStoredState().tabs[0].autoRefetch).toBe(false))
    typeQuery('*[_type == "person"]')
    await loadSharedTab()
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
      options: {perspective: 'global'},
    })
    saveVisionState(PROJECT_ID, {...initial, tabs: [tab], activeTabId: 'live'})
    const {fetchCalls, liveSubscriptionCount} = renderRedesign()

    await waitFor(() => expect(fetchCalls).toHaveLength(1))
    expect(fetchCalls[0].config.perspective).toBe('published')
    await waitFor(() => expect(liveSubscriptionCount()).toBe(1))
    fireEvent.click(document.getElementById('vision-response-history-tab') as HTMLElement)
    expect(text(screen.getByTestId('vision-history-entry'))).toContain(
      'vision.history.reason.resume',
    )

    // While another tab is active the navbar perspective changes, which reaches every tab; the
    // live tab comes back with a request its runner has not fetched yet, so it fetches again
    fireEvent.click(screen.getByTestId('vision-new-tab'))
    await waitFor(() => expect(screen.getAllByTestId('vision-tab')).toHaveLength(2))
    act(() => {
      sanityMocks.setPerspective({
        ...BASE_PERSPECTIVE,
        perspectiveStack: ['drafts'],
        selectedPerspectiveName: 'drafts',
      })
    })
    fireEvent.click(within(screen.getAllByTestId('vision-tab')[0]).getByTestId('vision-tab-button'))
    await waitFor(() => expect(fetchCalls).toHaveLength(2))
    expect(fetchCalls[1].config.perspective).toEqual(['drafts'])

    // Shown again without any change, it has nothing new to fetch
    fireEvent.click(within(screen.getAllByTestId('vision-tab')[1]).getByTestId('vision-tab-button'))
    fireEvent.click(within(screen.getAllByTestId('vision-tab')[0]).getByTestId('vision-tab-button'))
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(fetchCalls).toHaveLength(2)

    // A query typed but never run is not a reason to fetch either: automatic refetching never
    // runs unsent edits, and coming back to the tab must not run them behind the user's back
    typeQuery('*[_type == "book"]')
    await waitFor(() => expect(getStoredState().tabs[0].query).toBe('*[_type == "book"]'))
    fireEvent.click(within(screen.getAllByTestId('vision-tab')[1]).getByTestId('vision-tab-button'))
    fireEvent.click(within(screen.getAllByTestId('vision-tab')[0]).getByTestId('vision-tab-button'))
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(fetchCalls).toHaveLength(2)
    expect(getQueryEditor().value).toBe('*[_type == "book"]')
  })

  it('fetches with params typed just before running, ahead of the debounce', async () => {
    const {fetchCalls} = renderRedesign()
    typeQuery('*[_id == $id]')
    await waitFor(() => expect(isDisabled(screen.getByTestId('vision-fetch-button'))).toBe(false))

    const paramsEditor = within(screen.getByTestId('vision-params-editor')).getByTestId(
      'codemirror-mock',
    )
    fireEvent.change(paramsEditor, {target: {value: '{"id": "fresh"}'}})
    fireEvent.click(screen.getByTestId('vision-fetch-button'))

    await waitFor(() => expect(fetchCalls).toHaveLength(1))
    expect(fetchCalls[0].params).toEqual({id: 'fresh'})

    // The same goes for the fetch shortcut
    fireEvent.change(paramsEditor, {target: {value: '{"id": "fresher"}'}})
    fireEvent.keyDown(getQueryEditor(), {key: 'Enter', ctrlKey: true, which: 13, keyCode: 13})
    await waitFor(() => expect(fetchCalls).toHaveLength(2))
    expect(fetchCalls[1].params).toEqual({id: 'fresher'})
    fireEvent.click(within(shownTab()).getByTestId('vision-auto-refetch'))
    await waitFor(() => expect(getStoredState().tabs[0].autoRefetch).toBe(true))

    // And for the fetch an option change starts while refetching automatically: it carries the
    // params typed just before the change, not the ones the previous fetch went out with.
    // Opening Options unmounts the params editor, which commits the edit still in the debounce
    fireEvent.change(paramsEditor, {target: {value: '{"id": "freshest"}'}})
    openRequestTab('options')
    pickMenuItem('vision-option-perspective-select', 'drafts')
    await waitFor(() => expect(fetchCalls).toHaveLength(3))
    expect(fetchCalls[2].params).toEqual({id: 'freshest'})
    expect(fetchCalls[2].config.perspective).toBe('drafts')
    // The debounce settling afterwards has nothing left to fetch
    await new Promise((resolve) => setTimeout(resolve, 400))
    expect(fetchCalls).toHaveLength(3)
  })

  it('shares and exports params typed just before, ahead of the debounce', async () => {
    renderRedesign()
    typeQuery('*[_id == $id]')
    await waitFor(() => expect(isDisabled(screen.getByTestId('vision-fetch-button'))).toBe(false))
    const paramsEditor = within(screen.getByTestId('vision-params-editor')).getByTestId(
      'codemirror-mock',
    )

    // Share from the query menu
    fireEvent.change(paramsEditor, {target: {value: '{"id": "shared"}'}})
    fireEvent.click(screen.getByTestId('vision-query-menu-button'))
    fireEvent.click(screen.getByTestId('vision-share-tab'))
    fireEvent.click(await screen.findByTestId('vision-share-tab-confirm'))
    await waitFor(() => expect(sanityMocks.shareQuery).toHaveBeenCalledTimes(1))
    const [[{url}]] = sanityMocks.shareQuery.mock.calls
    expect(url).toContain(`${encodeURIComponent('$id')}=${encodeURIComponent('"shared"')}`)

    // Export shows the request built from the params just typed
    fireEvent.change(paramsEditor, {target: {value: '{"id": "exported"}'}})
    fireEvent.click(screen.getByTestId('vision-query-menu-button'))
    fireEvent.click(screen.getByTestId('vision-export-query'))
    const dialog = await screen.findByTestId('vision-export-query-dialog')
    expect(text(dialog)).toContain("{id: 'exported'}")
    expect(text(dialog)).not.toContain('"shared"')
  })

  it('confirms a copied export snippet on the copy button for a moment, and only once it copied', async () => {
    renderRedesign()
    typeQuery('*[_type == "post"]')
    await waitFor(() => expect(isDisabled(screen.getByTestId('vision-fetch-button'))).toBe(false))
    const writeText = vi.fn(() => Promise.resolve())
    const clipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
    Object.defineProperty(navigator, 'clipboard', {value: {writeText}, configurable: true})

    try {
      fireEvent.click(screen.getByTestId('vision-query-menu-button'))
      fireEvent.click(screen.getByTestId('vision-export-query'))
      const copy = await screen.findByTestId('vision-export-query-copy')
      expect(copy.hasAttribute('data-copied')).toBe(false)

      writeText.mockImplementationOnce(() => Promise.reject(new Error('Denied')))
      fireEvent.click(copy)
      await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1))
      expect(copy.hasAttribute('data-copied')).toBe(false)

      fireEvent.click(copy)
      await waitFor(() => expect(copy.getAttribute('data-copied')).toBe('true'))

      // The highlighted code reads exactly as the snippet copies
      const copied = writeText.mock.lastCall?.at(0)
      const shown = screen
        .getAllByTestId('vision-export-file')
        .map((file) => file.querySelector('pre'))
        .find((pre) => pre?.textContent === copied)
      expect(shown?.querySelectorAll('span[style]').length).toBeGreaterThan(1)

      // Another snippet has not been copied yet
      const tabs = within(screen.getByTestId('vision-export-query-dialog')).getAllByRole('tab', {
        hidden: true,
      })
      const otherTab = tabs.find((tab) => tab.getAttribute('aria-selected') !== 'true')
      fireEvent.click(otherTab as HTMLElement)
      expect(screen.getByTestId('vision-export-query-copy').hasAttribute('data-copied')).toBe(false)

      fireEvent.click(screen.getByTestId('vision-export-query-copy'))
      await waitFor(() =>
        expect(screen.getByTestId('vision-export-query-copy').getAttribute('data-copied')).toBe(
          'true',
        ),
      )
      await waitFor(
        () =>
          expect(screen.getByTestId('vision-export-query-copy').hasAttribute('data-copied')).toBe(
            false,
          ),
        {timeout: 3000},
      )
    } finally {
      if (clipboard) Object.defineProperty(navigator, 'clipboard', clipboard)
      else Reflect.deleteProperty(navigator, 'clipboard')
    }
  })

  it('shows the export snippets the settings keep, in their order, and remembers it', async () => {
    renderRedesign()
    typeQuery('*[_type == "post"]')
    await waitFor(() => expect(isDisabled(screen.getByTestId('vision-fetch-button'))).toBe(false))
    const exportTabs = async () => {
      fireEvent.click(screen.getByTestId('vision-query-menu-button'))
      fireEvent.click(screen.getByTestId('vision-export-query'))
      const dialog = await screen.findByTestId('vision-export-query-dialog')
      const titles = within(dialog)
        .getAllByRole('tab', {hidden: true})
        .map((tab) => text(tab))
      fireEvent.keyDown(dialog, {key: 'Escape'})
      await waitFor(() => expect(screen.queryByTestId('vision-export-query-dialog')).toBeNull())
      return titles
    }
    expect(await exportTabs()).toEqual([
      '@sanity/client',
      'curl',
      'next-sanity',
      '@sanity/astro',
      '@sanity/sveltekit',
      '@nuxtjs/sanity',
    ])

    fireEvent.click(screen.getByTestId('vision-sidebar-settings'))
    const settings = within(screen.getByTestId('vision-drawer-settings'))
    const reset = settings.getByTestId('vision-settings-export-snippets-reset')
    expect(isDisabled(reset)).toBe(true)
    for (const id of ['client', 'next-sanity', 'sveltekit', 'nuxt']) {
      fireEvent.click(settings.getByTestId(`vision-settings-export-snippet-${id}`))
    }
    // Astro moves up past curl
    fireEvent.click(settings.getByTestId('vision-settings-export-snippet-astro-up'))
    fireEvent.click(settings.getByTestId('vision-settings-export-snippet-astro-up'))
    fireEvent.click(settings.getByTestId('vision-settings-export-snippet-astro-up'))
    // The last snippet left cannot be switched off
    fireEvent.click(settings.getByTestId('vision-settings-export-snippet-curl'))
    expect(isDisabled(settings.getByTestId('vision-settings-export-snippet-astro'))).toBe(true)
    expect(isDisabled(reset)).toBe(false)

    expect(await exportTabs()).toEqual(['@sanity/astro'])
    await waitFor(() =>
      expect(getStoredState().exportSnippets).toEqual({
        order: ['astro', 'client', 'curl', 'next-sanity', 'sveltekit', 'nuxt'],
        hidden: ['client', 'next-sanity', 'sveltekit', 'nuxt', 'curl'],
      }),
    )

    fireEvent.click(reset)
    expect(await exportTabs()).toHaveLength(6)
  })

  it('locks the API version to the variants version and sends the navbar variant with the global perspective', async () => {
    const initial = createInitialState(DEFAULTS)
    const tab = createTab(initial.settings, {
      id: 'pinned',
      query: '*[_id == "a"]',
      options: {perspective: 'global'},
    })
    saveVisionState(PROJECT_ID, {...initial, tabs: [tab], activeTabId: 'pinned'})

    const {fetchCalls} = renderRedesign({...BASE_PERSPECTIVE, selectedVariantNames: ['french']})
    openRequestTab('options')
    expect(selectValue('vision-option-perspective-select')).toBe('global')
    expect(selectValue('vision-option-variant-select')).toBe('global')

    const apiVersionSelect = screen.getByTestId(
      'vision-option-api-version-select',
    ) as HTMLSelectElement
    expect(apiVersionSelect.value).toBe('v2025-08-18')
    expect(apiVersionSelect.disabled).toBe(true)
    // The disabled select is out of the tab order, so its wrapper takes its place there, as a
    // group described by the reason for the lock, for a keyboard user to reach the explanation
    const apiVersionWrap = screen.getByTestId('vision-option-api-version-wrap')
    expect(apiVersionWrap.getAttribute('tabindex')).toBe('0')
    expect(apiVersionWrap.getAttribute('role')).toBe('group')
    expect(apiVersionWrap.getAttribute('aria-label')).toBe('settings.api-version-label')
    expect(describedBy(apiVersionWrap)).toBe('settings.api-version-locked-for-variant')
    // The action bar names the version requests actually use, and its button shows the lock
    expect(text(screen.getByTestId('vision-api-version-button'))).toBe(
      'vision.api-version.button:v2025-08-18',
    )
    fireEvent.click(screen.getByTestId('vision-api-version-button'))
    await waitFor(() => expect(document.activeElement).toBe(apiVersionWrap))

    fireEvent.click(screen.getByTestId('vision-fetch-button'))
    await waitFor(() => expect(fetchCalls).toHaveLength(1))
    expect(fetchCalls[0].config).toMatchObject({
      apiVersion: 'v2025-08-18',
      perspective: 'published',
      variant: 'french',
    })
    const url = new URL((screen.getByTestId('vision-query-url') as HTMLInputElement).value)
    expect(url.pathname).toContain('/v2025-08-18/')
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
    saveVisionState(PROJECT_ID, {...initial, tabs: [tab], activeTabId: 'no-variant'})
    const {fetchCalls} = renderRedesign({...BASE_PERSPECTIVE, selectedVariantNames: ['french']})
    openRequestTab('options')
    expect(selectValue('vision-option-perspective-select')).toBe('raw')
    expect(selectValue('vision-option-variant-select')).toBe('none')
    expect(isDisabled(screen.getByTestId('vision-option-api-version-select'))).toBe(false)
    // The select itself is what a keyboard user reaches while it is not locked
    const apiVersionWrap = screen.getByTestId('vision-option-api-version-wrap')
    expect(apiVersionWrap.hasAttribute('tabindex')).toBe(false)
    expect(apiVersionWrap.hasAttribute('role')).toBe(false)

    fireEvent.click(screen.getByTestId('vision-fetch-button'))
    await waitFor(() => expect(fetchCalls).toHaveLength(1))
    expect(fetchCalls[0].config.perspective).toBe('raw')
    expect(fetchCalls[0].config.variant).toBeUndefined()
    const url = new URL((screen.getByTestId('vision-query-url') as HTMLInputElement).value)
    expect(url.searchParams.get('variant')).toBeNull()

    // The variant option is independent of the perspective
    pickMenuItem('vision-option-variant-select', 'global')
    await waitFor(() =>
      expect(isDisabled(screen.getByTestId('vision-option-api-version-select'))).toBe(true),
    )
    fireEvent.click(screen.getByTestId('vision-fetch-button'))
    await waitFor(() => expect(fetchCalls).toHaveLength(2))
    expect(fetchCalls[1].config).toMatchObject({
      apiVersion: 'v2025-08-18',
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
    const tab = createTab(initial.settings, {
      id: 'pinned',
      query: '*[_id == "a"]',
      options: {perspective: 'global'},
    })
    saveVisionState(PROJECT_ID, {...initial, tabs: [tab], activeTabId: 'pinned'})

    // A variant the URL still carries for the navbar is not one the studio shows
    const {fetchCalls} = renderRedesign({...BASE_PERSPECTIVE, selectedVariantNames: ['french']})
    openRequestTab('options')
    expect(screen.queryByTestId('vision-option-variant-select')).toBeNull()
    expect(selectValue('vision-option-perspective-select')).toBe('global')
    // Nothing locks the API version to the variants version
    const apiVersionSelect = screen.getByTestId(
      'vision-option-api-version-select',
    ) as HTMLSelectElement
    expect(apiVersionSelect.value).toBe('v2025-02-19')
    expect(apiVersionSelect.disabled).toBe(false)
    expect(text(screen.getByTestId('vision-api-version-button'))).toBe(
      'vision.api-version.button:v2025-02-19',
    )

    fireEvent.click(screen.getByTestId('vision-fetch-button'))
    await waitFor(() => expect(fetchCalls).toHaveLength(1))
    expect(fetchCalls[0].config).toMatchObject({
      apiVersion: 'v2025-02-19',
      perspective: 'published',
    })
    expect(fetchCalls[0].config.variant).toBeUndefined()
    const url = new URL((screen.getByTestId('vision-query-url') as HTMLInputElement).value)
    expect(url.pathname).toContain('/v2025-02-19/')
    expect(url.searchParams.get('variant')).toBeNull()

    // The settings for new tabs have no Variant option either
    fireEvent.click(screen.getByTestId('vision-sidebar-settings'))
    await screen.findByTestId('vision-settings-perspective-select')
    expect(screen.queryByTestId('vision-settings-variant-select')).toBeNull()
  })

  it('says a pasted or shared variant is not sent where the workspace has variants switched off', async () => {
    sanityMocks.workspace = {
      document: {drafts: {enabled: true}},
      beta: {variants: {enabled: false}},
    }
    const url = `https://${PROJECT_ID}.api.sanity.io/v2025-08-18/data/query/test?query=*&variant=french`
    sanityMocks.savedQueries = {
      queries: [
        {
          _key: 'shared-french',
          shared: true,
          title: 'French',
          url,
          savedAt: '2026-01-01T00:00:00Z',
        },
      ],
    }
    renderRedesign({...BASE_PERSPECTIVE, selectedVariantNames: ['french']})
    fireEvent.paste(document.body, {clipboardData: {getData: () => url}})
    await waitFor(() => expect(getQueryEditor().value).toBe('*'))
    // There is no navbar selector to select the variant with, so the toast does not point to it
    await screen.findByText('vision.paste.variants-disabled')
    expect(screen.queryByText('vision.paste.unavailable-variant')).toBeNull()

    fireEvent.click(screen.getByTestId('vision-sidebar-shared'))
    const open = await screen.findByTestId('vision-saved-query-open')
    // The pasted tab sends no variant, so it does not show this shared tab
    expect(open.hasAttribute('data-selected')).toBe(false)
    fireEvent.click(open)
    await screen.findByText('vision.saved.variants-disabled')
    expect(screen.queryByText('vision.saved.unavailable-variant')).toBeNull()
  })

  it('follows the workspace dataset until one is chosen, and Auto follows it again', async () => {
    const {fetchCalls} = renderRedesign()
    typeQuery('*')
    openRequestTab('options')
    const datasetSelect = () =>
      screen.getByTestId('vision-option-dataset-select') as HTMLButtonElement
    expect(datasetSelect().value).toBe('test')

    pickDataset('staging')
    fireEvent.click(screen.getByTestId('vision-fetch-button'))
    await waitFor(() => expect(fetchCalls).toHaveLength(1))
    expect(fetchCalls[0].config.dataset).toBe('staging')
    await waitFor(() =>
      expect(getStoredState().tabs[0].options).toMatchObject({
        datasetMode: 'override',
        dataset: 'staging',
      }),
    )

    // Auto stands for the workspace's own dataset, which has no item of its own
    fireEvent.click(datasetSelect())
    expect(screen.getByTestId('vision-option-dataset-item-auto')).toBeTruthy()
    expect(screen.queryByTestId('vision-option-dataset-item-test')).toBeNull()
    fireEvent.click(datasetSelect())

    pickMenuItem('vision-option-dataset-select', 'auto')
    await waitFor(() =>
      expect(getStoredState().tabs[0].options).toMatchObject({datasetMode: 'auto'}),
    )
    expect(datasetSelect().value).toBe('test')
    fireEvent.click(screen.getByTestId('vision-fetch-button'))
    await waitFor(() => expect(fetchCalls).toHaveLength(2))
    expect(fetchCalls[1].config.dataset).toBe('test')
  })

  it('checks Auto for a tab pinned to the workspace dataset', () => {
    const initial = createInitialState(DEFAULTS)
    const tab = createTab(initial.settings, {
      id: 'pinned',
      options: {datasetMode: 'override', dataset: 'test'},
    })
    saveVisionState(PROJECT_ID, {...initial, tabs: [tab], activeTabId: 'pinned'})
    renderRedesign()
    openRequestTab('options')

    fireEvent.click(screen.getByTestId('vision-option-dataset-select'))
    expect(screen.getByTestId('vision-option-dataset-item-auto').getAttribute('aria-checked')).toBe(
      'true',
    )
  })

  it('keeps focus in the dataset search until the user moves it, and opens unfiltered', () => {
    renderRedesign()
    openRequestTab('options')
    const select = screen.getByTestId('vision-option-dataset-select')

    fireEvent.click(select)
    const search = screen.getByTestId('vision-option-dataset-search') as HTMLInputElement
    expect(document.activeElement).toBe(search)

    // Typing in the search moves no focus, so it does not turn the guard below off
    fireEvent.keyDown(search, {key: 's'})
    // The menu focuses its selected item on its own, a frame after it opened
    const auto = screen.getByTestId('vision-option-dataset-item-auto')
    act(() => auto.focus())
    expect(document.activeElement).toBe(search)

    fireEvent.change(search, {target: {value: 'stag'}})
    expect(screen.getByTestId('vision-option-dataset-item-staging')).toBeTruthy()
    expect(screen.queryByTestId('vision-option-dataset-item-auto')).toBeNull()

    // A focus move the user asked for stands
    fireEvent.keyDown(search, {key: 'ArrowDown'})
    const staging = screen.getByTestId('vision-option-dataset-item-staging')
    act(() => staging.focus())
    expect(document.activeElement).toBe(staging)

    // The search is reset as the menu opens, not as it closes, which would re-filter the
    // items while the menu fades out
    fireEvent.keyDown(staging, {key: 'Escape'})
    fireEvent.click(select)
    expect((screen.getByTestId('vision-option-dataset-search') as HTMLInputElement).value).toBe('')
    expect(screen.getByTestId('vision-option-dataset-item-auto')).toBeTruthy()
    expect(document.activeElement).toBe(screen.getByTestId('vision-option-dataset-search'))
  })

  it('lists today first in the API version list, then dated versions, vX and v1', async () => {
    renderRedesign()
    openRequestTab('options')
    // A bare `v` matches every version
    fireEvent.change(screen.getByTestId('vision-option-api-version-select'), {
      target: {value: 'v'},
    })
    const today = `v${new Date().toISOString().split('T')[0]}`
    const optionIds = () =>
      screen
        .getAllByTestId(/^vision-option-api-version-option-/)
        .map((option) => option.dataset.testid?.replace('vision-option-api-version-option-', ''))

    await waitFor(() => expect(optionIds()[0]).toBe(today))
    expect(optionIds().filter((id) => id === today)).toHaveLength(1)
    expect(optionIds().slice(-2)).toEqual(['vX', 'v1'])
    const todayOption = screen.getByTestId(`vision-option-api-version-option-${today}`)
    // Titled with the version like the other options, with "Today" under it
    expect(todayOption.textContent).toBe(`${today}vision.options.api-version.today`)
    expect(screen.getByTestId('vision-option-api-version-option-v1').textContent).toContain(
      'vision.options.api-version.legacy',
    )
    // A typed query lists the matches without the group headings
    expect(screen.queryByText('vision.options.api-version.dated')).toBeNull()
  })

  it('switches a tab on its own perspective back to the global one when the navbar changes', async () => {
    const initial = createInitialState(DEFAULTS)
    const tab = createTab(initial.settings, {id: 'own', options: {perspective: 'raw'}})
    saveVisionState(PROJECT_ID, {...initial, tabs: [tab], activeTabId: 'own'})
    const {setPerspective} = renderRedesign()
    openRequestTab('options')
    expect(selectValue('vision-option-perspective-select')).toBe('raw')

    setPerspective({
      ...BASE_PERSPECTIVE,
      perspectiveStack: ['rSummer', 'drafts'],
      selectedPerspectiveName: 'rSummer',
      selectedReleaseId: 'rSummer',
    })

    await waitFor(() => expect(selectValue('vision-option-perspective-select')).toBe('global'))
  })

  it('runs a stored scheduled drafts perspective as Global where the workspace has none, keeping the choice', async () => {
    const initial = createInitialState(DEFAULTS)
    const tab = createTab(initial.settings, {
      id: 'scheduled',
      query: '*',
      options: {perspective: 'scheduledDrafts'},
    })
    saveVisionState(PROJECT_ID, {...initial, tabs: [tab], activeTabId: 'scheduled'})

    // The project's tabs are shared by its workspaces; this one has no scheduled drafts
    const {fetchCalls, setPerspective, unmount} = renderRedesign()
    openRequestTab('options')
    const perspectiveSelect = () =>
      screen.getByTestId('vision-option-perspective-select') as HTMLSelectElement
    expect(perspectiveSelect().value).toBe('global')
    expect(within(perspectiveSelect()).queryByRole('option', {name: /scheduled/i})).toBeNull()

    fireEvent.click(screen.getByTestId('vision-fetch-button'))
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
      const enabled = renderRedesign()
      openRequestTab('options')
      expect(perspectiveSelect().value).toBe('scheduledDrafts')
      fireEvent.click(screen.getByTestId('vision-fetch-button'))
      await waitFor(() => expect(enabled.fetchCalls).toHaveLength(1))
      // No scheduled releases in this test, so the stack is the workspace's default alone
      expect(enabled.fetchCalls[0].config.perspective).toEqual(['drafts'])
    } finally {
      vi.mocked(useScheduledDraftsEnabled).mockReturnValue(false)
    }
  })

  it('loads a pasted query URL into the active tab and runs it', async () => {
    const {fetchCalls} = renderRedesign()
    const url =
      'https://abc.api.sanity.io/v2021-10-21/data/query/staging?query=*%5B_id+%3D%3D+%24id%5D&%24id=%22a%22&perspective=published'

    fireEvent.paste(document.body, {clipboardData: {getData: () => url}})

    await waitFor(() => expect(getQueryEditor().value).toBe('*[_id == $id]'))
    expect(text(screen.getByTestId('vision-tab-button'))).toContain('*[_id == $id]')
    openRequestTab('options')
    expect(selectValue('vision-option-dataset-select')).toBe('staging')
    expect(selectValue('vision-option-api-version-select')).toBe('v2021-10-21')
    expect(selectValue('vision-option-perspective-select')).toBe('published')
    // The URL names its dataset, so the tab stops following the workspace's
    await waitFor(() =>
      expect(getStoredState().tabs[0].options).toMatchObject({
        datasetMode: 'override',
        dataset: 'staging',
      }),
    )
    expect(screen.queryByText('vision.paste.unknown-dataset')).toBeNull()

    // The request runs as pasted, as it does in the classic tool: the query is left as it was
    // written, with the URL's params and under its dataset, API version and perspective
    await waitFor(() => expect(fetchCalls).toHaveLength(1))
    expect(fetchCalls[0]).toMatchObject({
      query: '*[_id == $id]',
      params: {id: 'a'},
      config: {dataset: 'staging', apiVersion: 'v2021-10-21', perspective: 'published'},
    })
    fireEvent.click(document.getElementById('vision-response-history-tab') as HTMLElement)
    expect(text(screen.getByTestId('vision-history-entry'))).toContain(
      'vision.history.reason.paste',
    )
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(fetchCalls).toHaveLength(1)
  })

  it('loads a pasted curl command, runs the query from its body, and shows that the request posts it', async () => {
    preferTreeView()
    const {fetchCalls} = renderRedesign()
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
    await screen.findByText('vision.paste.parsed-curl')
    openRequestTab('options')
    expect(selectValue('vision-option-dataset-select')).toBe('staging')
    expect(selectValue('vision-option-api-version-select')).toBe('v2021-10-21')
    expect(selectValue('vision-option-perspective-select')).toBe('published')
    expect(document.body.textContent).not.toContain('skSECRET')
    // The tab is set up like the request: pinned to its dataset, on its API version and
    // perspective, with no variant and no source map, to the API; `tag` and `returnQuery` have
    // no setting and are passed over (the state is written behind a debounce)
    await waitFor(
      () =>
        expect(getStoredState().tabs[0].options).toEqual({
          datasetMode: 'override',
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
    const url = new URL((screen.getByTestId('vision-query-url') as HTMLInputElement).value)
    expect(url.searchParams.get('query')).toBe(query)
    expect(screen.getByTestId('vision-query-url-posted')).toBeTruthy()
    // The network details share the Response tab, which has no separate Network tab
    expect(document.getElementById('vision-response-network-tab')).toBeNull()
    expect(text(screen.getByTestId('vision-network-method'))).toBe('vision.network.method.post')

    // The curl export writes the POST form back, so it pastes again
    fireEvent.click(screen.getByTestId('vision-query-menu-button'))
    fireEvent.click(screen.getByTestId('vision-export-query'))
    const dialog = await screen.findByTestId('vision-export-query-dialog')
    fireEvent.click(document.getElementById('vision-export-curl-tab') as HTMLElement)
    expect(screen.getByTestId('vision-export-post-note')).toBeTruthy()
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
    const {fetchCalls} = renderRedesign()
    openRequestTab('options')
    expect(selectValue('vision-option-perspective-select')).toBe('published')

    fireEvent.paste(document.body, {
      clipboardData: {
        getData: () => `https://abc.api.sanity.io/v2021-10-21/data/query/test?query=*`,
      },
    })
    await waitFor(() => expect(getQueryEditor().value).toBe('*'))
    // The request ran without a perspective, so that is what the tab sends now, not the navbar's
    expect(selectValue('vision-option-perspective-select')).toBe('default')
    await waitFor(() => expect(fetchCalls).toHaveLength(1))
    expect(fetchCalls[0].config.perspective).toBeUndefined()
  })

  it('says so when a pasted URL used a variant the navbar does not have selected', async () => {
    const url = `https://${PROJECT_ID}.api.sanity.io/v2025-08-18/data/query/test?query=*&variant=french`
    renderRedesign()
    fireEvent.paste(document.body, {clipboardData: {getData: () => url}})
    await waitFor(() => expect(getQueryEditor().value).toBe('*'))
    // A tab cannot pin a variant, so the request runs without the saved one
    await screen.findByText('vision.paste.unavailable-variant')
    cleanup()

    // With that variant selected in the navbar the tab sends it, and there is nothing to say
    renderRedesign({...BASE_PERSPECTIVE, selectedVariantNames: ['french']})
    fireEvent.paste(document.body, {clipboardData: {getData: () => url}})
    await waitFor(() => expect(getQueryEditor().value).toBe('*'))
    await screen.findByText('vision.paste.parsed')
    expect(screen.queryByText('vision.paste.unavailable-variant')).toBeNull()
  })

  it(
    'says so when an opened shared tab used a variant the navbar does not have selected',
    {timeout: 15_000},
    async () => {
      sanityMocks.savedQueries = {
        queries: [
          {
            _key: 'shared-french',
            shared: true,
            title: 'French',
            url: `https://${PROJECT_ID}.api.sanity.io/v2025-08-18/data/query/test?query=*&variant=french`,
            savedAt: '2026-01-01T00:00:00Z',
          },
        ],
      }
      renderRedesign()
      fireEvent.click(screen.getByTestId('vision-sidebar-shared'))
      const open = await screen.findByTestId('vision-saved-query-open')
      // Not open anywhere: no tab sends the french variant
      expect(open.hasAttribute('data-selected')).toBe(false)
      fireEvent.click(open)
      await waitFor(() => expect(getQueryEditor().value).toBe('*'))
      await screen.findByText('vision.saved.unavailable-variant')
    },
  )

  it('says so when a pasted URL names a dataset that is not available here', async () => {
    renderRedesign()
    // Another project's URL, or a dataset this user cannot see: the query is loaded, but it runs
    // against the tab's own dataset, so the tab keeps following the workspace
    fireEvent.paste(document.body, {
      clipboardData: {
        getData: () => 'https://other.api.sanity.io/v2025-02-19/data/query/elsewhere?query=*',
      },
    })

    await waitFor(() => expect(getQueryEditor().value).toBe('*'))
    await screen.findByText('vision.paste.unknown-dataset')
    openRequestTab('options')
    expect(selectValue('vision-option-dataset-select')).toBe('test')
    await waitFor(() =>
      expect(getStoredState().tabs[0].options).toMatchObject({datasetMode: 'auto'}),
    )
  })

  it(
    'recognizes the tab showing a shared tab through the request it sends',
    {timeout: 15_000},
    async () => {
      sanityMocks.savedQueries = {
        queries: [
          {
            _key: 'shared-1',
            shared: true,
            title: 'Everything',
            // Shared from a tab on the `global` perspective while the navbar was on `published`
            url: `https://${PROJECT_ID}.api.sanity.io/v2025-02-19/data/query/test?query=*&perspective=published`,
            savedAt: '2026-01-01T00:00:00Z',
          },
        ],
      }
      renderRedesign()
      typeQuery('*')
      openRequestTab('options')
      pickMenuItem('vision-option-perspective-select', 'global')
      expect(selectValue('vision-option-perspective-select')).toBe('global')

      fireEvent.click(screen.getByTestId('vision-sidebar-shared'))
      const open = await screen.findByTestId('vision-saved-query-open')
      // The tab's options say `global`, but the request it sends is the shared one, so the query
      // shows as open and opening it selects the tab rather than adding one
      expect(open.hasAttribute('data-selected')).toBe(true)
      fireEvent.click(open)
      expect(screen.getAllByTestId('vision-tab')).toHaveLength(1)

      // Once the navbar moves to drafts the tab would send another request, so the shared tab
      // is no longer open and opening it adds a tab of its own
      act(() => sanityMocks.setPerspective({...BASE_PERSPECTIVE, perspectiveStack: ['drafts']}))
      await waitFor(() => expect(open.hasAttribute('data-selected')).toBe(false))
      fireEvent.click(open)
      await waitFor(() => expect(screen.getAllByTestId('vision-tab')).toHaveLength(2))
    },
  )

  it(
    'opens the personal saved queries as tabs once each, newest first, ahead of the open tab',
    {timeout: 15_000},
    async () => {
      sanityMocks.savedQueries = {
        // Newest first, as the saved queries hook lists them
        queries: [
          {
            _key: 'shared-1',
            shared: true,
            authorId: 'user-2',
            isOwnedByCurrentUser: false,
            title: 'Shared',
            url: `https://${PROJECT_ID}.api.sanity.io/v2025-02-19/data/query/test?query=*`,
            savedAt: '2026-03-01T00:00:00Z',
          },
          personalSavedQuery('saved-pages', 'Pages', '*[_type == "page"]', '2026-02-01T00:00:00Z'),
          personalSavedQuery('saved-posts', 'Posts', '*[_type == "post"]', '2026-01-02T00:00:00Z'),
          // The same request saved twice opens one tab
          personalSavedQuery('saved-again', 'Again', '*[_type == "post"]', '2026-01-01T00:00:00Z'),
          {
            _key: 'saved-broken',
            shared: false,
            title: 'Broken',
            url: 'not a query URL',
            savedAt: '2025-12-01T00:00:00Z',
          },
        ],
      }
      renderRedesign()

      await waitFor(() => expect(screen.getAllByTestId('vision-tab')).toHaveLength(3))
      const tabs = screen.getAllByTestId('vision-tab')
      expect(text(tabs[0])).toContain('Pages')
      expect(text(tabs[1])).toContain('Posts')
      // The tab the tool opened on stays last, and the shown one
      expect(within(tabs[2]).getByRole('tab').getAttribute('aria-selected')).toBe('true')
      expect(getQueryEditor().value).toBe('')
      expect(await screen.findByText('vision.saved.opened-as-tabs')).toBeTruthy()
      await waitFor(() =>
        expect(getStoredState().openedSavedQueries).toEqual([
          'saved-pages',
          'saved-posts',
          'saved-again',
          'saved-broken',
        ]),
      )
      expect(getStoredState().tabs.slice(0, 2)).toMatchObject([
        {
          title: 'Pages',
          query: '*[_type == "page"]',
          options: {datasetMode: 'override', dataset: 'staging', perspective: 'published'},
        },
        {title: 'Posts', query: '*[_type == "post"]'},
      ])

      // A reload opens nothing again
      cleanup()
      renderRedesign()
      await new Promise((resolve) => setTimeout(resolve, 50))
      expect(screen.getAllByTestId('vision-tab')).toHaveLength(3)
      expect(screen.queryByText('vision.saved.opened-as-tabs')).toBeNull()

      // A closed one stays closed, listed in Restore tabs like any closed tab
      fireEvent.click(
        within(screen.getAllByTestId('vision-tab')[1]).getByTestId('vision-tab-close'),
      )
      await waitFor(() => expect(getStoredState().tabs).toHaveLength(2))
      cleanup()
      renderRedesign()
      await new Promise((resolve) => setTimeout(resolve, 50))
      expect(screen.getAllByTestId('vision-tab')).toHaveLength(2)
      expect(screen.queryByText('vision.saved.opened-as-tabs')).toBeNull()
      fireEvent.click(screen.getByTestId('vision-sidebar-closed-tabs'))
      const closed = await screen.findAllByTestId('vision-closed-tab')
      expect(closed.map(text)).toEqual([expect.stringContaining('Posts')])
    },
  )

  it('opens the saved queries that arrive after the tool opened', async () => {
    const {show} = renderRedesign()
    expect(screen.getAllByTestId('vision-tab')).toHaveLength(1)

    sanityMocks.savedQueries = {
      queries: [
        personalSavedQuery('saved-pages', 'Pages', '*[_type == "page"]', '2026-01-01T00:00:00Z'),
      ],
    }
    show()

    await waitFor(() => expect(screen.getAllByTestId('vision-tab')).toHaveLength(2))
    expect(text(screen.getAllByTestId('vision-tab')[0])).toContain('Pages')
    await waitFor(() => expect(getStoredState().openedSavedQueries).toEqual(['saved-pages']))
  })

  it('records a saved query a tab already shows without opening it again', async () => {
    const initial = createInitialState(DEFAULTS)
    const tab = createTab(initial.settings, {
      id: 'pages',
      query: '*[_type == "page"]',
      options: {
        datasetMode: 'override',
        dataset: 'staging',
        apiVersion: 'v2025-02-19',
        perspective: 'published',
        variant: 'none',
      },
    })
    saveVisionState(PROJECT_ID, {...initial, tabs: [tab], activeTabId: 'pages'})
    sanityMocks.savedQueries = {
      queries: [
        personalSavedQuery('saved-pages', 'Pages', '*[_type == "page"]', '2026-01-01T00:00:00Z'),
      ],
    }
    renderRedesign()

    await waitFor(() => expect(getStoredState().openedSavedQueries).toEqual(['saved-pages']))
    expect(screen.getAllByTestId('vision-tab')).toHaveLength(1)
    expect(screen.queryByText('vision.saved.opened-as-tabs')).toBeNull()
  })

  it('opens on the query the classic tool last showed', () => {
    localStorage.setItem(
      `sanityVision:${PROJECT_ID}`,
      JSON.stringify({query: '*[_type == "movie"]'}),
    )
    renderRedesign()

    expect(screen.getAllByTestId('vision-tab')).toHaveLength(1)
    expect(getQueryEditor().value).toBe('*[_type == "movie"]')
  })

  it(
    'clears the storage from the settings dialog, closed tabs included, keeping the saved queries',
    {timeout: 15_000},
    async () => {
      const pages = personalSavedQuery(
        'saved-pages',
        'Pages',
        '*[_type == "page"]',
        '2026-01-01T00:00:00Z',
      )
      sanityMocks.savedQueries = {queries: [pages]}
      renderRedesign()
      await waitFor(() => expect(screen.getAllByTestId('vision-tab')).toHaveLength(2))
      fireEvent.click(
        within(screen.getAllByTestId('vision-tab')[0]).getByTestId('vision-tab-close'),
      )
      await waitFor(() => expect(getStoredState().closedTabs).toHaveLength(1))
      typeQuery('*[_type == "author"]')
      fireEvent.click(screen.getByTestId('vision-new-tab'))
      await waitFor(() => expect(getStoredState().tabs).toHaveLength(2))

      fireEvent.click(screen.getByTestId('vision-sidebar-settings'))
      fireEvent.click(await screen.findByTestId('vision-clear-storage'))
      // The list arrives again, as it does whenever the saved queries change
      sanityMocks.savedQueries = {queries: [pages]}
      fireEvent.click(screen.getByTestId('vision-clear-storage-confirm'))

      // The saved query stays saved, and the tab it opened stays closed, no longer listed
      await waitFor(() => expect(screen.getAllByTestId('vision-tab')).toHaveLength(1))
      expect(getQueryEditor().value).toBe('')
      await waitFor(() => {
        const stored = getStoredState()
        expect(stored.tabs).toHaveLength(1)
        expect(stored.tabs[0].query).toBe('')
        expect(stored.closedTabs).toEqual([])
        expect(stored.openedSavedQueries).toEqual(['saved-pages'])
      })
      await new Promise((resolve) => setTimeout(resolve, 50))
      expect(screen.getAllByTestId('vision-tab')).toHaveLength(1)
      // The tool stays open, with the drawer closed
      expect(screen.getByTestId('vision-root')).toBeTruthy()
      expect(screen.queryByTestId('vision-drawer-settings')).toBeNull()
    },
  )

  it('shares a tab once the user confirms', async () => {
    sanityMocks.shareQuery.mockResolvedValueOnce('shared-new')
    const {show} = renderRedesign()
    typeQuery('*[_type == "page"]')
    await waitFor(() => expect(isDisabled(screen.getByTestId('vision-fetch-button'))).toBe(false))

    const menu = await openMenu('vision-query-menu-button', 'vision-query-menu')
    expect(within(menu).queryByTestId('vision-unshare-tab')).toBeNull()
    fireEvent.click(within(menu).getByTestId('vision-share-tab'))
    // A shared tab is a document in the dataset, so nothing is shared before the user confirms
    const dialog = await screen.findByTestId('vision-share-tab-dialog')
    expect(text(dialog)).toContain('save-query.share-warning')
    expect(sanityMocks.shareQuery).not.toHaveBeenCalled()
    fireEvent.click(within(dialog).getByTestId('vision-share-tab-confirm'))

    await waitFor(() => expect(getStoredState().tabs[0].sharedId).toBe('shared-new'))
    expect(sanityMocks.shareQuery).toHaveBeenCalledTimes(1)
    expect(sanityMocks.shareQuery).toHaveBeenCalledWith(expect.objectContaining({title: 'page'}))
    const [[{url}]] = sanityMocks.shareQuery.mock.calls
    expect(new URL(url).searchParams.get('query')).toBe('*[_type == "page"]')
    expect(getStoredState().openedSavedQueries).toEqual([])
    expect(telemetry.log).toHaveBeenCalledWith(
      VisionSharedTabUsed,
      withVisionVersion({action: 'share'}),
    )
    await screen.findByText('vision.tabs.share-success')

    // Listed as shared, the tab is marked as such and, unchanged, has nothing to share again
    sanityMocks.savedQueries = {
      queries: [
        {
          _key: 'shared-new',
          shared: true,
          authorId: 'user-1',
          isOwnedByCurrentUser: true,
          title: 'page',
          url,
          savedAt: '2026-01-01T00:00:00Z',
        },
      ],
    }
    show()
    await waitFor(() =>
      expect(
        within(screen.getByTestId('vision-tab')).queryByRole('img', {name: 'vision.tabs.shared'}),
      ).not.toBeNull(),
    )
    const sharedMenu = await openMenu('vision-query-menu-button', 'vision-query-menu')
    expect(within(sharedMenu).queryByTestId('vision-share-tab')).toBeNull()
    expect(within(sharedMenu).getByTestId('vision-unshare-tab')).toBeTruthy()
  })

  it('shares a shared tab again in place once it changed, without asking again', async () => {
    sanityMocks.savedQueries = {
      queries: [sharedSavedQuery('shared-pages', 'Pages', '*[_type == "page"]', true)],
    }
    storeTabSharedAs('shared-pages', 'Pages', '*[_type == "page"]')
    renderRedesign()
    await waitFor(() => expect(isDisabled(screen.getByTestId('vision-fetch-button'))).toBe(false))

    typeQuery('*[_type == "post"]')
    const menu = await openMenu('vision-query-menu-button', 'vision-query-menu')
    fireEvent.click(within(menu).getByTestId('vision-share-tab'))

    await waitFor(() => expect(sanityMocks.updateSharedQuery).toHaveBeenCalledTimes(1))
    expect(screen.queryByTestId('vision-share-tab-dialog')).toBeNull()
    expect(sanityMocks.shareQuery).not.toHaveBeenCalled()
    const [[updated]] = sanityMocks.updateSharedQuery.mock.calls
    expect(updated).toMatchObject({_key: 'shared-pages', shared: true, title: 'Pages'})
    expect(new URL(updated.url).searchParams.get('query')).toBe('*[_type == "post"]')
    expect(telemetry.log).toHaveBeenCalledWith(
      VisionSharedTabUsed,
      withVisionVersion({action: 'update'}),
    )
    await screen.findByText('vision.tabs.share-update-success')
  })

  it('unshares a tab from its menu, keeping it open', async () => {
    sanityMocks.savedQueries = {
      queries: [sharedSavedQuery('shared-pages', 'Pages', '*[_type == "page"]', true)],
    }
    storeTabSharedAs('shared-pages', 'Pages', '*[_type == "page"]')
    renderRedesign()

    const menu = await openMenu('vision-query-menu-button', 'vision-query-menu')
    expect(within(menu).queryByTestId('vision-share-tab')).toBeNull()
    fireEvent.click(within(menu).getByTestId('vision-unshare-tab'))

    await waitFor(() => expect(getStoredState().tabs[0].sharedId).toBeUndefined())
    expect(sanityMocks.unshareQuery).toHaveBeenCalledWith('shared-pages')
    expect(screen.getAllByTestId('vision-tab')).toHaveLength(1)
    expect(getQueryEditor().value).toBe('*[_type == "page"]')
    expect(telemetry.log).toHaveBeenCalledWith(
      VisionSharedTabUsed,
      withVisionVersion({action: 'unshare'}),
    )
    await screen.findByText('vision.tabs.unshare-success')
  })

  it('keeps a tab shared when unsharing it fails', async () => {
    sanityMocks.savedQueries = {
      queries: [sharedSavedQuery('shared-pages', 'Pages', '*[_type == "page"]', true)],
    }
    sanityMocks.unshareQuery.mockRejectedValueOnce(new Error('permission denied'))
    storeTabSharedAs('shared-pages', 'Pages', '*[_type == "page"]')
    renderRedesign()

    const menu = await openMenu('vision-query-menu-button', 'vision-query-menu')
    fireEvent.click(within(menu).getByTestId('vision-unshare-tab'))

    await screen.findByText('vision.tabs.unshare-failed')
    expect(getStoredState().tabs[0].sharedId).toBe('shared-pages')
    expect(telemetry.log).not.toHaveBeenCalledWith(
      VisionSharedTabUsed,
      withVisionVersion({action: 'unshare'}),
    )
  })

  it("does not share a tab twice, and links the tab to the share when it is the user's own", async () => {
    const own = sharedSavedQuery('shared-pages', 'Pages', '*[_type == "page"]', true)
    sanityMocks.savedQueries = {queries: [own]}
    // The tab shows the shared query, but is not linked to it
    storeTabSharedAs('shared-gone', 'Pages', '*[_type == "page"]')
    renderRedesign()

    const menu = await openMenu('vision-query-menu-button', 'vision-query-menu')
    fireEvent.click(within(menu).getByTestId('vision-share-tab'))

    await screen.findByText('vision.tabs.already-shared')
    expect(screen.queryByTestId('vision-share-tab-dialog')).toBeNull()
    expect(sanityMocks.shareQuery).not.toHaveBeenCalled()
    await waitFor(() => expect(getStoredState().tabs[0].sharedId).toBe('shared-pages'))
  })

  it('offers each shared tab in the drawer the actions its author has', async () => {
    sanityMocks.savedQueries = {
      queries: [
        sharedSavedQuery('shared-pages', 'Pages', '*[_type == "page"]', true),
        sharedSavedQuery('shared-posts', 'Posts', '*[_type == "post"]', false),
      ],
    }
    renderRedesign()
    fireEvent.click(screen.getByTestId('vision-sidebar-shared'))
    await waitFor(() => expect(screen.getAllByTestId('vision-saved-query')).toHaveLength(2))

    expect(menuItemLabels(await openDrawerItemMenu('shared-posts'))).toEqual([
      'vision.saved.open-in-new-tab',
      'vision.saved.load-in-current-tab',
    ])
    fireEvent.keyDown(document.activeElement || document.body, {key: 'Escape'})
    expect(menuItemLabels(await openDrawerItemMenu('shared-pages'))).toEqual([
      'vision.saved.open-in-new-tab',
      'vision.saved.load-in-current-tab',
      'vision.saved.rename',
      'vision.tabs.unshare',
    ])
  })

  it('lists only the shared tabs in the Shared tabs drawer', async () => {
    sanityMocks.savedQueries = {
      queries: [
        sharedSavedQuery('shared-pages', 'Pages', '*[_type == "page"]', true),
        personalSavedQuery('saved-posts', 'Posts', '*[_type == "post"]', '2026-01-01T00:00:00Z'),
      ],
    }
    renderRedesign()
    // The personal saved query opens as a tab instead
    await waitFor(() => expect(screen.getAllByTestId('vision-tab')).toHaveLength(2))

    fireEvent.click(screen.getByTestId('vision-sidebar-shared'))
    const items = await screen.findAllByTestId('vision-saved-query')
    expect(items.map(text)).toEqual([expect.stringContaining('Pages')])
  })

  it('links the tabs opened from shared tabs the user shared, and only those', async () => {
    sanityMocks.savedQueries = {
      queries: [
        sharedSavedQuery('shared-pages', 'Pages', '*[_type == "page"]', true),
        sharedSavedQuery('shared-posts', 'Posts', '*[_type == "post"]', false),
      ],
    }
    renderRedesign()
    fireEvent.click(screen.getByTestId('vision-sidebar-shared'))
    const [own, teammate] = await screen.findAllByTestId('vision-saved-query')

    fireEvent.click(within(own).getByTestId('vision-saved-query-open'))
    fireEvent.click(within(teammate).getByTestId('vision-saved-query-open'))
    await waitFor(() => expect(getStoredState().tabs).toHaveLength(3))
    expect(getStoredState().tabs.slice(1)).toMatchObject([
      {title: 'Pages', query: '*[_type == "page"]', sharedId: 'shared-pages'},
      {title: 'Posts', query: '*[_type == "post"]'},
    ])
    expect(getStoredState().tabs[2].sharedId).toBeUndefined()
    expect(telemetry.log).toHaveBeenCalledWith(
      VisionSharedTabUsed,
      withVisionVersion({action: 'open'}),
    )
    const handles = screen.getAllByTestId('vision-tab')
    expect(within(handles[1]).queryByRole('img', {name: 'vision.tabs.shared'})).not.toBeNull()
    expect(within(handles[2]).queryByRole('img', {name: 'vision.tabs.shared'})).toBeNull()

    // Opened again, the linked tab is selected even after it changed
    typeQuery('*[_type == "author"]')
    fireEvent.click(within(handles[1]).getByTestId('vision-tab-button'))
    typeQuery('*[_type == "page" && defined(title)]')
    fireEvent.click(within(handles[2]).getByTestId('vision-tab-button'))
    fireEvent.click(within(own).getByTestId('vision-saved-query-open'))
    await waitFor(() => expect(getQueryEditor().value).toBe('*[_type == "page" && defined(title)]'))
    expect(screen.getAllByTestId('vision-tab')).toHaveLength(3)

    fireEvent.change(within(screen.getByTestId('vision-drawer-shared')).getByRole('textbox'), {
      target: {value: 'pa'},
    })
    expect(telemetry.log).toHaveBeenCalledWith(VisionSharedTabsSearched, withVisionVersion({}))
  })

  it('unshares a shared tab from the drawer, keeping its query open in a tab', async () => {
    sanityMocks.savedQueries = {
      queries: [
        sharedSavedQuery('shared-pages', 'Pages', '*[_type == "page"]', true),
        sharedSavedQuery('shared-posts', 'Posts', '*[_type == "post"]', true),
      ],
    }
    storeTabSharedAs('shared-pages', 'Pages', '*[_type == "page"]')
    renderRedesign()
    fireEvent.click(screen.getByTestId('vision-sidebar-shared'))
    await waitFor(() => expect(screen.getAllByTestId('vision-saved-query')).toHaveLength(2))

    // The tab shared as it stays open, no longer shared
    fireEvent.click(
      within(await openDrawerItemMenu('shared-pages')).getByText('vision.tabs.unshare'),
    )
    await waitFor(() => expect(getStoredState().tabs[0].sharedId).toBeUndefined())
    expect(sanityMocks.unshareQuery).toHaveBeenCalledWith('shared-pages')
    expect(getStoredState().tabs).toHaveLength(1)
    expect(telemetry.log).toHaveBeenCalledWith(
      VisionSharedTabUsed,
      withVisionVersion({action: 'unshare'}),
    )

    // One no tab shows opens in a tab of its own, so unsharing it does not lose it
    fireEvent.click(
      within(await openDrawerItemMenu('shared-posts')).getByText('vision.tabs.unshare'),
    )
    await waitFor(() => expect(getStoredState().tabs).toHaveLength(2))
    expect(getStoredState().tabs[1]).toMatchObject({title: 'Posts', query: '*[_type == "post"]'})
    expect(getStoredState().tabs[1].sharedId).toBeUndefined()
  })

  it('unshares a shared tab whose tab was closed, keeping it in Restore tabs instead of reopening it', async () => {
    sanityMocks.savedQueries = {
      queries: [sharedSavedQuery('shared-pages', 'Pages', '*[_type == "page"]', true)],
    }
    const initial = createInitialState(DEFAULTS)
    const tabs = [
      createTab(initial.settings, {id: 'posts', query: '*[_type == "post"]'}),
      createTab(initial.settings, {
        id: 'pages',
        title: 'Pages',
        query: '*[_type == "page"]',
        sharedId: 'shared-pages',
      }),
    ]
    saveVisionState(PROJECT_ID, {...initial, tabs, activeTabId: 'posts'})
    renderRedesign()

    fireEvent.click(within(screen.getAllByTestId('vision-tab')[1]).getByTestId('vision-tab-close'))
    await waitFor(() => expect(getStoredState().closedTabs).toHaveLength(1))

    fireEvent.click(screen.getByTestId('vision-sidebar-shared'))
    await screen.findByTestId('vision-saved-query')
    fireEvent.click(
      within(await openDrawerItemMenu('shared-pages')).getByText('vision.tabs.unshare'),
    )
    await waitFor(() => expect(getStoredState().closedTabs[0].tab.sharedId).toBeUndefined())
    expect(sanityMocks.unshareQuery).toHaveBeenCalledWith('shared-pages')
    expect(getStoredState().closedTabs[0].tab).toMatchObject({id: 'pages', title: 'Pages'})
    expect(getStoredState().tabs.map((tab: {id: string}) => tab.id)).toEqual(['posts'])
  })

  it('lists a closed tab in Restore tabs, restores it after the open tabs, and deletes one for good', async () => {
    const initial = createInitialState(DEFAULTS)
    const tabs = [
      createTab(initial.settings, {id: 'posts', title: 'Posts', query: '*[_type == "post"]'}),
      createTab(initial.settings, {id: 'pages', query: '*[_type == "page"]{title}'}),
      createTab(initial.settings, {id: 'authors', query: '*[_type == "author"]'}),
    ]
    saveVisionState(PROJECT_ID, {...initial, tabs, activeTabId: 'authors'})
    renderRedesign()

    fireEvent.click(within(screen.getAllByTestId('vision-tab')[1]).getByTestId('vision-tab-close'))
    fireEvent.click(within(screen.getAllByTestId('vision-tab')[0]).getByTestId('vision-tab-close'))
    await waitFor(() => expect(getStoredState().closedTabs).toHaveLength(2))

    // Most recently closed first, each with when it was closed
    fireEvent.click(screen.getByTestId('vision-sidebar-closed-tabs'))
    const drawer = await screen.findByTestId('vision-drawer-closed-tabs')
    const rows = within(drawer).getAllByTestId('vision-closed-tab')
    expect(rows.map(text)).toEqual([
      expect.stringContaining('Posts'),
      expect.stringContaining('page'),
    ])
    expect(text(rows[0])).toContain('vision.closed-tabs.closed-at')

    // Restored, the tab opens as it was after the open ones, and shows
    fireEvent.click(within(rows[0]).getByTestId('vision-closed-tab-restore'))
    await waitFor(() => expect(getQueryEditor().value).toBe('*[_type == "post"]'))
    await waitFor(() =>
      expect(getStoredState().tabs.map((tab: {id: string}) => tab.id)).toEqual([
        'authors',
        'posts',
      ]),
    )
    expect(getStoredState().tabs[1].title).toBe('Posts')
    expect(within(drawer).getAllByTestId('vision-closed-tab')).toHaveLength(1)
    expect(telemetry.log).toHaveBeenCalledWith(
      VisionClosedTabUsed,
      withVisionVersion({action: 'restore'}),
    )

    // Deleted from its menu, a closed tab is gone for good
    const menu = await openClosedTabMenu('pages')
    expect(menuItemLabels(menu)).toEqual([
      'vision.closed-tabs.restore',
      'vision.closed-tabs.delete',
    ])
    fireEvent.click(within(menu).getByTestId('vision-closed-tab-delete'))
    await waitFor(() => expect(getStoredState().closedTabs).toEqual([]))
    expect(within(drawer).queryByTestId('vision-closed-tab')).toBeNull()
    expect(text(drawer)).toContain('vision.closed-tabs.empty')
    expect(screen.getAllByTestId('vision-tab')).toHaveLength(2)
    expect(telemetry.log).toHaveBeenCalledWith(
      VisionClosedTabUsed,
      withVisionVersion({action: 'delete'}),
    )
    expect(logged(VisionSavedQueryUsed.name)).toEqual([])
  })

  it('keeps params typed just before closing a tab in Restore tabs, ahead of the debounce', async () => {
    const initial = createInitialState(DEFAULTS)
    const tabs = [
      createTab(initial.settings, {id: 'posts', query: '*[_type == "post" && _id == $id]'}),
      createTab(initial.settings, {id: 'blank'}),
    ]
    saveVisionState(PROJECT_ID, {...initial, tabs, activeTabId: 'posts'})
    renderRedesign()

    // Closed with its close button
    fireEvent.change(getParamsEditor(), {target: {value: '{"id": "typed"}'}})
    fireEvent.click(within(screen.getAllByTestId('vision-tab')[0]).getByTestId('vision-tab-close'))
    await waitFor(() => expect(getStoredState().closedTabs).toHaveLength(1))
    expect(getStoredState().closedTabs[0].tab).toMatchObject({
      id: 'posts',
      rawParams: '{"id": "typed"}',
    })

    // Closed with Delete, a tab that holds nothing but the params just typed is kept too
    fireEvent.change(getParamsEditor(), {target: {value: '{"limit": 2}'}})
    fireEvent.keyDown(within(screen.getByTestId('vision-tab')).getByRole('tab'), {key: 'Delete'})
    await waitFor(() => expect(getStoredState().closedTabs).toHaveLength(2))
    expect(getStoredState().closedTabs[0].tab).toMatchObject({
      id: 'blank',
      rawParams: '{"limit": 2}',
    })

    // Restored, the tab shows the params its editor showed when it was closed
    fireEvent.click(screen.getByTestId('vision-sidebar-closed-tabs'))
    const drawer = await screen.findByTestId('vision-drawer-closed-tabs')
    const posts = within(drawer)
      .getAllByTestId('vision-closed-tab')
      .find((row) => text(row).includes('post'))
    if (!posts) throw new Error('The closed posts tab is not listed')
    fireEvent.click(within(posts).getByTestId('vision-closed-tab-restore'))
    await waitFor(() => expect(getParamsEditor().value).toBe('{"id": "typed"}'))
  })

  it('searches the closed tabs by title and query, recording each search once', async () => {
    const initial = createInitialState(DEFAULTS)
    const closedAt = new Date().toISOString()
    saveVisionState(PROJECT_ID, {
      ...initial,
      closedTabs: [
        {
          tab: createTab(initial.settings, {
            id: 'posts',
            title: 'Posts',
            query: '*[_type == "post"]',
          }),
          closedAt,
        },
        {tab: createTab(initial.settings, {id: 'pages', query: '*[_type == "page"]'}), closedAt},
      ],
    })
    renderRedesign()
    fireEvent.click(screen.getByTestId('vision-sidebar-closed-tabs'))
    const drawer = await screen.findByTestId('vision-drawer-closed-tabs')
    const search = within(drawer).getByRole('textbox')
    const rows = () => within(drawer).queryAllByTestId('vision-closed-tab').map(text)

    fireEvent.change(search, {target: {value: 'p'}})
    fireEvent.change(search, {target: {value: 'pos'}})
    expect(rows()).toEqual([expect.stringContaining('Posts')])
    fireEvent.change(search, {target: {value: '"page"'}})
    expect(rows()).toEqual([expect.stringContaining('page')])
    fireEvent.change(search, {target: {value: 'author'}})
    expect(rows()).toEqual([])
    expect(text(drawer)).toContain('vision.saved.empty-search')
    expect(logged(VisionClosedTabsSearched.name)).toHaveLength(1)

    // Cleared and typed into again, it is another search
    fireEvent.change(search, {target: {value: ''}})
    fireEvent.change(search, {target: {value: 'p'}})
    expect(logged(VisionClosedTabsSearched.name)).toHaveLength(2)
    expect(logged(VisionSavedQueriesFiltered.name)).toEqual([])
  })

  it('purges a closed tab 30 days after it was closed, also while the tool stays open', async () => {
    vi.useFakeTimers({now: new Date('2026-03-31T12:00:00Z'), toFake: ['Date']})
    onTestFinished(() => {
      vi.useRealTimers()
    })
    const initial = createInitialState(DEFAULTS)
    const closed = (id: string, closedAt: string) => ({
      tab: createTab(initial.settings, {id, title: id, query: `*[_type == "${id}"]`}),
      closedAt,
    })
    saveVisionState(PROJECT_ID, {
      ...initial,
      closedTabs: [
        closed('recent', '2026-03-30T12:00:00.000Z'),
        closed('older', '2026-03-02T12:00:00.000Z'),
        // Closed 30 days ago, it is not loaded
        closed('expired', '2026-03-01T12:00:00.000Z'),
      ],
    })
    renderRedesign()
    const rows = () => screen.queryAllByTestId('vision-closed-tab').map(text)
    fireEvent.click(screen.getByTestId('vision-sidebar-closed-tabs'))
    await waitFor(() =>
      expect(rows()).toEqual([expect.stringContaining('recent'), expect.stringContaining('older')]),
    )

    // Two days on, with the tool open all along, the drawer purges as it opens again
    vi.setSystemTime(new Date('2026-04-02T12:00:00Z'))
    fireEvent.click(screen.getByTestId('vision-sidebar-closed-tabs'))
    fireEvent.click(screen.getByTestId('vision-sidebar-closed-tabs'))
    await waitFor(() => expect(rows()).toEqual([expect.stringContaining('recent')]))
    await waitFor(() =>
      expect(getStoredState().closedTabs.map(({tab}: {tab: {id: string}}) => tab.id)).toEqual([
        'recent',
      ]),
    )
  })

  it('waits before the first rail tooltip opens and then opens its neighbours at once', async () => {
    renderRedesign()
    // A closed tooltip can stay mounted under a hidden `<Activity>`, so only a shown one counts
    const tooltip = (label: string) =>
      Array.from(document.querySelectorAll<HTMLElement>('[data-ui="Tooltip"]')).find(
        (element) => text(element) === label && !element.closest('[style*="display: none"]'),
      )

    const shared = screen.getByTestId('vision-sidebar-shared')
    fireEvent.mouseEnter(shared)
    // A pointer passing over the rail on its way elsewhere opens nothing
    await act(() => new Promise((resolve) => setTimeout(resolve, 100)))
    expect(tooltip('vision.sidebar.shared-queries')).toBeUndefined()
    await waitFor(() => expect(tooltip('vision.sidebar.shared-queries')).toBeDefined())

    fireEvent.mouseLeave(shared)
    fireEvent.mouseEnter(screen.getByTestId('vision-sidebar-closed-tabs'))
    await act(() => new Promise((resolve) => setTimeout(resolve, 50)))
    expect(tooltip('vision.sidebar.closed-tabs')).toBeDefined()
  })

  it('sets the fields hidden from history diffs in the settings', async () => {
    renderRedesign()
    // The settings open in the sidebar's drawer, and close from the same button
    fireEvent.click(screen.getByTestId('vision-sidebar-settings'))
    const drawer = screen.getByTestId('vision-drawer-settings')
    expect(within(drawer).getByTestId('vision-settings')).toBeTruthy()
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.click(screen.getByTestId('vision-sidebar-settings'))
    expect(screen.queryByTestId('vision-drawer-settings')).toBeNull()
    fireEvent.click(screen.getByTestId('vision-sidebar-settings'))
    const fields = (await screen.findByTestId(
      'vision-settings-hidden-diff-fields',
    )) as HTMLTextAreaElement
    const reset = screen.getByTestId('vision-settings-hidden-diff-fields-reset')
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

  it('runs its own layout changes as view transitions, and never a tab being opened, switched or closed', async () => {
    const startViewTransition = stubViewTransitions()
    const {hide, show} = renderRedesign()
    const transitionTypes = () => startViewTransition.mock.calls.map(([call]) => call.types)

    // A view transition snapshots the page and holds pointer events while it runs, so tabs and
    // leaving the tool change at once
    fireEvent.click(screen.getByTestId('vision-new-tab'))
    fireEvent.click(within(screen.getAllByTestId('vision-tab')[0]).getByTestId('vision-tab-button'))
    fireEvent.click(within(screen.getAllByTestId('vision-tab')[1]).getByTestId('vision-tab-close'))
    hide()
    show()
    await act(async () => {})
    expect(startViewTransition).not.toHaveBeenCalled()

    const toggle = within(shownTab()).getByTestId('vision-request-panel-toggle')
    fireEvent.click(toggle)
    await waitFor(() =>
      expect(transitionTypes()).toEqual([['vision-panel', 'sanity-studio-resize']]),
    )
    await waitFor(() => expect(toggle.getAttribute('aria-expanded')).toBe('false'))

    fireEvent.click(screen.getByTestId('vision-sidebar-closed-tabs'))
    await screen.findByTestId('vision-drawer-closed-tabs')
    fireEvent.click(screen.getByTestId('vision-sidebar-toggle'))
    await waitFor(() =>
      expect(transitionTypes()).toEqual([
        ['vision-panel', 'sanity-studio-resize'],
        ['vision-sidebar', 'sanity-studio-resize'],
        ['vision-sidebar', 'sanity-studio-resize'],
      ]),
    )
  })

  it('pictures the Mutate drawer with its tool in it as the drawer comes in and as it leaves', async () => {
    const pictures: {state: 'old' | 'new'; drawer: boolean; mutate: boolean}[] = []
    stubViewTransitions((state) => {
      pictures.push({
        state,
        // React names the elements a view transition animates on their own
        drawer: Boolean(screen.queryByTestId('vision-drawer-mutate')?.style.viewTransitionName),
        mutate: screen.queryByTestId('vision-mutate') !== null,
      })
    })
    renderRedesign()

    // The tab renders the tool for the drawer as it shows, so the drawer slides in with the tool
    // in it and slides out with the tool still in it, rather than empty
    fireEvent.click(screen.getByTestId('vision-sidebar-mutate'))
    await screen.findByTestId('vision-mutate')
    await waitFor(() => expect(pictures).toHaveLength(2))
    expect(pictures).toEqual([
      {state: 'old', drawer: false, mutate: false},
      {state: 'new', drawer: true, mutate: true},
    ])
    expect(
      within(screen.getByTestId('vision-drawer-mutate-content')).getByTestId('vision-mutate'),
    ).toBeTruthy()

    fireEvent.click(screen.getByTestId('vision-sidebar-mutate'))
    await waitFor(() => expect(pictures).toHaveLength(4))
    expect(pictures.slice(2)).toEqual([
      {state: 'old', drawer: true, mutate: true},
      {state: 'new', drawer: false, mutate: false},
    ])
  })

  it('opens and closes the phone drawer at once, inert behind it only while it shows', async () => {
    const startViewTransition = stubViewTransitions()
    const {innerWidth} = window
    Object.defineProperty(window, 'innerWidth', {configurable: true, value: 500})
    try {
      renderRedesign()
      const rail = screen.getByTestId('vision-sidebar')

      // Floating over the tool, the drawer moves nothing, so it shows with the click that opens it
      fireEvent.click(screen.getByTestId('vision-sidebar-closed-tabs'))
      const drawer = screen.getByTestId('vision-drawer-closed-tabs')
      expect(rail.hasAttribute('inert')).toBe(true)

      fireEvent.click(within(drawer).getByRole('button', {name: 'vision.drawer.close'}))
      expect(screen.queryByTestId('vision-drawer-closed-tabs')).toBeNull()
      expect(rail.hasAttribute('inert')).toBe(false)
      await act(async () => {})
      expect(startViewTransition).not.toHaveBeenCalled()
    } finally {
      Object.defineProperty(window, 'innerWidth', {configurable: true, value: innerWidth})
    }
  })

  it('opens the phone drawer as a modal dialog: focus moves in, and back to the opener on Escape', async () => {
    // Without a measured root the layout follows the viewport; a phone one floats the drawer
    const {innerWidth} = window
    Object.defineProperty(window, 'innerWidth', {configurable: true, value: 500})
    try {
      const {hide, show} = renderRedesign()
      const opener = screen.getByTestId('vision-sidebar-closed-tabs')
      opener.focus()
      fireEvent.click(opener)

      const drawer = await screen.findByTestId('vision-drawer-closed-tabs')
      expect(drawer.getAttribute('role')).toBe('dialog')
      expect(drawer.getAttribute('aria-modal')).toBe('true')
      // The rail behind the drawer is inert; the drawer's close button takes focus
      expect(screen.getByTestId('vision-sidebar').hasAttribute('inert')).toBe(true)
      const closeButton = within(drawer).getByRole('button', {name: 'vision.drawer.close'})
      await waitFor(() => expect(document.activeElement).toBe(closeButton))

      // Leaving for another tool hides the drawer along with the tool but does not close it:
      // focus must not jump back to the rail, and coming back keeps the opener for later
      hide()
      expect(document.activeElement).not.toBe(opener)
      show()
      await waitFor(() => expect(document.activeElement).toBe(closeButton))

      fireEvent.keyDown(drawer, {key: 'Escape'})
      await waitFor(() => expect(screen.queryByTestId('vision-drawer-closed-tabs')).toBeNull())
      await waitFor(() => expect(document.activeElement).toBe(opener))
    } finally {
      Object.defineProperty(window, 'innerWidth', {configurable: true, value: innerWidth})
    }
  })

  it('stacks the columns when the sidebar takes their room, without the window changing', async () => {
    renderRedesign()
    const root = await screen.findByTestId('vision-root')
    const tabsArea = screen.getByTestId('vision-tabs-area')
    resizeElement(root, {width: 1200, height: 800})
    resizeElement(tabsArea, {width: 1151, height: 800})
    expect(root.dataset.visionLayout).toBe('columns')
    expect(screen.getByTestId('vision-split-handle').getAttribute('aria-orientation')).toBe(
      'vertical',
    )

    // A drawer opens beside the rail: the tool keeps its width, the tabs area loses 300px
    resizeElement(tabsArea, {width: 851 - 1, height: 800})
    expect(root.dataset.visionLayout).toBe('stacked')
    expect(screen.getByTestId('vision-split-handle').getAttribute('aria-orientation')).toBe(
      'horizontal',
    )

    // Closing it gives the room back
    resizeElement(tabsArea, {width: 1151, height: 800})
    expect(root.dataset.visionLayout).toBe('columns')

    // The phone layout follows the whole tool, so a floating drawer cannot switch it back out
    resizeElement(root, {width: 560, height: 800})
    expect(root.dataset.visionLayout).toBe('mobile')
  })

  // The redesign's stylesheet and @sanity/ui's runtime stylesheet load in either order (the
  // built studio links the stylesheet first, `sanity dev` injects it later), so a layout the two
  // disagree on must come from the component's own `display` prop: a `display: flex` in the
  // stylesheet that ties with Box's `.x:not([hidden]) {display: block}` loses in a built studio,
  // and the result scroller, and the graph filling it, get no height (jsdom resolves the
  // runtime stylesheet and no CSS module here, so what is asserted is the prop's rule alone)
  it('lays out the result card as a flex column through its own display rule', async () => {
    renderRedesign()
    const result = await screen.findByTestId('vision-result')
    const style = getComputedStyle(result)
    expect(style.display).toBe('flex')
    expect(result.querySelector('[data-testid="vision-result-toolbar"]')).not.toBeNull()
  })

  it('hides the pane that is not shown in the phone layout through the hidden attribute', async () => {
    renderRedesign()
    const root = await screen.findByTestId('vision-root')
    resizeElement(root, {width: 560, height: 800})
    expect(root.dataset.visionLayout).toBe('mobile')
    const requestPane = root.querySelector<HTMLElement>('[id$="vision-mobile-request-pane"]')!
    const responsePane = root.querySelector<HTMLElement>('[id$="vision-mobile-response-pane"]')!
    expect(requestPane.hidden).toBe(false)
    expect(responsePane.hidden).toBe(true)
    expect(getComputedStyle(responsePane).display).toBe('none')

    fireEvent.click(screen.getByRole('tab', {name: 'result.label'}))
    expect(requestPane.hidden).toBe(true)
    expect(responsePane.hidden).toBe(false)
    expect(getComputedStyle(responsePane).display).toBe('block')
  })

  it('keeps both panes of the main split at their minimum size, from the keyboard as well', async () => {
    renderRedesign()
    const split = await screen.findByTestId('vision-split')
    // The tab container's size gives the default share, the split's own its bounds
    resizeElement(shownTab(), {width: 1200, height: 700})
    resizeElement(split, {width: 1200, height: 700})
    const handle = screen.getByTestId('vision-split-handle')
    const requestPane = split.firstElementChild as HTMLElement

    // The request pane starts with half the width; the divider is a separator that says so and
    // can take neither pane below 280px
    expect(requestPane.style.flex).toBe('0 0 600px')
    expect(handle.getAttribute('role')).toBe('separator')
    expect(handle.getAttribute('aria-orientation')).toBe('vertical')
    expect(handle.getAttribute('aria-label')).toBe('vision.split.request-response')
    expect(handle.getAttribute('aria-valuenow')).toBe('600')
    expect(handle.getAttribute('aria-valuemin')).toBe('280')
    expect(handle.getAttribute('aria-valuemax')).toBe('919')
    expect(handle.getAttribute('tabindex')).toBe('0')

    // Arrow keys move the divider by a step, five with Shift, and a step that would pass over
    // equal halves stops on them; Home and End go to the bounds
    fireEvent.keyDown(handle, {key: 'ArrowRight'})
    expect(requestPane.style.flex).toBe('0 0 616px')
    fireEvent.keyDown(handle, {key: 'ArrowLeft', shiftKey: true})
    expect(requestPane.style.flex).toBe('0 0 600px')
    fireEvent.keyDown(handle, {key: 'ArrowLeft', shiftKey: true})
    expect(requestPane.style.flex).toBe('0 0 520px')
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

  it('renders a switched-to or new tab with the layout already in place, in its first render', async () => {
    renderRedesign()
    const split = await screen.findByTestId('vision-split')
    resizeElement(shownTab(), {width: 1200, height: 700})
    resizeElement(split, {width: 1200, height: 700})
    fireEvent.keyDown(screen.getByTestId('vision-split-handle'), {key: 'ArrowRight'})
    fireEvent.click(document.getElementById('vision-response-history-tab') as HTMLElement)
    fireEvent.click(document.getElementById('vision-request-lint-tab') as HTMLElement)

    // Each tab mounts its own panels, which nothing has measured yet: the split and the bottom
    // panels have to come from what the tab before them showed, or they paint in a default first
    const expectSameLayout = () => {
      const requestPane = within(shownTab()).getByTestId('vision-split')
        .firstElementChild as HTMLElement
      expect(requestPane.style.flex).toBe('0 0 616px')
      for (const id of ['vision-response-history-tab', 'vision-request-lint-tab']) {
        expect(document.getElementById(id)?.getAttribute('aria-selected')).toBe('true')
      }
    }
    fireEvent.click(screen.getByTestId('vision-new-tab'))
    expectSameLayout()
    fireEvent.click(within(screen.getAllByTestId('vision-tab')[0]).getByTestId('vision-tab-button'))
    expectSameLayout()
  })

  it.each(['params', 'options', 'lint', 'functions'] as const)(
    'fits the request panel to the %s tab on double-click, not on a single click',
    async (id) => {
      const offsetHeight = vi
        .spyOn(HTMLElement.prototype, 'offsetHeight', 'get')
        .mockImplementation(function (this: HTMLElement) {
          if (this.hasAttribute('data-vision-panel-content')) return 300
          const panel = this.parentElement
          return panel?.dataset.testid === 'vision-request-panel' &&
            panel.firstElementChild === this
            ? 35
            : 0
        })
      const clientHeight = vi
        .spyOn(HTMLElement.prototype, 'clientHeight', 'get')
        .mockImplementation(function (this: HTMLElement) {
          return this.dataset.testid === 'vision-request-column-split' ? 800 : 0
        })
      onTestFinished(() => {
        offsetHeight.mockRestore()
        clientHeight.mockRestore()
      })
      renderRedesign()
      const split = await screen.findByTestId('vision-request-column-split')
      const bottomPane = split.lastElementChild as HTMLElement
      const initialFlex = bottomPane.style.flex
      const tab = document.getElementById(`vision-request-${id}-tab`) as HTMLElement
      expect(tab.hasAttribute('title')).toBe(false)

      fireEvent.click(tab)
      expect(tab.getAttribute('aria-selected')).toBe('true')
      expect(bottomPane.style.flex).toBe(initialFlex)

      fireEvent.doubleClick(tab)
      await waitFor(() => expect(bottomPane.style.flex).toBe('0 0 335px'))
    },
  )

  it('places the params view menu between copy and the params menu, as the result view menu is', async () => {
    renderRedesign()
    await screen.findByTestId('vision-request-column-split')
    fireEvent.click(document.getElementById('vision-request-params-tab') as HTMLElement)

    const actions = screen.getByTestId('vision-params-toolbar-actions')
    const viewButton = within(actions).getByTestId('vision-params-view-button')
    expect(text(viewButton)).toBe('vision.params.view.json')
    expect(viewButton.getAttribute('aria-label')).toBe('vision.params.view.button')
    expect(
      Array.from(actions.querySelectorAll('[data-testid]'), (element) =>
        element.getAttribute('data-testid'),
      ).filter((id) =>
        ['vision-params-copy', 'vision-params-view-button', 'vision-params-menu-button'].includes(
          id ?? '',
        ),
      ),
    ).toEqual(['vision-params-copy', 'vision-params-view-button', 'vision-params-menu-button'])

    const menu = await openMenu('vision-params-view-button', 'vision-params-view-menu')
    const items = within(menu).getAllByRole('menuitemradio', {hidden: true})
    expect(items.map((item) => item.getAttribute('data-testid'))).toEqual([
      'vision-params-view-json',
      'vision-params-view-form',
    ])
    expect(items.map((item) => item.getAttribute('aria-checked'))).toEqual(['true', 'false'])
  })

  it('shows no fit tooltip on the panel tabs', async () => {
    renderRedesign()
    await screen.findByTestId('vision-request-column-split')
    fireEvent.click(document.getElementById('vision-request-params-tab') as HTMLElement)

    expect(screen.getByTestId('vision-params-view-button')).toBeTruthy()
    expect(document.getElementById('vision-response-response-tab')).not.toBeNull()
    const titled = [...document.querySelectorAll('[role="tab"][title]')].map((tab) => tab.id)
    expect(titled).toEqual([])
  })
})

function withVisionVersion<Data extends object>(data: Data) {
  return {...data, visionVersion: VISION_VERSION}
}

function logged(name: string): unknown[][] {
  return telemetry.log.mock.calls.filter((call) => call[0]?.name === name)
}

describe('VisionRedesign adoption telemetry', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  beforeEach(() => {
    localStorage.clear()
    resetAiCredits()
    sanityMocks.setPerspective(BASE_PERSPECTIVE)
    sanityMocks.savedQueries = {queries: []}
    sanityMocks.router.state = {}
    sanityMocks.workspace = {document: {drafts: {enabled: true}}, beta: {variants: {enabled: true}}}
    editorMocks.visibleColumns = undefined
  })

  it('records a fetch, a shortcut and starting Live once each, and params only when the run has them', async () => {
    const {fetchCalls, setPerspective} = renderRedesign()
    expect(logged(VisionTabsChanged.name)).toEqual([
      [VisionTabsChanged, withVisionVersion({count: 1, action: 'open'})],
    ])

    typeQuery('*[_type == "author"]')
    fireEvent.click(screen.getByTestId('vision-fetch-button'))
    await waitFor(() => expect(fetchCalls).toHaveLength(1))
    expect(logged(VisionQueryRun.name)).toEqual([
      [VisionQueryRun, withVisionVersion({mode: 'fetch', trigger: 'button', hasParams: false})],
    ])
    expect(logged(VisionParamsUsed.name)).toEqual([])

    const params = within(screen.getByTestId('vision-params-editor')).getByTestId(
      'codemirror-mock',
    ) as HTMLTextAreaElement
    fireEvent.change(params, {target: {value: '{\n  "limit": 1\n}'}})
    fireEvent.keyDown(getQueryEditor(), {key: 'Enter', ctrlKey: true, which: 13, keyCode: 13})
    await waitFor(() => expect(fetchCalls).toHaveLength(2))
    expect(logged(VisionQueryRun.name)).toEqual([
      [VisionQueryRun, withVisionVersion({mode: 'fetch', trigger: 'button', hasParams: false})],
      [VisionQueryRun, withVisionVersion({mode: 'fetch', trigger: 'shortcut', hasParams: true})],
    ])
    expect(logged(VisionParamsUsed.name)).toEqual([
      [VisionParamsUsed, withVisionVersion({mode: 'fetch'})],
    ])

    // Starting Live counts as a listen run, though it fetches nothing
    fireEvent.click(within(shownTab()).getByTestId('vision-auto-refetch'))
    await waitFor(() => expect(logged(VisionQueryRun.name)).toHaveLength(3))
    expect(fetchCalls).toHaveLength(2)
    expect(logged(VisionQueryRun.name).at(-1)).toEqual([
      VisionQueryRun,
      withVisionVersion({mode: 'listen', trigger: 'button', hasParams: true}),
    ])
    expect(logged(VisionParamsUsed.name)).toEqual([
      [VisionParamsUsed, withVisionVersion({mode: 'fetch'})],
      [VisionParamsUsed, withVisionVersion({mode: 'listen'})],
    ])

    // A live refetch, a pasted query and the navbar following along are not query runs
    const before = logged(VisionQueryRun.name).length
    setPerspective({...BASE_PERSPECTIVE, selectedPerspective: 'published'})
    expect(logged(VisionQueryRun.name)).toHaveLength(before)
    expect(logged(VisionPerspectiveChanged.name)).toEqual([])
  })

  it('records a dataset, perspective or API version change once, and not the refetch it causes', async () => {
    renderRedesign()
    telemetry.log.mockClear()
    typeQuery('*[_type == "author"]')
    openRequestTab('options')

    expect(logged(VisionDatasetChanged.name)).toEqual([])
    pickDataset('staging')
    expect(logged(VisionDatasetChanged.name)).toEqual([
      [VisionDatasetChanged, withVisionVersion({})],
    ])

    pickMenuItem('vision-option-perspective-select', 'drafts')
    pickMenuItem('vision-option-perspective-select', 'drafts')
    expect(logged(VisionPerspectiveChanged.name)).toEqual([
      [VisionPerspectiveChanged, withVisionVersion({})],
    ])

    const apiVersion = screen.getByTestId('vision-option-api-version-select')
    fireEvent.change(apiVersion, {target: {value: 'v1'}})
    // A dated version that is not one of the listed ones is a custom version
    fireEvent.change(apiVersion, {target: {value: 'v2020-01-01'}})
    fireEvent.change(apiVersion, {target: {value: 'v2020-01-01'}})
    expect(logged(VisionApiVersionChanged.name)).toEqual([
      [VisionApiVersionChanged, withVisionVersion({custom: false})],
      [VisionApiVersionChanged, withVisionVersion({custom: true})],
    ])
    expect(logged(VisionQueryRun.name)).toEqual([])

    // Settings edits the default for a new tab, not the query that is open
    fireEvent.click(screen.getByTestId('vision-sidebar-settings'))
    fireEvent.change(await screen.findByTestId('vision-settings-api-version-select'), {
      target: {value: 'vX'},
    })
    pickMenuItem('vision-settings-perspective-select', 'drafts')
    expect(logged(VisionApiVersionChanged.name)).toHaveLength(2)
    expect(logged(VisionPerspectiveChanged.name)).toHaveLength(1)
  })

  it('records a successful copy of the query, the URL and a snippet, and nothing when the copy fails', async () => {
    const {fetchCalls} = renderRedesign()
    const writeText = vi.fn(() => Promise.resolve())
    const clipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
    Object.defineProperty(navigator, 'clipboard', {value: {writeText}, configurable: true})
    try {
      typeQuery('*[_type == "author"]')
      fireEvent.click(within(shownTab()).getByTestId('vision-query-copy'))
      await waitFor(() =>
        expect(logged(VisionCopied.name)).toEqual([
          [VisionCopied, withVisionVersion({target: 'query'})],
        ]),
      )

      fireEvent.click(screen.getByTestId('vision-fetch-button'))
      await waitFor(() => expect(fetchCalls).toHaveLength(1))
      fireEvent.click(screen.getByRole('button', {name: 'action.copy-url-to-clipboard'}))
      await waitFor(() =>
        expect(logged(VisionCopied.name)).toEqual([
          [VisionCopied, withVisionVersion({target: 'query'})],
          [VisionCopied, withVisionVersion({target: 'url'})],
        ]),
      )

      fireEvent.click(screen.getByTestId('vision-query-menu-button'))
      fireEvent.click(screen.getByTestId('vision-export-query'))
      const copy = await screen.findByTestId('vision-export-query-copy')
      fireEvent.click(copy)
      await waitFor(() =>
        expect(logged(VisionSnippetCopied.name)).toEqual([
          [VisionSnippetCopied, withVisionVersion({snippet: 'client'})],
        ]),
      )

      writeText.mockRejectedValueOnce(new Error('denied'))
      fireEvent.click(screen.getByTestId('vision-export-query-copy'))
      await waitFor(() => expect(writeText).toHaveBeenCalledTimes(4))
      expect(logged(VisionSnippetCopied.name)).toHaveLength(1)
    } finally {
      if (clipboard) Object.defineProperty(navigator, 'clipboard', clipboard)
      else Reflect.deleteProperty(navigator, 'clipboard')
    }
  })

  it('records an agent action once when it is submitted, and not an empty prompt or the query plan', async () => {
    const {replyToPrompts, respondToRequests} = renderRedesign()
    replyToPrompts(new Error('offline'))
    respondToRequests({result: [], explain: 'Pipeline {}'})

    fireEvent.click(screen.getByTestId('vision-generate-query'))
    fireEvent.click(screen.getByTestId('vision-generate-submit'))
    expect(logged(VisionAgentActionInvoked.name)).toEqual([])

    fireEvent.change(screen.getByTestId('vision-generate-request'), {target: {value: 'Authors'}})
    fireEvent.click(screen.getByTestId('vision-generate-submit'))
    expect(logged(VisionAgentActionInvoked.name)).toEqual([
      [VisionAgentActionInvoked, withVisionVersion({action: 'generate-query'})],
    ])

    typeQuery('*[_type == "author"]')
    fireEvent.click(document.getElementById('vision-response-explain-tab') as HTMLElement)
    fireEvent.click(screen.getByTestId('vision-explain-plan-button'))
    await waitFor(() => expect(isDisabled(screen.getByTestId('vision-explain-button'))).toBe(false))
    fireEvent.click(screen.getByTestId('vision-explain-button'))
    expect(logged(VisionAgentActionInvoked.name)).toEqual([
      [VisionAgentActionInvoked, withVisionVersion({action: 'generate-query'})],
      [VisionAgentActionInvoked, withVisionVersion({action: 'explain'})],
    ])

    fireEvent.click(screen.getByTestId('vision-sidebar-mutate'))
    fireEvent.click(screen.getByTestId('vision-mutate-generate'))
    fireEvent.change(screen.getByTestId('vision-mutate-generate-request'), {
      target: {value: 'Rename them'},
    })
    fireEvent.click(screen.getByTestId('vision-mutate-generate-submit'))
    expect(logged(VisionAgentActionInvoked.name).at(-1)).toEqual([
      VisionAgentActionInvoked,
      withVisionVersion({action: 'generate-mutations'}),
    ])
    expect(logged(VisionAgentActionInvoked.name)).toHaveLength(3)
  })

  it('records tabs added and closed, and a prettify and a lint open once each', async () => {
    renderRedesign()
    expect(logged(VisionTabsChanged.name)).toEqual([
      [VisionTabsChanged, withVisionVersion({count: 1, action: 'open'})],
    ])

    fireEvent.click(screen.getByTestId('vision-new-tab'))
    expect(logged(VisionTabsChanged.name).at(-1)).toEqual([
      VisionTabsChanged,
      withVisionVersion({count: 2, action: 'add'}),
    ])
    fireEvent.click(within(screen.getAllByTestId('vision-tab')[1]).getByTestId('vision-tab-close'))
    expect(logged(VisionTabsChanged.name).at(-1)).toEqual([
      VisionTabsChanged,
      withVisionVersion({count: 1, action: 'close'}),
    ])
    fireEvent.click(screen.getByTestId('vision-tab-close'))
    expect(logged(VisionTabsChanged.name)).toHaveLength(3)

    typeQuery('*[_type=="author"]')
    fireEvent.click(await screen.findByTestId('vision-query-format'))
    await waitFor(() =>
      expect(logged(VisionQueryPrettified.name)).toEqual([
        [VisionQueryPrettified, withVisionVersion({outcome: 'success'})],
      ]),
    )
    typeQuery('*[_type == "author"')
    fireEvent.keyDown(getQueryEditor(), FORMAT_KEYS)
    await waitFor(() =>
      expect(logged(VisionQueryPrettified.name).at(-1)).toEqual([
        VisionQueryPrettified,
        withVisionVersion({outcome: 'error'}),
      ]),
    )

    openRequestTab('lint')
    await waitFor(() =>
      expect(logged(VisionLintUsed.name)).toEqual([
        [VisionLintUsed, withVisionVersion({action: 'open'})],
      ]),
    )
    openRequestTab('lint')
    expect(logged(VisionLintUsed.name)).toHaveLength(1)
  })

  it('records the tab shortcuts, and the tab changes they make as the buttons record theirs', () => {
    renderRedesign()
    telemetry.log.mockClear()

    fireEvent.keyDown(getQueryEditor(), NEW_TAB_KEYS)
    fireEvent.keyDown(getQueryEditor(), NEXT_TAB_KEYS)
    fireEvent.keyDown(getQueryEditor(), CLOSE_TAB_KEYS)
    // A single tab is its own next tab: the shortcut counts, the switch does not
    fireEvent.keyDown(getQueryEditor(), NEXT_TAB_KEYS)

    expect(logged(VisionShortcutUsed.name)).toEqual([
      [VisionShortcutUsed, withVisionVersion({shortcut: 'new-tab'})],
      [VisionShortcutUsed, withVisionVersion({shortcut: 'next-tab'})],
      [VisionShortcutUsed, withVisionVersion({shortcut: 'close-tab'})],
      [VisionShortcutUsed, withVisionVersion({shortcut: 'next-tab'})],
    ])
    expect(logged(VisionTabsChanged.name)).toEqual([
      [VisionTabsChanged, withVisionVersion({count: 2, action: 'add'})],
      [VisionTabsChanged, withVisionVersion({count: 1, action: 'close'})],
    ])
    expect(logged(VisionTabUsed.name)).toEqual([
      [VisionTabUsed, withVisionVersion({action: 'select'})],
    ])
  })
})
