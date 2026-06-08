import {render, screen, waitFor} from '@testing-library/react'
import {of} from 'rxjs'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../test/testUtils/TestProvider'
import {presentationUsEnglishLocaleBundle} from '../../i18n'
import {
  type PresentationNavigate,
  type PresentationSearchParams,
  type StructureDocumentPaneParams,
} from '../../types'

// Capture whether the presentation DocumentListPane delegates to the structure
// tool's DocumentListPane. Today (pre-fix) it does — and that's where the DOM
// order is lost. The fix renders rows itself, so this mock must NOT be called.
const capturedStructureCalls: {pane?: unknown}[] = []

vi.mock('sanity/structure', async (importOriginal) => {
  return {
    ...(await importOriginal()),
    StructureToolProvider: ({children}: {children: React.ReactNode}) => <>{children}</>,
    PaneLayout: ({children}: {children: React.ReactNode}) => <div>{children}</div>,
    DocumentListPane: (props: {pane: unknown}) => {
      capturedStructureCalls.push({pane: props.pane})
      return <div data-testid="structure-document-list-pane" />
    },
  }
})

// PresentationPaneRouterProvider pulls in the router context. Replace it with a
// no-op wrapper. (The new implementation doesn't use it, but we keep this in
// case of a partial revert.)
vi.mock('../../paneRouter/PresentationPaneRouterProvider', () => ({
  PresentationPaneRouterProvider: ({children}: {children: React.ReactNode}) => <>{children}</>,
}))

// usePresentationTool reads from PresentationContext via sanity/_singletons.
// Stub it out — devMode just gates an error-card render path we don't exercise.
vi.mock('../../usePresentationTool', () => ({
  usePresentationTool: () => ({devMode: false}),
}))

// Stub the preview machinery from `sanity`. We need:
//  - useSchema().get(typeName) → a SchemaType-ish object (truthy, with name)
//  - useDocumentPreviewStore() → any value (passed straight to the observable)
//  - usePerspective() → {perspectiveStack: []}
//  - getPreviewStateObservable() → an observable emitting a deterministic
//    snapshot. We key the title off documentId so the rendered DOM reflects
//    which id is in which row.
//  - SanityDefaultPreview → renders the title in a way we can read in the DOM.
//  - PreviewCard → render its children inside a wrapping element honoring
//    `data-testid` / `data-id` (PreviewCard normally forwards arbitrary data-*
//    attributes; we mimic that here without dragging in the full Sanity UI
//    PreviewCard).
//  - getPreviewValueWithFallback → mirror the real fallback logic enough for
//    the test.
vi.mock('sanity', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>
  // Cache schema-type objects by name so `useSchema().get(name)` returns the
  // same reference across renders. The real `useSchema()` in Studio does this
  // via the schema store; here we mimic it so `DocumentRow`'s `useEffect`
  // (which depends on `schemaType`) doesn't fire on every render.
  const schemaCache = new Map<
    string,
    {name: string; type: string; jsonType: string; fields: never[]}
  >()
  // Same stability requirement for the preview store and the perspective stack
  // — both are useEffect dependencies in DocumentRow.
  const stableStore = {}
  const stablePerspectiveStack: never[] = []
  return {
    ...actual,
    useSchema: () => ({
      get: (name: string) => {
        let type = schemaCache.get(name)
        if (!type) {
          type = {name, type: 'document', jsonType: 'object', fields: []}
          schemaCache.set(name, type)
        }
        return type
      },
    }),
    useDocumentPreviewStore: () => stableStore,
    usePerspective: () => ({perspectiveStack: stablePerspectiveStack}),
    getPreviewStateObservable: (_store: unknown, _schemaType: unknown, documentId: string) =>
      of({
        isLoading: false,
        snapshot: {_id: documentId, title: `Title for ${documentId}`},
        original: null,
      }),
    getPreviewValueWithFallback: ({
      snapshot,
      original,
      fallback,
    }: {
      snapshot?: {title?: string; _id?: string} | null
      original?: {title?: string; _id?: string} | null
      fallback?: {title?: string; _id?: string}
    }) => snapshot || original || fallback || {},
    SanityDefaultPreview: (props: {title?: string}) => (
      <span data-testid="document-row-title">{props.title}</span>
    ),
    PreviewCard: ({
      children,
      as: AsComponent,
      ...rest
    }: {
      'children': React.ReactNode
      'as'?: React.ComponentType<Record<string, unknown>>
      'data-testid'?: string
      'data-id'?: string
    }) => {
      // PreviewCard normally renders its content inside the component given by
      // `as`, forwarding remaining props (including data-*). Mirror enough of
      // that here that the `StateLink` mock (rendered via `as={Link}`) is part
      // of the row tree.
      if (AsComponent) {
        return (
          <AsComponent data-testid={rest['data-testid']} data-id={rest['data-id']}>
            {children}
          </AsComponent>
        )
      }
      return (
        <div data-testid={rest['data-testid']} data-id={rest['data-id']}>
          {children}
        </div>
      )
    },
  }
})

