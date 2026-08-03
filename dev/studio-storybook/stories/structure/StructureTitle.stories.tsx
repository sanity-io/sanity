import {type ObjectSchemaType, type SanityDocument} from '@sanity/types'
import {Card, Code, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useEffect, useLayoutEffect, useMemo, useState} from 'react'
import {throwError} from 'rxjs'
import {StructureToolContext} from 'sanity/_singletons'

import {useSchema} from '../../../../packages/sanity/src/core/hooks/useSchema'
import {createPreviewObserver} from '../../../../packages/sanity/src/core/preview/createPreviewObserver'
import {type DocumentPreviewStore} from '../../../../packages/sanity/src/core/preview/documentPreviewStore'
import {type ObservePathsFn} from '../../../../packages/sanity/src/core/preview/types'
// Real components from their real path (org contract §8): the file under test.
import {
  DocumentTitle,
  StructureTitle,
} from '../../../../packages/sanity/src/structure/components/structureTool/StructureTitle'
import {LOADING_PANE} from '../../../../packages/sanity/src/structure/constants'
import {structureTool} from '../../../../packages/sanity/src/structure/structureTool'
import {
  type PaneNode,
  type StructureToolContextValue,
} from '../../../../packages/sanity/src/structure/types'
import {createMockPreviewUniverse} from '../../lib/mockDocumentPreviewStore'
import {
  createStructureFixtureClient,
  StructureHarness,
  type StructureHarnessProps,
} from '../../lib/structureHarness'
import {WithStudioProviders} from '../../lib/testProvider'

/* ── Fixture universe ─────────────────────────────────────────────────────
   Reuses the article/quarterly/blank shape from `Document Pane/Header Title`
   (same fixture-store technique) so the two pages are easy to read side by side. */

const ARTICLE_TITLED_ID = 'drafts.article-quarterly'
const ARTICLE_BLANK_ID = 'drafts.article-blank'
const ARTICLE_ERROR_ID = 'drafts.article-broken'

const articleSchemaTypeDef = {
  name: 'article',
  title: 'Article',
  type: 'document',
  fields: [{name: 'title', title: 'Title', type: 'string'}],
  preview: {select: {title: 'title'}},
}

/** A second document type with NO human `title` configured, only the raw schema `name`. */
const internalSchemaTypeDef = {
  name: 'seoMetaFields',
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
  // Three documents of the same type, standing in for "three tabs open on three documents":
  {
    _id: 'article-onboarding',
    _type: 'article',
    _rev: 'rev-onboarding-1',
    _createdAt: '2026-04-01T09:00:00Z',
    _updatedAt: '2026-04-01T09:00:00Z',
    title: 'New Hire Onboarding Guide',
  },
  {
    _id: 'article-incident',
    _type: 'article',
    _rev: 'rev-incident-1',
    _createdAt: '2026-04-02T09:00:00Z',
    _updatedAt: '2026-04-02T09:00:00Z',
    title: 'Incident Postmortem Template',
  },
  {
    _id: 'article-pricing',
    _type: 'article',
    _rev: 'rev-pricing-1',
    _createdAt: '2026-04-03T09:00:00Z',
    _updatedAt: '2026-04-03T09:00:00Z',
    title: 'Pricing Page Refresh',
  },
]

function fixtureArticle(id: string): SanityDocument {
  const doc = fixtureArticles.find((candidate) => candidate._id === id)
  if (!doc) throw new Error(`No fixture article with id "${id}"`)
  return doc
}

/**
 * Reused from `DocumentHeaderTitle.stories.tsx`: makes one fixture id error instead of resolving.
 *
 * `DocumentTitle` reads through `useValuePreview`, which calls `observeForPreview`, NOT
 * `observePaths` directly. `createMockPreviewUniverse`'s own `observeForPreview`
 * (`mockDocumentPreviewStore.ts:161`) is built once, at store-creation time, via
 * `createPreviewObserver({observeDocumentTypeFromId, observePaths})` - it closes over THAT
 * `observePaths` reference, not a live read of whatever `observePaths` this object exposes. So
 * overriding only `observePaths` below (as `DocumentHeaderTitle.stories.tsx`'s original version
 * of this pattern does) throws for the right id on `observePaths` calls, but `observeForPreview`
 * still runs the ORIGINAL, non-throwing pipeline - the override never reaches the one method
 * `DocumentTitle` actually calls. Rebuilding `observeForPreview` from the overridden
 * `observePaths` here closes that gap, so `ErrorRendersAsUntitled` below genuinely throws and is
 * genuinely caught, rather than reading "Untitled" for the unrelated reason that this fixture id
 * is not in `fixtureArticles` either.
 */
