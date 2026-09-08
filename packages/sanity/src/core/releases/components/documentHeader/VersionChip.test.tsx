import {render, screen, within} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {useVersionContextMenu} from '../../hooks/useVersionContextMenu'
import {type LATEST, PUBLISHED} from '../../util/const'
import {VersionChip} from './VersionChip'

vi.mock('../../hooks/useVersionContextMenu', () => ({
  useVersionContextMenu: vi.fn(),
}))

const mockUseVersionContextMenu = vi.mocked(useVersionContextMenu)

const contextValues = {
  documentGroupId: 'foo',
  versionId: 'foo',
  documentType: 'author',
  releases: [],
  releasesLoading: false,
  isVersion: false,
}

const noop = () => {}
const emptyMenuAction = {
  icon: undefined,
  text: '',
  tone: 'default' as const,
  onClick: noop,
  disabled: false,
}

function mockContextMenu(sourceReleasePerspective: typeof LATEST | typeof PUBLISHED) {
  mockUseVersionContextMenu.mockReturnValue({
    contextMenu: {open: false},
    handleContextMenu: noop,
    closeContextMenu: noop,
    popoverRef: {current: null},
    referenceElement: null,
    setReferenceElement: noop,
    dialogState: 'idle',
    closeDialog: noop,
    openDiscardDialog: noop,
    openCreateReleaseDialog: noop,
    handleCopyToDrafts: async () => {},
    handleAddVersion: async () => {},
    isScheduledDraft: false,
    scheduledDraftMenuActions: {
      actions: {
        publishNow: emptyMenuAction,
        editSchedule: emptyMenuAction,
        deleteSchedule: {...emptyMenuAction, tone: 'critical'},
        schedulePublish: emptyMenuAction,
      },
      dialogs: null,
      isPerformingOperation: false,
      selectedAction: null,
      handleDialogClose: noop,
    },
    sourceReleasePerspective,
  })
}

describe('VersionChip', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    HTMLElement.prototype.scrollIntoView = vi.fn()
  })

  it('keeps the draft avatar caution when the chip acts on the published document', async () => {
    mockContextMenu(PUBLISHED)
    const wrapper = await createTestProvider()

    render(
      <VersionChip
        selected={false}
        text="Draft"
        tone="neutral"
        onClick={noop}
        contextValues={{...contextValues, bundleId: 'draft'}}
      />,
      {wrapper},
    )

    const chip = screen.getByRole('button', {name: 'Draft'})
    expect(within(chip).getByTestId('release-avatar-caution')).toBeInTheDocument()
    expect(within(chip).queryByTestId('release-avatar-positive')).not.toBeInTheDocument()
  })

  it('keeps the published avatar positive', async () => {
    mockContextMenu(PUBLISHED)
    const wrapper = await createTestProvider()

    render(
      <VersionChip
        selected
        text="Published"
        tone="positive"
        onClick={noop}
        contextValues={{...contextValues, bundleId: 'published'}}
      />,
      {wrapper},
    )

    const chip = screen.getByRole('button', {name: 'Published'})
    expect(within(chip).getByTestId('release-avatar-positive')).toBeInTheDocument()
  })
})
