import {type SanityClient} from '@sanity/client'
import {type ObjectSchemaType, type SanityDocument} from '@sanity/types'
import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useMemo} from 'react'
import {throwError} from 'rxjs'
import {DocumentPaneContext, PerspectiveContext} from 'sanity/_singletons'

import {useSchema} from '../../../../packages/sanity/src/core/hooks/useSchema'
import {type PerspectiveContextValue} from '../../../../packages/sanity/src/core/perspective/types'
import {
  type TimelineState,
  type TimelineStore,
} from '../../../../packages/sanity/src/core/store/history/useTimelineStore'
import {HISTORY_INSPECTOR_NAME} from '../../../../packages/sanity/src/structure/panes/document/constants'
import {type DocumentPaneContextValue} from '../../../../packages/sanity/src/structure/panes/document/DocumentPaneContext'
// Real component from its real path (org contract §8): the file under test. `ChangesTabs`,
// `EventsInspector`, `EventsSelector` and `HistorySelector` are never imported directly below.
// Every story mounts them through the real `ChangesTabs` dispatcher inside a real document pane,
// the same way a studio does. Only `ChangesInspector` is also mounted in isolation, for the one
// branch (`selectedReleaseId`) a document pane cannot easily be steered into (see `ReleaseVersion`).
import {ChangesInspector} from '../../../../packages/sanity/src/structure/panes/document/inspectors/changes/ChangesInspector'
import {structureTool} from '../../../../packages/sanity/src/structure/structureTool'
import {type PaneNode, type RouterPanes} from '../../../../packages/sanity/src/structure/types'
import {createMockDocumentPreviewStore} from '../../lib/mockDocumentPreviewStore'
import {
  createStructureFixtureClient,
  StructureHarness,
  type StructureHarnessProps,
} from '../../lib/structureHarness'
import {WithStudioProviders} from '../../lib/testProvider'

/* ── Fixture universe ─────────────────────────────────────────────────────
   One document, published AND draft, with a real difference in `body`, so the one branch that
   computes a diff independently of the timeline/events store (`EventsInspector`'s
   `CompareWithPublishedView`, see the events-error story) has something genuine to compare. */

const ARTICLE_ID = 'article-quarterly'

const articleSchemaTypeDef = {
  name: 'article',
  title: 'Article',
  type: 'document',
  fields: [
    {name: 'title', title: 'Title', type: 'string'},
    {name: 'body', title: 'Body', type: 'text'},
  ],
  preview: {select: {title: 'title'}},
}

const publishedArticle: SanityDocument = {
  _id: ARTICLE_ID,
  _type: 'article',
  _rev: 'rev-pub-1',
  _createdAt: '2026-05-01T09:00:00Z',
  _updatedAt: '2026-05-01T09:00:00Z',
  title: 'Quarterly Planning Review',
  body: 'Planning starts in April.',
}

const draftArticle: SanityDocument = {
  _id: `drafts.${ARTICLE_ID}`,
  _type: 'article',
  _rev: 'rev-draft-2',
  _createdAt: '2026-05-01T09:00:00Z',
  _updatedAt: '2026-05-14T11:30:00Z',
  title: 'Quarterly Planning Review',
  body: 'Planning starts in April and wraps by June, per the revised timeline.',
}

const fixtureDocuments = [publishedArticle, draftArticle]
const previewStore = createMockDocumentPreviewStore({documents: fixtureDocuments, delayMs: 1})

const okClient = createStructureFixtureClient({documents: fixtureDocuments})

/**
 * `TimelineController.fetchMoreTransactions` (`core/store/history/history/TimelineController.ts:296-299`)
 * builds its URL with `this.client.getUrl(...)` and immediately `fetch()`s it, inside a `try` the
 * controller's own `tick()` wraps (`TimelineController.ts:273-279`). A synchronous throw from
 * `getUrl` is caught there exactly like a real rejected fetch would be, and surfaces as
 * `historyStore.error` → `useDocumentPane().timelineError`, the same field `HistorySelector` and
 * `ChangesInspector` both read. No network mocking needed, just this one seam.
 */
