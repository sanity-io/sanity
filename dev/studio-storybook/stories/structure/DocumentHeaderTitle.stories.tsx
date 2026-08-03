import {type ObjectSchemaType, type SanityDocument, type SanityDocumentLike} from '@sanity/types'
import {Card, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useMemo} from 'react'
import {throwError} from 'rxjs'
import {DocumentPaneContext, ResolvedPanesProvider} from 'sanity/_singletons'

import {useSchema} from '../../../../packages/sanity/src/core/hooks/useSchema'
import {type DocumentPreviewStore} from '../../../../packages/sanity/src/core/preview/documentPreviewStore'
import {type DocumentPaneContextValue} from '../../../../packages/sanity/src/structure/panes/document/DocumentPaneContext'
// Real component from its real path (org contract §8): the file under test.
import {DocumentHeaderTitle} from '../../../../packages/sanity/src/structure/panes/document/documentPanel/header/DocumentHeaderTitle'
import {type Panes} from '../../../../packages/sanity/src/structure/structureResolvers/useResolvedPanes'
import {structureTool} from '../../../../packages/sanity/src/structure/structureTool'
import {type PaneNode} from '../../../../packages/sanity/src/structure/types'
import {createMockPreviewUniverse} from '../../lib/mockDocumentPreviewStore'
import {
  createStructureFixtureClient,
  StructureHarness,
  type StructureHarnessProps,
} from '../../lib/structureHarness'
import {WithStudioProviders} from '../../lib/testProvider'

/* ── Fixture universe ─────────────────────────────────────────────────────
   One schema type, three documents. `ARTICLE_UNWRITTEN_ID` is deliberately
   ABSENT from the fixture set, that absence is what makes the "new
   document" story resolve the way it does (see its docblock). */

const ARTICLE_TITLED_ID = 'drafts.article-quarterly'
const ARTICLE_BLANK_ID = 'drafts.article-blank'
const ARTICLE_ERROR_ID = 'drafts.article-broken'
const ARTICLE_UNWRITTEN_ID = 'drafts.article-unwritten'

const articleSchemaTypeDef = {
  name: 'article',
  title: 'Article',
  type: 'document',
  fields: [{name: 'title', title: 'Title', type: 'string'}],
  preview: {select: {title: 'title'}},
}

const fixtureArticles: SanityDocument[] = [
  {
    _id: ARTICLE_TITLED_ID,
    _type: 'article',
    _rev: 'rev-quarterly-1',
    _createdAt: '2026-05-01T09:00:00Z',
    _updatedAt: '2026-05-14T11:30:00Z',
    title: 'Quarterly Planning Review',
  },
  {
    _id: ARTICLE_BLANK_ID,
    _type: 'article',
    _rev: 'rev-blank-1',
    _createdAt: '2026-05-02T09:00:00Z',
    _updatedAt: '2026-05-02T09:00:00Z',
    // `title` intentionally omitted, a SAVED document whose title field is genuinely empty.
  },
]

/** Look up a fixture by id, for `editState.draft`, a thrown lookup miss beats a silent cast. */
function fixtureArticle(id: string): SanityDocument {
  const doc = fixtureArticles.find((candidate) => candidate._id === id)
  if (!doc) throw new Error(`No fixture article with id "${id}"`)
  return doc
}

/**
 * The shared preview universe, with one addition: `ARTICLE_ERROR_ID` always errors instead of
 * resolving. `createPreviewObserver` does not catch a failing `observePaths` (only a throwing
 * `prepare()` is swallowed, see `prepareForPreview.ts`), so this is a faithful way to reach
 * `useValuePreview`'s `catchError` branch without inventing behaviour the real store doesn't have.
 */
const previewUniverse = createMockPreviewUniverse({documents: fixtureArticles})
const previewStore: DocumentPreviewStore = {
  ...previewUniverse.store,
  observePaths: (value, paths, apiConfig, perspective) => {
    const id =
      typeof value === 'string'
        ? value
        : ((value as {_id?: string} | null)?._id ?? (value as {_ref?: string} | null)?._ref)
    if (id === ARTICLE_ERROR_ID) {
      return throwError(() => new Error('Preview subscription lost the connection'))
    }
    return previewUniverse.store.observePaths(value, paths, apiConfig, perspective)
  },
}

const client = createStructureFixtureClient({documents: fixtureArticles})

