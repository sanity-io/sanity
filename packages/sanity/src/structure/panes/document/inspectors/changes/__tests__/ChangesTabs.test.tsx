import {render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {beforeAll, beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {ChangesTabs} from '../ChangesTabs'

const mockSetParams = vi.hoisted(() => vi.fn())
const mockParams = vi.hoisted(() => ({current: {} as Record<string, string | undefined>}))

vi.mock('../../../../../components/paneRouter/usePaneRouter', () => ({
  usePaneRouter: () => ({params: mockParams.current, setParams: mockSetParams}),
}))

function isReleaseDocument(doc: unknown): boolean {
  return typeof doc === 'object' && doc !== null && '_type' in doc && doc._type === 'system.release'
}

vi.mock('sanity', () => ({
  isReleaseDocument,
  // ChangesTabs imports `structureLocaleNamespace` from the structure i18n barrel, which calls
  // this at module load time to define `structureUsEnglishLocaleBundle`.
  defineLocaleResourceBundle: (bundle: unknown) => bundle,
  useSource: () => ({beta: {eventsAPI: {documents: false}}}),
  usePerspective: () => ({selectedPerspective: 'drafts'}),
  // Identity translations keep the i18n Suspense from swapping the tabs for a loading spinner.
  useTranslation: () => ({t: (key: string) => key}),
  Translate: () => null,
}))

// The tab bodies are heavy and irrelevant here; only the tab list behaviour is under test.
vi.mock('../HistorySelector', () => ({HistorySelector: () => null}))
vi.mock('../EventsSelector', () => ({EventsSelector: () => null}))
vi.mock('../EventsInspector', () => ({EventsInspector: () => null}))
vi.mock('../ChangesInspector', () => ({ChangesInspector: () => null}))

let wrapper: React.ComponentType<{children: React.ReactNode}>

beforeAll(async () => {
  wrapper = await createTestProvider()
})

describe('ChangesTabs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockParams.current = {}
  })

  const inspectorProps = {onClose: vi.fn(), documentId: 'doc-1', documentType: 'article'}

  it('writes the selected tab to the pane router params', async () => {
    mockParams.current = {since: 'rev-1'}
    render(<ChangesTabs {...inspectorProps} />, {wrapper})

    const reviewTab = screen.getByRole('tab', {name: 'changes.tab.review-changes'})
    await userEvent.click(reviewTab)

    expect(mockSetParams).toHaveBeenCalledWith({since: 'rev-1', changesInspectorTab: 'review'})
  })

  it('clears the since param when returning to the history tab', async () => {
    mockParams.current = {since: 'rev-1', changesInspectorTab: 'review'}
    render(<ChangesTabs {...inspectorProps} />, {wrapper})

    const historyTab = screen.getByRole('tab', {name: 'changes.tab.history'})
    await userEvent.click(historyTab)

    expect(mockSetParams).toHaveBeenCalledWith({since: undefined, changesInspectorTab: 'history'})
  })
})
