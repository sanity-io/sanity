import {render, screen} from '@testing-library/react'
import {type ComponentType} from 'react'
import {type MockedFunction, beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {usePaneRouter} from '../../../components/paneRouter/usePaneRouter'
import {useDocumentPane} from '../useDocumentPane'
import {DocumentStatusBar} from './DocumentStatusBar'

const mockPerspective = vi.hoisted(() => ({
  selectedPerspective: 'published' as unknown,
  selectedVariantNames: [] as string[],
}))

vi.mock('sanity', async (importOriginal) => ({
  ...(await importOriginal()),
  usePerspective: () => mockPerspective,
}))
vi.mock('../useDocumentPane', () => ({useDocumentPane: vi.fn()}))
vi.mock('../../../components/paneRouter/usePaneRouter', () => ({usePaneRouter: vi.fn()}))
vi.mock('../documentPanel/header/DocumentGroupInventoryButton', () => ({
  DocumentGroupInventoryButton: () => <button type="button">Manage versions</button>,
}))
vi.mock('./DocumentStatusBarActions', () => ({
  DocumentStatusBarActions: () => <div data-testid="actions" />,
  HistoryStatusBarActions: () => <div data-testid="history-actions" />,
}))
vi.mock('./DocumentStatusLine', () => ({DocumentStatusLine: () => <div />}))
vi.mock('./DocumentBadges', () => ({DocumentBadges: () => <div />}))
vi.mock('./useResizeObserver', () => ({useResizeObserver: vi.fn()}))

const mockUseDocumentPane = useDocumentPane as MockedFunction<typeof useDocumentPane>
const mockUsePaneRouter = usePaneRouter as MockedFunction<typeof usePaneRouter>

describe('DocumentStatusBar', () => {
  let TestProvider: ComponentType<{children: React.ReactNode}>

  beforeEach(async () => {
    // The inventory is off by default, so these tests switch it on.
    TestProvider = await createTestProvider({
      config: {beta: {documentGroupInventory: {enabled: true}}},
    })
    mockUsePaneRouter.mockReturnValue({params: {}} as never)
    mockPerspective.selectedPerspective = 'published'
    mockPerspective.selectedVariantNames = []
  })

  it('keeps Manage versions when the published perspective has no published document', async () => {
    mockUseDocumentPane.mockReturnValue({
      editState: {ready: true, published: null},
      revisionNotFound: false,
      targetDocumentState: {status: 'ready', targetDocument: null},
    } as never)

    render(<DocumentStatusBar />, {wrapper: TestProvider})

    expect(await screen.findByText('Manage versions')).toBeTruthy()
    expect(screen.getByTestId('document-status-bar-empty')).toBeTruthy()
    // No actions here: the document cannot be acted on in this perspective
    expect(screen.queryByTestId('actions')).toBeNull()
  })

  it('leaves out Manage versions with the default config, where the inventory is off', async () => {
    const DefaultProvider = await createTestProvider()
    mockUseDocumentPane.mockReturnValue({
      editState: {ready: true, published: null},
      revisionNotFound: false,
      targetDocumentState: {status: 'ready', targetDocument: null},
    } as never)

    const {container} = render(<DocumentStatusBar />, {wrapper: DefaultProvider})

    await expect.poll(() => container.firstChild).toBeTruthy()
    expect(screen.queryByText('Manage versions')).toBeNull()
  })

  it('leaves out Manage versions when the studio switches the inventory off', async () => {
    const InventoryOffProvider = await createTestProvider({
      config: {beta: {documentGroupInventory: {enabled: false}}},
    })
    mockUseDocumentPane.mockReturnValue({
      editState: {ready: true, published: null},
      revisionNotFound: false,
      targetDocumentState: {status: 'ready', targetDocument: null},
    } as never)

    const {container} = render(<DocumentStatusBar />, {wrapper: InventoryOffProvider})

    // The bar itself mounts (its card is there), but with nothing to show and no inventory
    // there is no empty bar holding Manage versions.
    await expect.poll(() => container.firstChild).toBeTruthy()
    expect(screen.queryByText('Manage versions')).toBeNull()
    expect(screen.queryByTestId('document-status-bar-empty')).toBeNull()
  })
})
