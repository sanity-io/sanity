import {render, waitFor} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../test/testUtils/TestProvider'
import {presentationUsEnglishLocaleBundle} from '../../i18n'
import {
  type PresentationNavigate,
  type PresentationSearchParams,
  type StructureDocumentPaneParams,
} from '../../types'

// Capture the `pane` prop that the presentation DocumentListPane hands to the
// structure tool's DocumentListPane. We mock the structure-tool imports so the
// component renders without bringing up the full structure-tool stack.
const captured: {pane?: unknown} = {}

vi.mock('sanity/structure', async (importOriginal) => {
  return {
    ...(await importOriginal()),
    StructureToolProvider: ({children}: {children: React.ReactNode}) => <>{children}</>,
    PaneLayout: ({children}: {children: React.ReactNode}) => <div>{children}</div>,
    DocumentListPane: (props: {pane: unknown}) => {
      captured.pane = props.pane
      return <div data-testid="structure-document-list-pane" />
    },
  }
})

// PresentationPaneRouterProvider pulls in the router context. Replace it with a
// no-op wrapper so we don't need to set up the full router for this test.
vi.mock('../../paneRouter/PresentationPaneRouterProvider', () => ({
  PresentationPaneRouterProvider: ({children}: {children: React.ReactNode}) => <>{children}</>,
}))

// usePresentationTool reads from PresentationContext via sanity/_singletons.
// Stub it out — devMode just gates an error-card render path we don't exercise.
vi.mock('../../usePresentationTool', () => ({
  usePresentationTool: () => ({devMode: false}),
}))

// Import after the mocks so they're applied.
const {DocumentListPane} = await import('../DocumentListPane')

const noop = () => {
  // intentional no-op
}

describe('Presentation DocumentListPane — pane descriptor', () => {
  beforeEach(() => {
    captured.pane = undefined
  })

  // Regression for https://github.com/sanity-io/sanity/issues/12956
  //
  // The `refs` array passed in is in DOM order (the order documents appear on
  // the page, built from the overlay scan). The presentation tool's
  // DocumentListPane hands a pane descriptor to the structure tool's
  // DocumentListPane. That descriptor currently expresses no ordering, so the
  // structure tool falls back to DEFAULT_ORDERING (_updatedAt desc) — or, for
  // repeat visits, whatever sort the user previously picked on this pane
  // (persisted under pane.id "$root" via useStructureToolSetting). Either way
  // the DOM-order signal carried in `refs` is dropped.
  //
  // This test asserts that the pane descriptor carries an ordering tied to the
  // input id order. The exact mechanism is the fix author's call — examples:
  //   - defaultOrdering on the pane that sorts by `array::indexOf($ids, _id)`
  //   - a custom orderings entry plus defaultOrdering pointing at it
  //   - a GROQ `order(array::indexOf($ids, _id))` clause baked into the filter
  // The shared invariant: there is *some* ordering on the pane and it does
  // not fall through to the structure tool's _updatedAt-desc default.
  it('expresses an ordering on the pane so DOM order is preserved (regression #12956)', async () => {
    const wrapper = await createTestProvider({
      resources: [presentationUsEnglishLocaleBundle],
    })

    // Three refs in deliberately non-alphabetical, non-_updatedAt-friendly order.
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

    // The locale bundle resolves asynchronously through Suspense; wait for the
    // structure-tool DocumentListPane stub to receive the pane prop before
    // asserting on it.
    await waitFor(() => {
      expect(captured.pane).toBeDefined()
    })

    const pane = captured.pane as {
      options: {
        filter: string
        params: {ids: string[]}
        defaultOrdering?: Array<{field: string; direction: 'asc' | 'desc'}>
      }
      orderings?: Array<{
        name: string
        title: string
        by: Array<{field: string; direction: 'asc' | 'desc'}>
      }>
    }

    // Sanity check: the ids prop is what we passed (DOM order).
    expect(pane.options.params.ids).toEqual(['doc-zebra', 'doc-apple', 'doc-mango'])

    // Core regression: the descriptor must express an ordering that reflects
    // the DOM-order input. Today the pane has `filter: '_id in $ids'` and no
    // ordering at all, so the structure tool falls back to _updatedAt desc.
    const hasInlineDefault =
      Array.isArray(pane.options.defaultOrdering) && pane.options.defaultOrdering.length > 0
    const hasOrderings = Array.isArray(pane.orderings) && pane.orderings.length > 0
    // Some fixes might express order inside the GROQ filter itself (e.g. via
    // `order(array::indexOf($ids, _id))`). Accept either path: descriptor-level
    // ordering OR filter-level ordering, as long as the signal isn't dropped.
    const hasFilterOrdering =
      typeof pane.options.filter === 'string' && /order\s*\(/i.test(pane.options.filter)

    expect(
      hasInlineDefault || hasOrderings || hasFilterOrdering,
      'pane descriptor handed to the structure DocumentListPane must express an ordering ' +
        'so the DOM order encoded in `ids` is preserved. Today it carries none, so the ' +
        'structure tool falls back to DEFAULT_ORDERING (_updatedAt desc) and the order is lost.',
    ).toBe(true)
  })
})
