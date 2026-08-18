import {render, screen} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {useDocumentLastEditedBy} from '../../../store/translog/useDocumentLastEditedBy'
import {useUser} from '../../../store/user/hooks'
import {EditedByCell} from '../EditedByCell'

vi.mock('../../../store/translog/useDocumentLastEditedBy', () => ({
  useDocumentLastEditedBy: vi.fn(),
}))

// Partial mock: the test provider's internals (CopyPasteProvider) use useCurrentUser from this same
// module, so keep everything real and override only useUser.
vi.mock('../../../store/user/hooks', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useUser: vi.fn(() => [undefined, false]),
}))

// Isolate the cell from the real avatar/profile resolution; assert on stand-ins.
vi.mock('../../userAvatar/UserAvatar', () => ({
  UserAvatar: vi.fn(({user}) => <div data-testid="user-avatar">{user}</div>),
  AvatarSkeleton: vi.fn(() => <div data-testid="avatar-skeleton" />),
}))

const mockUseDocumentLastEditedBy = vi.mocked(useDocumentLastEditedBy)
const mockUseUser = vi.mocked(useUser)

async function renderCell(ui: React.ReactElement) {
  const wrapper = await createTestProvider()
  return render(ui, {wrapper})
}

describe('EditedByCell', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseUser.mockReturnValue([undefined, false])
  })

  it('shows a skeleton while the last editor is loading', async () => {
    mockUseDocumentLastEditedBy.mockReturnValue({lastEditedBy: undefined, loading: true})

    await renderCell(<EditedByCell documentId="doc-1" />)

    expect(screen.getByTestId('avatar-skeleton')).toBeInTheDocument()
    expect(screen.queryByTestId('user-avatar')).not.toBeInTheDocument()
  })

  it('renders nothing when there is no resolved editor', async () => {
    mockUseDocumentLastEditedBy.mockReturnValue({lastEditedBy: undefined, loading: false})

    await renderCell(<EditedByCell documentId="doc-1" />)

    expect(screen.queryByTestId('user-avatar')).not.toBeInTheDocument()
    expect(screen.queryByTestId('avatar-skeleton')).not.toBeInTheDocument()
  })

  it('renders the editor avatar and display name once resolved', async () => {
    mockUseDocumentLastEditedBy.mockReturnValue({lastEditedBy: 'user-42', loading: false})
    mockUseUser.mockReturnValue([{id: 'user-42', displayName: 'Ada Lovelace'} as never, false])

    await renderCell(<EditedByCell documentId="doc-1" revision="rev-1" />)

    expect(screen.getByTestId('user-avatar')).toHaveTextContent('user-42')
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument()
  })

  it('renders the avatar without a name when the profile has no display name', async () => {
    mockUseDocumentLastEditedBy.mockReturnValue({lastEditedBy: 'user-42', loading: false})
    mockUseUser.mockReturnValue([{id: 'user-42'} as never, false])

    await renderCell(<EditedByCell documentId="doc-1" />)

    expect(screen.getByTestId('user-avatar')).toBeInTheDocument()
    expect(screen.queryByText('Ada Lovelace')).not.toBeInTheDocument()
  })
})