/* ── The isolated harness ─────────────────────────────────────────────────
   `DocumentHeaderTitle` takes no props, every branch is read off
   `useDocumentPane()` (context) and `useDocumentTitle()` (a hook that reads
   the SAME context plus `usePerspective()` and a real preview subscription).
   This mounts a hand-built `DocumentPaneContext` the way `lib/documentPaneStub.tsx`
   does for the document banners, field by field, not a spread, so it's visible
   exactly which of the pane's ~30 fields this component actually depends on: eight.
   `useDocumentTitle()` itself is NOT mocked (Storybook has no `vi.mock`), so its
   internal branching runs for real against the seeded `previewStore` above. */

interface TitleFixture {
  connectionState?: DocumentPaneContextValue['connectionState']
  /** The structure-builder-configured static pane title (`S.document().title(...)`). */
  paneTitle?: string | null
  /** `useDocumentPane().value`, the pane's own document value, read directly by this component. */
  value?: SanityDocumentLike
  index?: number
  /** Read by `useDocumentTitle()`, NOT by this component directly. */
  editState?: {
    draft?: SanityDocument | null
    published?: SanityDocument | null
    version?: SanityDocument | null
  } | null
  isDeleted?: boolean
  lastRevisionDocument?: SanityDocument | null
  paneDataItems?: Panes['paneDataItems']
}

const FALLBACK_VALUE: SanityDocumentLike = {_id: ARTICLE_TITLED_ID, _type: 'article'}

function TitleFixtureHarness(props: TitleFixture) {
  const schema = useSchema()
  const schemaType = schema.get('article') as ObjectSchemaType
  const {
    connectionState = 'connected',
    paneTitle = null,
    value = FALLBACK_VALUE,
    index = 0,
    editState = null,
    isDeleted = false,
    lastRevisionDocument = null,
    paneDataItems = [],
  } = props

  const documentPaneValue = useMemo(
    () => ({
      connectionState,
      schemaType,
      title: paneTitle,
      value,
      index,
      editState,
      isDeleted,
      lastRevisionDocument,
    }),
    [
      connectionState,
      schemaType,
      paneTitle,
      value,
      index,
      editState,
      isDeleted,
      lastRevisionDocument,
    ],
  )

  const resolvedPanesValue = useMemo(
    (): Panes => ({
      paneDataItems,
      routerPanes: [],
      resolvedPanes: [],
      maximizedPane: null,
      setMaximizedPane: () => undefined,
    }),
    [paneDataItems],
  )

  return (
    <DocumentPaneContext.Provider
      // oxlint-disable-next-line no-unsafe-type-assertion -- narrow by design, see documentPaneStub.tsx
      value={documentPaneValue as unknown as DocumentPaneContextValue}
    >
      <ResolvedPanesProvider value={resolvedPanesValue}>
        <Text size={2} weight="semibold">
          <DocumentHeaderTitle />
        </Text>
      </ResolvedPanesProvider>
    </DocumentPaneContext.Provider>
  )
}

/** A labeled box, since two of the stories below render literally nothing. */
function Frame({label, note, children}: {label: string; note?: string; children: React.ReactNode}) {
  return (
    <Stack gap={2}>
      <Text size={0} muted weight="medium">
        {label}
      </Text>
      <Card border padding={3} radius={0} style={{maxWidth: 420, minHeight: 40}}>
        {children}
      </Card>
      {note && (
        <Text size={0} muted>
          {note}
        </Text>
      )}
    </Stack>
  )
}

