import {type SanityClient} from '@sanity/client'
import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {act, render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {Subject} from 'rxjs'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {RequestAccessScreen} from '../RequestAccessScreen'

vi.mock('../../activeWorkspaceMatcher/useActiveWorkspace', () => ({
  useActiveWorkspace: vi.fn(),
}))

interface AuthStateStub {
  currentUser: {name: string; email: string; provider?: string} | null
  client: SanityClient
}

function makeClient(projectId: string): SanityClient {
  const client = {
    config: () => ({projectId}),
    withConfig: (): unknown => client,
    request: vi.fn(() => Promise.resolve([])),
  }
  return client as unknown as SanityClient
}

const theme = buildTheme()
const currentUser = {
  name: 'Test User',
  email: 'test@example.com',
  provider: 'google',
}

/**
 * Suspense recovery requires the initial render to happen inside an awaited
 * `act`, otherwise React never attaches the promise ping and the boundary
 * stays stuck on the fallback.
 */
async function renderScreen() {
  // oxlint-disable-next-line testing-library/no-unnecessary-act -- see doc comment
  await act(async () => {
    render(
      <ThemeProvider theme={theme}>
        <RequestAccessScreen />
      </ThemeProvider>,
    )
  })
}

describe('RequestAccessScreen', () => {
  let authState$: Subject<AuthStateStub>
  const logout = vi.fn()

  beforeEach(async () => {
    vi.clearAllMocks()
    authState$ = new Subject<AuthStateStub>()
    const {useActiveWorkspace} = await import('../../activeWorkspaceMatcher/useActiveWorkspace')
    ;(useActiveWorkspace as ReturnType<typeof vi.fn>).mockReturnValue({
      activeWorkspace: {auth: {state: authState$, logout}},
    })
  })

  it('shows a loading block until auth emits, then the shared request-access form', async () => {
    await renderScreen()
    expect(screen.getByTestId('loading-block')).toBeInTheDocument()

    await act(async () => {
      authState$.next({currentUser, client: makeClient('projectA')})
    })

    expect(await screen.findByRole('form', {name: 'Request access'})).toBeInTheDocument()
  })

  it('keeps in-progress form state when auth re-emits a new client for the same project', async () => {
    await renderScreen()
    await act(async () => {
      authState$.next({currentUser, client: makeClient('projectA')})
    })

    const note = await screen.findByRole('textbox', {name: 'Message'})
    await userEvent.type(note, 'please let me in')

    await act(async () => {
      authState$.next({currentUser, client: makeClient('projectA')})
    })
    expect(screen.getByRole('textbox', {name: 'Message'})).toHaveValue('please let me in')
  })

  it('delegates sign-out to the workspace auth store', async () => {
    await renderScreen()
    await act(async () => {
      authState$.next({currentUser, client: makeClient('projectA')})
    })

    await userEvent.click(await screen.findByRole('button', {name: /Sign out/}))
    expect(logout).toHaveBeenCalledTimes(1)
  })
})
