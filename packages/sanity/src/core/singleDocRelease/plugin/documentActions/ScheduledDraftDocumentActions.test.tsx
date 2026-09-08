import {render, screen} from '@testing-library/react'
import {beforeEach, describe, expect, it, type MockedFunction, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {type DocumentActionProps} from '../../../config/document/actions'
import {activeCardinalityOneRelease} from '../../../releases/__fixtures__/release.fixture'
import {useAllReleases} from '../../../releases/store/useAllReleases'
import {
  type DocumentPermission,
  useDocumentPairPermissions,
} from '../../../store/grants/documentPairPermissions'
import {
  DeleteScheduledDraftAction,
  EditScheduledDraftAction,
  PublishScheduledDraftAction,
} from './ScheduledDraftDocumentActions'

vi.mock('../../../releases/store/useAllReleases', () => ({
  useAllReleases: vi.fn(),
}))

vi.mock('../../../store/grants/documentPairPermissions', () => ({
  useDocumentPairPermissions: vi.fn(),
}))

vi.mock('../../hooks/useScheduledDraftDocument', () => ({
  useScheduledDraftDocument: () => ({
    firstDocument: null,
    firstDocumentPreview: undefined,
    loading: false,
  }),
}))

vi.mock('../../hooks/useClearScheduledDraftPerspectiveOnDelete', () => ({
  useClearScheduledDraftPerspectiveOnDelete: () => vi.fn(),
}))

const mockUseAllReleases = useAllReleases as MockedFunction<typeof useAllReleases>
const mockUseDocumentPairPermissions = useDocumentPairPermissions as MockedFunction<
  typeof useDocumentPairPermissions
>

const withholdPermission = (withheld?: DocumentPermission) =>
  mockUseDocumentPairPermissions.mockImplementation(({permission}) => [
    {granted: permission !== withheld, reason: ''},
    false,
  ])

// `activeCardinalityOneRelease` is paused, which hides the edit schedule action.
const scheduledDraftRelease = {
  ...activeCardinalityOneRelease,
  state: 'scheduled' as const,
  publishAt: '2023-10-10T10:00:00.000Z',
}

const actionProps = {
  id: 'doc1',
  type: 'author',
  release: 'rCardinalityOne',
} as DocumentActionProps

function createActionProbe(useAction: typeof PublishScheduledDraftAction) {
  function ActionProbe() {
    const description = useAction(actionProps)

    if (!description) return <div data-testid="no-action" />

    return (
      <>
        <span data-testid="disabled">{String(description.disabled)}</span>
        <div data-testid="title">{description.title}</div>
      </>
    )
  }

  return ActionProbe
}

describe('scheduled draft document actions', () => {
  let TestProvider: React.ComponentType<{children: React.ReactNode}>

  beforeEach(async () => {
    vi.clearAllMocks()

    mockUseAllReleases.mockReturnValue({
      data: [scheduledDraftRelease],
      error: undefined,
      loading: false,
      map: new Map(),
    })
    withholdPermission()

    TestProvider = await createTestProvider()
  })

  const renderIn = (useAction: typeof PublishScheduledDraftAction) => {
    const ActionProbe = createActionProbe(useAction)
    render(
      <TestProvider>
        <ActionProbe />
      </TestProvider>,
    )
  }

  it('offers publish now with its own label when the publish grant is present', () => {
    renderIn(PublishScheduledDraftAction)

    expect(screen.getByTestId('disabled')).toHaveTextContent('false')
    expect(screen.getByTestId('title')).toHaveTextContent('Publish now')
  })

  it('disables publish now with an explanation when the publish grant is absent', () => {
    withholdPermission('publish')

    renderIn(PublishScheduledDraftAction)

    expect(screen.getByTestId('disabled')).toHaveTextContent('true')
    expect(screen.getByTestId('title')).toHaveTextContent(
      'You do not have permission to publish this document.',
    )
  })

  it('disables edit schedule with an explanation when the publish grant is absent', () => {
    withholdPermission('publish')

    renderIn(EditScheduledDraftAction)

    expect(screen.getByTestId('disabled')).toHaveTextContent('true')
    expect(screen.getByTestId('title')).toHaveTextContent(
      'You do not have permission to edit schedules.',
    )
  })

  it('disables delete schedule with an explanation when the discardVersion grant is absent', () => {
    withholdPermission('discardVersion')

    renderIn(DeleteScheduledDraftAction)

    expect(screen.getByTestId('disabled')).toHaveTextContent('true')
    expect(screen.getByTestId('title')).toHaveTextContent(
      'You do not have permission to delete schedules.',
    )
  })

  it('keeps delete schedule available when only the publish grant is absent', () => {
    withholdPermission('publish')

    renderIn(DeleteScheduledDraftAction)

    expect(screen.getByTestId('disabled')).toHaveTextContent('false')
    expect(screen.getByTestId('title')).toHaveTextContent('Delete schedule')
  })
})
