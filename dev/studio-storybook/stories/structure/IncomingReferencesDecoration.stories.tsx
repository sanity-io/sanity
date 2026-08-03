import {type SanityClient} from '@sanity/client'
import {type ObjectSchemaType, type SanityDocument} from '@sanity/types'
import {Box, Card, Menu, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {Component, type ReactNode, useMemo} from 'react'
import {NEVER, of, throwError} from 'rxjs'
import {DocumentPaneContext} from 'sanity/_singletons'

import {type ObjectMember} from '../../../../packages/sanity/src/core/form/store/types/members'
import {type ObjectRenderMembersCallback} from '../../../../packages/sanity/src/core/form/store/types/nodes'
import {ReferenceInputOptionsProvider} from '../../../../packages/sanity/src/core/form/studio/contexts/ReferenceInputOptions'
import {type RenderPreviewCallback} from '../../../../packages/sanity/src/core/form/types/renderCallback'
import {useSchema} from '../../../../packages/sanity/src/core/hooks/useSchema'
import {Preview} from '../../../../packages/sanity/src/core/preview/components/Preview'
import {type DocumentPreviewStore} from '../../../../packages/sanity/src/core/preview/documentPreviewStore'
import {type TemplatePermissionsResult} from '../../../../packages/sanity/src/core/store/grants/templatePermissions'
// Real components from their real paths (org contract: read the real thing, do not reimplement).
import {AddIncomingReference} from '../../../../packages/sanity/src/structure/components/incomingReferencesDecoration/AddIncomingReference'
import {CreateNewIncomingReference} from '../../../../packages/sanity/src/structure/components/incomingReferencesDecoration/CreateNewIncomingReference'
import {CrossDatasetIncomingReferenceDocumentPreview} from '../../../../packages/sanity/src/structure/components/incomingReferencesDecoration/CrossDatasetIncomingReference/CrossDatasetIncomingReferenceDocumentPreview'
import {CrossDatasetIncomingReferenceType} from '../../../../packages/sanity/src/structure/components/incomingReferencesDecoration/CrossDatasetIncomingReference/CrossDatasetIncomingReferenceType'
import {type CrossDatasetIncomingReferenceDocument} from '../../../../packages/sanity/src/structure/components/incomingReferencesDecoration/CrossDatasetIncomingReference/getCrossDatasetIncomingReferences'
import {defineIncomingReferenceDecoration} from '../../../../packages/sanity/src/structure/components/incomingReferencesDecoration/defineIncomingReferenceDecoration'
import {IncomingReferenceDocument} from '../../../../packages/sanity/src/structure/components/incomingReferencesDecoration/IncomingReferenceDocument'
import {IncomingReferenceDocumentActions} from '../../../../packages/sanity/src/structure/components/incomingReferencesDecoration/IncomingReferenceDocumentActions'
import {IncomingReferencePreview} from '../../../../packages/sanity/src/structure/components/incomingReferencesDecoration/IncomingReferencePreview'
import {IncomingReferencesDecoration} from '../../../../packages/sanity/src/structure/components/incomingReferencesDecoration/IncomingReferencesDecoration'
import {LinkToExistingPreview} from '../../../../packages/sanity/src/structure/components/incomingReferencesDecoration/LinkToExistingPreview'
import {
  type CrossDatasetIncomingReference,
  type IncomingReferenceType,
} from '../../../../packages/sanity/src/structure/components/incomingReferencesDecoration/types'
import {type DocumentPaneContextValue} from '../../../../packages/sanity/src/structure/panes/document/DocumentPaneContext'
import {structureTool} from '../../../../packages/sanity/src/structure/structureTool'
import {type PaneNode} from '../../../../packages/sanity/src/structure/types'
import {createMockPreviewUniverse} from '../../lib/mockDocumentPreviewStore'
import {WithStubPaneRouter} from '../../lib/paneRouterStub'
import {
  createStructureFixtureClient,
  StructureHarness,
  type StructureHarnessProps,
} from '../../lib/structureHarness'
import {FormStub, WithStudioProviders} from '../../lib/testProvider'

/* ── Enumeration, against the team lead's count ───────────────────────────────────────────────
   `components/incomingReferencesDecoration/` holds 14 direct files, not 9, but the brief's "about
   9 unstoried" reading is CORRECT once scoped to components: 5 of those 14 are not components at
   all (`defineIncomingReferenceDecoration.tsx` is a factory function, `getIncomingReferences.tsx`
   an observable factory, `isIncomingReferenceCreation.ts` a pure predicate, `shared.ts` a styled
   constant, `types.ts` types only). The remaining 9 are exactly the components named: AddIncomingReference,
   CreateNewIncomingReference, IncomingReferenceDocument, IncomingReferenceDocumentActions,
   IncomingReferencePreview, IncomingReferencesDecoration, IncomingReferencesList,
   IncomingReferencesType, LinkToExistingPreview. The `CrossDatasetIncomingReference/` subfolder
   likewise holds 3 files matching the brief's "2 components": `CrossDatasetIncomingReferenceType`
   and `CrossDatasetIncomingReferenceDocumentPreview` are components, `getCrossDatasetIncomingReferences`
   is an observable factory. Eleven storyable exported components total; this page covers all eleven. */

/* ── Fixture universe: same-dataset ───────────────────────────────────────────────────────────
   One document type ('article') that a decoration would be attached to, one referencing type
   ('quote') carrying a real `reference` field, so `getReferencePaths` has genuine paths to find. */

const ARTICLE_ID = 'article-populated'
const ARTICLE_EMPTY_ID = 'article-empty'
const ARTICLE_LOADING_ID = 'article-loading'

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

const quoteA: SanityDocument = {
  _id: 'quote-a',
  _type: 'quote',
  _rev: 'rev-quote-a-1',
  _createdAt: '2026-06-01T09:00:00Z',
  _updatedAt: '2026-06-01T09:00:00Z',
  text: 'Planning starts in April.',
  sourceArticle: {_type: 'reference', _ref: ARTICLE_ID},
}

const quoteB: SanityDocument = {
  _id: 'quote-b',
  _type: 'quote',
  _rev: 'rev-quote-b-1',
  _createdAt: '2026-06-02T09:00:00Z',
  _updatedAt: '2026-06-02T09:00:00Z',
  text: 'The wrap-up is scheduled for June.',
  sourceArticle: {_type: 'reference', _ref: ARTICLE_ID},
}

/**
 * Included in a host document's resolved id set (see `resolveDocumentIdSet` below) without
 * actually carrying a `sourceArticle` value that resolves back to that host. `IncomingReferenceDocument`'s
 * own comment names this exact situation: "when the document has been recently linked ... the
 * value we get in the listener is not the latest [snapshot]". `getReferencePaths` finds nothing,
 * so this fixture reaches the OPTIMISTIC PLACEHOLDER row for real, not by mocking a boolean.
 */
const quotePending: SanityDocument = {
  _id: 'quote-pending',
  _type: 'quote',
  _rev: 'rev-quote-pending-1',
  _createdAt: '2026-06-03T09:00:00Z',
  _updatedAt: '2026-06-03T09:00:00Z',
  text: 'Just linked, not caught up with the listener yet.',
}

const articleFixtureDocuments = [quoteA, quoteB, quotePending]

/**
 * `getIncomingReferences` queries the PREVIEW STORE (`unstable_observeDocumentIdSet`), not the
 * client, so the seam this family's data availability hangs on is `resolveDocumentIdSet`, the
 * same one the release document table uses (see `lib/mockDocumentPreviewStore.ts`'s own docblock).
 */
function resolveDocumentIdSet(groqFilter: string): string[] | undefined {
  if (groqFilter.includes(`references("${ARTICLE_ID}")`)) {
    return [quoteA._id, quoteB._id]
  }
  return []
}

const previewStore = createMockPreviewUniverse({
  documents: articleFixtureDocuments,
  resolveDocumentIdSet,
}).store

/** A store that never resolves the id-set query, for the `Loading` story. Every other read
 * (previews, availability) is real, only the one query this family's loading state depends on
 * is held open, mirroring `DocumentHeaderTitle.stories.tsx`'s one-method override technique. */
const neverResolvingPreviewStore: DocumentPreviewStore = {
  ...previewStore,
  unstable_observeDocumentIdSet: () => NEVER,
}

const client = createStructureFixtureClient({documents: articleFixtureDocuments})

const providers = WithStudioProviders({
  config: {
    schema: {name: 'storybook-incoming-refs', types: [articleSchemaTypeDef, quoteSchemaTypeDef]},
  },
  client,
  previewStore,
})

const loadingProviders = WithStudioProviders({
  config: {
    schema: {name: 'storybook-incoming-refs', types: [articleSchemaTypeDef, quoteSchemaTypeDef]},
  },
  client,
  previewStore: neverResolvingPreviewStore,
})

/* ── Isolated harness ──────────────────────────────────────────────────────────────────────────
   `IncomingReferencesList`/`IncomingReferencesType` read `useDocumentPane()` for exactly two
   things (`documentId`/`documentType`, `displayed`, `editState`), and `IncomingReferencePreview`/
   `CreateNewIncomingReference` read `usePaneRouter()` for pure navigation (`ChildLink`, `navigate`).
   Per `DocumentHeaderTitle.stories.tsx`'s technique, the pane context value is hand-built field by
   field rather than routed through a full document pane, and `lib/paneRouterStub.tsx`'s
   `WithStubPaneRouter` supplies the navigation-only pane router context its own docblock says it
   is for. Neither hook throws on a partial value; only the fields actually read matter. */

interface DecorationHostFixture {
  displayedId?: string
  editState?: {published?: SanityDocument | null; draft?: SanityDocument | null} | null
}

function DecorationHarness(
  props: DecorationHostFixture & {
    types: (IncomingReferenceType | CrossDatasetIncomingReference)[]
    onLinkDocument?: (
      document: SanityDocument,
      reference: {_type: 'reference'; _ref: string},
    ) => SanityDocument | false
    creationAllowed?: boolean
    withDescription?: boolean
  },
) {
  const {
    displayedId = ARTICLE_ID,
    editState = {published: {_id: displayedId ?? ARTICLE_ID, _type: 'article'} as SanityDocument},
    types,
    onLinkDocument,
    creationAllowed = true,
    withDescription = true,
  } = props

  const documentPaneValue = useMemo(
    () => ({
      documentId: displayedId,
      documentType: 'article',
      displayed: {_id: displayedId, _type: 'article'},
      editState,
    }),
    [displayedId, editState],
  )

  return (
    <DocumentPaneContext.Provider
      // oxlint-disable-next-line no-unsafe-type-assertion -- narrow by design, see documentPaneStub.tsx
      value={documentPaneValue as unknown as DocumentPaneContextValue}
    >
      <Box style={{width: 420}}>
        <IncomingReferencesDecoration
          name="incomingReferences"
          title="Incoming references"
          description={withDescription ? 'Articles and quotes that link back here.' : undefined}
          types={types}
          onLinkDocument={onLinkDocument}
          creationAllowed={creationAllowed}
        />
      </Box>
    </DocumentPaneContext.Provider>
  )
}

const meta: Meta = {
  title: 'Document Pane/Incoming References Decoration',
  parameters: {
    docs: {
      description: {
        component: [
          'This panel says which documents point back here, not how many: there is no total ' +
            'count anywhere in this family, only the resolved list itself.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/structure/components/incomingReferencesDecoration/` |',
          '| Tier | SERVICE. This tells an editor who else already points at the document they have open; it enriches the edit, it is not the act of editing |',
          '| Audit | 🔴 needs-work (`error-states`). See `CrossDatasetSourceFetchFailureCrashes` below |',
          '| Patterns | `error-states` · `empty-states` |',
          '',
          'This is the "who links to this" panel a document type opts into by declaring it in its ' +
            'own render configuration. It is not an inspector, that is the sibling Incoming ' +
            'References Inspector page: this is a decoration inserted directly into the document ' +
            'form, next to the fields, scoped to whatever types the schema author names.',
          '',
          'The list itself is capped at 100 for the search-and-link autocomplete, uncapped and ' +
            'un-numbered for the incoming list. A cross-dataset reference names its own dataset, ' +
            'but only when the schema author supplies a title or preview for it.',
          '',
          '> **Why it matters:** two different fetch failures inside the same subsystem produce ' +
            'two different outcomes. A same-dataset fetch failure renders the honest empty state, ' +
            'correctly caught. A cross-dataset fetch failure that is not a not-found response is ' +
            'left uncaught and crashes the pane.',
          '',
          'Most stories below hand-build the document pane and pane router context values ' +
            'directly, the same technique the header title page uses, because the only real ' +
            'dependency is a handful of fields off two contexts, not a whole resolved pane. The ' +
            'in-real-form story at the very end is the one exception: it mounts the real document ' +
            'pane with the decoration actually wired on the schema, to confirm the isolated harness ' +
            'above matches what the real configuration produces end to end.',
        ].join('\n'),
      },
    },
  },
  decorators: [providers, WithStubPaneRouter],
  tags: [
    'autodocs',
    'chapter:cms',
    'pattern:error-states',
    'pattern:empty-states',
    'audit:needs-work',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj

/* ── IncomingReferencesDecoration: the field-level wrapper ───────────────────────────────────
   One return: a label (`title` or `startCase(name)`), an optional description, then the list. */

/** The label, the description, and a populated list beneath: the common case an editor sees. */
export const Decoration: Story = {
  render: () => <DecorationHarness types={[{type: 'quote'}]} />,
}

/** Same decoration, no `description` configured. The label row alone, no muted line beneath it. */
export const DecorationWithoutDescription: Story = {
  render: () => <DecorationHarness types={[{type: 'quote'}]} withDescription={false} />,
}

/* ── IncomingReferencesList: dispatches same-dataset vs cross-dataset per type ────────────────
   Two returns: `!types || types.length === 0` → a critical-tone card; otherwise a map over
   `types`, routing each to `CrossDatasetIncomingReferenceType` or `IncomingReferencesType` via
   `isCrossDatasetIncomingReference` (`Boolean(type.dataset)`). */

/** `types: []`, the schema author configured the decoration with nothing to show. */
export const NoTypesConfigured: Story = {
  tags: ['variant:current'],
  render: () => <DecorationHarness types={[]} />,
}

/**
 * `types: [{type: 'quote'}, {type: 'note', dataset: 'partner', ...}]`, both populated.
 * `shouldRenderTitle` is `types.length > 1`, so BOTH sections carry their own per-type title,
 * unlike the single-type stories elsewhere on this page which render no title at all.
 */
export const MixedSameAndCrossDataset: Story = {
  decorators: [
    WithStudioProviders({
      config: {
        schema: {
          name: 'storybook-incoming-refs',
          types: [articleSchemaTypeDef, quoteSchemaTypeDef],
        },
      },
      client: crossDatasetOkClientWithReferences(),
      previewStore,
    }),
    WithStubPaneRouter,
  ],
  render: () => (
    <DecorationHarness
      types={[
        {type: 'quote', title: 'Quotes'},
        {
          type: 'note',
          dataset: 'partner',
          title: 'Partner notes',
          preview: {select: {title: 'title'}},
          studioUrl: (doc) => `https://partner.example.com/studio/note;${doc.id}`,
        } as CrossDatasetIncomingReference,
      ]}
    />
  ),
}

/* ── IncomingReferencesType: the workhorse, one type's same-dataset list ──────────────────────
   Five appearances, top to bottom in source:
   1. `if (!schemaType) return null` (L175)
   2. `if (loading) return <LoadingBlock .../>` (L176-178)
   3. documents.length > 0 → populated `CommandList` (L189-206)
   4. else → "no items" muted `Flex` (L207-219)
   5. footer: `onLinkDocument` set → ghost "Add item" button; else → `CreateNewIncomingReference`
   `newReferenceId` (optimistic placeholder) and `isAdding` (inline search) are both LOCAL state
   set only from click handlers; they are real, reachable states but not fixture-seedable without
   an interaction, so they are not stored here (see `AddIncomingReference`'s own page for the
   search UI in isolation). */

/**
 * A `types` entry naming a schema type that does not exist (`{type: 'ghost-quote'}`). Renders
 * NOTHING: `if (!schemaType) return null`, no error text, no visual trace that a `types` entry
 * was misconfigured. Compare with `IncomingReferenceDocumentSchemaTypeNotFound` below, where the
 * SAME kind of lookup miss, one level down, DOES show a visible red error card.
 */
export const SchemaTypeNotFound: Story = {
  tags: ['variant:current'],
  render: () => <DecorationHarness types={[{type: 'ghost-quote'}]} />,
}

/** The id-set query never resolves. `LoadingBlock` with "Loading documents...", distinguishable
 * from the empty state below by its icon and text, not merely by the absence of rows. */
export const Loading: Story = {
  decorators: [loadingProviders, WithStubPaneRouter],
  render: () => <DecorationHarness displayedId={ARTICLE_LOADING_ID} types={[{type: 'quote'}]} />,
}

/** Zero linked quotes, `onLinkDocument` provided: "No items", and a ghost "Add item" button below
 * the card that opens the inline search (`AddIncomingReference`) rather than creating outright. */
export const EmptyWithLinkCallback: Story = {
  render: () => (
    <DecorationHarness
      displayedId={ARTICLE_EMPTY_ID}
      types={[{type: 'quote'}]}
      onLinkDocument={(document, reference) => ({...document, sourceArticle: reference})}
    />
  ),
}

/** Same empty state, no `onLinkDocument`: the footer is `CreateNewIncomingReference` directly, no
 * ghost button, no search step. Two different empty-list footers for the same "nothing yet". */
export const EmptyCreationOnly: Story = {
  render: () => <DecorationHarness displayedId={ARTICLE_EMPTY_ID} types={[{type: 'quote'}]} />,
}

/** Two linked quotes, resolved through the real preview pipeline, each a real `ChildLink` to its
 * document. This is also `IncomingReferenceDocument`'s and `IncomingReferencePreview`'s real
 * in-context appearance (see their own dedicated pages below for the same components in isolation). */
export const Populated: Story = {
  render: () => <DecorationHarness types={[{type: 'quote'}]} />,
}

/* ── CrossDatasetIncomingReferenceType ─────────────────────────────────────────────────────────
   Three appearances: `!schemaType` → null; `loading` → the SAME `LoadingBlock` text as the
   same-dataset type above (no "cross dataset" wording here, unlike the Inspector's own list,
   see that page); else a populated `CommandList` or the same "no items" text. Two FAILURE
   states below are the headline finding on this page. */

function makeCrossDatasetClient(options: {
  /** Hang the existence check forever, for the loading story. */
  existsNever?: boolean
  existsResponse?: {omitted: {id: string; reason: string}[]}
  toResponse?: unknown
  toError?: Error
}): SanityClient {
  const base = createStructureFixtureClient({documents: []})
  // Mutate IN PLACE. The mock's `withConfig: () => mockClient` (mockSanityClient.ts:120) returns
  // the ORIGINAL object, so a spread copy is discarded the moment anything calls `useClient()`,
  // which is every consumer. The copy looks right and does nothing: the component gets the
  // unwrapped original and throws "t.getDataUrl is not a function".
  const baseRequest = base.observable.request.bind(base.observable)
  Object.assign(base, {
    // `getDocumentExistence` calls this synchronously; the base mock does not implement it at all.
    getDataUrl: (operation: string, path?: string) =>
      `/data/${operation}/mock-data-set/${path ?? ''}`,
  })
  Object.assign(base.observable, {
    request: (opts: {uri?: string; url?: string; tag?: string}) => {
      if (opts.tag === 'use-referring-documents.document-existence') {
        if (options.existsNever) return NEVER
        // Both draft and published exist by default (`omitted: []`), so the existence check
        // resolves to a real id and the flow proceeds to the `/to` reference lookup below.
        return of(options.existsResponse ?? {omitted: []})
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

function crossDatasetOkClientWithReferences(): SanityClient {
  return makeCrossDatasetClient({
    toResponse: {
      totalCount: 2,
      references: [
        {projectId: 'partner-project', documentId: 'note-1', datasetName: 'partner'},
        {projectId: 'partner-project', documentId: 'note-2', datasetName: 'partner'},
      ],
    },
  })
}

const crossDatasetTypeConfig: CrossDatasetIncomingReference = {
  type: 'note',
  dataset: 'partner',
  title: 'Partner note',
  preview: {select: {title: 'title'}},
}

/** The referenced type is not in THIS studio's schema (`schema.get(type.type)` looks up the
 * LOCAL schema even for a cross-dataset type). Renders nothing, same silent-empty shape as the
 * same-dataset `SchemaTypeNotFound` above. */
export const CrossDatasetSchemaTypeNotFound: Story = {
  decorators: [
    WithStudioProviders({config: {}, client: makeCrossDatasetClient({})}),
    WithStubPaneRouter,
  ],
  render: () => (
    <CrossDatasetIncomingReferenceType
      type={{...crossDatasetTypeConfig, type: 'ghost-note'}}
      referenced={{id: ARTICLE_ID, type: 'article'}}
      shouldRenderTitle={false}
    />
  ),
}

/**
 * A hard-won distinction, worth stating plainly since it is not obvious from either direction:
 * a bare `{name: 'note', type: 'document', fields: []}` object is fine as a PROP LITERAL (see
 * `AddIncomingReferenceDefault` below, and `ReferenceInputInternals.stories.tsx`'s
 * `EmptyAutocompletePopover`, both cast straight to `ObjectSchemaType` and never touched by a
 * schema compiler) but the IDENTICAL literal placed inside `config.schema.types` here throws at
 * workspace-build time: `createSchema` (`core/schema/createSchema.ts:19-21`) runs it through the
 * real `@sanity/schema` validator, which reports "Object should have at least one field" as an
 * ERROR-severity problem (confirmed by calling `validateSchema`/`groupProblems` directly), and
 * `prepareConfig.tsx:367` throws `new SchemaError(schema)` the moment any error-severity problem
 * exists. Every `note` type below carries a real field for exactly this reason.
 */

/** `loading` true: identical `LoadingBlock` copy to the same-dataset list, "Loading documents...",
 * no distinguishing "cross dataset" wording (contrast with the Inspector panel, which does have
 * dedicated copy for this same wait, `incoming-references-input.types-loading-cross-dataset`). */
export const CrossDatasetLoading: Story = {
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
      client: makeCrossDatasetClient({existsNever: true}),
      previewStore,
    }),
    WithStubPaneRouter,
  ],
  render: () => (
    <CrossDatasetIncomingReferenceType
      type={crossDatasetTypeConfig}
      referenced={{id: ARTICLE_ID, type: 'article'}}
      shouldRenderTitle={false}
    />
  ),
}

/** A genuinely empty, successful response: zero cross-dataset references, "No items", the
 * legitimate honest-zero state (not a failure). */
export const CrossDatasetEmpty: Story = {
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
      client: makeCrossDatasetClient({}),
      previewStore,
    }),
    WithStubPaneRouter,
  ],
  render: () => (
    <CrossDatasetIncomingReferenceType
      type={crossDatasetTypeConfig}
      referenced={{id: ARTICLE_ID, type: 'article'}}
      shouldRenderTitle={false}
    />
  ),
}

const partnerNote1: SanityDocument = {
  _id: 'note-1',
  _type: 'note',
  _rev: 'rev-note-1',
  _createdAt: '2026-06-04T09:00:00Z',
  _updatedAt: '2026-06-04T09:00:00Z',
  title: 'Cross-team mention, planning doc',
}
const partnerNote2: SanityDocument = {
  _id: 'note-2',
  _type: 'note',
  _rev: 'rev-note-2',
  _createdAt: '2026-06-05T09:00:00Z',
  _updatedAt: '2026-06-05T09:00:00Z',
  title: 'Follow-up thread',
}

/** Two references resolved from the partner dataset. `studioUrl` is configured, so each row is a
 * real anchor to the partner studio (see `CrossDatasetIncomingReferenceDocumentPreviewWithLink`
 * for this exact row in isolation, with the anchor-vs-plain-card contrast). */
export const CrossDatasetPopulated: Story = {
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
      client: crossDatasetOkClientWithReferences(),
      previewStore: createMockPreviewUniverse({documents: [partnerNote1, partnerNote2]}).store,
    }),
    WithStubPaneRouter,
  ],
  render: () => (
    <CrossDatasetIncomingReferenceType
      type={{
        ...crossDatasetTypeConfig,
        studioUrl: (doc) => `https://partner.example.com/studio/note;${doc.id}`,
      }}
      referenced={{id: ARTICLE_ID, type: 'article'}}
      shouldRenderTitle={false}
    />
  ),
}