const meta: Meta = {
  title: 'Document Pane/Header Title',
  parameters: {
    docs: {
      description: {
        component: [
          'The loading state and a real document a reviewer left blank render the identical ' +
            'string, in the identical muted grey. Nothing on screen tells the difference between ' +
            'still connecting and someone needs to fix this.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/structure/panes/document/documentPanel/header/DocumentHeaderTitle.tsx` |',
          '| Tier | CORE, the title above every open document, one of the most-read strings in the product |',
          '| Audit | 🔴 needs-work (`similarity`). See `LoadingAndBlankTitleCollapse` below |',
          '| Patterns | `similarity` · `empty-states` |',
          '',
          'Five return statements, read top to bottom, decide what shows in the header:',
          '',
          '```',
          "if (connectionState === 'connecting' && !subscribed) return <></>                 // L23-25",
          'if (title) return <>{title}</>                                                    // L27-29',
          "if (!documentValue) return <>{t('...new.text', {schemaType})}</>                  // L31-39",
          "if (error) return <>{t('...error.text', {error})}</>                              // L41-43",
          'return hasMaximizedPane ? <Breadcrumb/> : documentTitle || <Untitled/>            // L45-57',
          '```',
          '',
          "The last line's two variables come from a second hook the component also calls at the " +
            'top, which reads the same context again and runs its own, independent set of guards, ' +
            'connecting, no value, error, against a different field than the checks above it use. ' +
            'Two near-identical guard ladders, fed from two different fields off the same context.',
          '',
          "> **Why it matters:** the pane's own document value always resolves to at least an id " +
            "and a type, never to something falsy. That makes this component's own first and " +
            'third guards unreachable through any real document pane, see the two-branches story ' +
            'below. Every case an author actually sees, new, loading, blank, titled, erroring, is ' +
            "decided entirely by the second, nested hook. The component's own unit test " +
            'independently confirms this: its default props never set a value, so three of its ' +
            'nine cases land on the dead branch while their own descriptions claim to test the ' +
            "other hook's result.",
        ].join('\n'),
      },
    },
  },
  decorators: [
    WithStudioProviders({
      config: {
        schema: {name: 'storybook-header-title', types: [articleSchemaTypeDef]},
        plugins: [structureTool()],
      },
      client,
      previewStore,
    }),
  ],
  tags: [
    'autodocs',
    'chapter:cms',
    'pattern:similarity',
    'pattern:empty-states',
    'audit:needs-work',
    'source:studio-only',
    'tier:core',
  ],
}

export default meta
type Story = StoryObj

/* ── The real appearances ─────────────────────────────────────────────── */

/**
 * `connectionState: 'connecting'`, `editState: null`, the moment before the document store
 * has resolved anything, including whether the document is new or existing.
 *
 * `useDocumentTitle()`'s OWN connecting guard (`useDocumentTitle.ts:73-75`) fires first and
 * returns `{title: undefined}`. Back in `DocumentHeaderTitle`, that lands on the final
 * `documentTitle || <Untitled/>`, so the loading state's visible text is the muted
 * "Untitled" string. Compare with `BlankTitle` below.
 */
export const Loading: Story = {
  render: () => (
    <TitleFixtureHarness connectionState="connecting" editState={null} value={FALLBACK_VALUE} />
  ),
}

/**
 * A document that has never been saved: `editState.draft` is a bare `{_id, _type}` at an id
 * the preview store has never heard of (`ARTICLE_UNWRITTEN_ID` is absent from the fixture set
 * on purpose). The preview subscription is genuinely ENABLED here (unlike `Loading`). It
 * resolves, and resolves to nothing (`observePaths` returns a `null` snapshot), which is what
 * actually reaches `useDocumentTitle`'s `!value` branch (`useDocumentTitle.ts:82-89`) and
 * produces "New Article". Unlike `Untitled`, this text is NOT muted: plain ink, legible, and
 * honest about the document's state.
 */
export const NewDocument: Story = {
  render: () => (
    <TitleFixtureHarness
      connectionState="connected"
      value={{_id: ARTICLE_UNWRITTEN_ID, _type: 'article'}}
      editState={{draft: {_id: ARTICLE_UNWRITTEN_ID, _type: 'article'} as SanityDocument}}
    />
  ),
}

/**
 * A SAVED document (has `_createdAt`/`_updatedAt`, exists in the fixture set) whose `title`
 * field was simply never filled in. `useValuePreview` resolves a real snapshot,
 * `{title: undefined}`, which is a truthy object, so `useDocumentTitle`'s `!value` guard does
 * NOT fire (that guard needs a null snapshot, not an empty field; see `NewDocument`). Falls to
 * `documentTitle || <Untitled/>` with `documentTitle` undefined → the same muted "Untitled".
 */
export const BlankTitle: Story = {
  render: () => (
    <TitleFixtureHarness
      connectionState="connected"
      value={{_id: ARTICLE_BLANK_ID, _type: 'article'}}
      editState={{
        draft: fixtureArticle(ARTICLE_BLANK_ID),
      }}
    />
  ),
}