const legacyErrorClient: SanityClient = {
  ...okClient,
  getUrl: (uri: string) => {
    if (uri.includes('/transactions/')) {
      throw new Error('Simulated translog fetch failure (network unreachable)')
    }
    return okClient.getUrl(uri)
  },
} as unknown as SanityClient

/**
 * The events-API equivalent: `getInitialFetchEvents` (`core/store/events/getInitialFetchEvents.ts`)
 * fetches `/events/documents/{id}` through `client.observable.request` and already wraps that in
 * its own `catchError`, so an error observable here reaches `useEvents().error` cleanly rather
 * than crashing the pane.
 */
const eventsErrorClient: SanityClient = {
  ...okClient,
  observable: {
    ...okClient.observable,
    request: (opts: {uri?: string; url?: string}) => {
      const target = opts.url ?? opts.uri ?? ''
      if (target.includes('/events/documents/')) {
        return throwError(() => new Error('Simulated events feed failure (network unreachable)'))
      }
      return okClient.observable.request(opts as never)
    },
  },
} as unknown as SanityClient

/* ── The real document pane, opened straight onto the inspector ──────────────────────────────
   `lib/structureHarness.tsx`'s own docblock names this seam: "every in-pane inspector opens ...
   Review changes via history params". `ChangesTabs.isReady` reads `params.inspect ===
   HISTORY_INSPECTOR_NAME` but only for a CSS fade-in class (`ChangesTabs.tsx:44,64`), so setting
   that param on the pane's INITIAL router state, rather than clicking the menu item, is a faithful
   way to land straight on the panel: `DocumentInspectorPanel` (`documentInspector/
   DocumentInspectorPanel.tsx:28-30`) mounts `inspector.component`, `ChangesTabs`, the moment
   `useDocumentPane().inspector` resolves, which `useDocumentPaneInspector` derives from that same
   param (`useDocumentPaneInspector.ts:29-43`), independent of the `features.reviewChanges` flag
   that only hides the OPEN button. The document must be a CHILD pane, not the root: the root
   pane's params live in harness-internal state with no seeding prop, while a child sibling's
   `params` come straight from `initialPanes`. */

const resolveRootPane: StructureHarnessProps['resolveRootPane'] = (S) =>
  S.documentTypeList('article').serialize() as unknown as PaneNode

const resolvePane: StructureHarnessProps['resolvePane'] = (S, id) =>
  S.document().id(id).documentId(id).schemaType('article').serialize() as unknown as PaneNode

function openOn(tab: 'history' | 'review'): RouterPanes {
  const params: Record<string, string | undefined> = {
    inspect: HISTORY_INSPECTOR_NAME,
    changesInspectorTab: tab,
  }
  // Mirrors `changesInspector.onOpen` (`inspectors/changes/index.ts:30`), which sets this the
  // moment a real editor clicks "Review changes".
  if (tab === 'review') params.since = '@lastPublished'
  return [[{id: ARTICLE_ID, params}]]
}

const legacyProviders = WithStudioProviders({
  config: {
    schema: {name: 'storybook-changes', types: [articleSchemaTypeDef]},
    plugins: [structureTool()],
  },
  client: okClient,
  previewStore,
})

const eventsProviders = WithStudioProviders({
  config: {
    schema: {name: 'storybook-changes', types: [articleSchemaTypeDef]},
    plugins: [structureTool()],
    beta: {eventsAPI: {documents: true}},
  },
  client: okClient,
  previewStore,
})

const legacyErrorProviders = WithStudioProviders({
  config: {
    schema: {name: 'storybook-changes', types: [articleSchemaTypeDef]},
    plugins: [structureTool()],
  },
  client: legacyErrorClient,
  previewStore,
})

