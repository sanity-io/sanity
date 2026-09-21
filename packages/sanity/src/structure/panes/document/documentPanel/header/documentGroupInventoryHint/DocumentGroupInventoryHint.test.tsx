import {act, render, screen} from '@testing-library/react'
import {useTranslation} from 'sanity'
import {beforeEach, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {structureLocaleNamespace, structureUsEnglishLocaleBundle} from '../../../../../i18n'
import {useDocumentPane} from '../../../useDocumentPane'
import {DocumentGroupInventoryHint} from './DocumentGroupInventoryHint'

vi.mock('../../../useDocumentPane', () => ({
  useDocumentPane: vi.fn(),
}))

const SESSION_COUNT_KEY = 'studio.document-group-inventory.hint.session-count'

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  vi.mocked(useDocumentPane).mockReturnValue({
    setIsDocumentGroupInventoryActive: vi.fn(),
  } as unknown as ReturnType<typeof useDocumentPane>)
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