/** The common case: a saved document with a real title. */
export const Titled: Story = {
  render: () => (
    <TitleFixtureHarness
      connectionState="connected"
      value={{_id: ARTICLE_TITLED_ID, _type: 'article'}}
      editState={{
        draft: fixtureArticle(ARTICLE_TITLED_ID),
      }}
    />
  ),
}

/**
 * The headline finding, side by side. `Loading` (still connecting, nothing known yet) and
 * `BlankTitle` (a real, saved document an author left untitled) are two completely different
 * situations, one transient, one a real authoring state a reviewer might need to act on, and
 * they render the identical picture: the same muted grey "Untitled", same weight, same size.
 * Nothing on screen distinguishes "wait" from "this document needs a title."
 *
 * `NewDocument` is included as the counter-example: the ONE case that reads differently
 * (plain-ink "New Article"), which is what makes the other two collapsing together a real gap
 * rather than a universal limitation of the component.
 */
export const LoadingAndBlankTitleCollapse: Story = {
  name: 'Loading vs. Blank title, the collapse',
  tags: ['variant:current'],
  parameters: {
    docs: {
      description: {
        story:
          'Read top to bottom: two genuinely different document states render identically, and the one case that reads differently is right there for comparison.',
      },
    },
  },
  render: () => (
    <Stack gap={4}>
      <Frame label="Loading, connecting, nothing resolved yet" note='Renders: "Untitled" (muted)'>
        <TitleFixtureHarness connectionState="connecting" editState={null} value={FALLBACK_VALUE} />
      </Frame>
      <Frame
        label="Blank title, a saved document, title field left empty"
        note='Renders: "Untitled" (muted), same text, same style, as Loading above'
      >
        <TitleFixtureHarness
          connectionState="connected"
          value={{_id: ARTICLE_BLANK_ID, _type: 'article'}}
          editState={{
            draft: fixtureArticle(ARTICLE_BLANK_ID),
          }}
        />
      </Frame>
      <Frame
        label="New document, for comparison, the one case that DOES read differently"
        note='Renders: "New Article" (plain ink, not muted)'
      >
        <TitleFixtureHarness
          connectionState="connected"
          value={{_id: ARTICLE_UNWRITTEN_ID, _type: 'article'}}
          editState={{draft: {_id: ARTICLE_UNWRITTEN_ID, _type: 'article'} as SanityDocument}}
        />
      </Frame>
    </Stack>
  ),
}

/**
 * `useValuePreview`'s `catchError` branch (`useDocumentTitle.ts:91-96`), reached here by a
 * preview subscription that genuinely fails (see `previewStore` above, `observePaths` errors
 * for this one fixture id, the same failure mode a network drop would produce; `prepareForPreview`
 * itself swallows its own `prepare()` errors, so a config bug can NOT reach this branch, only a
 * subscription-level failure can).
 */
export const ErrorResolvingTitle: Story = {
  render: () => (
    <TitleFixtureHarness
      connectionState="connected"
      value={{_id: ARTICLE_ERROR_ID, _type: 'article'}}
      editState={{draft: {_id: ARTICLE_ERROR_ID, _type: 'article'} as SanityDocument}}
    />
  ),
}

/**
 * The structure builder can give a pane a static `.title(...)`, independent of the document
 * inside it (`if (title) return <>{title}</>`, L27-29, the SECOND branch checked, ahead of
 * every document-derived state). All four rows below carry the identical static title even
 * though the underlying document states are as different as `Loading`, `NewDocument`,
 * `ErrorResolvingTitle` and `Titled` above, because this branch returns before any of that
 * is consulted. A deliberate structure-builder choice, not a defect, but worth seeing next to
 * the states above: a pane-level title override erases every one of the distinctions those
 * stories draw.
 */