const previewUniverse = createMockPreviewUniverse({documents: fixtureArticles})
const overriddenObservePaths: ObservePathsFn = (value, paths, apiConfig, perspective) => {
  const id =
    typeof value === 'string'
      ? value
      : ((value as {_id?: string} | null)?._id ?? (value as {_ref?: string} | null)?._ref)
  if (id === ARTICLE_ERROR_ID) {
    return throwError(() => new Error('Preview subscription lost the connection'))
  }
  return previewUniverse.store.observePaths(value, paths, apiConfig, perspective)
}
const previewStore: DocumentPreviewStore = {
  ...previewUniverse.store,
  observePaths: overriddenObservePaths,
  observeForPreview: createPreviewObserver({
    observeDocumentTypeFromId: previewUniverse.store.observeDocumentTypeFromId,
    observePaths: overriddenObservePaths,
  }),
}

/** The real, compiled `article` schema type, so `DocumentTitle`'s `useValuePreview` actually
 * reads the fixtures instead of short-circuiting: `useValuePreview.ts:62` returns `IDLE_STATE`
 * (title always `undefined`) whenever `schemaType` is falsy, before `observeForPreview` is ever
 * called - the five stories below used to pass `schemaType={undefined}`, so none of them actually
 * exercised the branch their own docblock describes. */
function useArticleSchemaType(): ObjectSchemaType {
  const schema = useSchema()
  return schema.get('article') as ObjectSchemaType
}

const client = createStructureFixtureClient({documents: fixtureArticles})

/* ── Reading a side effect back into the page ─────────────────────────────
   Both `DocumentTitle` and `StructureTitle`/`PassthroughTitle` always `return null`.
   Their entire effect is `document.title = ...`, so there is nothing to render. A
   MutationObserver on the real `<title>` DOM node is the honest way to make that
   effect visible: it reports exactly what a browser tab would show, not a
   recomputed guess at what the component "should" produce. */

function useDocumentTitleReadout(): string {
  const [title, setTitle] = useState(() => document.title)
  // `useLayoutEffect`, not `useEffect`, and on purpose: React fires effects child-first, and
  // this hook lives in a PARENT (`TabTitleReadout`) wrapping children (`SeedPriorTitle`,
  // `DocumentTitle`, `StructureTitle`) that set `document.title` from their own regular
  // `useEffect`. A plain `useEffect` here would attach the observer in the SAME (passive) phase
  // as, but after, those children's title-setting effects, missing the first mutation entirely.
  // The layout phase finishes in full, all layout effects, children before parents, before the
  // passive phase starts, so a layout effect here is guaranteed to attach before any of those
  // children's passive effects can run.
  useLayoutEffect(() => {
    const titleEl = document.querySelector('title')
    if (!titleEl) return undefined
    const observer = new MutationObserver(() => setTitle(document.title))
    observer.observe(titleEl, {childList: true, characterData: true, subtree: true})
    return () => observer.disconnect()
  }, [])
  return title
}

/** Seeds `document.title` to a known prior value BEFORE the child effects below can run. */
function SeedPriorTitle({value}: {value: string}) {
  useEffect(() => {
    document.title = value
  }, [value])
  return null
}

function TabTitleReadout({children}: {children: React.ReactNode}) {
  const title = useDocumentTitleReadout()
  return (
    <Stack gap={3}>
      <Card border padding={3} radius={0} style={{maxWidth: 480}}>
        <Stack gap={2}>
          <Text size={0} muted weight="medium">
            document.title, read back from the real DOM &lt;title&gt; element (not rendered by the
            component under test, which returns null)
          </Text>
          <Code size={2}>{title || '(empty string)'}</Code>
        </Stack>
      </Card>
      {children}
    </Stack>
  )
}

/** A labeled variant of `TabTitleReadout`, for the matrix and comparison stories. */
function Row({label, children}: {label: string; children: React.ReactNode}) {
  return (
    <Stack gap={2}>
      <Text size={0} muted weight="medium">
        {label}
      </Text>
      <TabTitleReadout>{children}</TabTitleReadout>
    </Stack>
  )
}

/** Narrow `StructureToolContext` stub, the way the component's own unit test mocks `useStructureTool`. */
function WithStructureContext({title, children}: {title: string; children: React.ReactNode}) {
  const value = useMemo(
    () =>
      // oxlint-disable-next-line no-unsafe-type-assertion -- narrow by design, only `.structureContext.title` is read
      ({structureContext: {title}}) as unknown as StructureToolContextValue,
    [title],
  )
  return <StructureToolContext.Provider value={value}>{children}</StructureToolContext.Provider>
}

