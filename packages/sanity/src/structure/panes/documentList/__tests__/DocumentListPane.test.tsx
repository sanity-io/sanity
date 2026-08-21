import {render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {type ReactNode} from 'react'
import {defineConfig, type PerspectiveContextValue, usePerspective} from 'sanity'
import {PaneContext} from 'sanity/_singletons'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {structureUsEnglishLocaleBundle} from '../../../i18n'
import {type DocumentListPaneNode} from '../../../types'
import {DocumentListPane} from '../DocumentListPane'
import {useDocumentList} from '../useDocumentList'

vi.mock('../useDocumentList', () => ({
  useDocumentList: vi.fn(),
}))

// Stub out the heavy results content while retaining a visible node so the
// pane body's Activity boundary can be asserted.
vi.mock('../DocumentListPaneContent', () => ({
  DocumentListPaneContent: () => <div data-testid="document-list-content" />,
}))

vi.mock('sanity', async (importOriginal) => ({
  ...(await importOriginal()),
  useActiveReleases: vi.fn(() => ({loading: false, data: []})),
  usePerspective: vi.fn((): PerspectiveContextValue => ({
    perspectiveStack: ['drafts'],
    excludedPerspectives: [],
    selectedPerspective: 'drafts',
    selectedPerspectiveName: undefined,
    selectedReleaseId: undefined,
    selectedVariantName: undefined,
    selectedVariant: undefined,
    bundle: 'drafts',
  })),
  useReconnectingToast: vi.fn(),
}))

const mockUseDocumentList = vi.mocked(useDocumentList)
const mockUsePerspective = vi.mocked(usePerspective)

const BASE_PERSPECTIVE: PerspectiveContextValue = {
  perspectiveStack: ['drafts'],
  excludedPerspectives: [],
  selectedPerspective: 'drafts',
  selectedPerspectiveName: undefined,
  selectedReleaseId: undefined,
  selectedVariantName: undefined,
  selectedVariant: undefined,
  bundle: 'drafts',
}

const CONTENT_TESTID = 'document-list-content'
const ORDERING_TESTID = 'document-list-search-ordering'
const SEARCH_TESTID = 'document-list-search'

function getPaneProps() {
  return {
    paneKey: 'test-pane',
    index: 0,
    itemId: 'itemId',
    isActive: true,
    pane: {
      id: 'author',
      type: 'documentList',
      title: 'Authors',
      options: {filter: '_type == "author"'},
    } as DocumentListPaneNode,
  }
}

/** The pane reads its collapsed state from context, so tests must supply one. */
function PaneProvider(props: {children: ReactNode; collapsed?: boolean}) {
  return (
    <PaneContext.Provider
      value={{
        collapse: vi.fn(),
        collapsed: props.collapsed ?? false,
        expand: vi.fn(),
        index: 0,
        isLast: true,
        rootElement: null,
      }}
    >
      {props.children}
    </PaneContext.Provider>
  )
}

async function renderDocumentListPane(options: {collapsed?: boolean} = {}) {
  const wrapper = await createTestProvider({
    config: defineConfig({projectId: 'test', dataset: 'test'}),
    resources: [structureUsEnglishLocaleBundle],
  })

  return render(
    <PaneProvider collapsed={options.collapsed}>
      <DocumentListPane {...getPaneProps()} />
    </PaneProvider>,
    {wrapper},
  )
}

describe('DocumentListPane search ordering indicator', () => {
  beforeEach(() => {
    mockUseDocumentList.mockReturnValue({
      error: null,
      onRetry: vi.fn(),
      isLoading: false,
      items: [],
      isRetrying: false,
      canRetry: false,
      retryCount: 0,
      autoRetry: false,
      connected: true,
      fromCache: false,
      onLoadFullList: vi.fn(),
      isLoadingFullList: false,
    })
  })

  it('does not show the relevance indicator when there is no search term', async () => {
    await renderDocumentListPane()

    expect(screen.queryByTestId(ORDERING_TESTID)).toBeNull()
  })

  it('shows the relevance indicator once a search term is entered', async () => {
    await renderDocumentListPane()

    await userEvent.type(await screen.findByLabelText('Search list'), 'exodus')

    const indicator = await screen.findByTestId(ORDERING_TESTID)
    expect(indicator).toHaveTextContent('Sorted by relevance')
  })

  it('treats a whitespace-only query as empty and hides the indicator', async () => {
    await renderDocumentListPane()

    await userEvent.type(await screen.findByLabelText('Search list'), '   ')

    // The query is effectively empty, so the search-scoped sort control must not
    // appear. Allow time for the debounced query to settle before asserting.
    await new Promise((resolve) => setTimeout(resolve, 400))
    expect(screen.queryByTestId(ORDERING_TESTID)).toBeNull()
  })
})

describe('DocumentListPane search area when the pane is collapsed', () => {
  beforeEach(() => {
    mockUseDocumentList.mockReturnValue({
      error: null,
      onRetry: vi.fn(),
      isLoading: false,
      items: [],
      isRetrying: false,
      canRetry: false,
      retryCount: 0,
      autoRetry: false,
      connected: true,
      fromCache: false,
      onLoadFullList: vi.fn(),
      isLoadingFullList: false,
    })
  })

  it('shows the search area while the pane is expanded', async () => {
    await renderDocumentListPane()

    expect(await screen.findByTestId(SEARCH_TESTID)).toBeVisible()
    expect(screen.getByTestId(CONTENT_TESTID)).toBeVisible()
  })

  it('hides the pane body while collapsed and restores its state when expanded', async () => {
    const {rerender} = await renderDocumentListPane()

    // Enter a search term while expanded, so the relevance indicator renders,
    // then collapse the pane.
    await userEvent.type(await screen.findByLabelText('Search list'), 'exodus')
    expect(await screen.findByTestId(ORDERING_TESTID)).toBeVisible()

    rerender(
      <PaneProvider collapsed>
        <DocumentListPane {...getPaneProps()} />
      </PaneProvider>,
    )

    // The pane body stays mounted so its state survives the collapse, but a
    // collapsed pane is too narrow to render it without overflowing.
    expect(screen.getByTestId(SEARCH_TESTID)).not.toBeVisible()
    expect(screen.getByTestId(ORDERING_TESTID)).not.toBeVisible()
    expect(screen.getByTestId(CONTENT_TESTID)).not.toBeVisible()

    rerender(
      <PaneProvider>
        <DocumentListPane {...getPaneProps()} />
      </PaneProvider>,
    )

    expect(screen.getByLabelText('Search list')).toHaveValue('exodus')
    expect(screen.getByTestId(ORDERING_TESTID)).toBeVisible()
    expect(screen.getByTestId(CONTENT_TESTID)).toBeVisible()
  })
})

describe('DocumentListPane perspective and variant', () => {
  beforeEach(() => {
    mockUseDocumentList.mockReturnValue({
      error: null,
      onRetry: vi.fn(),
      isLoading: false,
      items: [],
      isRetrying: false,
      canRetry: false,
      retryCount: 0,
      autoRetry: false,
      connected: true,
      fromCache: false,
      onLoadFullList: vi.fn(),
      isLoadingFullList: false,
    })
  })

  afterEach(() => {
    mockUsePerspective.mockReturnValue(BASE_PERSPECTIVE)
  })

  it('queries with the perspective stack and no variant by default', async () => {
    await renderDocumentListPane()

    expect(mockUseDocumentList).toHaveBeenCalledWith(
      expect.objectContaining({perspective: ['drafts'], variant: undefined}),
    )
  })

  it('queries with the selected variant alongside the perspective stack', async () => {
    mockUsePerspective.mockReturnValue({...BASE_PERSPECTIVE, selectedVariantName: 'alpha-audience'})

    await renderDocumentListPane()

    expect(mockUseDocumentList).toHaveBeenCalledWith(
      expect.objectContaining({perspective: ['drafts'], variant: 'alpha-audience'}),
    )
  })

  it('uses an explicit list perspective and ignores the navbar variant', async () => {
    mockUsePerspective.mockReturnValue({...BASE_PERSPECTIVE, selectedVariantName: 'alpha-audience'})

    const wrapper = await createTestProvider({
      config: defineConfig({projectId: 'test', dataset: 'test'}),
      resources: [structureUsEnglishLocaleBundle],
    })

    render(
      <DocumentListPane
        {...getPaneProps()}
        pane={{
          ...getPaneProps().pane,
          options: {
            filter: 'sanity::partOfRelease($releaseId)',
            params: {releaseId: 'rSummer'},
            perspective: 'raw',
          },
        }}
      />,
      {wrapper},
    )

    expect(mockUseDocumentList).toHaveBeenCalledWith(
      expect.objectContaining({perspective: 'raw', variant: undefined}),
    )
  })
})
