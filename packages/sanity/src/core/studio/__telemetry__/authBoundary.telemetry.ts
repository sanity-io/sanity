import {defineEvent} from '@sanity/telemetry'

/** Fired when the AuthBoundary resolves from 'loading' to a final auth state. */
export const AuthBoundaryResolved = defineEvent<{
  durationMs: number
  result: 'logged-in' | 'logged-out' | 'unauthorized'
}>({
  name: 'Auth Boundary Resolved',
  version: 1,
  description: 'Time from AuthBoundary mount until auth state is resolved',
})

/** Fired when handleCallbackUrl completes in the auth store. */
export const SessionTokenExchangeCompleted = defineEvent<{
  hadSessionId: boolean
  loginMethod: string
  path: 'no-session' | 'cookie-auth' | 'token-exchange'
  success: boolean
  durationMs: number
  tokenExchangeDurationMs?: number
  failureReason?: string
}>({
  name: 'Session Token Exchange Completed',
  version: 1,
  description: 'Result of the session token exchange flow in handleCallbackUrl',
})
