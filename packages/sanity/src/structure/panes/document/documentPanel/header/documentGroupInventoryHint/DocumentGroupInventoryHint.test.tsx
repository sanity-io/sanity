import {act, render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {useTranslation} from 'sanity'
import {beforeEach, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {structureLocaleNamespace, structureUsEnglishLocaleBundle} from '../../../../../i18n'
import {type DocumentPaneContextValue} from '../../../DocumentPaneContext'
import {useDocumentGroupInventoryTarget} from '../../../useDocumentGroupInventoryTarget'
import {useDocumentPane} from '../../../useDocumentPane'
import {DocumentGroupInventoryHint} from './DocumentGroupInventoryHint'

vi.mock('../../../useDocumentPane', () => ({
  useDocumentPane: vi.fn(),
}))

vi.mock('../../../useDocumentGroupInventoryTarget', () => ({
  useDocumentGroupInventoryTarget: vi.fn(),
}))

const SESSION_COUNT_KEY = 'studio.document-group-inventory.hint.session-count'
const HAS_DISPLAYED_KEY = 'studio.document-group-inventory.hint.has-displayed'

function mockDocumentPane(
  setIsDocumentGroupInventoryActive: DocumentPaneContextValue['setIsDocumentGroupInventoryActive'],
) {
  vi.mocked(useDocumentPane).mockReturnValue({
    setIsDocumentGroupInventoryActive,
  } as DocumentPaneContextValue)
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  mockDocumentPane(vi.fn())
  vi.mocked(useDocumentGroupInventoryTarget).mockReturnValue({
    isAvailable: true,
    documentId: 'drafts.doc-123',
  })
})

function LocaleProbe() {
  useTranslation(structureLocaleNamespace)
  return <span data-testid="locale-loaded" />
}

// `useTranslation` suspends until the structure namespace is loaded. In the studio it has long
// been loaded when a document header renders, so load it here too: the hint's mounting render is
// then synchronous, and what it paints before the status resolves is observable.
async function createWrapper(): Promise<Awaited<ReturnType<typeof createTestProvider>>> {
  const wrapper = await createTestProvider({resources: [structureUsEnglishLocaleBundle]})
  const {unmount} = render(<LocaleProbe />, {wrapper})
  await screen.findByTestId('locale-loaded')
  unmount()
  return wrapper
}

// the status is read from storage asynchronously, so it is unresolved in the mounting render
async function letStatusResolve() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
}

it('does not show a dismissed hint while its status is still being read', async () => {
  localStorage.setItem(SESSION_COUNT_KEY, '-1') // suppressed by the user
  const wrapper = await createWrapper()

  render(<DocumentGroupInventoryHint />, {wrapper})
  expect(screen.queryByRole('button')).toBeNull()

  await letStatusResolve()
  expect(screen.queryByRole('button')).toBeNull()
})

it('shows the hint once its status resolves as active', async () => {
  const wrapper = await createWrapper()

  render(<DocumentGroupInventoryHint />, {wrapper})
  expect(screen.queryByRole('button')).toBeNull()

  await letStatusResolve()
  expect(screen.getByRole('button')).toBeTruthy()
})

it('opens the document group inventory and dismisses itself when pressed', async () => {
  const setIsDocumentGroupInventoryActive = vi.fn()
  mockDocumentPane(setIsDocumentGroupInventoryActive)
  const wrapper = await createWrapper()

  render(<DocumentGroupInventoryHint />, {wrapper})
  await letStatusResolve()

  await userEvent.click(screen.getByRole('button'))

  expect(setIsDocumentGroupInventoryActive).toHaveBeenCalledWith(true)
  expect(localStorage.getItem(SESSION_COUNT_KEY)).toBe('-1')
})

it('is not shown when there is no document group inventory to open', async () => {
  vi.mocked(useDocumentGroupInventoryTarget).mockReturnValue({isAvailable: false})
  const wrapper = await createWrapper()

  render(<DocumentGroupInventoryHint />, {wrapper})
  await letStatusResolve()

  expect(screen.queryByRole('button')).toBeNull()
  // A hidden hint does not use up one of the sessions it is shown for.
  expect(localStorage.getItem(SESSION_COUNT_KEY)).toBeNull()
  expect(sessionStorage.getItem(HAS_DISPLAYED_KEY)).toBeNull()
})

it('appears once the inventory becomes available', async () => {
  vi.mocked(useDocumentGroupInventoryTarget).mockReturnValue({isAvailable: false})
  const wrapper = await createWrapper()

  const {rerender} = render(<DocumentGroupInventoryHint />, {wrapper})
  await letStatusResolve()
  expect(screen.queryByRole('button')).toBeNull()

  vi.mocked(useDocumentGroupInventoryTarget).mockReturnValue({
    isAvailable: true,
    documentId: 'drafts.doc-123',
  })
  rerender(<DocumentGroupInventoryHint />)
  await letStatusResolve()

  expect(screen.getByRole('button')).toBeTruthy()
  expect(sessionStorage.getItem(HAS_DISPLAYED_KEY)).toBe('true')
})
