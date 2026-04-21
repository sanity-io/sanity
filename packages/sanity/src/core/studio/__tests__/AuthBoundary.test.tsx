import {render, waitFor} from '@testing-library/react'
import {Subject} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

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

describe('AuthBoundary telemetry', () => {
  let authState$: Subject<AuthState>
  let telemetryLog: ReturnType<typeof vi.fn>
  let AuthBoundary: typeof AuthBoundaryType
  let StudioAuthReadyMeasured: typeof StudioAuthReadyMeasuredType

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

    // No auth state emitted yet — we should still be loading.
    expect(telemetryLog).not.toHaveBeenCalled()
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
      expect(telemetryLog).toHaveBeenCalledTimes(1)
    })

    expect(telemetryLog).toHaveBeenCalledWith(
      StudioAuthReadyMeasured,
      expect.objectContaining({
        authState: 'logged-in',
        durationMs: expect.any(Number),
      }),
    )
    expect(telemetryLog.mock.calls[0][1].durationMs).toBeGreaterThanOrEqual(0)
  })

  it('fires Studio Auth Ready Measured with authState=logged-out', async () => {
    render(
      <AuthBoundary>
        <div data-testid="content" />
      </AuthBoundary>,
    )

    authState$.next({authenticated: false, currentUser: null})

    await waitFor(() => {
      expect(telemetryLog).toHaveBeenCalledTimes(1)
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
      expect(telemetryLog).toHaveBeenCalledTimes(1)
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
      expect(telemetryLog).toHaveBeenCalledTimes(1)
    })

    // Subsequent auth state changes must not produce additional events.
    authState$.next({authenticated: false, currentUser: null})
    authState$.next({
      authenticated: true,
      currentUser: {roles: [{name: 'administrator'}]},
    })

    // Give any pending effects a chance to run.
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(telemetryLog).toHaveBeenCalledTimes(1)
  })
})
