import {LayerProvider, ThemeProvider} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'
import {buildTheme} from '@sanity/ui/theme'
import {act, render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {type ReactNode} from 'react'
import {of} from 'rxjs'
import {WorkspacesContext} from 'sanity/_singletons'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {createMockSanityClientAsClient} from '../../../../../../../test/mocks/mockSanityClient'
import {prepareConfig} from '../../../../../config/prepareConfig'
import {type WorkspaceOptions, type WorkspaceSummary} from '../../../../../config/types'
import {_createLegacyAuthStore} from '../../../../../store/auth/legacy/createLegacyAuthStore'
import {createMockAuthStore} from '../../../../../store/auth/mock/createMockAuthStore'
import {type AuthStore} from '../../../../../store/auth/types'
import {UnclaimedProjectProvider} from '../../../../unclaimedProject/UnclaimedProjectProvider'
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
vi.mock('../../../../unclaimedProject/useUnclaimedProject', async (importOriginal) => ({
  ...(await importOriginal()),
  useUnclaimedProject: mockUseUnclaimedProject,
}))
vi.mock('../../../../workspace', () => ({useWorkspace: mockUseWorkspace}))

const theme = buildTheme()
const CLAIM_URL = 'https://www.sanity.io/manage/claim/claim-token'
const PROJECT_ID = 'test-project'
const SECOND_PROJECT_ID = 'second-project'

let workspaces: WorkspaceSummary[] = []

function createStore(logout?: AuthStore['logout']): AuthStore {
  const store = createMockAuthStore({client: createMockSanityClientAsClient(), currentUser: null})
  return logout ? {...store, logout} : store
}

/** The store a Studio hosted in the dashboard gets: the dashboard hands it its token. */
function createDashboardStore(projectId: string, refreshDashboardToken?: () => void): AuthStore {
  return _createLegacyAuthStore({
    projectId,
    dataset: 'production',
    getSessionId: () => undefined,
    consumeHashToken: () => undefined,
    observeWorkbenchToken: () => of('dashboard-token'),
    refreshWorkbenchToken: refreshDashboardToken,
  })
}

/**
 * Each workspace gets its own project unless a test says otherwise: workspaces on one project with
 * different stores are a misconfiguration that `prepareConfig` warns about.
 */
function createWorkspace(name: string, overrides: Partial<WorkspaceOptions>): WorkspaceOptions {
  return {
    name,
    basePath: `/${name}`,
    projectId: `${name}-project`,
    dataset: 'production',
    ...overrides,
  }
}

/**
 * Resolves the workspaces the way the Studio does, so each summary carries the store it gets. The
 * first one is the active workspace.
 */
function setWorkspaces(...options: WorkspaceOptions[]) {
  workspaces = prepareConfig(options).workspaces
  setActiveWorkspace(workspaces[0].projectId)
}

function setActiveWorkspace(projectId: string) {
  mockUseWorkspace.mockReturnValue({
    auth: workspaces[0].auth,
    currentUser: {provider: 'sanity-token'},
    projectId,
  })
}

const wrapper = ({children}: {children: ReactNode}) => (
  <ThemeProvider theme={theme}>
    <LayerProvider>
      <WorkspacesContext.Provider value={workspaces}>
        <UnclaimedProjectProvider>{children}</UnclaimedProjectProvider>
      </WorkspacesContext.Provider>
    </LayerProvider>
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
    setWorkspaces(
      createWorkspace('default', {auth: createStore(mockLogout), projectId: PROJECT_ID}),
    )
  })

  afterEach(() => {
    vi.useRealTimers()
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

  it('replaces the claim action with sign out at the local expiry', async () => {
    vi.useFakeTimers()
    const now = new Date('2026-08-14T12:00:00.000Z')
    vi.setSystemTime(now)
    mockUseUnclaimedProject.mockReturnValue({
      status: 'unclaimed',
      claimUrl: CLAIM_URL,
      expiresAt: new Date(now.getTime() + 1_000),
    })
    renderAction('drawer')
    expect(screen.getByRole('link', {name: 'Claim this project'})).toBeInTheDocument()

    await act(() => vi.advanceTimersByTimeAsync(1_000))

    expect(screen.getByRole('button', {name: 'Sign out'})).toBeInTheDocument()
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

    setActiveWorkspace(SECOND_PROJECT_ID)
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
    setWorkspaces(createWorkspace('default', {auth: createStore()}))

    const {container} = render(<UserMenuAuthAction layout="drawer" />, {wrapper})

    expect(container).toBeEmptyDOMElement()
  })

  describe('sign out', () => {
    async function clickSignOut() {
      renderAction('menu')
      await userEvent.click(screen.getByRole('menuitem', {name: 'Sign out'}))
    }

    function resolved() {
      return vi.fn(() => Promise.resolve())
    }

    it('signs out of every workspace, hidden ones and other projects included', async () => {
      const [active, other, hidden] = [resolved(), resolved(), resolved()]
      setWorkspaces(
        createWorkspace('active', {auth: createStore(active)}),
        createWorkspace('other', {auth: createStore(other)}),
        createWorkspace('hidden', {auth: createStore(hidden), hidden: true}),
      )

      await clickSignOut()

      for (const logout of [active, other, hidden]) {
        expect(logout).toHaveBeenCalledTimes(1)
        // `logout` takes options; the click event must not reach it.
        expect(logout).toHaveBeenCalledWith()
      }
    })

    it('signs out of a store that several workspaces share once', async () => {
      const shared = createStore(resolved())
      setWorkspaces(
        createWorkspace('first', {auth: shared, projectId: PROJECT_ID}),
        createWorkspace('second', {auth: shared, projectId: PROJECT_ID}),
      )

      await clickSignOut()

      expect(shared.logout).toHaveBeenCalledTimes(1)
    })

    it('skips other stores without logout', async () => {
      const active = resolved()
      setWorkspaces(
        createWorkspace('active', {auth: createStore(active)}),
        createWorkspace('without-logout', {auth: createStore()}),
      )

      await clickSignOut()

      expect(active).toHaveBeenCalledTimes(1)
    })

    it('starts signing out of the active workspace first', async () => {
      // Another store on the same project would otherwise tell the active store about its sign-out
      // before the active store has marked its own, and a `redirectOnSingle` login screen would
      // then send the user back to the provider.
      const [active, other] = [resolved(), resolved()]
      setWorkspaces(
        createWorkspace('active', {auth: createStore(active)}),
        createWorkspace('other', {auth: createStore(other)}),
      )

      await clickSignOut()

      expect(active).toHaveBeenCalledTimes(1)
      expect(other).toHaveBeenCalledTimes(1)
      expect(active.mock.invocationCallOrder[0]).toBeLessThan(other.mock.invocationCallOrder[0])
    })

    it.each([
      ['rejects', () => Promise.reject(new Error('revoke failed'))],
      [
        'throws',
        () => {
          throw new Error('revoke failed')
        },
      ],
    ] as const)('signs out of the other stores when one of them %s', async (_, fail) => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const failing = vi.fn(fail)
      const [active, other] = [resolved(), resolved()]
      setWorkspaces(
        createWorkspace('active', {auth: createStore(active)}),
        createWorkspace('failing', {auth: createStore(failing)}),
        createWorkspace('other', {auth: createStore(other)}),
      )

      await clickSignOut()

      expect(failing).toHaveBeenCalledTimes(1)
      expect(other).toHaveBeenCalledTimes(1)
      expect(active).toHaveBeenCalledTimes(1)
      expect(warn).toHaveBeenCalledWith('[sanity] Sign out failed:', new Error('revoke failed'))
      warn.mockRestore()
    })

    it('leaves stores of a dashboard-hosted workspace alone', async () => {
      const refreshDashboardToken = vi.fn()
      const active = resolved()
      setWorkspaces(
        createWorkspace('active', {auth: createStore(active)}),
        createWorkspace('dashboard', {
          auth: createDashboardStore('dashboard-project', refreshDashboardToken),
        }),
      )

      await clickSignOut()

      expect(active).toHaveBeenCalledTimes(1)
      expect(refreshDashboardToken).not.toHaveBeenCalled()
    })

    it.each([
      ['has no logout', () => createStore()],
      ['is hosted in the dashboard', () => createDashboardStore('active-project')],
    ])(
      'renders no sign out when the active workspace %s, even if another can sign out',
      (_, createActiveStore) => {
        const other = resolved()
        setWorkspaces(
          createWorkspace('active', {auth: createActiveStore()}),
          createWorkspace('other', {auth: createStore(other)}),
        )

        const {container} = render(<UserMenuAuthAction layout="drawer" />, {wrapper})

        expect(container).toBeEmptyDOMElement()
      },
    )
  })
})
