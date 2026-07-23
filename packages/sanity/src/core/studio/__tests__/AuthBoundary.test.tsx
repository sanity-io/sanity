import {act, render, screen, waitFor} from '@testing-library/react'
import {Subject} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {promiseWithResolvers} from '../../util/promiseWithResolvers'
import {type StudioAuthReadyMeasured as StudioAuthReadyMeasuredType} from '../__telemetry__/bootstrap.telemetry'
import {type AuthBoundary as AuthBoundaryType} from '../AuthBoundary'

vi.mock('@sanity/telemetry/react', () => ({
  useTelemetry: vi.fn(),
}))

vi.mock('../activeWorkspaceMatcher', () => ({
  useActiveWorkspace: vi.fn(),
}))

// Minimal stubs for the screen components so we don't pull in heavy deps.
vi.mock('../screens', () => ({
  AuthenticateScreen: () => <div data-testid="authenticate-screen" />,
  NotAuthenticatedScreen: () => <div data-testid="not-authenticated-screen" />,
  RequestAccessScreen: () => <div data-testid="request-access-screen" />,
}))

vi.mock('../../components/loadingBlock', () => ({
  LoadingBlock: () => <div data-testid="loading-block" />,
}))

type AuthState = {
  authenticated: boolean
  currentUser: {roles: unknown[]; provider?: string} | null
}

