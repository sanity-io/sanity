import {type SanityClient} from '@sanity/client'
import {type SanityDocument} from '@sanity/types'
import {Box} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {NEVER, of, throwError} from 'rxjs'
import {DocumentPaneInfoContext} from 'sanity/_singletons'

import {type DocumentPreviewStore} from '../../../../packages/sanity/src/core/preview/documentPreviewStore'
import {CrossDatasetIncomingReferenceDocumentPreview} from '../../../../packages/sanity/src/structure/components/incomingReferencesDecoration/CrossDatasetIncomingReference/CrossDatasetIncomingReferenceDocumentPreview'
import {type CrossDatasetIncomingReferenceDocument} from '../../../../packages/sanity/src/structure/components/incomingReferencesDecoration/CrossDatasetIncomingReference/getCrossDatasetIncomingReferences'
import {
  HISTORY_INSPECTOR_NAME,
  INCOMING_REFERENCES_INSPECTOR_NAME,
} from '../../../../packages/sanity/src/structure/panes/document/constants'
import {type DocumentPaneInfoContextValue} from '../../../../packages/sanity/src/structure/panes/document/DocumentPaneContext'
// Real components from their real paths (org contract: read the real thing, do not reimplement).
// `IncomingReferencesInspector` itself is never imported directly below: every story reaches it
// through `structureTool()`'s own default inspector registration (`structureTool.ts:35`), the
// same technique `ChangesInspector.stories.tsx` uses for its dispatcher.
import {IncomingReferenceDocument} from '../../../../packages/sanity/src/structure/panes/document/inspectors/incomingReferences/IncomingReferenceDocument'
import {IncomingReferencesList} from '../../../../packages/sanity/src/structure/panes/document/inspectors/incomingReferences/IncomingReferencesList'
import {structureTool} from '../../../../packages/sanity/src/structure/structureTool'
import {type PaneNode, type RouterPanes} from '../../../../packages/sanity/src/structure/types'
import {createMockPreviewUniverse} from '../../lib/mockDocumentPreviewStore'
import {WithStubPaneRouter} from '../../lib/paneRouterStub'
import {
  createStructureFixtureClient,
  StructureHarness,
  type StructureHarnessProps,
} from '../../lib/structureHarness'
import {WithStudioProviders} from '../../lib/testProvider'

/* ── Enumeration ────────────────────────────────────────────────────────────────────────────────
   `panes/document/inspectors/incomingReferences/` holds exactly 3 files (matches the brief's
   count): `IncomingReferencesInspector.tsx`, `IncomingReferencesList.tsx`,
   `IncomingReferenceDocument.tsx`, plus an `index.ts` barrel (not a component). All three
   exported components are storied on this page. Note the name COLLISION with the sibling
   decoration package: this folder has its OWN `IncomingReferencesList` and its OWN
   `IncomingReferenceDocument`, unrelated to (though partly reusing) the decoration ones covered on
   `Document Pane/Incoming References Decoration`. This inspector's `IncomingReferenceDocument`
   reuses the DECORATION package's `IncomingReferencePreview` internally; its own
   `IncomingReferencesList` reuses the decoration package's `getIncomingReferences` and
   `getCrossDatasetIncomingReferences` verbatim, so a defect in either fetch is a defect in BOTH
   surfaces, not two independent bugs (see `CrossDatasetPostProcessingFailureSwallowed` below). */

/* ── Fixture universe ──────────────────────────────────────────────────────────────────────────
   Two same-dataset referencing types (`quote`, `mention`) and one cross-dataset type (`note`, in
   a `partner` dataset), all pointing at one host article, so the inspector's grouping-by-type
   has more than one group to actually group. */

const ARTICLE_ID = 'article-populated'
const ARTICLE_EMPTY_ID = 'article-empty'

const articleSchemaTypeDef = {
  name: 'article',
  title: 'Article',
  type: 'document',
  fields: [{name: 'title', title: 'Title', type: 'string'}],
  preview: {select: {title: 'title'}},
}

const quoteSchemaTypeDef = {
  name: 'quote',
  title: 'Quote',
  type: 'document',
  fields: [
    {name: 'text', title: 'Text', type: 'string'},
    {name: 'sourceArticle', title: 'Source article', type: 'reference', to: [{type: 'article'}]},
  ],
  preview: {select: {title: 'text'}},
}

const mentionSchemaTypeDef = {
  name: 'mention',
  title: 'Mention',
  type: 'document',
  fields: [
    {name: 'note', title: 'Note', type: 'string'},
    {name: 'sourceArticle', title: 'Source article', type: 'reference', to: [{type: 'article'}]},
  ],
  preview: {select: {title: 'note'}},
}

