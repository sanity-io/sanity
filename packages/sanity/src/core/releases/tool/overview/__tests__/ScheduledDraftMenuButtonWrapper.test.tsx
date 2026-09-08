import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {flushMicrotasksThisIsACodeSmell} from '../../../../../../test/testUtils/flushMicrotasks'
import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {type DocumentActionsResolver} from '../../../../config/types'
import {activeCardinalityOneRelease} from '../../../__fixtures__/release.fixture'
import {releasesUsEnglishLocaleBundle} from '../../../i18n'
import {ScheduledDraftMenuButtonWrapper} from '../ScheduledDraftMenuButtonWrapper'

const scheduledDraftDocument = {
  _id: 'versions.rSchedule.doc1',
  _type: 'author',
  _rev: 'rev1',
  _createdAt: '',
  _updatedAt: '',
}

vi.mock('../../../../singleDocRelease/hooks/useScheduledDraftDocument', () => ({
  useScheduledDraftDocument: vi.fn(() => ({
    firstDocument: scheduledDraftDocument,
    firstDocumentPreview: undefined,
    firstDocumentValidation: undefined,
    loading: false,
  })),
}))

const renderMenu = async (documentActions?: DocumentActionsResolver) => {
  const wrapper = await createTestProvider({
    resources: [releasesUsEnglishLocaleBundle],
    config: documentActions ? {document: {actions: documentActions}} : undefined,
  })

  render(<ScheduledDraftMenuButtonWrapper release={activeCardinalityOneRelease} />, {wrapper})
  await flushMicrotasksThisIsACodeSmell()
}

describe('ScheduledDraftMenuButtonWrapper', () => {
  it('renders the menu button while the scheduled draft actions are configured', async () => {
    await renderMenu()

    expect(screen.getByTestId('scheduled-draft-menu-button')).toBeInTheDocument()
  })

  it('renders nothing when every scheduled draft action is omitted from document.actions', async () => {
    await renderMenu((prev) => prev.filter(({action}) => action === 'duplicate'))

    expect(screen.queryByTestId('scheduled-draft-menu-button')).not.toBeInTheDocument()
  })

  it('keeps the menu button when only publish survives', async () => {
    await renderMenu((prev) => prev.filter(({action}) => action === 'publish'))

    expect(screen.getByTestId('scheduled-draft-menu-button')).toBeInTheDocument()
  })
})