/**
 * **The headline finding, part one.** `fetchCrossDatasetReferences` succeeds (two references
 * come back for real), but resolving ONE of them into a preview (`documentPreviewStore.observePaths`)
 * fails. `getCrossDatasetIncomingReferences`'s `catchError` (`getCrossDatasetIncomingReferences.tsx:154-157`)
 * DOES catch this, because it wraps the post-processing pipeline that runs on an already-successful
 * fetch. The whole list quietly degrades to zero rows, identical to `CrossDatasetEmpty` above: a
 * genuine fetch failure and a genuinely empty dataset render the same picture.
 */
export const CrossDatasetPostProcessingFailureSwallowed: Story = {
  tags: ['variant:current'],
  parameters: {
    docs: {
      description: {
        story:
          'Two references really exist and really came back from the API. What renders is the identical empty card `CrossDatasetEmpty` shows for a dataset with nothing in it.',
      },
    },
  },
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
      client: crossDatasetOkClientWithReferences(),
      previewStore: {
        ...createMockPreviewUniverse({documents: [partnerNote1, partnerNote2]}).store,
        observePaths: () => throwError(() => new Error('Preview subscription lost the connection')),
      } as unknown as DocumentPreviewStore,
    }),
    WithStubPaneRouter,
  ],
  render: () => (
    <CrossDatasetIncomingReferenceType
      type={crossDatasetTypeConfig}
      referenced={{id: ARTICLE_ID, type: 'article'}}
      shouldRenderTitle={false}
    />
  ),
}

