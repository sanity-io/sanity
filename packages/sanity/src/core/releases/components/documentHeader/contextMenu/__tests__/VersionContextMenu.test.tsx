import {type ReleaseDocument} from '@sanity/client'
import {render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {useDocumentPairPermissionsMockReturn} from '../../../../../../../test/mocks/useDocumentPairPermissions.mock'
import {flushMicrotasksThisIsACodeSmell} from '../../../../../../../test/testUtils/flushMicrotasks'
import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {type DocumentActionComponent} from '../../../../../config/document/actions'
import {
  mockUseReleasePermissions,
  useReleasePermissionsMockReturn,
  useReleasesPermissionsMockReturnTrue,
} from '../../../../store/__tests__/__mocks/useReleasePermissions.mock'
import {VersionContextMenu} from '../VersionContextMenu'

vi.mock('sanity/router', async (importOriginal) => ({
  ...(await importOriginal()),
  IntentLink: ({children}: {children: React.ReactNode}) => <div>{children}</div>,
  route: {
    create: vi.fn(),
  },
}))

vi.mock('../../../../store/useReleasePermissions', () => ({
  useReleasePermissions: vi.fn(() => useReleasePermissionsMockReturn),
}))

vi.mock('../../../../../store/grants/documentPairPermissions', () => ({
  useDocumentPairPermissions: vi.fn(() => useDocumentPairPermissionsMockReturn),
}))

// `discardChanges` is contributed by the structure tool, which the core test harness does not load.
const discardChangesAction: DocumentActionComponent = Object.assign(() => null, {
  action: 'discardChanges' as const,
})

describe('VersionContextMenu', () => {
  // `defaultProps` holds shared `vi.fn()`s, so without this a test asserting on one of them can
  // pass on a call an earlier test made.
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockReleases: ReleaseDocument[] = [
    {
      _id: '_.releases.release1',
      name: 'release1',
      _type: 'system.release',
      _rev: 'rev1',
      _updatedAt: '',
      _createdAt: '',
      state: 'active',
      createdBy: 'safsd',
      metadata: {
        title: 'Release 1',
        releaseType: 'asap',
      },
    },
    {
      _id: '_.releases.release2',
      name: 'release2',
      _type: 'system.release',
      _rev: 'rev1',
      _createdAt: '',
      _updatedAt: '',
      createdBy: 'safsd',
      state: 'active',
      metadata: {
        title: 'Release 2',
        releaseType: 'asap',
      },
    },
  ]

  const defaultProps = {
    documentGroupId: 'doc1',
    versionId: 'versions.bundle.doc1',
    releases: mockReleases,
    releasesLoading: false,
    fromRelease: 'release1',
    onDiscard: vi.fn(),
    onCreateRelease: vi.fn(),
    onCopyToDrafts: vi.fn(),
    onCreateVersion: vi.fn(),
    disabled: false,
    type: 'document',
  }

  const draftChipProps = {...defaultProps, fromRelease: 'draft', versionId: 'drafts.doc1'}

  const createScheduledDraftRelease = (): ReleaseDocument => ({
    ...mockReleases[0],
    metadata: {...mockReleases[0].metadata, cardinality: 'one'},
  })

  const createScheduledDraftMenuActions = () => ({
    actions: {
      publishNow: {
        'icon': undefined,
        'text': 'Publish now',
        'tone': 'default' as const,
        'onClick': vi.fn(),
        'disabled': false,
        'data-testid': 'publish-now-menu-item',
      },
      editSchedule: {
        'icon': undefined,
        'text': 'Edit schedule',
        'tone': 'default' as const,
        'onClick': vi.fn(),
        'disabled': false,
        'data-testid': 'edit-schedule-menu-item',
      },
      schedulePublish: {
        'icon': undefined,
        'text': 'Schedule',
        'tone': 'default' as const,
        'onClick': vi.fn(),
        'disabled': false,
        'data-testid': 'schedule-publish-menu-item',
      },
      deleteSchedule: {
        'icon': undefined,
        'text': 'Delete schedule',
        'tone': 'critical' as const,
        'onClick': vi.fn(),
        'disabled': false,
        'data-testid': 'delete-schedule-menu-item',
      },
    },
    dialogs: null,
    isPerformingOperation: false,
    selectedAction: null,
    handleDialogClose: vi.fn(),
  })

  it('renders the menu items correctly', async () => {
    mockUseReleasePermissions.mockReturnValue(useReleasesPermissionsMockReturnTrue)

    const wrapper = await createTestProvider()

    render(<VersionContextMenu {...defaultProps} />, {wrapper})
    await flushMicrotasksThisIsACodeSmell()

    expect(screen.getByTestId('copy-version-to-release-button-group')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByTestId('copy-version-to-release-button-group')).not.toBeDisabled()
    })

    await userEvent.click(screen.getByTestId('copy-version-to-release-button-group'))

    await waitFor(() => {
      expect(screen.getByTestId('create-new-release-button')).toBeInTheDocument()
      expect(screen.getByText('Release 1')).toBeInTheDocument()
      expect(screen.getByText('Release 2')).toBeInTheDocument()
    })
  })

  it('calls onCreateRelease when "New release" is clicked', async () => {
    mockUseReleasePermissions.mockReturnValue(useReleasesPermissionsMockReturnTrue)

    const wrapper = await createTestProvider()

    render(<VersionContextMenu {...defaultProps} />, {wrapper})
    await flushMicrotasksThisIsACodeSmell()

    expect(screen.getByTestId('copy-version-to-release-button-group')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByTestId('copy-version-to-release-button-group')).not.toBeDisabled()
    })

    await userEvent.click(screen.getByTestId('copy-version-to-release-button-group'))

    await userEvent.click(screen.getByTestId('create-new-release-button'))
    expect(defaultProps.onCreateRelease).toHaveBeenCalled()
  })

  it('hides discard version on published chip', async () => {
    mockUseReleasePermissions.mockReturnValue(useReleasesPermissionsMockReturnTrue)

    const wrapper = await createTestProvider()
    const publishedProps = {
      ...defaultProps,
      documentGroupId: 'testid',
      versionId: 'testid',
    }

    render(<VersionContextMenu {...publishedProps} />, {wrapper})
    await flushMicrotasksThisIsACodeSmell()

    expect(screen.queryByTestId('discard')).not.toBeInTheDocument()
  })

  it('calls onDiscard when "Discard version" is clicked', async () => {
    mockUseReleasePermissions.mockReturnValue(useReleasesPermissionsMockReturnTrue)

    const wrapper = await createTestProvider()

    render(<VersionContextMenu {...defaultProps} />, {wrapper})
    await flushMicrotasksThisIsACodeSmell()

    await waitFor(() => {
      expect(screen.getByText('Discard version')).not.toBeDisabled()
    })

    await userEvent.click(screen.getByText('Discard version'))

    expect(defaultProps.onDiscard).toHaveBeenCalled()
  })

  it('hides discard version when discardVersion is omitted from document.actions', async () => {
    mockUseReleasePermissions.mockReturnValue(useReleasesPermissionsMockReturnTrue)

    const wrapper = await createTestProvider({
      config: {
        document: {
          actions: (prev) => prev.filter((action) => action.action === 'publish'),
        },
      },
    })

    render(<VersionContextMenu {...defaultProps} />, {wrapper})
    await flushMicrotasksThisIsACodeSmell()

    expect(screen.queryByText('Discard version')).not.toBeInTheDocument()
  })

  it('shows discard version on a draft chip while discardChanges is configured', async () => {
    mockUseReleasePermissions.mockReturnValue(useReleasesPermissionsMockReturnTrue)

    const wrapper = await createTestProvider({
      config: {document: {actions: (prev) => [...prev, discardChangesAction]}},
    })

    render(<VersionContextMenu {...draftChipProps} />, {wrapper})
    await flushMicrotasksThisIsACodeSmell()

    expect(screen.getByText('Discard version')).toBeInTheDocument()
  })

  it('hides discard version on a draft chip when discardChanges is omitted', async () => {
    mockUseReleasePermissions.mockReturnValue(useReleasesPermissionsMockReturnTrue)

    const wrapper = await createTestProvider({
      config: {
        document: {
          actions: (prev) =>
            [...prev, discardChangesAction].filter((action) => action.action !== 'discardChanges'),
        },
      },
    })

    render(<VersionContextMenu {...draftChipProps} />, {wrapper})
    await flushMicrotasksThisIsACodeSmell()

    expect(screen.getByTestId('copy-version-to-release-button-group')).toBeInTheDocument()
    expect(screen.queryByText('Discard version')).not.toBeInTheDocument()
  })

  it('shows every scheduled draft action when document.actions is unfiltered', async () => {
    mockUseReleasePermissions.mockReturnValue(useReleasesPermissionsMockReturnTrue)

    const wrapper = await createTestProvider()

    render(
      <VersionContextMenu
        {...defaultProps}
        release={createScheduledDraftRelease()}
        isScheduledDraft
        scheduledDraftMenuActions={createScheduledDraftMenuActions()}
      />,
      {wrapper},
    )
    await flushMicrotasksThisIsACodeSmell()

    expect(screen.getByTestId('publish-now-menu-item')).toBeInTheDocument()
    expect(screen.getByTestId('edit-schedule-menu-item')).toBeInTheDocument()
    expect(screen.getByTestId('delete-schedule-menu-item')).toBeInTheDocument()
  })

  it('hides publish now when publish is omitted from document.actions', async () => {
    mockUseReleasePermissions.mockReturnValue(useReleasesPermissionsMockReturnTrue)

    const scheduledRelease = createScheduledDraftRelease()
    const scheduledDraftMenuActions = createScheduledDraftMenuActions()

    const wrapper = await createTestProvider({
      config: {
        document: {
          actions: (prev) => prev.filter((action) => action.action === 'duplicate'),
        },
      },
    })

    render(
      <VersionContextMenu
        {...defaultProps}
        release={scheduledRelease}
        isScheduledDraft
        scheduledDraftMenuActions={scheduledDraftMenuActions}
      />,
      {wrapper},
    )
    await flushMicrotasksThisIsACodeSmell()

    expect(screen.queryByTestId('publish-now-menu-item')).not.toBeInTheDocument()
    expect(screen.queryByTestId('edit-schedule-menu-item')).not.toBeInTheDocument()
    expect(screen.queryByTestId('delete-schedule-menu-item')).not.toBeInTheDocument()
  })

  it('hides delete schedule when discardVersion is omitted from document.actions', async () => {
    mockUseReleasePermissions.mockReturnValue(useReleasesPermissionsMockReturnTrue)

    const scheduledRelease = createScheduledDraftRelease()
    const scheduledDraftMenuActions = createScheduledDraftMenuActions()

    const wrapper = await createTestProvider({
      config: {
        document: {
          actions: (prev) => prev.filter((action) => action.action === 'publish'),
        },
      },
    })

    render(
      <VersionContextMenu
        {...defaultProps}
        release={scheduledRelease}
        isScheduledDraft
        scheduledDraftMenuActions={scheduledDraftMenuActions}
      />,
      {wrapper},
    )
    await flushMicrotasksThisIsACodeSmell()

    expect(screen.getByTestId('publish-now-menu-item')).toBeInTheDocument()
    expect(screen.queryByTestId('edit-schedule-menu-item')).not.toBeInTheDocument()
    expect(screen.queryByTestId('delete-schedule-menu-item')).not.toBeInTheDocument()
  })

  it('calls onCreateRelease when a "new release" is clicked', async () => {
    mockUseReleasePermissions.mockReturnValue(useReleasesPermissionsMockReturnTrue)

    const wrapper = await createTestProvider()

    render(<VersionContextMenu {...defaultProps} />, {wrapper})
    await flushMicrotasksThisIsACodeSmell()

    expect(screen.getByTestId('copy-version-to-release-button-group')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByTestId('copy-version-to-release-button-group')).not.toBeDisabled()
    })

    await userEvent.click(screen.getByTestId('copy-version-to-release-button-group'))

    await userEvent.click(screen.getByTestId('create-new-release-button'))
    expect(defaultProps.onCreateRelease).toHaveBeenCalled()
  })

  it('calls onCreateVersion with the target release when a release is clicked', async () => {
    mockUseReleasePermissions.mockReturnValue(useReleasesPermissionsMockReturnTrue)

    const wrapper = await createTestProvider()

    render(<VersionContextMenu {...defaultProps} />, {wrapper})
    await flushMicrotasksThisIsACodeSmell()

    expect(screen.getByTestId('copy-version-to-release-button-group')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByTestId('copy-version-to-release-button-group')).not.toBeDisabled()
    })

    await userEvent.click(screen.getByTestId('copy-version-to-release-button-group'))

    await userEvent.click(screen.getByText('Release 2'))
    expect(defaultProps.onCreateVersion).toHaveBeenCalledWith('_.releases.release2')
  })

  it('disables the copy version to option if the document is going to be unpublished', async () => {
    mockUseReleasePermissions.mockReturnValue(useReleasesPermissionsMockReturnTrue)

    const wrapper = await createTestProvider()

    render(<VersionContextMenu {...defaultProps} isGoingToUnpublish />, {wrapper})
    await flushMicrotasksThisIsACodeSmell()

    await waitFor(() => {
      expect(screen.getByTestId('copy-version-to-release-button-group')).toBeDisabled()
    })
  })
})
