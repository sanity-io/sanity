import {render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {defineConfig, type PerspectiveContextValue} from 'sanity'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {structureUsEnglishLocaleBundle} from '../../../i18n'
import {type DocumentListPaneNode} from '../../../types'
import {DocumentListPane} from '../DocumentListPane'
import {useDocumentList} from '../useDocumentList'

vi.mock('../useDocumentList', () => ({
  useDocumentList: vi.fn(),
}))

// Stub out the heavy results content so we can focus on the search header.
vi.mock('../DocumentListPaneContent', () => ({
  DocumentListPaneContent: () => null,
}))

vi.mock('sanity', async (importOriginal) => ({
  ...(await importOriginal()),
  useActiveReleases: vi.fn(() => ({loading: false, data: []})),
  usePerspective: vi.fn(
    (): PerspectiveContextValue => ({
      perspectiveStack: ['drafts'],
      excludedPerspectives: [],
      selectedPerspective: 'drafts',
      selectedPerspectiveName: undefined,
      selectedReleaseId: undefined,
      selectedVariantName: undefined,
      selectedVariant: undefined,
      bundle: 'drafts',
    }),
  ),
  useReconnectingToast: vi.fn(),
}))

const mockUseDocumentList = vi.mocked(useDocumentList)

const ORDERING_TESTID = 'document-list-search-ordering'

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
    const wrapper = await createTestProvider({
      config: defineConfig({projectId: 'test', dataset: 'test'}),
      resources: [structureUsEnglishLocaleBundle],
    })

    render(<DocumentListPane {...getPaneProps()} />, {wrapper})

    expect(screen.queryByTestId(ORDERING_TESTID)).toBeNull()
  })

  it('shows the relevance indicator once a search term is entered', async () => {
    const wrapper = await createTestProvider({
      config: defineConfig({projectId: 'test', dataset: 'test'}),
      resources: [structureUsEnglishLocaleBundle],
    })

    render(<DocumentListPane {...getPaneProps()} />, {wrapper})

    await userEvent.type(await screen.findByLabelText('Search list'), 'exodus')

    const indicator = await screen.findByTestId(ORDERING_TESTID)
    expect(indicator).toHaveTextContent('Sorted by relevance')
  })

  it('treats a whitespace-only query as empty and hides the indicator', async () => {
    const wrapper = await createTestProvider({
      config: defineConfig({projectId: 'test', dataset: 'test'}),
      resources: [structureUsEnglishLocaleBundle],
    })

    render(<DocumentListPane {...getPaneProps()} />, {wrapper})

    await userEvent.type(await screen.findByLabelText('Search list'), '   ')

    // The query is effectively empty, so the search-scoped sort control must not
    // appear. Allow time for the debounced query to settle before asserting.
    await new Promise((resolve) => setTimeout(resolve, 400))
    expect(screen.queryByTestId(ORDERING_TESTID)).toBeNull()
  })
})
