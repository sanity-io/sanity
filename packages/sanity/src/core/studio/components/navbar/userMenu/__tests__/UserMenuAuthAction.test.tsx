import {LayerProvider, ThemeProvider} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'
import {buildTheme} from '@sanity/ui/theme'
import {render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {type ReactNode} from 'react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {UserMenuAuthAction} from '../UserMenuAuthAction'

const {mockEnvironment, mockLogout, mockUseUnclaimedProject, mockUseWorkspace} = vi.hoisted(() => ({
  mockEnvironment: {isDev: true},
  mockLogout: vi.fn(),
  mockUseUnclaimedProject: vi.fn(),
  mockUseWorkspace: vi.fn(),
}))

vi.mock('../../../../../environment', () => mockEnvironment)
vi.mock('../../../../../i18n/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) =>
      key === 'user-menu.action.claim-project' ? 'Claim this project' : 'Sign out',
  }),
}))
vi.mock('../../../../unclaimedProject/useUnclaimedProject', () => ({
  useUnclaimedProject: mockUseUnclaimedProject,
}))
vi.mock('../../../../workspace', () => ({useWorkspace: mockUseWorkspace}))

const theme = buildTheme()
const CLAIM_URL = 'https://www.sanity.io/manage/claim/claim-token'
const PROJECT_ID = 'test-project'
const SECOND_PROJECT_ID = 'second-project'
const wrapper = ({children}: {children: ReactNode}) => (
  <ThemeProvider theme={theme}>
    <LayerProvider>{children}</LayerProvider>
  </ThemeProvider>
)

function renderAction(layout: 'drawer' | 'menu') {
  return render(
    layout === 'menu' ? (
      <Menu>
        <UserMenuAuthAction layout={layout} />
      </Menu>
    ) : (
      <UserMenuAuthAction layout={layout} />
    ),
    {wrapper},
  )
}

describe('UserMenuAuthAction', () => {
  beforeEach(() => {
    mockEnvironment.isDev = true
    mockUseUnclaimedProject.mockReturnValue(undefined)
    mockUseWorkspace.mockReturnValue({
      auth: {logout: mockLogout},
      projectId: PROJECT_ID,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it.each(['menu', 'drawer'] as const)(
    'links to the claim flow in the %s for a provisioned robot session',
    (layout) => {
      mockUseUnclaimedProject.mockReturnValue({
        status: 'unclaimed',
        claimUrl: CLAIM_URL,
        expiresAt: new Date(Date.now() + 60_000),
      })

      renderAction(layout)

      const claimAction = screen.getByRole(layout === 'menu' ? 'menuitem' : 'link', {
        name: 'Claim this project',
      })
      expect(claimAction).toHaveAttribute('href', CLAIM_URL)
      expect(claimAction).toHaveAttribute('target', '_blank')
      expect(claimAction).toHaveAttribute('rel', 'noopener noreferrer')
      expect(screen.queryByText('Sign out')).not.toBeInTheDocument()
    },
  )

  it('keeps sign out for robot sessions without minted-project provenance', async () => {
    renderAction('menu')
    await userEvent.click(screen.getByRole('menuitem', {name: 'Sign out'}))

    expect(mockLogout).toHaveBeenCalledTimes(1)
  })

  it.each(['claimed', 'expired'] as const)(
    'keeps sign out when the project is %s even when mint provenance remains',
    (status) => {
      mockUseUnclaimedProject.mockReturnValue({status})

      renderAction('drawer')

      expect(screen.getByRole('button', {name: 'Sign out'})).toBeInTheDocument()
      expect(screen.queryByText('Claim this project')).not.toBeInTheDocument()
    },
  )

  it('replaces the claim action when the live project state changes to claimed', () => {
    mockUseUnclaimedProject.mockReturnValue({
      status: 'unclaimed',
      claimUrl: CLAIM_URL,
      expiresAt: new Date(Date.now() + 60_000),
    })
    const {unmount} = renderAction('menu')
    expect(screen.getByRole('menuitem', {name: 'Claim this project'})).toBeInTheDocument()

    unmount()
    mockUseUnclaimedProject.mockReturnValue({status: 'claimed'})
    renderAction('menu')

    expect(screen.getByRole('menuitem', {name: 'Sign out'})).toBeInTheDocument()
    expect(screen.queryByText('Claim this project')).not.toBeInTheDocument()
  })

  it('starts elevated status polling when the claim action is opened', async () => {
    mockUseUnclaimedProject.mockReturnValue({
      status: 'unclaimed',
      claimUrl: CLAIM_URL,
      expiresAt: new Date(Date.now() + 60_000),
    })
    renderAction('menu')

    await userEvent.click(screen.getByRole('menuitem', {name: 'Claim this project'}))

    expect(mockUseUnclaimedProject).toHaveBeenLastCalledWith({
      claimAttemptedAt: expect.any(Number),
    })
  })

  it('does not carry elevated polling into another workspace', async () => {
    mockUseUnclaimedProject.mockReturnValue({
      status: 'unclaimed',
      claimUrl: CLAIM_URL,
      expiresAt: new Date(Date.now() + 60_000),
    })
    renderAction('drawer')
    const claimAction = screen.getByRole('link', {name: 'Claim this project'})
    await userEvent.click(claimAction)
    expect(mockUseUnclaimedProject).toHaveBeenLastCalledWith({
      claimAttemptedAt: expect.any(Number),
    })

    mockUseWorkspace.mockReturnValue({
      auth: {logout: mockLogout},
      projectId: SECOND_PROJECT_ID,
    })
    await userEvent.click(claimAction)

    expect(mockUseUnclaimedProject).toHaveBeenLastCalledWith({claimAttemptedAt: undefined})
  })

  it('keeps sign out outside dev even for a provisioned robot session', () => {
    mockEnvironment.isDev = false
    mockUseUnclaimedProject.mockReturnValue({
      status: 'unclaimed',
      claimUrl: CLAIM_URL,
      expiresAt: new Date(Date.now() + 60_000),
    })

    renderAction('menu')

    expect(screen.getByRole('menuitem', {name: 'Sign out'})).toBeInTheDocument()
    expect(screen.queryByText('Claim this project')).not.toBeInTheDocument()
    expect(mockUseUnclaimedProject).not.toHaveBeenCalled()
  })

  it('renders no action when neither claim nor sign out is available', () => {
    mockUseWorkspace.mockReturnValue({
      auth: {},
      projectId: PROJECT_ID,
    })

    const {container} = render(<UserMenuAuthAction layout="drawer" />, {wrapper})

    expect(container).toBeEmptyDOMElement()
  })
})
