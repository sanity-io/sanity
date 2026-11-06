import {render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {
  type DocumentPermission,
  type ReleaseDocument,
  useDocumentPairPermissions,
  usePauseToEditScheduledDraft,
} from 'sanity'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {ScheduledReleaseBanner} from '../ScheduledReleaseBanner'

vi.mock('../../../useDocumentTitle', () => ({
  useDocumentTitle: () => ({title: 'Test document'}),
}))

vi.mock('sanity', async () => {
  const actual = await vi.importActual('sanity')
  return {
    ...actual,
    usePauseToEditScheduledDraft: vi.fn(),
    useDocumentPairPermissions: vi.fn(),
  }
})

const mockUsePauseToEditScheduledDraft = usePauseToEditScheduledDraft as Mock<
  typeof usePauseToEditScheduledDraft
>

const mockUseDocumentPairPermissions = useDocumentPairPermissions as Mock<
  typeof useDocumentPairPermissions
>

const withholdPermission = (withheld?: DocumentPermission) =>
  mockUseDocumentPairPermissions.mockImplementation(({permission}) => [
    {granted: permission !== withheld, reason: ''},
    false,
  ])

const pauseToEdit = vi.fn()

// Matches `scheduledRelease` in core/releases/__fixtures__/release.fixture.ts
const scheduledRelease: ReleaseDocument = {
  _rev: 'scheduledRev',
  _id: '_.releases.rScheduled',
  name: 'rScheduled',
  _type: 'system.release',
  _createdAt: '2023-10-10T08:00:00Z',
  _updatedAt: '2023-10-10T09:00:00Z',
  state: 'scheduled',
  publishAt: '2023-10-10T10:00:00Z',
  metadata: {
    title: 'scheduled Release',
    releaseType: 'scheduled',
    intendedPublishAt: '2023-10-10T10:00:00Z',
    description: 'scheduled Release description',
    cardinality: undefined,
  },
}

const scheduledCardinalityOneRelease: ReleaseDocument = {
  ...scheduledRelease,
  metadata: {
    ...scheduledRelease.metadata,
    cardinality: 'one',
  },
}

async function renderBanner(currentRelease: ReleaseDocument) {
  const wrapper = await createTestProvider()
  return render(
    <ScheduledReleaseBanner
      currentRelease={currentRelease}
      documentId="doc1"
      documentType="author"
    />,
    {wrapper},
  )
}

describe('ScheduledReleaseBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUsePauseToEditScheduledDraft.mockReturnValue({
      pauseToEdit,
      isPausing: false,
    })
    withholdPermission()
  })

  it('shows a Pause to edit button for a cardinality-one scheduled release', async () => {
    await renderBanner(scheduledCardinalityOneRelease)

    expect(screen.getByTestId('scheduled-release-banner')).toBeInTheDocument()
    expect(screen.getByRole('button', {name: 'Pause to edit'})).toBeInTheDocument()
    expect(mockUsePauseToEditScheduledDraft).toHaveBeenCalledWith({
      release: scheduledCardinalityOneRelease,
      documentTitle: 'Test document',
    })
  })

  it('does not show a Pause to edit button for a multi-doc scheduled release', async () => {
    await renderBanner(scheduledRelease)

    expect(screen.getByTestId('scheduled-release-banner')).toBeInTheDocument()
    expect(screen.getByText(/scheduled to be published/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', {name: 'Pause to edit'})).not.toBeInTheDocument()
    expect(mockUsePauseToEditScheduledDraft).toHaveBeenCalledWith({
      release: undefined,
      documentTitle: 'Test document',
    })
  })

  it('calls pauseToEdit when Pause to edit is clicked', async () => {
    await renderBanner(scheduledCardinalityOneRelease)

    await userEvent.click(screen.getByRole('button', {name: 'Pause to edit'}))

    expect(pauseToEdit).toHaveBeenCalled()
  })

  describe('grants', () => {
    it('looks up the publish grant against the scheduled draft version', async () => {
      await renderBanner(scheduledCardinalityOneRelease)

      expect(mockUseDocumentPairPermissions).toHaveBeenCalledWith({
        id: 'doc1',
        type: 'author',
        version: 'rScheduled',
        permission: 'publish',
      })
    })

    it('skips the document lookup for a multi-doc scheduled release', async () => {
      await renderBanner(scheduledRelease)

      expect(mockUseDocumentPairPermissions).toHaveBeenCalledWith(
        expect.objectContaining({type: '*'}),
      )
    })

    it('enables Pause to edit with no explanation when the publish grant is present', async () => {
      await renderBanner(scheduledCardinalityOneRelease)

      expect(screen.getByRole('button', {name: 'Pause to edit'})).toBeEnabled()
      expect(screen.queryByText('Insufficient permissions')).not.toBeInTheDocument()
    })

    it('disables Pause to edit with an explanation when the publish grant is absent', async () => {
      withholdPermission('publish')

      await renderBanner(scheduledCardinalityOneRelease)

      expect(screen.getByRole('button', {name: 'Pause to edit'})).toBeDisabled()
      expect(screen.getByText('You do not have permission to edit schedules.')).toBeInTheDocument()
    })

    it('disables Pause to edit with no explanation while the grant is loading', async () => {
      mockUseDocumentPairPermissions.mockReturnValue([undefined, true])

      await renderBanner(scheduledCardinalityOneRelease)

      expect(screen.getByRole('button', {name: 'Pause to edit'})).toBeDisabled()
      expect(screen.queryByText('Insufficient permissions')).not.toBeInTheDocument()
    })
  })
})