const eventsErrorProviders = WithStudioProviders({
  config: {
    schema: {name: 'storybook-changes', types: [articleSchemaTypeDef]},
    plugins: [structureTool()],
    beta: {eventsAPI: {documents: true}},
  },
  client: eventsErrorClient,
  previewStore,
})

function Frame({label, children}: {label: string; children: React.ReactNode}) {
  return (
    <Stack gap={2}>
      <Text size={0} muted weight="medium">
        {label}
      </Text>
      <Card border radius={2} overflow="hidden" style={{width: 420, height: 380}}>
        {children}
      </Card>
    </Stack>
  )
}

/* ── The isolated exception: ChangesInspector's `selectedReleaseId` branch ───────────────────
   `ChangesInspector`'s very first check after its hooks (`ChangesInspector.tsx:71-79`) is
   `if (selectedReleaseId) return <TimelineError versionError />`, reached whenever a release
   perspective is selected. Steering a real document pane onto a release perspective needs a
   resolved release document flowing through `useActiveReleases()` AND the perspective router
   segment, which is more machinery than this one early return justifies. `usePerspective()` and
   `useDocumentPane()` are both plain `useContext` reads (confirmed from source: `usePerspective.ts`
   is `useContext(PerspectiveContext)` with no fallback), so this story hand-builds both context
   VALUES directly instead, the same technique `DocumentHeaderTitle.stories.tsx`'s
   `TitleFixtureHarness` uses. `useTimelineSelector` still runs as a hook before the early return
   fires (hooks execute unconditionally), so it needs a real-shaped `TimelineStore`; its contents
   are never read on this branch, so a static one stands in. */

const STATIC_TIMELINE_STATE: TimelineState = {
  chunks: [],
  diff: null,
  hasMoreChunks: false,
  isLoading: false,
  isPristine: true,
  lastNonDeletedRevId: null,
  onOlderRevision: false,
  realRevChunk: null,
  revTime: null,
  selectionState: 'inactive',
  sinceAttributes: null,
  sinceTime: null,
  timelineDisplayed: null,
  timelineReady: true,
}

function createStaticTimelineStore(): TimelineStore {
  return {
    findRangeForRev: () => [null, null],
    findRangeForSince: () => ['', null],
    loadMore: () => undefined,
    getSnapshot: () => STATIC_TIMELINE_STATE,
    subscribe: () => () => undefined,
  }
}

// `ChangesInspector`'s own branch never reads `selectedPerspective`'s contents, only
// `usePerspective().selectedReleaseId`, so a minimal release-shaped stub stands in.
// oxlint-disable-next-line no-unsafe-type-assertion -- narrow by design, see comment above.
const releaseSelectedPerspective = {
  _id: '_.releases.rSpring',
  _type: 'system.release',
  name: 'rSpring',
  state: 'active',
  metadata: {title: 'Spring campaign', releaseType: 'asap'},
} as unknown as PerspectiveContextValue['selectedPerspective']

const releasePerspectiveValue: PerspectiveContextValue = {
  selectedPerspectiveName: 'rSpring',
  selectedReleaseId: 'rSpring',
  selectedPerspective: releaseSelectedPerspective,
  perspectiveStack: ['rSpring'],
  excludedPerspectives: [],
  selectedVariantName: undefined,
  selectedVariant: undefined,
  bundle: 'rSpring',
}

const isolatedProviders = WithStudioProviders({
  config: {schema: {name: 'storybook-changes', types: [articleSchemaTypeDef]}},
})

