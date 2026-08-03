/**
 * Structure-tool harness: renders REAL pane chrome (`PaneLayout` → `Pane` →
 * `PaneHeader`/`PaneContent`, dividers, document panes) inside Storybook.
 *
 * How the real Studio mounts this stack (`components/structureTool/StructureTool.tsx`):
 * `StructureToolProvider` (structure builder + features) → `PaneLayout` (pane
 * controller + resize/collapse state) → one `PaneRouterProvider` per pane (maps a
 * router `panes` group onto pane-scoped navigation: `ChildLink`, `BackLink`,
 * `setParams`, `handleEditReference`) → the pane component (`PaneContainer` for
 * document lists, `DocumentPane` for documents). Pane resolution normally runs
 * through the async rxjs resolver (`useResolvedPanes`); this harness replaces ONLY
 * that resolver with a synchronous `resolvePane` callback — every mounted component
 * below it is the real one.
 *
 * The router is the real structure router (`structure/router.ts`, the `/:panes`
 * segment codec), mounted STATEFULLY: `onNavigate` writes back into React state, so
 * clicking a list item really navigates — the pane stack re-derives from
 * `routerState.panes` and a document pane opens to the right, exactly like the desk.
 * This nested `RouterProvider` intentionally shadows the `route.intents` router that
 * `WithStudioProviders` mounts (panes state is not encodable on that one).
 *
 * Layer ON TOP of `WithStudioProviders` (workspace/schema/source/i18n/perspective +
 * seeded preview/presence/releases stores). Pass `createStructureFixtureClient(...)`
 * as that decorator's `client` so the pane data paths resolve against fixtures:
 * - list panes: `useDocumentList` → `listenSearchQuery` → `client.listen` (welcome,
 *   held open) + weighted search `observable.fetch` (fixtures filtered by
 *   `$__types`, re-sorted per the query's `order(...)` clause)
 * - document panes: the real `documentStore` pair — `observable.getDocuments`
 *   serves fixture snapshots, `/acl` serves full grants, mutations land in the mock
 *   transaction log (local-first edits work; nothing persists)
 * - `/users/me/keyvalue` (sort/layout persistence) is served in-memory per client,
 *   so `useStructureToolSetting` round-trips without console noise.
 */
import {type SanityClient} from '@sanity/client'
import {type SanityDocument} from '@sanity/types'
import {useCallback, useMemo, useState} from 'react'
import {map, merge, NEVER, type Observable, of, timer} from 'rxjs'
import {
  ActiveWorkspaceMatcherContext,
  DocumentLimitUpsellContext,
  type DocumentLimitUpsellContextValue,
} from 'sanity/_singletons'
import {RouterProvider} from 'sanity/router'

import {CommentsOnboardingProvider} from '../../../packages/sanity/src/core/comments/context/onboarding/CommentsOnboardingProvider'
import {type WorkspaceSummary} from '../../../packages/sanity/src/core/config'
import {usePerspective} from '../../../packages/sanity/src/core/perspective/usePerspective'
import {type Grant} from '../../../packages/sanity/src/core/store/grants/types'
import {AppIdCacheProvider} from '../../../packages/sanity/src/core/store/studio-app/AppIdCacheProvider'
import {useSource} from '../../../packages/sanity/src/core/studio/source'
import {useWorkspace} from '../../../packages/sanity/src/core/studio/workspace'
import {PaneLayout} from '../../../packages/sanity/src/structure/components/pane/PaneLayout'
import {PaneRouterProvider} from '../../../packages/sanity/src/structure/components/paneRouter/PaneRouterProvider'
import {DocumentPane} from '../../../packages/sanity/src/structure/panes/document/DocumentPane'
import {DocumentListPane} from '../../../packages/sanity/src/structure/panes/documentList/DocumentListPane'
import {router as structureRouter} from '../../../packages/sanity/src/structure/router'
import {createStructureBuilder} from '../../../packages/sanity/src/structure/structureBuilder/createStructureBuilder'
import {type StructureBuilder} from '../../../packages/sanity/src/structure/structureBuilder/types'
import {StructureToolProvider} from '../../../packages/sanity/src/structure/StructureToolProvider'
import {
  type PaneNode,
  type RouterPanes,
  type RouterPaneSibling,
} from '../../../packages/sanity/src/structure/types'
import {createMockSanityClient} from '../../../packages/sanity/test/mocks/mockSanityClient'