describe('AuthBoundary login flash gate', () => {
  // A logged-out auth state is ambiguous while the sid → credential exchange
  // (handleCallbackUrl) is in flight: it may be the stale pre-exchange probe
  // result. The boundary must hold the loading screen until the callback
  // settles instead of flashing the login screen.
  let authState$: Subject<AuthState>
  let AuthBoundary: typeof AuthBoundaryType

  beforeEach(async () => {
    vi.resetModules()
    authState$ = new Subject<AuthState>()

    const {useTelemetry} = await import('@sanity/telemetry/react')
    ;(useTelemetry as ReturnType<typeof vi.fn>).mockReturnValue({log: vi.fn()})
    ;({AuthBoundary} = await import('../AuthBoundary'))
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  async function mockWorkspaceAuth(auth: Record<string, unknown>) {
    const {useActiveWorkspace} = await import('../activeWorkspaceMatcher')
    ;(useActiveWorkspace as ReturnType<typeof vi.fn>).mockReturnValue({
      activeWorkspace: {auth: {state: authState$, ...auth}},
    })
  }

  it('holds the loading screen on logged-out while the callback is unsettled, then renders children', async () => {
    const {promise: callback, resolve: resolveCallback} = promiseWithResolvers<unknown>()
    await mockWorkspaceAuth({
      handleCallbackUrl: () => callback,
    })

    render(
      <AuthBoundary>
        <div data-testid="content" />
      </AuthBoundary>,
    )

    // The stale pre-exchange probe result arrives while the exchange is in
    // flight — this is the moment the login screen used to flash.
    act(() => authState$.next({authenticated: false, currentUser: null}))

    await waitFor(() => {
      expect(screen.getByTestId('loading-block')).toBeTruthy()
    })
    expect(screen.queryByTestId('authenticate-screen')).toBeNull()

    // The exchange completes: the state reflects it before the callback
    // resolves (the auth store's settle contract).
    act(() =>
      authState$.next({authenticated: true, currentUser: {roles: [{name: 'administrator'}]}}),
    )
    // Settle inside act: the .finally in the boundary sets state.
    await act(async () => {
      resolveCallback({flow: 'exchange', success: true, loginMethod: 'dual', durationMs: 1})
    })

    await screen.findByTestId('content')
    expect(screen.queryByTestId('authenticate-screen')).toBeNull()
  })

  it('shows the login screen once the callback settles while logged out', async () => {
    await mockWorkspaceAuth({
      handleCallbackUrl: () =>
        Promise.resolve({flow: 'exchange', success: false, loginMethod: 'dual', durationMs: 1}),
    })

    render(
      <AuthBoundary>
        <div data-testid="content" />
      </AuthBoundary>,
    )

    // Async act also flushes the immediately-resolving callback chain, so
    // its setState lands inside act.
    await act(async () => {
      authState$.next({authenticated: false, currentUser: null})
    })

    await screen.findByTestId('authenticate-screen')
  })

  it('does not delay logged-in rendering while the callback is pending', async () => {
    await mockWorkspaceAuth({
      handleCallbackUrl: () => new Promise(() => {}), // never settles
    })

    render(
      <AuthBoundary>
        <div data-testid="content" />
      </AuthBoundary>,
    )

    act(() =>
      authState$.next({authenticated: true, currentUser: {roles: [{name: 'administrator'}]}}),
    )

    await screen.findByTestId('content')
  })

  it('renders the login screen immediately for auth stores without a callback flow', async () => {
    await mockWorkspaceAuth({handleCallbackUrl: undefined})

    render(
      <AuthBoundary>
        <div data-testid="content" />
      </AuthBoundary>,
    )

    act(() => authState$.next({authenticated: false, currentUser: null}))

    await screen.findByTestId('authenticate-screen')
  })

  it('keeps the gate closed across a workspace switch mid-exchange', async () => {
    // The gate tracks WHICH store's callback settled, not a boolean: after a
    // workspace switch, the old store's exchange settling late must not open
    // the gate for the new workspace — only the new store's own callback may.
    const {useActiveWorkspace} = await import('../activeWorkspaceMatcher')

    const callbackA = promiseWithResolvers<unknown>()
    const callbackB = promiseWithResolvers<unknown>()
    const stateB$ = new Subject<AuthState>()
    const authA = {state: authState$, handleCallbackUrl: () => callbackA.promise}
    const authB = {state: stateB$, handleCallbackUrl: () => callbackB.promise}

    const workspaceMock = useActiveWorkspace as ReturnType<typeof vi.fn>
    workspaceMock.mockReturnValue({activeWorkspace: {auth: authA}})

    const {rerender} = render(
      <AuthBoundary>
        <div data-testid="content" />
      </AuthBoundary>,
    )

    act(() => authState$.next({authenticated: false, currentUser: null}))
    expect(screen.getByTestId('loading-block')).toBeTruthy()

    // Switch to workspace B while A's exchange is still in flight.
    workspaceMock.mockReturnValue({activeWorkspace: {auth: authB}})
    rerender(
      <AuthBoundary>
        <div data-testid="content" />
      </AuthBoundary>,
    )
    act(() => stateB$.next({authenticated: false, currentUser: null}))

    // A's exchange settles late: not B's store, so the gate stays closed.
    await act(async () => {
      callbackA.resolve({flow: 'exchange', success: false, loginMethod: 'dual', durationMs: 1})
    })
    expect(screen.getByTestId('loading-block')).toBeTruthy()
    expect(screen.queryByTestId('authenticate-screen')).toBeNull()

    // B's own callback settles: logged-out can now be trusted.
    await act(async () => {
      callbackB.resolve({
        flow: 'already-authenticated',
        success: true,
        loginMethod: 'dual',
        durationMs: 1,
      })
    })
    await screen.findByTestId('authenticate-screen')
  })

  it('does not re-close the gate when a superseded exchange settles after the active one', async () => {
    // Reverse settle order of the test above: B (active) settles first and
    // the login screen shows; A's stale exchange settling later must not
    // overwrite the settled marker and strand B on the loading screen.
    const {useActiveWorkspace} = await import('../activeWorkspaceMatcher')

    const callbackA = promiseWithResolvers<unknown>()
    const callbackB = promiseWithResolvers<unknown>()
    const stateB$ = new Subject<AuthState>()
    const authA = {state: authState$, handleCallbackUrl: () => callbackA.promise}
    const authB = {state: stateB$, handleCallbackUrl: () => callbackB.promise}

    const workspaceMock = useActiveWorkspace as ReturnType<typeof vi.fn>
    workspaceMock.mockReturnValue({activeWorkspace: {auth: authA}})

    const {rerender} = render(
      <AuthBoundary>
        <div data-testid="content" />
      </AuthBoundary>,
    )

    // Switch to workspace B while A's exchange is still in flight.
    workspaceMock.mockReturnValue({activeWorkspace: {auth: authB}})
    rerender(
      <AuthBoundary>
        <div data-testid="content" />
      </AuthBoundary>,
    )
    act(() => stateB$.next({authenticated: false, currentUser: null}))

    // B settles: the gate opens onto the login screen.
    await act(async () => {
      callbackB.resolve({
        flow: 'already-authenticated',
        success: true,
        loginMethod: 'dual',
        durationMs: 1,
      })
    })
    await screen.findByTestId('authenticate-screen')

    // A's superseded exchange settles late: the login screen must survive.
    await act(async () => {
      callbackA.resolve({flow: 'exchange', success: false, loginMethod: 'dual', durationMs: 1})
    })
    expect(screen.getByTestId('authenticate-screen')).toBeTruthy()
    expect(screen.queryByTestId('loading-block')).toBeNull()
  })
})

describe('AuthBoundary telemetry', () => {
  let authState$: Subject<AuthState>
  let telemetryLog: ReturnType<typeof vi.fn>
  let AuthBoundary: typeof AuthBoundaryType
  let StudioAuthReadyMeasured: typeof StudioAuthReadyMeasuredType

  // AuthBoundary.tsx logs two events per auth-state transition:
  // - AuthBoundaryResolved (shipped in #12529) — mount-baseline timing
  // - StudioAuthReadyMeasured (this PR) — navigation-start baseline, one-shot
  // We filter mock calls to the event under test so the assertions are robust
  // to any adjacent telemetry that may land alongside.
  const studioAuthReadyCalls = () =>
    telemetryLog.mock.calls.filter((args) => args[0] === StudioAuthReadyMeasured)

  beforeEach(async () => {
    // Reset the module graph so the module-level `authReadyFired` guard
    // starts fresh each test.
    vi.resetModules()

    authState$ = new Subject<AuthState>()
    telemetryLog = vi.fn()

    const {useTelemetry} = await import('@sanity/telemetry/react')
    ;(useTelemetry as ReturnType<typeof vi.fn>).mockReturnValue({
      log: telemetryLog,
    })

    const {useActiveWorkspace} = await import('../activeWorkspaceMatcher')
    ;(useActiveWorkspace as ReturnType<typeof vi.fn>).mockReturnValue({
      activeWorkspace: {
        auth: {
          state: authState$,
          handleCallbackUrl: undefined,
        },
      },
    })

    ;({AuthBoundary} = await import('../AuthBoundary'))
    ;({StudioAuthReadyMeasured} = await import('../__telemetry__/bootstrap.telemetry'))
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('does not fire Studio Auth Ready Measured while loading', () => {
    render(
      <AuthBoundary>
        <div data-testid="content" />
      </AuthBoundary>,
    )

    // No auth state emitted yet — we should still be loading, so neither
    // auth telemetry event should have fired.
    expect(studioAuthReadyCalls()).toHaveLength(0)
  })

  it('fires Studio Auth Ready Measured once with authState=logged-in', async () => {
    render(
      <AuthBoundary>
        <div data-testid="content" />
      </AuthBoundary>,
    )

    authState$.next({
      authenticated: true,
      currentUser: {roles: [{name: 'administrator'}]},
    })

    await waitFor(() => {
      expect(studioAuthReadyCalls()).toHaveLength(1)
    })

    expect(telemetryLog).toHaveBeenCalledWith(
      StudioAuthReadyMeasured,
      expect.objectContaining({
        authState: 'logged-in',
        durationMs: expect.any(Number),
        // jsdom reports a visible document, so the snapshot is a clean foreground load.
        wasHidden: false,
        visibilityState: 'visible',
        firstHiddenTime: null,
      }),
    )
    expect(studioAuthReadyCalls()[0][1].durationMs).toBeGreaterThanOrEqual(0)
  })

  it('fires Studio Auth Ready Measured with authState=logged-out', async () => {
    render(
      <AuthBoundary>
        <div data-testid="content" />
      </AuthBoundary>,
    )

    authState$.next({authenticated: false, currentUser: null})

    await waitFor(() => {
      expect(studioAuthReadyCalls()).toHaveLength(1)
    })

    expect(telemetryLog).toHaveBeenCalledWith(
      StudioAuthReadyMeasured,
      expect.objectContaining({authState: 'logged-out'}),
    )
  })

  it('fires Studio Auth Ready Measured with authState=unauthorized when user has no roles', async () => {
    render(
      <AuthBoundary>
        <div data-testid="content" />
      </AuthBoundary>,
    )

    authState$.next({
      authenticated: true,
      currentUser: {roles: [], provider: 'google'},
    })

    await waitFor(() => {
      expect(studioAuthReadyCalls()).toHaveLength(1)
    })

    expect(telemetryLog).toHaveBeenCalledWith(
      StudioAuthReadyMeasured,
      expect.objectContaining({authState: 'unauthorized'}),
    )
  })

  it('fires Studio Auth Ready Measured only once even if auth state changes multiple times', async () => {
    render(
      <AuthBoundary>
        <div data-testid="content" />
      </AuthBoundary>,
    )

    authState$.next({
      authenticated: true,
      currentUser: {roles: [{name: 'administrator'}]},
    })

    await waitFor(() => {
      expect(studioAuthReadyCalls()).toHaveLength(1)
    })

    // Subsequent auth state changes must not produce additional
    // StudioAuthReadyMeasured events (module-level one-shot guard).
    authState$.next({authenticated: false, currentUser: null})
    authState$.next({
      authenticated: true,
      currentUser: {roles: [{name: 'administrator'}]},
    })

    // Give any pending effects a chance to run.
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(studioAuthReadyCalls()).toHaveLength(1)
  })
})