function ReleaseVersionHarness() {
  const schema = useSchema()
  const schemaType = schema.get('article') as ObjectSchemaType

  // Only the five fields `ChangesInspector` actually destructures off `useDocumentPane()`
  // (`ChangesInspector.tsx:41`), listed explicitly rather than spread, the same discipline
  // `lib/documentPaneStub.tsx` uses for the banners.
  const documentPaneValue = useMemo(
    () => ({
      documentId: ARTICLE_ID,
      schemaType,
      timelineError: null,
      timelineStore: createStaticTimelineStore(),
      value: {_id: ARTICLE_ID, _type: 'article'},
    }),
    [schemaType],
  )

  return (
    <PerspectiveContext.Provider value={releasePerspectiveValue}>
      {/* Narrow by design, see the fields listed above and `documentPaneStub.tsx`'s docblock
          for the same pattern. */}
      <DocumentPaneContext.Provider
        // oxlint-disable-next-line no-unsafe-type-assertion -- see comment above.
        value={documentPaneValue as unknown as DocumentPaneContextValue}
      >
        <Box style={{width: 420}}>
          <ChangesInspector showChanges />
        </Box>
      </DocumentPaneContext.Provider>
    </PerspectiveContext.Provider>
  )
}

const meta: Meta = {
  title: 'Document Pane/Changes Inspector',
  parameters: {
    docs: {
      description: {
        component: [
          'A broken connection tells the truth on one tab of this panel and stays silent on the ' +
            'other, for the exact same document. This page is the frame around Review Changes, ' +
            'not the diffs themselves: the tab strip that switches between a plain revision list ' +
            'and a from/to comparison, the two selectors that populate that list, and the two ' +
            'panels that render, or decline to render, a diff.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/structure/panes/document/inspectors/changes/`: `ChangesTabs.tsx`, `ChangesInspector.tsx`, `EventsInspector.tsx`, `HistorySelector.tsx`, `EventsSelector.tsx` |',
          '| Tier | SERVICE. Reviewing history enriches editing but nothing here is the act of editing itself |',
          '| Audit | 🔴 needs-work (`similarity`). See `TranslogErrorVsNoChanges` below |',
          '| Patterns | `similarity` · `empty-states` |',
          '',
          '<details><summary><b>Which inspector an editor sees is a workspace config flag, not ' +
            'a menu choice.</b></summary>',
          '',
          'The tab strip checks a beta feature flag twice to pick the legacy selector and ' +
            'inspector (the deprecated timeline/translog model) or the newer selector and ' +
            'inspector (the events-API model), and the document pane provider reads the same flag ' +
            'one layer up to decide which history store even backs the pane. An editor cannot ' +
            'toggle this from inside the product; it is set once, per workspace, in config.',
          '',
          '</details>',
          '',
          '<details><summary><b>No document a reader opens ever shows both.</b></summary>',
          '',
          'The two selectors and the two panels are mutually exclusive alternates, not ' +
            'complementary views: the legacy selector walks chunks from the deprecated ' +
            'translog-based store, the newer selector walks events from the newer events API. ' +
            'Same job, picking a point in time, two unrelated data models, picked once at the ' +
            'workspace level.',
          '',
          '</details>',
          '',
          '<details><summary><b>Empty history reads differently depending on which path is ' +
            'active.</b></summary>',
          '',
          'The two are meant to be interchangeable: the legacy inspector falls to a generic "No ' +
            'changes" message shared with every other empty-diff case, while the events inspector ' +
            'has its own dedicated check, with its own "no document history" title and ' +
            'description, checked before the tab renders anything else. Two different empty-state ' +
            "messages for what is, from an editor's chair, the same situation: a document with no " +
            'history yet.',
          '',
          '</details>',
          '',
          '> **Why the translog/error finding matters:** the review inspector checks for an ' +
            'error before checking whether a diff exists, the same branch a document with a real, ' +
            'boring, empty history reaches. The history selector, reading the identical error off ' +
            'the identical pane, shows a properly critical-toned error message instead. Open the ' +
            'History tab on a broken connection and the panel is honest; switch to Review and it ' +
            'goes quiet. The newer events inspector does not have this problem: its own error ' +
            'branch renders a dedicated error component.',
          '',
          'Every story below except `ReleaseVersion` mounts the real document pane with the ' +
            'changes inspector already open via router params, the same params a click on Review ' +
            'Changes would set. `ReleaseVersion` mounts `ChangesInspector` in isolation instead: ' +
            'its release-version branch needs a release perspective selected, not a release ' +
            'document resolved, and the relevant hooks are plain context reads with no fallback ' +
            'logic, so the context values are supplied directly rather than routing a whole ' +
            'release through the pane machinery. Two client variants inject a real failure at the ' +
            'exact seam each store fetches from, rather than faking a UI state. Revision and ' +
            'event list contents, an actual populated timeline, are out of scope for this harness ' +
            "tier, the same boundary `Document Pane/Document Pane`'s own page draws.",
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:cms',
    'pattern:similarity',
    'pattern:empty-states',
    'audit:needs-work',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj

/* ── ChangesTabs: which inspector an editor sees ──────────────────────────────────────────── */

/**
 * `source.beta?.eventsAPI?.documents` unset (the default): `ChangesTabs` renders `HistorySelector`
 * on the History tab. The harness's fixture client serves an empty (but successful) translog, so
 * `TimelineController` resolves to zero chunks, a document with a real, complete, boring history
 * of nothing yet, not a loading or error state. `Timeline` (the list component `HistorySelector`
 * delegates to) is mounted with `chunks: []`; its own empty rendering is a different component's
 * concern.
 */
export const LegacyHistoryTab: Story = {
  name: 'History tab (legacy)',
  decorators: [legacyProviders],
  render: () => (
    <StructureHarness
      resolveRootPane={resolveRootPane}
      resolvePane={resolvePane}
      initialPanes={openOn('history')}
      height={480}
    />
  ),
}

/**
 * Same flag, same fixture data, the Review tab: `ChangesTabs` renders `ChangesInspector`.
 * `timelineStore`'s `diff` stays `null` (no `sinceTime` resolves against zero transactions) and
 * `timelineError` stays `null`, so `Content()` falls through both its `error` and `loading` checks
 * to `if (!diff) return <NoChanges/>`, the honest "nothing has happened yet" rendering. Compare
 * with `TranslogErrorVsNoChanges` below, which reaches the SAME `<NoChanges/>` output from a
 * broken connection instead of an empty one.
 */
export const LegacyReviewTab: Story = {
  name: 'Review tab (legacy, no changes)',
  decorators: [legacyProviders],
  render: () => (
    <StructureHarness
      resolveRootPane={resolveRootPane}
      resolvePane={resolvePane}
      initialPanes={openOn('review')}
      height={480}
    />
  ),
}

/**
 * `beta.eventsAPI.documents: true` on the workspace config: `DocumentPaneProviderWrapper` now
 * mounts `DocumentEventsPane` instead of the legacy timeline pane, and `ChangesTabs` follows suit
 * on the History tab, rendering `EventsSelector`. The harness's fixture client shapes an empty-but-
 * successful events response for this document (`{events: {}, nextCursor: null}`), so `EventsTimeline`
 * mounts with zero events, the events-API equivalent of `LegacyHistoryTab`, through an entirely
 * different data model.
 */
export const EventsHistoryTab: Story = {
  name: 'History tab (events API)',
  decorators: [eventsProviders],
  render: () => (
    <StructureHarness
      resolveRootPane={resolveRootPane}
      resolvePane={resolvePane}
      initialPanes={openOn('history')}
      height={480}
    />
  ),
}

/**
 * Same flag, Review tab: `ChangesTabs` renders `EventsInspector`. With `events.length === 0`,
 * `EventsInspector`'s OWN top-level check fires (`EventsInspector.tsx:189-202`) before the tab
 * content it shares with every other state, a dedicated "no document history" title and
 * description, NOT the generic `<NoChanges/>` the legacy path uses for what is, to an editor,
 * the identical situation. Read this next to `LegacyReviewTab` above: same meaning, two different
 * messages, the choice made once at the workspace level.
 */
export const EventsReviewTab: Story = {
  name: 'Review tab (events API, no history)',
  decorators: [eventsProviders],
  render: () => (
    <StructureHarness
      resolveRootPane={resolveRootPane}
      resolvePane={resolvePane}
      initialPanes={openOn('review')}
      height={480}
    />
  ),
}

/* ── The headline finding ──────────────────────────────────────────────────────────────────── */

/**
 * `legacyErrorClient` makes the translog fetch fail for real (see its docblock in source), on the
 * SAME document, side by side on the two tabs `ChangesTabs` switches between. `HistorySelector`
 * (left) reads `timelineError` and renders the properly critical-toned `<TimelineError/>`: title,
 * description, red icon. `ChangesInspector` (right), reading the IDENTICAL `timelineError` off the
 * identical pane, hits `if (error) return <NoChanges/>` first, the same component `LegacyReviewTab`
 * shows for a document with genuinely nothing to report. An editor on a broken connection who opens
 * History sees an honest error; the same editor clicking over to Review sees "No changes", with
 * nothing on screen to say the two tabs disagree about what happened.
 */
export const TranslogErrorVsNoChanges: Story = {
  name: 'A translog failure: selector vs. inspector',
  tags: ['variant:current'],
  decorators: [legacyErrorProviders],
  parameters: {
    docs: {
      description: {
        story:
          'Read left to right: the same broken connection, the same document, two tabs of the same panel. One tells you it failed. The other tells you nothing happened.',
      },
    },
  },
  render: () => (
    <Flex gap={4} wrap="wrap">
      <Frame label="History tab: HistorySelector reads timelineError → TimelineError">
        <StructureHarness
          resolveRootPane={resolveRootPane}
          resolvePane={resolvePane}
          initialPanes={openOn('history')}
          height={380}
        />
      </Frame>
      <Frame label="Review tab: ChangesInspector reads the SAME timelineError → NoChanges">
        <StructureHarness
          resolveRootPane={resolveRootPane}
          resolvePane={resolvePane}
          initialPanes={openOn('review')}
          height={380}
        />
      </Frame>
    </Flex>
  ),
}

/**
 * `eventsErrorClient` makes the events-feed fetch fail for real. `EventsInspector`'s `Content()`
 * (`EventsInspector.tsx:279-286`) takes the error branch: `<CompareWithPublishedView/>` first,
 * then `<ChangesError/>` beneath it (unless `sinceEvent?.type === 'historyCleared'`, not the case
 * here with no events loaded at all). `CompareWithPublishedView`'s own guards (`isVariantTarget`,
 * `selectedReleaseId`, the drafts/published perspective checks, `EventsInspector.tsx:87-99`) all
 * clear for this fixture (a `drafts`-perspective document with a real draft and a real `_rev`), so
 * it computes its OWN draft-vs-published diff independently of the broken events feed and renders
 * above the error message, rather than the panel going fully blank. Contrast with the legacy path:
 * here the failure is at least named, via `<ChangesError/>`'s "error-title"/"error-description"
 * copy, distinct from `<NoChanges/>`.
 */
export const EventsFeedError: Story = {
  name: 'Events feed failure (review tab)',
  decorators: [eventsErrorProviders],
  render: () => (
    <StructureHarness
      resolveRootPane={resolveRootPane}
      resolvePane={resolvePane}
      initialPanes={openOn('review')}
      height={480}
    />
  ),
}

/* ── The one branch a document pane can't easily reach ────────────────────────────────────── */

/**
 * `ChangesInspector`'s first check after its hooks: `if (selectedReleaseId) return <TimelineError versionError/>`
 * (`ChangesInspector.tsx:71-79`), reviewing changes is not
 * supported while viewing a release version. `versionError` swaps in different copy from the
 * connection-failure case above (`timeline.error.load-document-changes-version-*` vs
 * `timeline.error.load-document-changes-*`), but it is the SAME component, so this renders with
 * the identical critical-toned layout as `TranslogErrorVsNoChanges`'s left frame, a genuine
 * unsupported-state message wearing the same visual language as a network failure.
 */
export const ReleaseVersion: Story = {
  name: 'Viewing a release version (not supported)',
  decorators: [isolatedProviders],
  render: () => <ReleaseVersionHarness />,
}