// StateLink reads from the router context. Replace with a plain anchor that
// surfaces the navigation target so we can assert click behavior preservation
// without setting up a router.
vi.mock('sanity/router', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>
  return {
    ...actual,
    StateLink: ({
      state,
      children,
      ...rest
    }: {
      state: {id: string; type: string}
      children?: React.ReactNode
    }) => (
      <a {...rest} data-link-id={state.id} data-link-type={state.type}>
        {children}
      </a>
    ),
  }
})

// Import after the mocks so they're applied.
const {DocumentListPane} = await import('../DocumentListPane')

const noop = () => {
  // intentional no-op
}

describe('Presentation DocumentListPane', () => {
  beforeEach(() => {
    capturedStructureCalls.length = 0
  })

  // Regression for https://github.com/sanity-io/sanity/issues/12956
  //
  // The `refs` array passed in is in DOM order (the order documents appear on
  // the page, built from the overlay scan). Previously the presentation tool's
  // DocumentListPane handed those ids to the structure tool's DocumentListPane,
  // which then sorted by DEFAULT_ORDERING (`_updatedAt desc`) — or by whatever
  // sort the user previously picked on this pane (persisted under pane.id
  // "$root" via `useStructureToolSetting`). Either way the DOM-order signal
  // carried in `refs` was dropped.
  //
  // The fix renders rows directly in `refs` order using presentation-native
  // preview primitives. This test pins that invariant: rows appear in DOM
  // order matching the input refs, and the structure tool's DocumentListPane
  // is NOT involved.
  it('renders rows in the order of `refs` and bypasses the structure DocumentListPane (regression #12956)', async () => {
    const wrapper = await createTestProvider({
      resources: [presentationUsEnglishLocaleBundle],
    })

    // Three refs in deliberately non-alphabetical order. If anything along the
    // pipeline sorts by id, by title, or by a `_updatedAt` fallback, this will
    // come out in a different order than the input.
    const refs = [
      {_id: 'doc-zebra', _type: 'page'},
      {_id: 'doc-apple', _type: 'page'},
      {_id: 'doc-mango', _type: 'page'},
    ]

    render(
      <DocumentListPane
        mainDocumentState={undefined}
        onEditReference={noop as unknown as PresentationNavigate}
        onStructureParams={noop as (params: StructureDocumentPaneParams) => void}
        searchParams={{} as PresentationSearchParams}
        refs={refs}
      />,
      {wrapper},
    )

    // Wait for rows to render (Suspense for the i18n bundle has to resolve).
    await waitFor(() => {
      expect(screen.getAllByTestId('presentation-document-row')).toHaveLength(3)
    })

    const rows = screen.getAllByTestId('presentation-document-row')
    const renderedIds = rows.map((el) => el.getAttribute('data-id'))

    // Core regression: rendered order matches input (DOM) order, not alpha
    // or `_updatedAt` order.
    expect(renderedIds).toEqual(['doc-zebra', 'doc-apple', 'doc-mango'])

    // Each row is wrapped in a StateLink (the mocked link surfaces `state` as
    // `data-link-*` attributes). Navigation is preserved — clicking a row
    // opens the right document.
    expect(rows.map((row) => row.getAttribute('data-link-id'))).toEqual([
      'doc-zebra',
      'doc-apple',
      'doc-mango',
    ])
    expect(rows.map((row) => row.getAttribute('data-link-type'))).toEqual(['page', 'page', 'page'])

    // The structure tool's DocumentListPane must NOT be in the render tree.
    // A regression that reverts to "let the structure tool sort it" would
    // show up here.
    expect(capturedStructureCalls).toHaveLength(0)
    expect(screen.queryByTestId('structure-document-list-pane')).not.toBeInTheDocument()
  })

  it('filters out the main document (it is rendered separately above the list)', async () => {
    const wrapper = await createTestProvider({
      resources: [presentationUsEnglishLocaleBundle],
    })

    const refs = [
      {_id: 'doc-zebra', _type: 'page'},
      {_id: 'doc-main', _type: 'page'},
      {_id: 'doc-mango', _type: 'page'},
    ]

    render(
      <DocumentListPane
        mainDocumentState={
          {
            // Only the fields we actually read.
            document: {_id: 'doc-main', _type: 'page'},
          } as never
        }
        onEditReference={noop as unknown as PresentationNavigate}
        onStructureParams={noop as (params: StructureDocumentPaneParams) => void}
        searchParams={{} as PresentationSearchParams}
        refs={refs}
      />,
      {wrapper},
    )

    await waitFor(() => {
      expect(screen.getAllByTestId('presentation-document-row')).toHaveLength(2)
    })

    const renderedIds = screen
      .getAllByTestId('presentation-document-row')
      .map((el) => el.getAttribute('data-id'))
    expect(renderedIds).toEqual(['doc-zebra', 'doc-mango'])
  })
})