class CrashBoundary extends Component<{children: ReactNode}, {error: Error | null}> {
  constructor(props: {children: ReactNode}) {
    super(props)
    this.state = {error: null}
  }
  static getDerivedStateFromError(error: Error) {
    return {error}
  }
  render() {
    if (this.state.error) {
      return (
        <Card padding={3} radius={2} tone="critical" border>
          <Text size={1} weight="medium">
            Uncaught: {this.state.error.message}
          </Text>
        </Card>
      )
    }
    return this.props.children
  }
}

/**
 * **The headline finding, part two.** The `/to` cross-dataset request itself fails with a
 * non-404 error (a real service outage, not "this reference does not exist yet"). Inside
 * `fetchCrossDatasetReferences`, only a 404 is caught (`useReferringDocuments.ts:151-156`); any
 * other error is rethrown and propagates OUT of `getCrossDatasetIncomingReferences`'s outer
 * `switchMap` boundary, UNCAUGHT: its own `catchError` (`getCrossDatasetIncomingReferences.tsx:154`)
 * sits inside a NESTED pipe on `of(referencesResult)`, which only runs once a `referencesResult`
 * has already arrived. `useObservable` rethrows stream errors during render, so this is a genuine
 * React render crash, not a graceful error card. `CrashBoundary` below is a Storybook-only
 * demonstration harness (the same technique `PaneHeaderCreateButton.stories.tsx`'s
 * `TemplateErrorBoundary` uses); without it, this crashes the whole document pane.
 */
