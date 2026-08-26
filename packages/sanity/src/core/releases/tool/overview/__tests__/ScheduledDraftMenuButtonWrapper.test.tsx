import {render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {beforeEach, describe, expect, it, type MockedFunction, vi} from 'vitest'

import {flushMicrotasksThisIsACodeSmell} from '../../../../../../test/testUtils/flushMicrotasks'
import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {type DocumentActionsResolver} from '../../../../config/types'
import {
  type DocumentPermission,
  useDocumentPairPermissions,
} from '../../../../store/grants/documentPairPermissions'
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

vi.mock('../../../../store/grants/documentPairPermissions', () => ({
  useDocumentPairPermissions: vi.fn(),
}))

const mockUseDocumentPairPermissions = useDocumentPairPermissions as MockedFunction<
  typeof useDocumentPairPermissions
>

const grantEveryPermission = () =>
  mockUseDocumentPairPermissions.mockImplementation(() => [{granted: true, reason: ''}, false])

const withholdPermission = (withheld?: DocumentPermission) =>
  mockUseDocumentPairPermissions.mockImplementation(({permission}) => [
    {granted: permission !== withheld, reason: ''},
    false,
  ])

const renderMenu = async (documentActions?: DocumentActionsResolver) => {
  const wrapper = await createTestProvider({
    resources: [releasesUsEnglishLocaleBundle],
    config: documentActions ? {document: {actions: documentActions}} : undefined,
  })

  render(<ScheduledDraftMenuButtonWrapper release={activeCardinalityOneRelease} />, {wrapper})
  await flushMicrotasksThisIsACodeSmell()
}

const openMenu = async () => {
  await renderMenu()
  await userEvent.click(screen.getByTestId('scheduled-draft-menu-button'))
}

describe('ScheduledDraftMenuButtonWrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    grantEveryPermission()
  })

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

  it('offers publish now and delete schedule when both grants are present', async () => {
    await openMenu()

    expect(screen.getByTestId('publish-now-menu-item')).toBeEnabled()
    expect(screen.getByTestId('delete-schedule-menu-item')).toBeEnabled()
    expect(screen.queryByText('Insufficient permissions')).not.toBeInTheDocument()
  })

  it('disables publish now with an explanation when the publish grant is absent', async () => {
    withholdPermission('publish')

    await openMenu()

    expect(screen.getByTestId('publish-now-menu-item')).toBeDisabled()
    expect(screen.getByTestId('delete-schedule-menu-item')).toBeEnabled()
    expect(
      screen.getByText('You do not have permission to publish this document.'),
    ).toBeInTheDocument()
  })

  it('disables delete schedule with an explanation when the discardVersion grant is absent', async () => {
    withholdPermission('discardVersion')

    await openMenu()

    expect(screen.getByTestId('delete-schedule-menu-item')).toBeDisabled()
    expect(screen.getByTestId('publish-now-menu-item')).toBeEnabled()
    expect(screen.getByText('You do not have permission to delete schedules.')).toBeInTheDocument()
  })
})