/** Full read/write access — the shape `grantsStore` fetches from `/acl`. */
const FULL_ACCESS_GRANTS: Grant[] = [
  {filter: '_id in path("**")', permissions: ['read', 'create', 'history', 'update']},
]

export interface StructureFixtureClientOptions {
  /** Documents served to list-pane searches and document-pane snapshot fetches. */
  documents: SanityDocument[]
  /** ACL grants; defaults to full access (administrator-shaped). */
  grants?: Grant[]
}

interface OrderEntry {
  field: string
  direction: 'asc' | 'desc'
}

/** Split on top-level commas only (function calls in entries carry nested commas). */
function splitTopLevel(input: string): string[] {
  const parts: string[] = []
  let depth = 0
  let current = ''
  for (const char of input) {
    if (char === '(' || char === '[') depth++
    if (char === ')' || char === ']') depth--
    if (char === ',' && depth === 0) {
      parts.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  if (current.trim()) parts.push(current.trim())
  return parts
}

/** Extract the balanced-paren argument of `| order(...)` from a GROQ query. */
function extractOrderArgument(query: string): string | null {
  const start = query.search(/\|\s*order\(/)
  if (start === -1) return null
  const openIndex = query.indexOf('(', start)
  let depth = 0
  for (let i = openIndex; i < query.length; i++) {
    if (query[i] === '(') depth++
    if (query[i] === ')') {
      depth--
      if (depth === 0) return query.slice(openIndex + 1, i)
    }
  }
  return null
}

/** Unwrap mapper functions (`lower(title)`, `dateTime(_createdAt)`) to the inner expression. */
function unwrapMappers(expression: string): string {
  let current = expression.trim()
  let match = current.match(/^[a-zA-Z:]+\((.+)\)$/)
  while (match) {
    current = match[1].trim()
    match = current.match(/^[a-zA-Z:]+\((.+)\)$/)
  }
  return current
}

/**
 * Extract sortable `field direction` pairs from a weighted-search GROQ query. The
 * search compiler projects every sort expression into a top-level `"orderings": [...]`
 * array and orders by `orderings[N]` (see `search/weighted/createSearchQuery.ts`), so
 * aliases are resolved back through that projection. Plain `order(title asc)` clauses
 * are handled too. Entries that don't resolve to a simple field name (`_score`,
 * `select(...)` null-sorting prefixes, nested paths) are skipped.
 */
function parseOrderClause(query: string): OrderEntry[] {
  const orderArgument = extractOrderArgument(query)
  if (!orderArgument) return []

  const projectionMatch = query.match(/"orderings":\s*\[([^\]]*)\]/)
  const projectedExpressions = projectionMatch ? splitTopLevel(projectionMatch[1]) : []

  return splitTopLevel(orderArgument)
    .map((raw): OrderEntry | null => {
      const entry = raw.trim()
      const dirMatch = entry.match(/\s+(asc|desc)$/)
      const direction = (dirMatch?.[1] as OrderEntry['direction'] | undefined) ?? 'asc'
      let field = unwrapMappers(dirMatch ? entry.slice(0, dirMatch.index).trim() : entry)
      const aliasMatch = field.match(/^orderings\[(\d+)\]$/)
      if (aliasMatch) {
        const projected = projectedExpressions[Number(aliasMatch[1])]
        if (!projected) return null
        field = unwrapMappers(projected)
      }
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(field) || field === '_score') return null
      return {field, direction}
    })
    .filter((entry): entry is OrderEntry => entry !== null)
}

function sortDocuments(docs: SanityDocument[], order: OrderEntry[]): SanityDocument[] {
  if (order.length === 0) return docs
  return [...docs].sort((a, b) => {
    for (const {field, direction} of order) {
      const aValue = a[field] as string | number | undefined
      const bValue = b[field] as string | number | undefined
      if (aValue === bValue) continue
      if (aValue === undefined) return 1
      if (bValue === undefined) return -1
      const cmp = aValue < bValue ? -1 : 1
      return direction === 'asc' ? cmp : -cmp
    }
    return 0
  })
}

/**
 * A `createMockSanityClient` wrapped with the responses the structure data paths
 * need (see module docblock). Everything else falls through to the base mock.
 */
export function createStructureFixtureClient(options: StructureFixtureClientOptions): SanityClient {
  const {documents, grants = FULL_ACCESS_GRANTS} = options
  // `/features`: the plan-level feature list (`useFeatureEnabled`). Without it the
  // mock resolves null → comments land in 'upsell' mode and the inspector opens
  // as an upsell shell with no upsell data. Serving `studioComments` puts the
  // comments surface in its real default mode: the inspector opens with the
  // genuine empty-comments state. Deliberately ONLY that flag — other features
  // keep their previously-verified default-off rendering.
  const base = createMockSanityClient({
    requests: {'/acl': grants, '/features': ['studioComments']},
  })
  const keyValue = new Map<string, unknown>()
  const callLog: Array<{kind: string; detail: string}> = []
  const log = (kind: string, detail: unknown) =>
    callLog.push({kind, detail: JSON.stringify(detail)?.slice(0, 200) ?? ''})

  // The pair listener and the list listener both require a 'welcome' first event and
  // a connection that stays OPEN — the base mock's `of(...)` completes, which would
  // tear the streams down mid-flight. The welcome must also be ASYNC: the pair
  // splits one shared event stream into draft/published/version substreams that
  // subscribe one after another, and a synchronous welcome flushes the snapshot
  // events before the later substreams attach (share() does not replay) — the
  // published stream starves and `editState.ready` never flips. A real EventSource
  // is always async; `timer(0)` restores that.
  const listen = (query?: string) => {
    log('listen', query)
    return merge(timer(0).pipe(map(() => ({type: 'welcome' as const}))), NEVER)
  }

  const fetch = (query: string, params?: Record<string, unknown>): Observable<unknown> => {
    // Weighted search (`createWeightedSearch`): filter by the `$__types` param and
    // honor the query's `order(...)` clause so the sort menu visibly reorders.
    if (params && Array.isArray(params.__types)) {
      const types = params.__types as string[]
      const hits = sortDocuments(
        documents.filter((doc) => types.includes(doc._type)),
        parseOrderClause(query),
      )
      return of(hits)
    }
    // `listenSearchQuery` type-name discovery (only reached without a static filter).
    if (query.startsWith('array::unique')) {
      return of([...new Set(documents.map((doc) => doc._type))])
    }
    // Mentions/permissions user list (`getSystemGroups$`) expects an array.
    if (query.includes('system.group')) {
      return of([])
    }
    return of(null)
  }

  const request = (opts: {uri?: string; url?: string; method?: string; body?: unknown}) => {
    const uri = opts.uri ?? ''
    if (uri.startsWith('/users/me/keyvalue')) {
      if (opts.method === 'PUT') {
        const body = opts.body as {key: string; value: unknown}[]
        body.forEach((pair) => keyValue.set(pair.key, pair.value))
        return Promise.resolve(body)
      }
      const keys = uri.slice('/users/me/keyvalue/'.length).split(',')
      return Promise.resolve(keys.map((key) => ({key, value: keyValue.get(key) ?? null})))
    }
    // The app-id path (`fetchStudiosWithUrl`) maps over the response unguarded.
    if ((opts.url ?? '').includes('/user-applications')) {
      return Promise.resolve([])
    }
    // Other callers that pass `url` instead of `uri` would crash the base mock's
    // `opts.uri.startsWith` — resolve null, which they treat as "not available".
    if (!opts.uri) {
      return Promise.resolve(null)
    }
    return base.request(opts as Parameters<typeof base.request>[0])
  }

  const client = {
    ...base,
    listen,
    request,
    // The translog reader (`getTransactionsLogs` → `getJsonStream`) does a RAW
    // `fetch(client.getUrl(...))` — the base mock's `mock://` scheme makes that
    // throw in the console. An empty `data:` URL fetches successfully and parses
    // as zero NDJSON transactions: the history surface stays in its empty state.
    getUrl: (uri: string) =>
      uri.includes('/transactions/') ? 'data:text/plain,' : base.getUrl(uri),
    observable: {
      ...base.observable,
      // The observable sub-client mirrors the client surface; `getSystemGroups$`
      // (comments mentions) keys its cache on `client.observable.config()`.
      config: () => base.config(),
      listen,
      fetch,
      getDocuments: (ids: string[]) => {
        log('getDocuments', ids)
        return of(ids.map((id) => documents.find((doc) => doc._id === id) ?? null))
      },
      request: (opts: {uri?: string; url?: string; method?: string; body?: unknown}) => {
        // The events-API history feed (`getInitialFetchEvents`) maps over
        // `response.events` unguarded — a shaped empty feed keeps the document
        // pane's history surface in its real "no events" state instead of erroring.
        if ((opts.url ?? opts.uri ?? '').includes('/events/documents/')) {
          return of({events: {}, nextCursor: null})
        }
        return base.observable.request(opts as never)
      },
    },
    withConfig: () => client,
  }

  // Debug handle: the wrapper records listen/getDocuments calls (and the base mock
  // records the rest in `$log`) so a browser console or verification script can
  // confirm which mock paths were hit.
  ;(globalThis as Record<string, unknown>).__structureFixtureClientLog = {
    calls: callLog,
    base: base.$log,
  }

  return client as unknown as SanityClient
}

/**
 * The synchronous stand-in for `useResolvedPanes`: given a router pane id, return
 * the concrete `PaneNode` to mount. Build nodes with the provided REAL structure
 * builder (`S.documentTypeList('book').serialize()` emits the same node — including
 * the auto-derived sort/layout menu items — the desk resolver would).
 */
export type ResolveStructurePane = (
  S: StructureBuilder,
  id: string,
  context: {groupIndex: number},
) => PaneNode

export interface StructureHarnessProps {
  /** Root pane (always mounted first; not part of router state, like the desk). */
  resolveRootPane: (S: StructureBuilder) => PaneNode
  /** Resolver for panes present in router state. */
  resolvePane: ResolveStructurePane
  /**
   * Initial router pane groups, e.g. `[[{id: 'book-war'}]]` opens one child pane.
   * Defaults to `[]` (root pane only). Navigation (clicking list items, closing
   * panes, opening in-pane inspectors) updates this state live.
   */
  initialPanes?: RouterPanes
  /** Viewport height of the pane stack. Default 480. */
  height?: number | string
}

interface HarnessPaneData {
  key: string
  pane: PaneNode
  index: number
  flatIndex: number
  siblingIndex: number
  params: Record<string, string | undefined>
  payload: unknown
  itemId: string
  childItemId: string | null
  active: boolean
  selected: boolean
}

const EMPTY_PARAMS: Record<string, string | undefined> = {}

export function StructureHarness(props: StructureHarnessProps) {
  const {resolveRootPane, resolvePane, initialPanes = [], height = 480} = props
  const [routerState, setRouterState] = useState<Record<string, unknown>>({panes: initialPanes})
  // Router params for the ROOT pane. The root sits at pane index 0 → PaneRouter
  // groupIndex -1, OUTSIDE router state (desk semantics: the root list has no
  // router entry). But `setParams` from the root — which is how every in-pane
  // inspector opens (comments via `openInspector`, Review changes via history
  // params) — writes through `modifyCurrentGroup`, whose groupIndex -1 math
  // fabricates an id-LESS sibling group at the front of the panes array. In the
  // real desk this path is never hit (documents are never the root pane); here
  // we absorb that artifact group in `handleNavigate` and route its params back
  // to the root pane's `params` prop, so inspectors open/close for real without
  // the resolver ever seeing a phantom pane id.
  const [rootParams, setRootParams] = useState<Record<string, string | undefined>>(EMPTY_PARAMS)
  // `onNavigate` receives an already-encoded PATH (RouterProvider resolves state →
  // path before calling out, mirroring a history push); decode it back through the
  // same router so the harness state stays the single source of truth.
  const handleNavigate = useCallback((opts: {path: string}) => {
    const nextState = structureRouter.decode(opts.path) ?? {}
    const panes = (nextState.panes as RouterPanes | undefined) ?? []
    // The groupIndex -1 artifact: an id-less first group (`{id: ''}` after the
    // codec round-trip) is the root pane's own params update, not a child pane.
    if (panes[0]?.[0] !== undefined && !panes[0][0].id) {
      setRootParams(panes[0][0].params ?? EMPTY_PARAMS)
      setRouterState({...nextState, panes: panes.slice(1)})
      return
    }
    setRouterState(nextState)
  }, [])

  // `DocumentPanelSubHeader` (and other document-pane chrome) reads
  // `useActiveWorkspace()`. The test provider deliberately omits
  // `ActiveWorkspaceMatcherProvider` (it needs a `history` instance); providing the
  // context VALUE directly needs neither — the mock workspace stands in for the
  // summary (it carries the read fields: name/title/basePath/projectId/dataset).
  const workspace = useWorkspace()
  const activeWorkspaceValue = useMemo(
    () => ({
      activeWorkspace: workspace as unknown as WorkspaceSummary,
      setActiveWorkspace: noopNavigateWorkspace,
    }),
    [workspace],
  )

  return (
    <ActiveWorkspaceMatcherContext.Provider value={activeWorkspaceValue}>
      {/* Self-creating app-id cache: document-pane chrome (dashboard/Create seams)
          resolves app ids through it; the fetch fails silently against the mock. */}
      <AppIdCacheProvider>
        {/* In the real studio the comments plugin's STUDIO layout middleware
            (CommentsStudioLayout) mounts this; the harness renders no studio
            layout, so without it the comments inspector — opened by the pane's
            own field comment buttons — throws `useCommentsOnboarding: missing
            context value`. The real provider is self-contained (localStorage +
            state), so we mount it rather than stub it. */}
        <CommentsOnboardingProvider>
          <DocumentLimitUpsellContext.Provider value={documentLimitUpsellValue}>
            <StructureHarnessInner
              handleNavigate={handleNavigate}
              routerState={routerState}
              rootParams={rootParams}
              resolveRootPane={resolveRootPane}
              resolvePane={resolvePane}
              height={height}
            />
          </DocumentLimitUpsellContext.Provider>
        </CommentsOnboardingProvider>
      </AppIdCacheProvider>
    </ActiveWorkspaceMatcherContext.Provider>
  )
}

const noopNavigateWorkspace = () => undefined

const noop = () => undefined

// Inert stand-in for `DocumentLimitUpsellProvider` (document panes read it for the
// document-limit upsell affordance). The real provider needs the vi-mocked
// `useUpsellData`; providing the context VALUE directly needs nothing.
const documentLimitUpsellValue: DocumentLimitUpsellContextValue = {
  upsellDialogOpen: false,
  handleOpenDialog: noop,
  handleClose: noop,
  upsellData: null,
  telemetryLogs: {
    dialogSecondaryClicked: noop,
    dialogPrimaryClicked: noop,
    panelPrimaryClicked: noop,
    panelSecondaryClicked: noop,
  },
}

function StructureHarnessInner(props: {
  handleNavigate: (opts: {path: string}) => void
  routerState: Record<string, unknown>
  rootParams: Record<string, string | undefined>
  resolveRootPane: StructureHarnessProps['resolveRootPane']
  resolvePane: ResolveStructurePane
  height: number | string
}) {
  const {handleNavigate, routerState, rootParams, resolveRootPane, resolvePane, height} = props
  return (
    <RouterProvider router={structureRouter} state={routerState} onNavigate={handleNavigate}>
      <StructureToolProvider>
        <div style={{height, display: 'flex'}}>
          <PaneLayout height="fill" style={{minWidth: 320, flex: 1}}>
            <StructurePanes
              resolveRootPane={resolveRootPane}
              resolvePane={resolvePane}
              rootParams={rootParams}
              routerPanes={(routerState.panes as RouterPanes | undefined) ?? []}
            />
          </PaneLayout>
        </div>
      </StructureToolProvider>
    </RouterProvider>
  )
}

function StructurePanes(props: {
  resolveRootPane: (S: StructureBuilder) => PaneNode
  resolvePane: ResolveStructurePane
  rootParams: Record<string, string | undefined>
  routerPanes: RouterPanes
}) {
  const {resolveRootPane, resolvePane, rootParams, routerPanes} = props
  const source = useSource()
  const {perspectiveStack} = usePerspective()

  // The same builder `StructureToolProvider` constructs internally; building our own
  // keeps `resolvePane` synchronous (the provider does not expose its instance).
  const S = useMemo(
    () => createStructureBuilder({source, perspectiveStack}),
    [source, perspectiveStack],
  )

  const paneData = useMemo((): HarnessPaneData[] => {
    const flattened: Array<{
      sibling: RouterPaneSibling | null
      groupIndex: number
      siblingIndex: number
    }> = [{sibling: null, groupIndex: -1, siblingIndex: 0}]
    routerPanes.forEach((group, groupIndex) => {
      group.forEach((sibling, siblingIndex) => {
        flattened.push({sibling, groupIndex, siblingIndex})
      })
    })

    // groupsLen counts the root as its own group (mirrors useResolvedPanes, where
    // `active` marks the pane whose CHILD is the last group — the list you are
    // "navigating from").
    const groupsLen = routerPanes.length + 1

    return flattened.map((entry, flatIndex): HarnessPaneData => {
      const {sibling, groupIndex, siblingIndex} = entry
      const pane = sibling ? resolvePane(S, sibling.id, {groupIndex}) : resolveRootPane(S)
      const nextGroup = routerPanes[groupIndex + 1]
      return {
        key: sibling ? `${sibling.id}-${groupIndex}-${siblingIndex}` : 'root',
        pane,
        index: groupIndex + 1,
        flatIndex,
        siblingIndex,
        // The root pane's params live in harness state (see `rootParams` in
        // StructureHarness), not in router state.
        params: sibling ? (sibling.params ?? EMPTY_PARAMS) : rootParams,
        payload: sibling?.payload,
        itemId: sibling?.id ?? 'root',
        childItemId: nextGroup?.[0]?.id ?? null,
        active: groupIndex + 1 === groupsLen - 2,
        selected: flatIndex === flattened.length - 1,
      }
    })
  }, [S, resolvePane, resolveRootPane, rootParams, routerPanes])

  return (
    <>
      {paneData.map((data) => (
        <PaneRouterProvider
          key={data.key}
          flatIndex={data.flatIndex}
          index={data.index}
          params={data.params}
          payload={data.payload}
          siblingIndex={data.siblingIndex}
        >
          <HarnessPane data={data} />
        </PaneRouterProvider>
      ))}
    </>
  )
}

function HarnessPane({data}: {data: HarnessPaneData}) {
  const {pane, itemId, childItemId, flatIndex, active, selected} = data
  const paneKey = data.key

  if (pane.type === 'documentList') {
    return (
      <DocumentListPane
        childItemId={childItemId ?? ''}
        index={flatIndex}
        itemId={itemId}
        isActive={active}
        isSelected={selected}
        paneKey={paneKey}
        pane={pane}
      />
    )
  }
  if (pane.type === 'document') {
    return (
      <DocumentPane
        childItemId={childItemId ?? ''}
        index={flatIndex}
        itemId={itemId}
        isActive={active}
        isSelected={selected}
        paneKey={paneKey}
        pane={pane}
      />
    )
  }
  throw new Error(`StructureHarness: unsupported pane type "${pane.type}"`)
}

export type {PaneNode, RouterPanes}