export const CrossDatasetSourceFetchFailureCrashes: Story = {
  name: 'A non-404 fetch failure crashes the pane (not caught)',
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
      client: makeCrossDatasetClient({toError: new Error('Simulated partner API outage (503)')}),
      previewStore,
    }),
    WithStubPaneRouter,
  ],
  render: () => (
    <CrashBoundary>
      <CrossDatasetIncomingReferenceType
        type={crossDatasetTypeConfig}
        referenced={{id: ARTICLE_ID, type: 'article'}}
        shouldRenderTitle={false}
      />
    </CrashBoundary>
  ),
}

/* ── IncomingReferenceDocument (decoration package): one row, handed its input directly ──────
   A RENDERER, not a dispatcher: `document`/`referenceToId`/`actions` are plain props, so these
   fixtures are the component's own input, not a pre-decided answer. Two returns: `!schemaType`
   → a visible red `ErrorCard`; else a fade-in `Flex` with either the resolved preview or a
   placeholder, plus an optional actions menu. */

/** `document._type` names a schema type this studio does not have. UNLIKE the silent nulls
 * above, this one shows: `{t('incoming-references-input.schema-type-not-found', {type})}` in a
 * red-tone card. Same underlying failure mode, two different treatments in the same subsystem. */
export const IncomingReferenceDocumentSchemaTypeNotFound: Story = {
  render: () => (
    <Box style={{width: 360}}>
      <IncomingReferenceDocument
        document={{...quoteA, _type: 'unregistered-type'}}
        referenceToId={ARTICLE_ID}
        actions={[]}
      />
    </Box>
  ),
}