const quoteA: SanityDocument = {
  _id: 'quote-a',
  _type: 'quote',
  _rev: 'rev-quote-a-1',
  _createdAt: '2026-06-01T09:00:00Z',
  _updatedAt: '2026-06-01T09:00:00Z',
  text: 'Planning starts in April.',
  sourceArticle: {_type: 'reference', _ref: ARTICLE_ID},
}

const mentionA: SanityDocument = {
  _id: 'mention-a',
  _type: 'mention',
  _rev: 'rev-mention-a-1',
  _createdAt: '2026-06-02T09:00:00Z',
  _updatedAt: '2026-06-02T09:00:00Z',
  note: 'Referenced in the quarterly digest.',
  sourceArticle: {_type: 'reference', _ref: ARTICLE_ID},
}

const sameDatasetFixtureDocuments = [quoteA, mentionA]

/** `getIncomingReferences`, called through this inspector, passes NO `type`, so the filter is
 * `references("<id>") ` with no `_type ==` clause: every referencing type comes back at once,
 * grouped client-side by `IncomingReferencesList` (inspector) itself. */
function resolveDocumentIdSet(groqFilter: string): string[] | undefined {
  if (groqFilter.includes(`references("${ARTICLE_ID}")`)) {
    return [quoteA._id, mentionA._id]
  }
  return []
}

const previewStore = createMockPreviewUniverse({
  documents: sameDatasetFixtureDocuments,
  resolveDocumentIdSet,
}).store

/**
 * This inspector queries BOTH sources unconditionally, regardless of whether any cross-dataset
 * type is even configured anywhere (unlike the sibling Decoration page, which only fetches
 * cross-dataset references for a `type` entry that names a `dataset`). That means every story
 * needs a client that can at least answer the cross-dataset existence check, or `getDataUrl`
 * (missing on the base mock entirely, see `getDocumentExistence` in `useReferringDocuments.ts`)
 * throws for EVERY story, not just the ones deliberately about failure. `withCrossDatasetSupport`
 * gives the DEFAULT client a genuine, successful, empty cross-dataset answer; only the stories
 * that want the cross-dataset side POPULATED or FAILING override `toResponse`/`toError`.
 */
/**
 * Mutates `base` IN PLACE, deliberately.
 *
 * The mock's `withConfig: () => mockClient` (mockSanityClient.ts:120) hands back the ORIGINAL
 * object, so a wrapped copy is discarded the moment anything calls `useClient()`, which is every
 * consumer. Returning `{...base, getDataUrl}` therefore looks correct and does nothing: the
 * component receives the unwrapped original and throws "t.getDataUrl is not a function".
 * `lib/testProvider.tsx` documents the same trap for its `live` and `getDataUrl` attachments.
 *
 * Each call needs its own `base`, since the interception is now part of that instance.
 */
function withCrossDatasetSupport(
  base: SanityClient,
  options: {existsNever?: boolean; toResponse?: unknown; toError?: Error} = {},
): SanityClient {
  const baseRequest = base.observable.request.bind(base.observable)
  Object.assign(base, {
    getDataUrl: (operation: string, path?: string) =>
      `/data/${operation}/mock-data-set/${path ?? ''}`,
  })
  Object.assign(base.observable, {
    request: (opts: {uri?: string; url?: string; tag?: string}) => {
      if (opts.tag === 'use-referring-documents.document-existence') {
        if (options.existsNever) return NEVER
        return of({omitted: []}) // both draft and published exist
      }
      if (opts.tag === 'use-referring-documents.external') {
        if (options.toError) return throwError(() => options.toError)
        return of(options.toResponse ?? {totalCount: 0, references: []})
      }
      return baseRequest(opts as never)
    },
  })
  return base
}

const client = withCrossDatasetSupport(
  createStructureFixtureClient({documents: sameDatasetFixtureDocuments}),
)

const partnerNote1: SanityDocument = {
  _id: 'note-1',
  _type: 'note',
  _rev: 'rev-note-1',
  _createdAt: '2026-06-04T09:00:00Z',
  _updatedAt: '2026-06-04T09:00:00Z',
  title: 'Cross-team mention, planning doc',
}

const crossDatasetClientWithReferences = withCrossDatasetSupport(
  createStructureFixtureClient({documents: []}),
  {
    toResponse: {
      totalCount: 1,
      references: [{projectId: 'partner-project', documentId: 'note-1', datasetName: 'partner'}],
    },
  },
)