export const PaneTitleOverride: Story = {
  render: () => (
    <Stack gap={4}>
      <Frame label="Static title, document still connecting">
        <TitleFixtureHarness
          connectionState="connecting"
          paneTitle="Company Handbook"
          editState={null}
        />
      </Frame>
      <Frame label="Static title, document is a new, unsaved article">
        <TitleFixtureHarness
          connectionState="connected"
          paneTitle="Company Handbook"
          value={{_id: ARTICLE_UNWRITTEN_ID, _type: 'article'}}
          editState={{draft: {_id: ARTICLE_UNWRITTEN_ID, _type: 'article'} as SanityDocument}}
        />
      </Frame>
      <Frame label="Static title, preview subscription is erroring">
        <TitleFixtureHarness
          connectionState="connected"
          paneTitle="Company Handbook"
          value={{_id: ARTICLE_ERROR_ID, _type: 'article'}}
          editState={{draft: {_id: ARTICLE_ERROR_ID, _type: 'article'} as SanityDocument}}
        />
      </Frame>
      <Frame label="Static title, document is titled 'Quarterly Planning Review'">
        <TitleFixtureHarness
          connectionState="connected"
          paneTitle="Company Handbook"
          value={{_id: ARTICLE_TITLED_ID, _type: 'article'}}
          editState={{
            draft: fixtureArticle(ARTICLE_TITLED_ID),
          }}
        />
      </Frame>
    </Stack>
  ),
}

/**
 * The component's OWN first and third returns (`!subscribed`, L23-25, and `!documentValue`,
 * L31-39) both require `useDocumentPane().value` to be falsy. Reading `useDocumentForm.ts`
 * (`core/form/useDocumentForm.ts:259-292`) end to end: every branch of `value`'s `useMemo`
 * falls back to `baseValue = initialValue?.value || {_id: documentId, _type: documentType}`,
 * an object, always truthy. `DocumentPaneProvider.tsx` (L292, L586) passes that `value` straight
 * into context, unmodified. So through any real `DocumentPaneProvider`, `documentValue` here can
 * never be falsy, and these two branches can never run.
 *
 * This page reaches them anyway by hand-setting `value: undefined` on the context directly
 * (bypassing `DocumentPaneProvider`, the way the component's own unit test does, via a mocked
 * `useDocumentPane` in `__tests__/DocumentHeaderTitle.test.tsx`). That test file is itself
 * evidence this is a real gap and not a hypothetical one: three of its nine cases (L171, L184,
 * L212) never override
 * `value` away from the mock's default `undefined`, so, despite descriptions like "should
 * return the value.title if value is provided", they exercise THIS branch, not the
 * `useDocumentTitle()` result their names claim to cover.
 */
export const StructurallyUnreachableGuards: Story = {
  name: 'Two branches no real document pane can reach',
  render: () => (
    <Stack gap={4}>
      <Frame
        label='Return #1, `if (connectionState === "connecting" && !subscribed) return <></>`'
        note="Renders nothing at all, an empty fragment. The box below is empty on purpose."
      >
        <TitleFixtureHarness
          connectionState="connecting"
          // Deliberately violates the real invariant (`value` is never falsy through
          // DocumentPaneProvider, see the docblock above) in order to reach dead code.
          value={undefined as unknown as SanityDocumentLike}
          editState={null}
        />
      </Frame>
      <Frame
        label="Return #3, `if (!documentValue) return <>{New schemaType}</>`"
        note='Renders "New Article", but via THIS branch, not the `useDocumentTitle()` path that produces the same text in `NewDocument` above.'
      >
        <TitleFixtureHarness
          connectionState="connected"
          // Same deliberate violation as above.
          value={undefined as unknown as SanityDocumentLike}
          editState={null}
        />
      </Frame>
    </Stack>
  ),
}

const breadcrumbPaneDataItems: Panes['paneDataItems'] = [
  {
    active: false,
    childItemId: null,
    groupIndex: 0,
    index: 0,
    itemId: 'articles',
    key: 'articles-0',
    params: {},
    path: '',
    payload: undefined,
    selected: false,
    siblingIndex: 0,
    maximized: false,
    // oxlint-disable-next-line no-unsafe-type-assertion -- minimal shape the breadcrumb reads
    pane: {id: 'articles', type: 'documentList', title: 'Articles'} as unknown as PaneNode,
  },
  {
    active: true,
    childItemId: null,
    groupIndex: 1,
    index: 1,
    itemId: ARTICLE_TITLED_ID,
    key: `${ARTICLE_TITLED_ID}-1`,
    params: {},
    path: '',
    payload: undefined,
    selected: true,
    siblingIndex: 0,
    maximized: true,
    pane: {
      id: ARTICLE_TITLED_ID,
      type: 'document',
      options: {id: ARTICLE_TITLED_ID, type: 'article'},
    } as unknown as PaneNode,
  },
]