/** A real resolved reference path: the ordinary case, a clickable preview card. */
export const IncomingReferenceDocumentResolved: Story = {
  render: () => (
    <Box style={{width: 360}}>
      <IncomingReferenceDocument document={quoteA} referenceToId={ARTICLE_ID} actions={[]} />
    </Box>
  ),
}

/** `getReferencePaths` finds nothing (`quotePending` carries no `sourceArticle` value pointing
 * back to `referenceToId`), the exact "just linked, listener hasn't caught up" case the
 * component's own comment names. Renders `SanityDefaultPreview isPlaceholder`, not the real
 * preview and not an error. */
export const IncomingReferenceDocumentPendingPath: Story = {
  render: () => (
    <Box style={{width: 360}}>
      <IncomingReferenceDocument document={quotePending} referenceToId={ARTICLE_ID} actions={[]} />
    </Box>
  ),
}

/** `actions.length > 0`: the row grows a context-menu button (see
 * `IncomingReferenceDocumentActionsDefault` below for that menu in isolation). */
export const IncomingReferenceDocumentWithActions: Story = {
  render: () => (
    <Box style={{width: 360}}>
      <IncomingReferenceDocument
        document={quoteA}
        referenceToId={ARTICLE_ID}
        actions={[
          () => ({label: 'Unlink', tone: 'critical', onHandle: () => undefined}),
          () => ({label: 'Open in new tab', onHandle: () => undefined}),
        ]}
      />
    </Box>
  ),
}

