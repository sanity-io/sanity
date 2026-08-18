import {render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {type ReactNode} from 'react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {UnclaimedProjectProvider, useUnclaimedProjectContext} from '../UnclaimedProjectProvider'

const {mockEnvironment, mockUseUnclaimedProject, mockUseWorkspace} = vi.hoisted(() => ({
  mockEnvironment: {isDev: true},
  mockUseUnclaimedProject: vi.fn(),
  mockUseWorkspace: vi.fn(),
}))

vi.mock('../../../environment', () => mockEnvironment)
vi.mock('../../workspace', () => ({useWorkspace: mockUseWorkspace}))
vi.mock('../useUnclaimedProject', async (importOriginal) => ({
  ...(await importOriginal()),
  useUnclaimedProject: mockUseUnclaimedProject,
}))

const PROJECT_ID = 'test-project'

function Consumer({name}: {name: string}) {
  const {onClaim, state} = useUnclaimedProjectContext()

  return <button onClick={onClaim}>{`${name}: ${state?.status ?? 'unknown'}`}</button>
}

function renderConsumers(children?: ReactNode) {
  return render(
    <UnclaimedProjectProvider>
      {children ?? (
        <>
          <Consumer name="nudge" />
          <Consumer name="menu" />
        </>
      )}
    </UnclaimedProjectProvider>,
  )
}

describe('UnclaimedProjectProvider', () => {
  beforeEach(() => {
    mockEnvironment.isDev = true
    mockUseWorkspace.mockReturnValue({
      currentUser: {provider: 'sanity-token'},
      projectId: PROJECT_ID,
    })
    mockUseUnclaimedProject.mockReturnValue({
      status: 'unclaimed',
      claimUrl: 'https://www.sanity.io/manage/claim/claim-token',
      expiresAt: new Date(Date.now() + 60_000),
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('shares one lifecycle and claim attempt across all consumers', async () => {
    renderConsumers()

    expect(mockUseUnclaimedProject).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', {name: 'nudge: unclaimed'})).toBeInTheDocument()
    expect(screen.getByRole('button', {name: 'menu: unclaimed'})).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', {name: 'menu: unclaimed'}))

    expect(mockUseUnclaimedProject).toHaveBeenCalledTimes(2)
    expect(mockUseUnclaimedProject).toHaveBeenLastCalledWith({
      claimAttemptedAt: expect.any(Number),
    })
  })

  it('does not run the lifecycle outside development', () => {
    mockEnvironment.isDev = false

    renderConsumers(<Consumer name="consumer" />)

    expect(screen.getByRole('button', {name: 'consumer: unknown'})).toBeInTheDocument()
    expect(mockUseWorkspace).not.toHaveBeenCalled()
    expect(mockUseUnclaimedProject).not.toHaveBeenCalled()
  })
})
