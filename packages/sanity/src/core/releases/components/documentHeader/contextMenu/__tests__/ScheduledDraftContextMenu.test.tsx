import {render, screen} from '@testing-library/react'
import {beforeEach, describe, expect, it, type MockedFunction, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {useScheduledDraftMenuActions} from '../../../../../singleDocRelease/hooks/useScheduledDraftMenuActions'
import {
  type DocumentPermission,
  useDocumentPairPermissions,
} from '../../../../../store/grants/documentPairPermissions'
import {activeCardinalityOneRelease} from '../../../../__fixtures__/release.fixture'
import {ScheduledDraftContextMenu} from '../ScheduledDraftContextMenu'

vi.mock('../../../../../store/grants/documentPairPermissions', () => ({
  useDocumentPairPermissions: vi.fn(),
}))

vi.mock('../../../../../singleDocRelease/hooks/useScheduledDraftDocument', () => ({
  useScheduledDraftDocument: () => ({
    firstDocument: null,
    firstDocumentPreview: undefined,
    loading: false,
  }),
}))

vi.mock('../CopyToDraftsMenuItem', () => ({
  useHasCopyToDraftOption: () => false,
}))

const mockUseDocumentPairPermissions = useDocumentPairPermissions as MockedFunction<
  typeof useDocumentPairPermissions
>

const withholdPermission = (withheld?: DocumentPermission) =>
  mockUseDocumentPairPermissions.mockImplementation(({permission}) => [
    {granted: permission !== withheld, reason: ''},
    false,
  ])

// `activeCardinalityOneRelease` is paused, which hides the edit schedule item.
const scheduledDraftRelease = {
  ...activeCardinalityOneRelease,
  state: 'scheduled' as const,
  publishAt: '2023-10-10T10:00:00.000Z',
}

function MenuDriver() {
  const scheduledDraftMenuActions = useScheduledDraftMenuActions({
    release: scheduledDraftRelease,
    documentType: 'author',
    documentId: 'doc1',
  })

  return (
    <ScheduledDraftContextMenu
      releases={[]}
      bundleId="rCardinalityOne"
      onCreateRelease={vi.fn()}
      onCopyToDrafts={vi.fn()}
      onCreateVersion={vi.fn()}
      hasCreatePermission
      scheduledDraftMenuActions={scheduledDraftMenuActions}
      documentType="author"
      release={scheduledDraftRelease}
      showPublishNow
      showEditSchedule
      showDeleteSchedule
    />
  )
}

const renderMenu = async () => {
  const wrapper = await createTestProvider()

  render(<MenuDriver />, {wrapper})
}

describe('ScheduledDraftContextMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    withholdPermission()
  })

  it('enables every scheduled draft item when both grants are present', async () => {
    await renderMenu()

    expect(screen.getByTestId('publish-now-menu-item')).toBeEnabled()
    expect(screen.getByTestId('edit-schedule-menu-item')).toBeEnabled()
    expect(screen.getByTestId('delete-schedule-menu-item')).toBeEnabled()

    expect(screen.queryByText('Insufficient permissions')).not.toBeInTheDocument()
  })

  it('disables publish now and edit schedule when the publish grant is absent', async () => {
    withholdPermission('publish')

    await renderMenu()

    expect(screen.getByTestId('publish-now-menu-item')).toBeDisabled()
    expect(screen.getByTestId('edit-schedule-menu-item')).toBeDisabled()
    expect(screen.getByTestId('delete-schedule-menu-item')).toBeEnabled()

    expect(
      screen.getByText('You do not have permission to publish this document.'),
    ).toBeInTheDocument()
    expect(screen.getByText('You do not have permission to edit schedules.')).toBeInTheDocument()
  })

  it('disables delete schedule when the discardVersion grant is absent', async () => {
    withholdPermission('discardVersion')

    await renderMenu()

    expect(screen.getByTestId('delete-schedule-menu-item')).toBeDisabled()
    expect(screen.getByTestId('publish-now-menu-item')).toBeEnabled()

    expect(screen.getByText('You do not have permission to delete schedules.')).toBeInTheDocument()
  })
})
