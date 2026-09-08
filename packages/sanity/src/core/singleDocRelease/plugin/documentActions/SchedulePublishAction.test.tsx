import {render, screen} from '@testing-library/react'
import {beforeEach, describe, expect, it, type MockedFunction, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {type DocumentActionProps} from '../../../config/document/actions'
import {useValidationStatus} from '../../../hooks/useValidationStatus'
import {studioDefaultLocaleResources} from '../../../i18n/bundles/studio'
import {usePerspective} from '../../../perspective/usePerspective'
import {useActiveReleases} from '../../../releases/store/useActiveReleases'
import {
  type DocumentPermission,
  useDocumentPairPermissions,
} from '../../../store/grants/documentPairPermissions'
import {useSingleDocReleaseEnabled} from '../../context/SingleDocReleaseEnabledProvider'
import {useSingleDocRelease} from '../../context/SingleDocReleaseProvider'
import {useSingleDocReleaseUpsell} from '../../context/SingleDocReleaseUpsellProvider'
import {useHasCardinalityOneReleaseVersions} from '../../hooks/useHasCardinalityOneReleaseVersions'
import {useScheduleDraftOperations} from '../../hooks/useScheduleDraftOperations'
import {singleDocReleaseUsEnglishLocaleBundle} from '../../i18n'
import {useSchedulePublishAction} from './SchedulePublishAction'

vi.mock('../../../hooks/useValidationStatus', () => ({
  useValidationStatus: vi.fn(),
}))

vi.mock('../../../perspective/usePerspective', () => ({
  usePerspective: vi.fn(),
}))

vi.mock('../../../releases/store/useActiveReleases', () => ({
  useActiveReleases: vi.fn(),
}))

vi.mock('../../../store/grants/documentPairPermissions', () => ({
  useDocumentPairPermissions: vi.fn(),
}))

vi.mock('../../context/SingleDocReleaseEnabledProvider', () => ({
  useSingleDocReleaseEnabled: vi.fn(),
}))

vi.mock('../../context/SingleDocReleaseProvider', () => ({
  useSingleDocRelease: vi.fn(),
}))

vi.mock('../../context/SingleDocReleaseUpsellProvider', () => ({
  useSingleDocReleaseUpsell: vi.fn(),
}))

vi.mock('../../hooks/useHasCardinalityOneReleaseVersions', () => ({
  useHasCardinalityOneReleaseVersions: vi.fn(),
}))

vi.mock('../../hooks/useScheduleDraftOperations', () => ({
  useScheduleDraftOperations: vi.fn(),
}))

const mockUseValidationStatus = useValidationStatus as MockedFunction<typeof useValidationStatus>
const mockUsePerspective = usePerspective as MockedFunction<typeof usePerspective>
const mockUseActiveReleases = useActiveReleases as MockedFunction<typeof useActiveReleases>
const mockUseDocumentPairPermissions = useDocumentPairPermissions as MockedFunction<
  typeof useDocumentPairPermissions
>
const mockUseSingleDocReleaseEnabled = useSingleDocReleaseEnabled as MockedFunction<
  typeof useSingleDocReleaseEnabled
>
const mockUseSingleDocRelease = useSingleDocRelease as MockedFunction<typeof useSingleDocRelease>
const mockUseSingleDocReleaseUpsell = useSingleDocReleaseUpsell as MockedFunction<
  typeof useSingleDocReleaseUpsell
>
const mockUseHasCardinalityOneReleaseVersions =
  useHasCardinalityOneReleaseVersions as MockedFunction<typeof useHasCardinalityOneReleaseVersions>
const mockUseScheduleDraftOperations = useScheduleDraftOperations as MockedFunction<
  typeof useScheduleDraftOperations
>

const grantEveryPermission = () =>
  mockUseDocumentPairPermissions.mockReturnValue([{granted: true, reason: ''}, false])

const withholdPermission = (withheld: DocumentPermission) =>
  mockUseDocumentPairPermissions.mockImplementation(({permission}) => [
    {granted: permission !== withheld, reason: ''},
    false,
  ])

const loadPermission = () => mockUseDocumentPairPermissions.mockReturnValue([undefined, true])

const actionProps = {
  id: 'doc1',
  type: 'author',
  draft: {_id: 'drafts.doc1', _type: 'author'},
} as DocumentActionProps

function ActionProbe() {
  const description = useSchedulePublishAction(actionProps)

  if (!description) return <div data-testid="no-action" />

  return (
    <>
      <span data-testid="disabled">{String(description.disabled)}</span>
      <div data-testid="title">{description.title}</div>
    </>
  )
}

describe('useSchedulePublishAction', () => {
  let TestProvider: React.ComponentType<{children: React.ReactNode}>

  beforeEach(async () => {
    vi.clearAllMocks()

    mockUseValidationStatus.mockReturnValue({validation: [], isValidating: false})

    mockUsePerspective.mockReturnValue({
      selectedPerspectiveName: undefined,
      selectedReleaseId: undefined,
      selectedPerspective: 'drafts',
      perspectiveStack: ['drafts'],
      excludedPerspectives: [],
      selectedVariantName: undefined,
      selectedVariant: undefined,
      bundle: 'drafts',
    })

    mockUseActiveReleases.mockReturnValue({
      data: [],
      error: undefined,
      loading: false,
      dispatch: vi.fn(),
      byId: new Map(),
    })

    mockUseSingleDocReleaseEnabled.mockReturnValue({enabled: true, mode: 'default'})
    mockUseSingleDocRelease.mockReturnValue({onSetScheduledDraftPerspective: vi.fn()})
    mockUseSingleDocReleaseUpsell.mockReturnValue({
      upsellDialogOpen: false,
      handleOpenDialog: vi.fn(),
      handleClose: vi.fn(),
      upsellData: null,
      telemetryLogs: {
        dialogSecondaryClicked: vi.fn(),
        dialogPrimaryClicked: vi.fn(),
        panelViewed: vi.fn(),
        panelDismissed: vi.fn(),
        panelPrimaryClicked: vi.fn(),
        panelSecondaryClicked: vi.fn(),
      },
    })
    mockUseHasCardinalityOneReleaseVersions.mockReturnValue(false)
    mockUseScheduleDraftOperations.mockReturnValue({
      createScheduledDraft: vi.fn(),
      publishScheduledDraft: vi.fn(),
      deleteScheduledDraft: vi.fn(),
      rescheduleScheduledDraft: vi.fn(),
      pauseScheduledDraft: vi.fn(),
    })

    grantEveryPermission()

    TestProvider = await createTestProvider({
      resources: [studioDefaultLocaleResources, singleDocReleaseUsEnglishLocaleBundle],
    })
  })

  // `createTestProvider` renders a loading block until its i18n resources resolve.
  const renderAction = async () => {
    render(
      <TestProvider>
        <ActionProbe />
      </TestProvider>,
    )

    await screen.findByTestId('disabled')
  }

  it('is enabled with its normal title when the publish grant is present', async () => {
    await renderAction()

    expect(screen.getByTestId('disabled')).toHaveTextContent('false')
    expect(screen.getByTestId('title')).toHaveTextContent('Schedule publish')
  })

  it('is disabled with the insufficient-permissions explanation when the publish grant is absent', async () => {
    withholdPermission('publish')

    await renderAction()

    expect(screen.getByTestId('disabled')).toHaveTextContent('true')
    expect(screen.getByTestId('title')).toHaveTextContent(
      'You do not have permission to edit schedules.',
    )
  })

  it('is disabled with no permissions explanation while the grant is loading', async () => {
    loadPermission()

    await renderAction()

    expect(screen.getByTestId('disabled')).toHaveTextContent('true')
    expect(screen.getByTestId('title')).not.toHaveTextContent('You do not have permission')
  })
})