const BASE_TITLE = 'Acme Studio'

const meta: Meta = {
  title: 'Document Pane/Structure Title',
  parameters: {
    docs: {
      description: {
        component: [
          'Three tabs open on three different documents of the same type can be indistinguishable ' +
            "in a browser's tab strip, because a structure-builder-configured static title wins " +
            "over every document's own identity.",
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/structure/components/structureTool/StructureTitle.tsx` |',
          "| Tier | CORE. This sets the browser tab title for the whole structure tool. It is the one piece of the product that survives into bookmarks, browser history, session restore, and screenshots of somebody's tab bar |",
          '| Audit | 🔴 needs-work (`similarity`). See `SameTypeThreeTabsCollapse` below |',
          '| Patterns | `similarity` · `identity` |',
          '',
          'Three functions in one file, all of which return null and do their real work in an ' +
            'effect that assigns the document title. Nothing here is visible by rendering it, so ' +
            'every story below reads the title back out of the real DOM element rather than ' +
            'rendering a guess.',
          '',
          '```',
          '// StructureTitle(resolvedPanes) - picks WHICH of the two below runs, off the LAST pane only',
          'if (!resolvedPanes?.length) return null                          // untouched, no effect at all',
          'if (isLoadingPane(lastPane)) return <PassthroughTitle />         // base title only',
          'if (isDocumentPane(lastPane)) {',
          '  if (lastPane?.title) return <PassthroughTitle title={lastPane.title} />',
          '  return null                                                   // <DocumentTitle> (mounted separately',
          '}                                                                // inside DocumentPaneProvider) governs instead',
          'return <PassthroughTitle title={lastPane?.title} />',
          '',
          "// DocumentTitle({isDeleted, displayed, ready, schemaType}) - the document's OWN resolved title",
          "const documentTitle = isDeleted ? ''",
          "  : isNewDocument ? t('New {{schemaType}}')",
          "  : value?.title || t('Untitled')",
          'useEffect(() => { if (!ready || previewValueIsLoading) return; document.title = newTitle })',
          '```',
          '',
          'This effect only ever reads the last resolved pane. Opening Content, Articles, ' +
            '"Quarterly Planning Review" produces a tab reading just "Quarterly Planning Review, ' +
            'Acme Studio", never the full breadcrumb, matching the component\'s own unit test.',
          '',
          "> **Why it matters:** the document's own title effect is mounted unconditionally " +
            'inside every real document pane, separate from this one. The two coordinate only by ' +
            'both writing the same global tab title; whichever effect commits last wins. And the ' +
            "document's own effect never reads the preview's error state at all, only its value " +
            'and loading flag: a genuinely broken preview subscription is not just ' +
            'indistinguishable from an empty title, it is architecturally incapable of being ' +
            'distinguished here.',
        ].join('\n'),
      },
    },
  },
  decorators: [
    WithStudioProviders({
      config: {
        schema: {
          name: 'storybook-structure-title',
          types: [articleSchemaTypeDef, internalSchemaTypeDef],
        },
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
    'pattern:identity',
    'audit:needs-work',
    'source:studio-only',
    'tier:core',
  ],
}

export default meta
type Story = StoryObj

/* ── DocumentTitle: the document's own resolved tab title ────────────────── */

/**
 * `ready: false`. Per the docblock above, the effect's own guard clause (returning early when
 * not ready or the preview is still loading) means `document.title` is not merely unset, it is left
 * COMPLETELY UNTOUCHED. This story seeds a plausible "previous document" title before mounting
 * the loading `DocumentTitle`, the way a real tab would already be showing SOMETHING before a
 * person clicks to a new document. The readout below proves that stale title survives the
 * navigation: the tab keeps announcing the PREVIOUS document's identity for as long as loading
 * takes, which is a different and arguably worse failure than `Document Pane/Header Title`'s
 * loading collapse (that one shows a neutral "Untitled"; this one shows something actively wrong).
 */
export const Loading: Story = {
  render: function LoadingStory() {
    const schemaType = useArticleSchemaType()
    return (
      <TabTitleReadout>
        <WithStructureContext title={BASE_TITLE}>
          <SeedPriorTitle value={`Incident Postmortem Template | ${BASE_TITLE}`} />
          <DocumentTitle
            isDeleted={false}
            displayed={fixtureArticle(ARTICLE_TITLED_ID)}
            ready={false}
            schemaType={schemaType}
          />
        </WithStructureContext>
      </TabTitleReadout>
    )
  },
}

/**
 * The preview subscription genuinely fails (`previewStore`'s `observeForPreview`, rebuilt above
 * from the overridden `observePaths`, throws for this one fixture id). `DocumentTitle`
 * destructures only `{value, isLoading}` off `useValuePreview()`, the `error` field is never even
 * read. So `value` is `undefined`, `value?.title || t('Untitled')` falls to "Untitled", and a
 * broken subscription reads exactly like an author who left the title field blank. There is no
 * branch in this file that could show it differently, this is not a missed guard, the information
 * is discarded before the ternary runs.
 *
 * This needed a real `schemaType` AND the `observeForPreview` fix above to genuinely demonstrate
 * that: with `schemaType={undefined}` this never called `observeForPreview` at all (idle state,
 * `useValuePreview.ts:62`), and with only `observePaths` overridden `observeForPreview` still ran
 * the original, non-throwing pipeline - either gap alone reached "Untitled" anyway, just not by
 * a caught error.
 */
export const ErrorRendersAsUntitled: Story = {
  render: function ErrorRendersAsUntitledStory() {
    const schemaType = useArticleSchemaType()
    return (
      <TabTitleReadout>
        <WithStructureContext title={BASE_TITLE}>
          <DocumentTitle
            isDeleted={false}
            displayed={{
              _id: ARTICLE_ERROR_ID,
              _type: 'article',
              _createdAt: '2026-05-01T09:00:00Z',
            }}
            ready
            schemaType={schemaType}
          />
        </WithStructureContext>
      </TabTitleReadout>
    )
  },
}

/**
 * `displayed._createdAt` is falsy, `isNewDocument` is computed directly off that field, not
 * inferred from an empty preview result the way `Document Pane/Header Title`'s equivalent branch
 * is. A cleaner design: the "is this new" question has exactly one source of truth here.
 */
export const NewDocument: Story = {
  render: () => (
    <TabTitleReadout>
      <WithStructureContext title={BASE_TITLE}>
        <DocumentTitle
          isDeleted={false}
          displayed={{_id: 'article-unwritten', _type: 'article'}}
          ready
          schemaType={{title: 'Article', name: 'article'} as ObjectSchemaType}
        />
      </WithStructureContext>
    </TabTitleReadout>
  ),
}

/** A saved document (`_createdAt` present) whose `title` field was never filled in. */
export const Untitled: Story = {
  render: function UntitledStory() {
    const schemaType = useArticleSchemaType()
    return (
      <TabTitleReadout>
        <WithStructureContext title={BASE_TITLE}>
          <DocumentTitle
            isDeleted={false}
            displayed={fixtureArticle(ARTICLE_BLANK_ID)}
            ready
            schemaType={schemaType}
          />
        </WithStructureContext>
      </TabTitleReadout>
    )
  },
}

/**
 * The common case: a saved document with a real title. Needed a real `schemaType` to actually
 * demonstrate it - see `useArticleSchemaType`'s docblock above.
 */
export const Titled: Story = {
  render: function TitledStory() {
    const schemaType = useArticleSchemaType()
    return (
      <TabTitleReadout>
        <WithStructureContext title={BASE_TITLE}>
          <DocumentTitle
            isDeleted={false}
            displayed={fixtureArticle(ARTICLE_TITLED_ID)}
            ready
            schemaType={schemaType}
          />
        </WithStructureContext>
      </TabTitleReadout>
    )
  },
}

/**
 * `isDeleted: true` short-circuits `documentTitle` to `''` before the new/untitled/value
 * checks ever run, and `useConstructDocumentTitle` filters falsy segments out of the pipe-join,
 * so the tab reads just the base title. A clean, positive result: a deleted document leaves no
 * trace of its own identity in the tab. Compare with `Loading` above, which leaves the WRONG
 * identity rather than none at all.
 */
export const Deleted: Story = {
  render: function DeletedStory() {
    const schemaType = useArticleSchemaType()
    return (
      <TabTitleReadout>
        <WithStructureContext title={BASE_TITLE}>
          <DocumentTitle
            isDeleted
            displayed={fixtureArticle(ARTICLE_TITLED_ID)}
            ready
            schemaType={schemaType}
          />
        </WithStructureContext>
      </TabTitleReadout>
    )
  },
}

/**
 * A schema type with no human `title` configured (`internalSchemaTypeDef`, only the raw
 * camelCase `name: 'seoMetaFields'`). `schemaType?.title || schemaType?.name` falls to the raw
 * name, and that string reaches the browser tab verbatim. Not a document id, the component never
 * touches `_id`, but an internal identifier all the same: the kind of string an author has no
 * reason to recognise and a support screenshot has no business showing.
 */
export const SchemaTypeNameLeak: Story = {
  render: () => (
    <TabTitleReadout>
      <WithStructureContext title={BASE_TITLE}>
        <DocumentTitle
          isDeleted={false}
          displayed={{_id: 'seoMetaFields-unwritten', _type: 'seoMetaFields'}}
          ready
          schemaType={{name: 'seoMetaFields'} as ObjectSchemaType}
        />
      </WithStructureContext>
    </TabTitleReadout>
  ),
}

/* ── StructureTitle: which pane's title wins ──────────────────────────── */

/** `resolvedPanes: []`. Not "cleared", not "base title", genuinely never touched. */
export const EmptyPanes: Story = {
  render: () => (
    <TabTitleReadout>
      <WithStructureContext title={BASE_TITLE}>
        <SeedPriorTitle value="Whatever the browser tab said before" />
        <StructureTitle resolvedPanes={[]} />
      </WithStructureContext>
    </TabTitleReadout>
  ),
}

/**
 * The last resolved pane is the `LOADING_PANE` sentinel (structure resolution itself still
 * running, distinct from `DocumentTitle`'s `ready: false`, which is the DOCUMENT still loading
 * inside an already-resolved pane). This branch actively resets to the base title alone, a
 * different loading behaviour from `Loading` above, which leaves the previous title untouched.
 * Two different kinds of "loading" in this one file, two different tab outcomes.
 */
export const LoadingPane: Story = {
  render: () => (
    <TabTitleReadout>
      <WithStructureContext title={BASE_TITLE}>
        <SeedPriorTitle value={`Incident Postmortem Template | ${BASE_TITLE}`} />
        <StructureTitle resolvedPanes={[LOADING_PANE]} />
      </WithStructureContext>
    </TabTitleReadout>
  ),
}

const contentListPane = {id: 'content', type: 'list', title: 'Content'} as unknown as PaneNode

function documentListPane(title: string): PaneNode {
  return {
    id: 'articles',
    type: 'documentList',
    title,
    schemaTypeName: 'article',
    options: {filter: '_type == $type'},
  } as unknown as PaneNode
}

function staticTitledDocumentPane(id: string, title: string): PaneNode {
  return {
    id,
    type: 'document',
    title,
    options: {id, type: 'article'},
  } as unknown as PaneNode
}

/** Only the LEAF pane's title reaches the tab, never the full path. */
export const InnerListPane: Story = {
  render: () => (
    <TabTitleReadout>
      <WithStructureContext title={BASE_TITLE}>
        <StructureTitle resolvedPanes={[contentListPane, documentListPane('Articles')]} />
      </WithStructureContext>
    </TabTitleReadout>
  ),
}

/**
 * A document pane the structure builder gave a static `.title(...)` (`S.document().title(...)`,
 * the same seam `Document Pane/Header Title`'s `PaneTitleOverride` covers for the on-screen
 * header). Here it wins over the document's own resolved preview title in the SAME way, and the
 * cost is different: this is the tab strip, not a header inside one already-open document.
 */
export const StaticDocumentPaneTitle: Story = {
  render: () => (
    <TabTitleReadout>
      <WithStructureContext title={BASE_TITLE}>
        <StructureTitle
          resolvedPanes={[
            contentListPane,
            documentListPane('Articles'),
            staticTitledDocumentPane('article-onboarding', 'Edit Article'),
          ]}
        />
      </WithStructureContext>
    </TabTitleReadout>
  ),
}

/**
 * The headline finding. Three DIFFERENT documents of the same type, opened the way a structure
 * builder commonly wires a document-type list:
 *
 * ```
 * S.documentTypeList('article').child((id) =>
 *   S.document().documentId(id).schemaType('article').title('Edit Article'))
 * ```
 *
 * Every child pane gets the SAME configured title, so `StructureTitle`'s `if (lastPane?.title)`
 * branch wins for all three and the tab reads "Edit Article | Acme Studio" regardless of which
 * one is open.
 *
 * Compare the second group: the same three documents, opened WITHOUT a static pane title, so
 * `DocumentTitle` supplies each document's own resolved preview title instead. There, the tabs
 * are distinguishable, because each document's title is genuinely different information, not
 * because anything about the component changed.
 */
export const SameTypeThreeTabsCollapse: Story = {
  name: 'Three tabs, same type, one with static titles',
  tags: ['variant:current'],
  parameters: {
    docs: {
      description: {
        story:
          'Read top to bottom: three different documents produce one indistinguishable tab title when the pane has a static title, and three distinguishable ones when it does not.',
      },
    },
  },
  render: () => (
    <Stack gap={4}>
      <Text size={1} weight="semibold">
        With a structure-builder static pane title (indistinguishable)
      </Text>
      <Row label="Tab 1, open document: New Hire Onboarding Guide">
        <WithStructureContext title={BASE_TITLE}>
          <StructureTitle
            resolvedPanes={[
              contentListPane,
              documentListPane('Articles'),
              staticTitledDocumentPane('article-onboarding', 'Edit Article'),
            ]}
          />
        </WithStructureContext>
      </Row>
      <Row label="Tab 2, open document: Incident Postmortem Template">
        <WithStructureContext title={BASE_TITLE}>
          <StructureTitle
            resolvedPanes={[
              contentListPane,
              documentListPane('Articles'),
              staticTitledDocumentPane('article-incident', 'Edit Article'),
            ]}
          />
        </WithStructureContext>
      </Row>
      <Row label="Tab 3, open document: Pricing Page Refresh">
        <WithStructureContext title={BASE_TITLE}>
          <StructureTitle
            resolvedPanes={[
              contentListPane,
              documentListPane('Articles'),
              staticTitledDocumentPane('article-pricing', 'Edit Article'),
            ]}
          />
        </WithStructureContext>
      </Row>
      <Text size={1} weight="semibold">
        Without a static pane title, `DocumentTitle` supplies each document&apos;s own preview title
        (distinguishable)
      </Text>
      <Row label="Tab 1, open document: New Hire Onboarding Guide">
        <WithStructureContext title={BASE_TITLE}>
          <DocumentTitle
            isDeleted={false}
            displayed={fixtureArticle('article-onboarding')}
            ready
            schemaType={undefined}
          />
        </WithStructureContext>
      </Row>
      <Row label="Tab 2, open document: Incident Postmortem Template">
        <WithStructureContext title={BASE_TITLE}>
          <DocumentTitle
            isDeleted={false}
            displayed={fixtureArticle('article-incident')}
            ready
            schemaType={undefined}
          />
        </WithStructureContext>
      </Row>
      <Row label="Tab 3, open document: Pricing Page Refresh">
        <WithStructureContext title={BASE_TITLE}>
          <DocumentTitle
            isDeleted={false}
            displayed={fixtureArticle('article-pricing')}
            ready
            schemaType={undefined}
          />
        </WithStructureContext>
      </Row>
    </Stack>
  ),
}

/**
 * Every distinct outcome, one at a time.
 *
 * `document.title` is a single page-global property. The first version of this story mounted all
 * ten rows' components at once, each with its own `TabTitleReadout` observing the SAME `<title>`
 * node - ten concurrent writers of one global, all converging on whichever effect happened to
 * commit last in mount order. Every readout showed that one value, identical top to bottom
 * (confirmed live, screenshotted: `sweep-tail-mx-document-pane-structure-title--return-matrix.png`).
 * Ten concurrent observers of one global cannot show ten states; that is not a bug in the
 * component, it is a bug in demonstrating a singleton ten times over.
 *
 * The fix is not a wider fixture, it is fewer live mounts: only ONE row's component is ever
 * mounted, chosen by clicking it. The other nine show the value the source (quoted in this page's
 * own docblock) says they WOULD produce, as plain labeled text, not a live reading - the two are
 * visually distinct (`(live)` vs `(expected)`) so nobody mistakes a prediction for a measurement.
 * Clicking a row mounts its component fresh (seeding its own prior title first, where the branch
 * being shown depends on one, exactly as the standalone story above it does), so activation order
 * never leaks between rows.
 *
 * Falsifiable prediction: activating any row shows that row's `expected` string, verbatim, in its
 * `TabTitleReadout`, AND the actual browser tab title changes to match (visible in a real
 * browser's tab strip, not just this canvas - `document.title` really is being set). Activating a
 * second row after the first replaces both the readout and the tab title with the second row's
 * value; nothing from the first row lingers, because only one component tree exists at a time.
 */
interface MatrixRowDef {
  label: string
  /** The literal string `document.title` should read once this row is the active, live mount. */
  expected: string
  // Takes the real article schemaType as a plain argument rather than calling
  // `useArticleSchemaType()` itself: `MatrixRow` below only invokes `render()` inside its
  // conditional `active` branch, and a component instance that sometimes calls a hook and
  // sometimes doesn't (depending on which row is active) breaks the rules of hooks. Resolving it
  // once, unconditionally, in `ReturnMatrix`'s `Demo` and threading it down as data avoids that.
  render: (articleSchemaType: ObjectSchemaType) => React.ReactNode
}

const MATRIX_ROWS: MatrixRowDef[] = [
  {
    label: 'StructureTitle: resolvedPanes is empty (untouched, not shown here)',
    expected: 'Whatever the browser tab said before',
    render: () => (
      <WithStructureContext title={BASE_TITLE}>
        <SeedPriorTitle value="Whatever the browser tab said before" />
        <StructureTitle resolvedPanes={[]} />
      </WithStructureContext>
    ),
  },
  {
    label: 'StructureTitle: last pane is LOADING_PANE',
    expected: BASE_TITLE,
    render: () => (
      <WithStructureContext title={BASE_TITLE}>
        <StructureTitle resolvedPanes={[LOADING_PANE]} />
      </WithStructureContext>
    ),
  },
  {
    label: 'StructureTitle: leaf is a list pane',
    expected: `Articles | ${BASE_TITLE}`,
    render: () => (
      <WithStructureContext title={BASE_TITLE}>
        <StructureTitle resolvedPanes={[contentListPane, documentListPane('Articles')]} />
      </WithStructureContext>
    ),
  },
  {
    label: 'StructureTitle: leaf is a document pane with a static title',
    expected: `Edit Article | ${BASE_TITLE}`,
    render: () => (
      <WithStructureContext title={BASE_TITLE}>
        <StructureTitle
          resolvedPanes={[
            contentListPane,
            documentListPane('Articles'),
            staticTitledDocumentPane('article-onboarding', 'Edit Article'),
          ]}
        />
      </WithStructureContext>
    ),
  },
  {
    label: 'DocumentTitle: still loading (ready=false), previous title persists',
    expected: `Incident Postmortem Template | ${BASE_TITLE}`,
    render: (articleSchemaType) => (
      <WithStructureContext title={BASE_TITLE}>
        <SeedPriorTitle value={`Incident Postmortem Template | ${BASE_TITLE}`} />
        <DocumentTitle
          isDeleted={false}
          displayed={fixtureArticle(ARTICLE_TITLED_ID)}
          ready={false}
          schemaType={articleSchemaType}
        />
      </WithStructureContext>
    ),
  },
  {
    label: 'DocumentTitle: new, unsaved document',
    expected: `New Article | ${BASE_TITLE}`,
    render: () => (
      <WithStructureContext title={BASE_TITLE}>
        <DocumentTitle
          isDeleted={false}
          displayed={{_id: 'article-unwritten', _type: 'article'}}
          ready
          schemaType={{title: 'Article', name: 'article'} as ObjectSchemaType}
        />
      </WithStructureContext>
    ),
  },
  {
    label: 'DocumentTitle: saved, blank title',
    expected: `Untitled | ${BASE_TITLE}`,
    render: (articleSchemaType) => (
      <WithStructureContext title={BASE_TITLE}>
        <DocumentTitle
          isDeleted={false}
          displayed={fixtureArticle(ARTICLE_BLANK_ID)}
          ready
          schemaType={articleSchemaType}
        />
      </WithStructureContext>
    ),
  },
  {
    // Corrected once the real schemaType fix landed (see `useArticleSchemaType`'s docblock and
    // the standalone `Titled` story above): with `schemaType={undefined}`, `useValuePreview`
    // short-circuited to `IDLE_STATE` (`useValuePreview.ts:62`) before it ever read the real
    // document, so this used to read "Untitled" regardless of the fixture's real title. Now that
    // both `Titled` and this row pass the real, compiled `article` schemaType, `expected` is the
    // fixture's actual title, and this row genuinely demonstrates "the common case" its label
    // claims - verified against the standalone `Titled` story.
    label: 'DocumentTitle: saved, titled',
    expected: `Quarterly Planning Review | ${BASE_TITLE}`,
    render: (articleSchemaType) => (
      <WithStructureContext title={BASE_TITLE}>
        <DocumentTitle
          isDeleted={false}
          displayed={fixtureArticle(ARTICLE_TITLED_ID)}
          ready
          schemaType={articleSchemaType}
        />
      </WithStructureContext>
    ),
  },
  {
    // Corrected alongside the row above: with the real schemaType AND `observeForPreview`
    // rebuilt from the overridden `observePaths` (see the `previewStore` docblock), this row now
    // genuinely throws and is genuinely caught, landing on "Untitled" for the reason the label
    // states rather than by the same `IDLE_STATE` shortcut the "saved, titled" row hit.
    label: 'DocumentTitle: preview subscription erroring (same picture as blank title)',
    expected: `Untitled | ${BASE_TITLE}`,
    render: (articleSchemaType) => (
      <WithStructureContext title={BASE_TITLE}>
        <DocumentTitle
          isDeleted={false}
          displayed={{
            _id: ARTICLE_ERROR_ID,
            _type: 'article',
            _createdAt: '2026-05-01T09:00:00Z',
          }}
          ready
          schemaType={articleSchemaType}
        />
      </WithStructureContext>
    ),
  },
  {
    label: 'DocumentTitle: deleted',
    expected: BASE_TITLE,
    render: (articleSchemaType) => (
      <WithStructureContext title={BASE_TITLE}>
        <DocumentTitle
          isDeleted
          displayed={fixtureArticle(ARTICLE_TITLED_ID)}
          ready
          schemaType={articleSchemaType}
        />
      </WithStructureContext>
    ),
  },
]

/** One row of the matrix: the active row mounts its component inside the real DOM-reading
 * `TabTitleReadout`; every other row is inert, plain text stating what it WOULD read, sourced
 * from the component logic quoted in this page's own docblock, not measured. Clicking a row
 * toggles it - clicking the active row again returns the whole matrix to all-static. */
function MatrixRow({
  def,
  active,
  onToggle,
  articleSchemaType,
}: {
  def: MatrixRowDef
  active: boolean
  onToggle: () => void
  articleSchemaType: ObjectSchemaType
}) {
  if (active) {
    return (
      <Stack gap={2}>
        <Text size={0} muted weight="medium">
          {def.label} (live - click the readout below to deactivate)
        </Text>
        <Card as="button" onClick={onToggle} radius={0} style={{textAlign: 'left'}} tone="positive">
          <TabTitleReadout>{def.render(articleSchemaType)}</TabTitleReadout>
        </Card>
      </Stack>
    )
  }
  return (
    <Stack gap={2}>
      <Text size={0} muted weight="medium">
        {def.label} (expected - click to mount live)
      </Text>
      <Card
        as="button"
        onClick={onToggle}
        border
        padding={3}
        radius={0}
        style={{textAlign: 'left'}}
      >
        <Code size={2}>{def.expected}</Code>
      </Card>
    </Stack>
  )
}

export const ReturnMatrix: Story = {
  // Enumeration story: the docs canvas is 540px and this content is 1040px tall, so
  // 500px of it sat below an unscrolled fold on the page a reviewer actually reads.
  parameters: {docs: {story: {height: '1064px'}}},
  render: () => {
    function Demo() {
      const [activeIndex, setActiveIndex] = useState<number | null>(null)
      const articleSchemaType = useArticleSchemaType()
      return (
        <Stack gap={4}>
          <Text size={1} muted>
            document.title is one global property, so only one row below can genuinely be read back
            from the DOM at a time. Click a row to mount it live; the rest show the value their
            source says they would produce.
          </Text>
          {MATRIX_ROWS.map((def, index) => (
            <MatrixRow
              // oxlint-disable-next-line no-array-index-key -- static list, order never changes
              key={index}
              def={def}
              active={activeIndex === index}
              onToggle={() => setActiveIndex((current) => (current === index ? null : index))}
              articleSchemaType={articleSchemaType}
            />
          ))}
        </Stack>
      )
    }
    return <Demo />
  },
}

const inContextResolveRootPane: StructureHarnessProps['resolveRootPane'] = (S) =>
  S.document()
    .id(ARTICLE_TITLED_ID)
    .documentId(ARTICLE_TITLED_ID)
    .schemaType('article')
    .serialize() as unknown as PaneNode

const inContextResolvePane: StructureHarnessProps['resolvePane'] = (S, id) =>
  S.document().id(id).documentId(id).schemaType('article').serialize() as unknown as PaneNode

/**
 * The REAL document pane (`lib/structureHarness.tsx`, same harness the `Document Pane` chapter's
 * own pages use), opened on a titled fixture. `DocumentTitle` is mounted inside the real
 * `DocumentPaneProvider` exactly as `DocumentPaneProvider.tsx:751` wires it, no stub of the
 * pane's own logic, only the readout below is this story's addition. Confirms the isolated
 * `DocumentTitle`/`StructureTitle` stories above match what a real studio actually puts in the
 * tab.
 */
export const InContext: Story = {
  name: 'In context, the real document pane',
  render: () => (
    <TabTitleReadout>
      <StructureHarness
        resolveRootPane={inContextResolveRootPane}
        resolvePane={inContextResolvePane}
        height={420}
      />
    </TabTitleReadout>
  ),
}