/* ── IncomingReferencePreview: the clickable card itself, in isolation ────────────────────────
   Single return. Already exercised for real inside `Populated`/`IncomingReferenceDocumentResolved`
   above; this page mounts it alone to give it its own docs entry as an exported component. */

function useQuoteSchemaType(): ObjectSchemaType {
  const schema = useSchema()
  return schema.get('quote') as ObjectSchemaType
}

function IncomingReferencePreviewHarness() {
  const quoteType = useQuoteSchemaType()
  return (
    <Box style={{width: 320}}>
      <IncomingReferencePreview type={quoteType} value={quoteA} path={['sourceArticle']} />
    </Box>
  )
}

export const IncomingReferencePreviewDefault: Story = {
  render: () => <IncomingReferencePreviewHarness />,
}

/* ── CrossDatasetIncomingReferenceDocumentPreview, in isolation ───────────────────────────────
   Single return, one visible branch driven by `studioUrl?.(...)`: an anchor with an external-link
   affordance when the schema author configured one, a plain non-interactive card without. */

const crossDatasetDoc: CrossDatasetIncomingReferenceDocument = {
  id: 'note-1',
  type: 'note',
  availability: {available: true, reason: 'READABLE'},
  preview: {published: {title: 'Cross-team mention, planning doc'}},
  projectId: 'partner-project',
  dataset: 'partner',
}

