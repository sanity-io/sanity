import {ThemeProvider, ToastProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {act, render, screen} from '@testing-library/react'
import {type ReactNode} from 'react'
import {Subject} from 'rxjs'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {type AccessRequest, RequestAccessScreen} from '../RequestAccessScreen'

vi.mock('../../activeWorkspaceMatcher/useActiveWorkspace', () => ({
  useActiveWorkspace: vi.fn(),
}))

// Leaf chrome that pulls in i18n — irrelevant to the behavior under test.
vi.mock('../../../../ui-components/button/Button', () => ({
  Button: (props: {text?: string; onClick?: () => void}) => (
    <button type="button" onClick={props.onClick}>
      {props.text}
    </button>
  ),
}))
vi.mock('../../../../ui-components/dialog/Dialog', () => ({
  Dialog: (props: {children?: ReactNode}) => <div data-testid="dialog">{props.children}</div>,
}))
vi.mock('../../../components/loadingBlock/LoadingBlock', () => ({
  LoadingBlock: () => <div data-testid="loading-block" />,
}))

interface AuthStateStub {
  currentUser: {name: string; email: string; provider?: string}
  client: unknown
}

function makeClient(projectId: string, requests$: Subject<AccessRequest[] | null>) {
  const client: Record<string, unknown> = {
    config: () => ({projectId}),
    observable: {request: () => requests$},
    request: vi.fn(() => Promise.resolve(null)),
  }
  client.withConfig = () => client
  return client
}

/**
 * Suspense recovery requires the initial render to happen inside an awaited
 * `act`, otherwise React never attaches the promise ping and the boundary
 * stays stuck on the fallback.
 */
const theme = buildTheme()

async function renderAsync(ui: ReactNode) {
  let result!: ReturnType<typeof render>
  // oxlint-disable-next-line testing-library/no-unnecessary-act
  await act(async () => {
    result = render(
      <ThemeProvider theme={theme}>
        <ToastProvider>{ui}</ToastProvider>
      </ThemeProvider>,
    )
  })
  return result
}

describe('RequestAccessScreen', () => {
  let authState$: Subject<AuthStateStub>

  beforeEach(async () => {
    vi.clearAllMocks()
    authState$ = new Subject<AuthStateStub>()
    const {useActiveWorkspace} = await import('../../activeWorkspaceMatcher/useActiveWorkspace')
    ;(useActiveWorkspace as ReturnType<typeof vi.fn>).mockReturnValue({
      activeWorkspace: {auth: {state: authState$, logout: vi.fn()}},
    })
  })

  it('keeps in-progress form state when auth re-emits a new client (re-suspension)', async () => {
    const currentUser = {name: 'Test User', email: 'test@example.com'}
    const requestsA$ = new Subject<AccessRequest[] | null>()
    const requestsB$ = new Subject<AccessRequest[] | null>()
    const clientA = makeClient('projectA', requestsA$)
    const clientB = makeClient('projectA', requestsB$)

    await renderAsync(<RequestAccessScreen />)

    // Before auth emits: loading block (early return, no form yet).
    expect(screen.getByTestId('loading-block')).toBeTruthy()

    await act(async () => {
      authState$.next({currentUser, client: clientA})
    })
    // Access requests still pending: Suspense fallback.
    expect(screen.getByTestId('loading-block')).toBeTruthy()

    await act(async () => {
      requestsA$.next([])
    })
    const input = (await screen.findByPlaceholderText('Add your note…')) as HTMLInputElement

    // User types a note.
    await act(async () => {
      const setValue = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value',
      )!.set!
      setValue.call(input, 'please let me in')
      input.dispatchEvent(new Event('input', {bubbles: true}))
    })
    expect((screen.getByPlaceholderText('Add your note…') as HTMLInputElement).value).toBe(
      'please let me in',
    )

    // Auth re-emits with a NEW client identity: new observable, new promise,
    // the boundary re-suspends into the fallback...
    await act(async () => {
      authState$.next({currentUser, client: clientB})
    })
    expect(screen.getByTestId('loading-block')).toBeTruthy()

    // ...and once the new client's access requests resolve, the form returns
    // with the in-progress note intact (content was hidden, not unmounted).
    await act(async () => {
      requestsB$.next([])
    })
    expect(((await screen.findByPlaceholderText('Add your note…')) as HTMLInputElement).value).toBe(
      'please let me in',
    )
  })
})