const crossDatasetPostProcessingFailureClient = withCrossDatasetSupport(
  createStructureFixtureClient({documents: []}),
  {
    toResponse: {
      totalCount: 1,
      references: [{projectId: 'partner-project', documentId: 'note-1', datasetName: 'partner'}],
    },
  },
)

/* ── Isolated harness for `IncomingReferencesList`/`IncomingReferenceDocument` (inspector) ────
   `useDocumentPaneInfo()` throws without `DocumentPaneInfoContext`; the value is hand-built with
   only the one field this family reads (`documentId`), the same technique
   `Document Pane/Incoming References Decoration`'s `DecorationHarness` uses for the sibling
   `DocumentPaneContext`. `IncomingReferencePreview` (reused inside the row renderer) still needs
   `usePaneRouter()` for its `ChildLink`, hence `WithStubPaneRouter` alongside it. */

function InspectorListHarness({documentId = ARTICLE_ID}: {documentId?: string}) {
  const value = {documentId} as unknown as DocumentPaneInfoContextValue
  return (
    <DocumentPaneInfoContext.Provider value={value}>
      <Box style={{width: 420}}>
        <IncomingReferencesList />
      </Box>
    </DocumentPaneInfoContext.Provider>
  )
}

const meta: Meta = {
  title: 'Document Pane/Incoming References Inspector',
  parameters: {
    docs: {
      description: {
        component: [
          'One subsystem fetches from two different sources, and only one of its two surfaces ' +
            'bothers to say which kind of reference it is waiting on.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/structure/panes/document/inspectors/incomingReferences/` |',
          '| Tier | SERVICE. A document-level "who links to this" panel, opened from the pane menu, independent of any specific field |',
          '| Audit | 🔴 needs-work (`similarity`). See the loading-copy comparison below |',
          '| Patterns | `similarity` |',
          '',
          "Unlike the sibling decoration page, this panel is not scoped to a schema author's types " +
            'list; it shows every referencing document of every type. It is the header and close ' +
            'button around the list that queries and groups every document referencing the one ' +
            'currently open, same-dataset documents in one set of sections and cross-dataset ' +
            'documents in another, falling back to one shared empty message only when both ' +
            'sources are empty and settled.',
          '',
          "> **Why it matters:** this reuses the decoration package's own fetch functions " +
            'verbatim, including its uncaught cross-dataset crash and its silently emptied ' +
            'post-processing failure. Neither defect is specific to the decoration; this inspector ' +
            'calls the identical functions and inherits both.',
          '',
          '<details><summary><b>A dead branch exists in the underlying list component, and it cannot be storied.</b></summary>',
          '',
          'The module-local section renderer shows an empty-message card when it receives zero ' +
            'documents, but every section this file mounts is built only from groups that already ' +
            'have at least one document. That branch is unreachable through the real component, ' +
            'and because the section renderer is not exported, there is no way to reach it with a ' +
            'hand-built prop either, short of editing component source, which is out of scope ' +
            'here.',
          '',
          '</details>',
        ].join('\n'),
      },
    },
  },
  decorators: [
    WithStudioProviders({
      config: {
        schema: {
          name: 'storybook-incoming-refs-inspector',
          types: [articleSchemaTypeDef, quoteSchemaTypeDef, mentionSchemaTypeDef],
        },
      },
      client,
      previewStore,
    }),
    WithStubPaneRouter,
  ],
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

/* ── IncomingReferencesInspector: the panel chrome ────────────────────────────────────────────
   One return: header + `IncomingReferencesList`. Opened the same way `Document Pane/Changes
   Inspector` opens its own inspector, seeding `inspect` on a CHILD pane's router params. */

const resolveRootPane: StructureHarnessProps['resolveRootPane'] = (S) =>
  S.documentTypeList('article').serialize() as unknown as PaneNode

const resolvePane: StructureHarnessProps['resolvePane'] = (S, id) =>
  S.document().id(id).documentId(id).schemaType('article').serialize() as unknown as PaneNode

const openOnIncomingReferences: RouterPanes = [
  [{id: ARTICLE_ID, params: {inspect: INCOMING_REFERENCES_INSPECTOR_NAME}}],
]

/**
 * The real document pane, opened straight onto this inspector (confirms `HISTORY_INSPECTOR_NAME`
 * and `INCOMING_REFERENCES_INSPECTOR_NAME` are genuinely different registrations, not the same
 * inspector under two names): header reads `t('incoming-references.title')` ("Incoming
 * references"), close button wired to the pane's own `onClose`, panel populated with the two
 * same-dataset groups from the fixture universe above.
 */
export const InContext: Story = {
  name: 'In context, the real document pane',
  decorators: [
    WithStudioProviders({
      config: {
        schema: {
          name: 'storybook-incoming-refs-inspector',
          types: [articleSchemaTypeDef, quoteSchemaTypeDef, mentionSchemaTypeDef],
        },
        plugins: [structureTool()],
      },
      client,
      previewStore,
    }),
  ],
  render: () => (
    <StructureHarness
      resolveRootPane={resolveRootPane}
      resolvePane={resolvePane}
      initialPanes={openOnIncomingReferences}
      height={480}
    />
  ),
}

/** Confirms `HISTORY_INSPECTOR_NAME` really is a distinct registration from this one, referenced
 * once here so the import earns its keep rather than sitting unused. */
export const NotTheHistoryInspector: Story = {
  name: 'A different inspector name than Review changes',
  parameters: {
    docs: {
      description: {
        story: `INCOMING_REFERENCES_INSPECTOR_NAME is "${INCOMING_REFERENCES_INSPECTOR_NAME}", HISTORY_INSPECTOR_NAME is "${HISTORY_INSPECTOR_NAME}": two separately registered inspectors, opened through the identical \`inspect\` router param mechanism.`,
      },
    },
  },
  decorators: [
    WithStudioProviders({
      config: {
        schema: {
          name: 'storybook-incoming-refs-inspector',
          types: [articleSchemaTypeDef, quoteSchemaTypeDef, mentionSchemaTypeDef],
        },
        plugins: [structureTool()],
      },
      client,
      previewStore,
    }),
  ],
  render: () => (
    <StructureHarness
      resolveRootPane={resolveRootPane}
      resolvePane={resolvePane}
      initialPanes={openOnIncomingReferences}
      height={480}
    />
  ),
}

/* ── IncomingReferencesList (inspector): the two-source aggregator ───────────────────────────
   `showEmptyState` (both sources settled AND empty) → one shared card; otherwise each source
   renders its OWN loading block or its OWN set of `TypeSection`s independently. */

/** Both sources resolved, both genuinely empty: the ONE combined "No incoming references found."
 * card, not two separate empty messages. */
export const CombinedEmpty: Story = {
  render: () => <InspectorListHarness documentId={ARTICLE_EMPTY_ID} />,
}

/** The same-dataset id-set query never resolves: `LoadingBlock` reading
 * `incoming-references-input.types-loading`, "Loading documents...". Compare the WORDING with
 * `CrossDatasetLoadingDistinctCopy` below, the finding this page's docblock names. */
export const SameDatasetLoading: Story = {
  decorators: [
    WithStudioProviders({
      config: {
        schema: {
          name: 'storybook-incoming-refs-inspector',
          types: [articleSchemaTypeDef, quoteSchemaTypeDef, mentionSchemaTypeDef],
        },
      },
      client,
      previewStore: {
        ...previewStore,
        unstable_observeDocumentIdSet: () => NEVER,
      } as unknown as DocumentPreviewStore,
    }),
    WithStubPaneRouter,
  ],
  render: () => <InspectorListHarness />,
}

/** The cross-dataset existence check never resolves: `LoadingBlock` reading
 * `incoming-references-input.types-loading-cross-dataset`, "Loading cross dataset documents...",
 * DIFFERENT copy from `SameDatasetLoading` above for what is, to the person waiting, the
 * identical situation (a list that has not answered yet). */
export const CrossDatasetLoadingDistinctCopy: Story = {
  decorators: [
    WithStudioProviders({
      config: {
        schema: {
          name: 'x',
          types: [
            {
              name: 'note',
              type: 'document',
              fields: [{name: 'title', title: 'Title', type: 'string'}],
            },
          ],
        },
      },
      client: withCrossDatasetSupport(createStructureFixtureClient({documents: []}), {
        existsNever: true,
      }),
      previewStore: createMockPreviewUniverse({documents: []}).store,
    }),
    WithStubPaneRouter,
  ],
  render: () => <InspectorListHarness documentId={ARTICLE_EMPTY_ID} />,
}

/** Two same-dataset types (`quote`, `mention`) both populated: two `TypeSection`s, each with its
 * own title and its own `CommandList`, under one panel. */
export const PopulatedSameDatasetTypes: Story = {
  render: () => <InspectorListHarness />,
}

/** Cross-dataset references populated, same-dataset empty: the panel shows the combined-empty
 * card is NOT shown (one source has content), and only the cross-dataset `TypeSection` renders. */
export const PopulatedCrossDatasetOnly: Story = {
  decorators: [
    WithStudioProviders({
      config: {
        schema: {
          name: 'x',
          types: [
            {
              name: 'note',
              type: 'document',
              fields: [{name: 'title', title: 'Title', type: 'string'}],
            },
          ],
        },
      },
      client: crossDatasetClientWithReferences,
      // No `resolveDocumentIdSet` here: this store's own `unstable_observeDocumentIdSet` default
      // (`[]` for any filter) is exactly the "same-dataset side genuinely empty" state this story
      // wants, leaving only the cross-dataset side, seeded via the client above, populated.
      previewStore: createMockPreviewUniverse({documents: [partnerNote1]}).store,
    }),
    WithStubPaneRouter,
  ],
  render: () => <InspectorListHarness documentId={ARTICLE_EMPTY_ID} />,
}

/**
 * **Reproduces the sibling page's finding, in this surface too.** One cross-dataset reference
 * really exists and really came back from the API; resolving its preview then fails
 * (`documentPreviewStore.observePaths` throws for this one id). `getCrossDatasetIncomingReferences`'s
 * `catchError` catches it (it wraps the post-processing pipeline, not the fetch itself, see the
 * sibling `Incoming References Decoration` page for the full trace), and the panel quietly shows
 * zero cross-dataset rows, the same picture `CombinedEmpty` shows for a document with nothing
 * pointing at it at all.
 */
export const CrossDatasetPostProcessingFailureSwallowed: Story = {
  tags: ['variant:current'],
  decorators: [
    WithStudioProviders({
      config: {
        schema: {
          name: 'x',
          types: [
            {
              name: 'note',
              type: 'document',
              fields: [{name: 'title', title: 'Title', type: 'string'}],
            },
          ],
        },
      },
      client: crossDatasetPostProcessingFailureClient,
      previewStore: {
        ...createMockPreviewUniverse({documents: [partnerNote1]}).store,
        observePaths: () => throwError(() => new Error('Preview subscription lost the connection')),
      },
    }),
    WithStubPaneRouter,
  ],
  render: () => <InspectorListHarness documentId={ARTICLE_EMPTY_ID} />,
}

/* ── IncomingReferenceDocument (inspector): one row, handed its input directly ────────────────
   A RENDERER: `document`/`referenceToId` are plain props. Two returns: `!schemaType` → a
   visible red-tone card (`incoming-references-pane.schema-type-not-found`, a DIFFERENT i18n key
   from the decoration package's `incoming-references-input.schema-type-not-found`, though the
   English copy reads identically: two independently-translatable strings for the same failure);
   else a fade-in `Card` wrapping the shared `IncomingReferencePreview`. */

export const IncomingReferenceDocumentSchemaTypeNotFound: Story = {
  render: () => (
    <Box style={{width: 360}}>
      <IncomingReferenceDocument
        document={{...quoteA, _type: 'unregistered-type'}}
        referenceToId={ARTICLE_ID}
      />
    </Box>
  ),
}

export const IncomingReferenceDocumentDefault: Story = {
  render: () => (
    <Box style={{width: 360}}>
      <IncomingReferenceDocument document={quoteA} referenceToId={ARTICLE_ID} />
    </Box>
  ),
}

/* ── CrossDatasetIncomingReferenceDocumentPreview, reused here without a `type` prop ─────────
   Already covered on the sibling Decoration page in both its `studioUrl` branches; mounted once
   more here to confirm the inspector's own call site (`IncomingReferencesList.tsx`'s
   `renderCrossDatasetItem`) passes NO `type` at all, the un-configured-preview shape
   `getCrossDatasetIncomingReferences` builds when the caller has no per-type config to give it. */

const crossDatasetDocNoType: CrossDatasetIncomingReferenceDocument = {
  id: 'note-1',
  type: 'note',
  availability: {available: true, reason: 'READABLE'},
  preview: {
    published: {
      title: 'Document Id: note-1',
      subtitle: 'Dataset: partner - Project Id: partner-project',
    },
  },
  projectId: 'partner-project',
  dataset: 'partner',
}

/** No `type` configured for this call site: title/subtitle fall back to the raw id and
 * "Dataset: X - Project Id: Y" wording, per `getCrossDatasetIncomingReferences`'s own
 * un-configured branch, rather than a resolved document preview. */
export const CrossDatasetRowWithoutTypeConfig: Story = {
  render: () => (
    <Box style={{width: 360}}>
      <CrossDatasetIncomingReferenceDocumentPreview document={crossDatasetDocNoType} />
    </Box>
  ),
}