export const CrossDatasetIncomingReferenceDocumentPreviewWithLink: Story = {
  render: () => (
    <Box style={{width: 360}}>
      <CrossDatasetIncomingReferenceDocumentPreview
        document={crossDatasetDoc}
        type={{
          ...crossDatasetTypeConfig,
          studioUrl: (doc) => `https://partner.example.com/studio/note;${doc.id}`,
        }}
      />
    </Box>
  ),
}

/** No `studioUrl` configured for this type (or no `type` at all, the un-configured-preview shape
 * `getCrossDatasetIncomingReferences` builds when `type` is omitted): a plain card, not an anchor,
 * no external-link affordance, no dataset name shown ON the row itself either (the dataset only
 * shows up as this type's OWN section title, configured by the schema author, not per-row). */
export const CrossDatasetIncomingReferenceDocumentPreviewWithoutLink: Story = {
  render: () => (
    <Box style={{width: 360}}>
      <CrossDatasetIncomingReferenceDocumentPreview
        document={crossDatasetDoc}
        type={crossDatasetTypeConfig}
      />
    </Box>
  ),
}

/* ── LinkToExistingPreview: a search-result row in the "link existing" flow ───────────────────
   Single return with a status badge branch: draft / published / release version / none. */

function LinkToExistingPreviewHarness() {
  const quoteType = useQuoteSchemaType()
  return (
    <Box style={{width: 320}}>
      <LinkToExistingPreview
        documentPreviewStore={previewStore}
        schemaType={quoteType}
        value={{_id: quoteA._id, _type: quoteA._type}}
        onLinkToDocument={() => undefined}
      />
    </Box>
  )
}

/** Reuses the file's own `providers` decorator (already seeded with the `quote` schema type),
 * rather than a one-off empty config that would leave `schema.get('quote')` resolving nothing. */
export const LinkToExistingPreviewPublished: Story = {
  render: () => <LinkToExistingPreviewHarness />,
}

/* ── AddIncomingReference: search-and-link, initial appearance ────────────────────────────────
   Its own internal search hits are typed-query state, reachable only by interaction; the initial
   render (empty query, the autocomplete input plus the create-button) is a legitimate, fixture-
   reachable state on its own and is what this page shows. */

/** `ReferenceAutocomplete` (which `AddIncomingReference` renders directly) reads `focusPath` off
 * `useFormBuilder()` (`ReferenceAutocomplete.tsx:45`), which throws "FormBuilder: missing context
 * value" without a `FormBuilderContext` ancestor. `AddIncomingReference` is not itself resolved
 * as a form member, so the full `FormBuilderHarness` is more machinery than this needs; `FormStub`
 * (`lib/testProvider.tsx`) supplies just the form-layer context, the same technique
 * `ReferenceInputInternals.stories.tsx`'s `EmptyAutocompletePopover` uses for the identical seam.
 * `documentType`'s `fields: []` below is a PROP LITERAL, never run through a schema compiler, so it
 * is safe: see the note above `CrossDatasetLoading` for why the identical literal throws when it
 * is a `config.schema.types` entry instead. */
export const AddIncomingReferenceDefault: Story = {
  render: () => (
    <FormStub
      documentValue={{_id: ARTICLE_ID, _type: 'article'}}
      documentType={{name: 'article', type: 'document', fields: []} as unknown as ObjectSchemaType}
      renderPreview={((p) => <Preview {...p} />) as RenderPreviewCallback}
      focusPath={['incomingReferences']}
    >
      <Box style={{width: 380}}>
        <AddIncomingReference
          type="quote"
          referenced={{id: ARTICLE_ID, type: 'article'}}
          onCreateNewReference={() => undefined}
          onLinkDocument={() => undefined}
          fieldName="incomingReferences"
          creationAllowed
        />
      </Box>
    </FormStub>
  ),
}

/** `creationAllowed={false}`: the grid collapses to a single column (`gap: 0`), and
 * `CreateNewIncomingReference` returns `null` for itself, so only the search box remains. */
export const AddIncomingReferenceCreationNotAllowed: Story = {
  render: () => (
    <FormStub
      documentValue={{_id: ARTICLE_ID, _type: 'article'}}
      documentType={{name: 'article', type: 'document', fields: []} as unknown as ObjectSchemaType}
      renderPreview={((p) => <Preview {...p} />) as RenderPreviewCallback}
      focusPath={['incomingReferences']}
    >
      <Box style={{width: 380}}>
        <AddIncomingReference
          type="quote"
          referenced={{id: ARTICLE_ID, type: 'article'}}
          onCreateNewReference={() => undefined}
          onLinkDocument={() => undefined}
          fieldName="incomingReferences"
          creationAllowed={false}
        />
      </Box>
    </FormStub>
  ),
}