/**
 * `hasMaximizedPane` (`paneDataItems.some((p) => p.maximized)`) swaps the title for
 * `DocumentHeaderBreadcrumb` entirely, not a title at all, but a trail back through the
 * columns that got collapsed when this one maximized. `DocumentHeaderBreadcrumbItem`'s own
 * preview resolution (per-item document titles) is that component's concern, not this one's;
 * this fixture exists to exercise `DocumentHeaderTitle`'s OWN branch selection (L47-49), not to
 * re-audit the breadcrumb.
 */
export const MaximizedBreadcrumb: Story = {
  render: () => (
    <TitleFixtureHarness
      connectionState="connected"
      index={1}
      value={{_id: ARTICLE_TITLED_ID, _type: 'article'}}
      editState={{
        draft: fixtureArticle(ARTICLE_TITLED_ID),
      }}
      paneDataItems={breadcrumbPaneDataItems}
    />
  ),
}

/** Every return, stacked and labeled, the reason this page exists. */
export const ReturnMatrix: Story = {
  // Enumeration story: the docs canvas is 540px and this content is 727px tall, so
  // 187px of it sat below an unscrolled fold on the page a reviewer actually reads.
  parameters: {docs: {story: {height: '751px'}}},
  render: () => (
    <Stack gap={4}>
      <Frame label="Loading (connecting, nothing resolved)">
        <TitleFixtureHarness connectionState="connecting" editState={null} value={FALLBACK_VALUE} />
      </Frame>
      <Frame label="New, unsaved document">
        <TitleFixtureHarness
          connectionState="connected"
          value={{_id: ARTICLE_UNWRITTEN_ID, _type: 'article'}}
          editState={{draft: {_id: ARTICLE_UNWRITTEN_ID, _type: 'article'} as SanityDocument}}
        />
      </Frame>
      <Frame label="Saved document, blank title (same picture as Loading)">
        <TitleFixtureHarness
          connectionState="connected"
          value={{_id: ARTICLE_BLANK_ID, _type: 'article'}}
          editState={{
            draft: fixtureArticle(ARTICLE_BLANK_ID),
          }}
        />
      </Frame>
      <Frame label="Saved document, titled">
        <TitleFixtureHarness
          connectionState="connected"
          value={{_id: ARTICLE_TITLED_ID, _type: 'article'}}
          editState={{
            draft: fixtureArticle(ARTICLE_TITLED_ID),
          }}
        />
      </Frame>
      <Frame label="Preview subscription erroring">
        <TitleFixtureHarness
          connectionState="connected"
          value={{_id: ARTICLE_ERROR_ID, _type: 'article'}}
          editState={{draft: {_id: ARTICLE_ERROR_ID, _type: 'article'} as SanityDocument}}
        />
      </Frame>
      <Frame label="Static pane title override">
        <TitleFixtureHarness connectionState="connected" paneTitle="Company Handbook" />
      </Frame>
      <Frame label="Maximized pane (breadcrumb, not a title)">
        <TitleFixtureHarness
          connectionState="connected"
          index={1}
          value={{_id: ARTICLE_TITLED_ID, _type: 'article'}}
          editState={{
            draft: fixtureArticle(ARTICLE_TITLED_ID),
          }}
          paneDataItems={breadcrumbPaneDataItems}
        />
      </Frame>
    </Stack>
  ),
}

const inContextResolveRootPane: StructureHarnessProps['resolveRootPane'] = (S) =>
  S.document()
    .id(ARTICLE_BLANK_ID)
    .documentId(ARTICLE_BLANK_ID)
    .schemaType('article')
    .serialize() as unknown as PaneNode

const inContextResolvePane: StructureHarnessProps['resolvePane'] = (S, id) =>
  S.document().id(id).documentId(id).schemaType('article').serialize() as unknown as PaneNode

/**
 * The REAL document pane (`lib/structureHarness.tsx`, the same harness the `Document Pane`
 * chapter's own page uses), opened on the blank-title fixture, so the header renders inside its
 * real chrome (subheader, form, status bar) rather than the isolated `<Text>` wrapper the
 * stories above use. That sibling page covers the pane's other lifecycle states; this one
 * anchors `BlankTitle` above in a fully real render, confirming the isolated harness matches
 * production.
 */
export const InContext: Story = {
  name: 'In context, the real document pane',
  render: () => (
    <StructureHarness
      resolveRootPane={inContextResolveRootPane}
      resolvePane={inContextResolvePane}
      height={520}
    />
  ),
}
