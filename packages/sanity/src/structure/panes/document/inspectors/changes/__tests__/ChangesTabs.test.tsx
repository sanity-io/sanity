import {render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {beforeAll, beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {structureUsEnglishLocaleBundle} from '../../../../../i18n'
import {ChangesTabs} from '../ChangesTabs'

const mockTelemetryLog = vi.hoisted(() => vi.fn())
const mockSetParams = vi.hoisted(() => vi.fn())
const mockParams = vi.hoisted(() => ({current: {} as Record<string, string | undefined>}))

vi.mock('@sanity/telemetry/react', () => ({
  useTelemetry: () => ({log: mockTelemetryLog}),
}))

vi.mock('../../../../../components/paneRouter/usePaneRouter', () => ({
  usePaneRouter: () => ({params: mockParams.current, setParams: mockSetParams}),
}))

vi.mock('sanity', async (importOriginal) => ({
  ...(await importOriginal()),
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
  wrapper = await createTestProvider({
    resources: [structureUsEnglishLocaleBundle],
  })
})

describe('ChangesTabs telemetry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockParams.current = {}
  })

  const inspectorProps = {onClose: vi.fn(), documentId: 'doc-1', documentType: 'article'}

  it('logs a tab change with both tab values when a different tab is clicked', async () => {
    render(<ChangesTabs {...inspectorProps} />, {wrapper})

    const [, reviewTab] = screen.getAllByRole('tab')
    await userEvent.click(reviewTab)

    expect(mockTelemetryLog).toHaveBeenCalledTimes(1)
    expect(mockTelemetryLog).toHaveBeenCalledWith(
      expect.objectContaining({name: 'Document History Inspector Tab Changed'}),
      {tab: 'review', previousTab: 'history'},
    )
  })

  it('logs nothing when the already-selected tab is clicked', async () => {
    render(<ChangesTabs {...inspectorProps} />, {wrapper})

    const [historyTab] = screen.getAllByRole('tab')
    await userEvent.click(historyTab)

    expect(mockTelemetryLog).not.toHaveBeenCalled()
    // The params reset still runs so behaviour is unchanged.
    expect(mockSetParams).toHaveBeenCalled()
  })
})