/* ── CreateNewIncomingReference: the create-new button, in isolation ─────────────────────────
   `if (!creationAllowed) return null`; else `CreateReferenceButton` with whatever `createOptions`
   resolve from `useReferenceInputOptions().initialValueTemplateItems`, filtered by matching type. */

/** `creationAllowed={false}`: nothing renders, no placeholder, no explanation. */
export const CreateNewIncomingReferenceDisabled: Story = {
  render: () => (
    <CreateNewIncomingReference
      type="quote"
      referenceToId={ARTICLE_ID}
      referenceToType="article"
      creationAllowed={false}
      onCreateNewReference={() => undefined}
      fieldName="incomingReferences"
    />
  ),
}

/** `creationAllowed={true}`, no `ReferenceInputOptionsProvider` seeded (the context's own default
 * is `{}`, per `_singletons/context/ReferenceInputOptionsContext.ts`): `createOptions` resolves to
 * `[]`, `canCreateAny` is false, and `CreateButton` renders a DISABLED button behind an
 * insufficient-permissions tooltip, not an empty state and not a hidden affordance. */
export const CreateNewIncomingReferenceNoTemplates: Story = {
  render: () => (
    <CreateNewIncomingReference
      type="quote"
      referenceToId={ARTICLE_ID}
      referenceToType="article"
      creationAllowed
      onCreateNewReference={() => undefined}
      fieldName="incomingReferences"
    />
  ),
}

// oxlint-disable-next-line no-unsafe-type-assertion -- narrow fixture, only the fields `CreateNewIncomingReference` reads are set
const grantedQuoteTemplate = {
  id: 'quote-default',
  title: 'Quote',
  granted: true,
  reason: 'Permission granted',
  template: {id: 'quote-default', schemaType: 'quote'},
} as unknown as TemplatePermissionsResult

/** One granted template matching `type="quote"`: a real, enabled "Create new" button. */
export const CreateNewIncomingReferenceTemplateAvailable: Story = {
  render: () => (
    <ReferenceInputOptionsProvider initialValueTemplateItems={[grantedQuoteTemplate]}>
      <CreateNewIncomingReference
        type="quote"
        referenceToId={ARTICLE_ID}
        referenceToType="article"
        creationAllowed
        onCreateNewReference={() => undefined}
        fieldName="incomingReferences"
      />
    </ReferenceInputOptionsProvider>
  ),
}

/* ── IncomingReferenceDocumentActions: the per-row context menu ───────────────────────────────
   `GetHookCollectionState` resolves the `actions` hooks, then either returns null (no states) or
   the real `MenuButton`/`Menu` (already wraps its own `MenuItem`s in a real `<Menu>`, so no extra
   ancestor is needed here). Opening the popover to see the rows inside is an interaction; the
   closed button, which is what an editor sees by default in a row, is the fixture-reachable state. */

export const IncomingReferenceDocumentActionsDefault: Story = {
  render: () => (
    <Menu>
      <IncomingReferenceDocumentActions
        document={quoteA}
        actions={[
          () => ({label: 'Unlink', tone: 'critical', onHandle: () => undefined}),
          () => ({label: 'Open in new tab', onHandle: () => undefined}),
        ]}
        isExecutingAction={false}
        setIsExecutingAction={() => undefined}
      />
    </Menu>
  ),
}

/* ── In real form: the true end-to-end mount, via `defineIncomingReferenceDecoration` ─────────
   The one story that mounts the REAL document pane with `renderMembers` actually wired on the
   schema, confirming the isolated harness above matches production rather than asserting it. */

const articleWithDecorationSchemaTypeDef = {
  ...articleSchemaTypeDef,
  renderMembers: ((members: ObjectMember[]) => [
    ...members,
    defineIncomingReferenceDecoration({
      name: 'incomingReferences',
      title: 'Incoming references',
      types: [{type: 'quote'}],
    }),
  ]) satisfies ObjectRenderMembersCallback,
}

const inRealFormProviders = WithStudioProviders({
  config: {
    schema: {
      name: 'storybook-incoming-refs-real',
      types: [articleWithDecorationSchemaTypeDef, quoteSchemaTypeDef],
    },
    plugins: [structureTool()],
  },
  client,
  previewStore,
})

const inRealFormResolveRootPane: StructureHarnessProps['resolveRootPane'] = (S) =>
  S.document()
    .id(ARTICLE_ID)
    .documentId(ARTICLE_ID)
    .schemaType('article')
    .serialize() as unknown as PaneNode

const inRealFormResolvePane: StructureHarnessProps['resolvePane'] = (S, id) =>
  S.document().id(id).documentId(id).schemaType('article').serialize() as unknown as PaneNode

/**
 * `defineIncomingReferenceDecoration({...})` in `article`'s own `renderMembers`, opened through
 * `lib/structureHarness.tsx`'s real `StructureHarness`. Confirms `Decoration`/`Populated` above
 * (the isolated-harness versions) render the same thing this literal schema-author call produces.
 */
export const InRealForm: Story = {
  decorators: [inRealFormProviders],
  render: () => (
    <StructureHarness
      resolveRootPane={inRealFormResolveRootPane}
      resolvePane={inRealFormResolvePane}
      height={520}
    />
  ),
}
