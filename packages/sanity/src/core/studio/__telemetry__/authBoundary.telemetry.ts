import {defineEvent} from '@sanity/telemetry'

/** Fired when the AuthBoundary resolves from 'loading' to a final auth state. */
export const AuthBoundaryResolved = defineEvent<{
  durationMs: number
  result: 'logged-in' | 'logged-out' | 'unauthorized' | 'error'
}>({
  name: 'Auth Boundary Resolved',
  version: 2,
  description: 'Time from AuthBoundary mount until auth state is resolved',
})

/** Fired when handleCallbackUrl completes in the auth store. */
export const SessionTokenExchangeCompleted = defineEvent<{
  loginMethod: 'dual' | 'cookie' | 'token'
  flow: 'already-authenticated' | 'exchange'
  success: boolean
  durationMs: number
  exchangeDurationMs?: number
  probeDurationMs?: number
  authMethod?: 'cookie' | 'token'
  failureReason?: string
}>({
  name: 'Session Token Exchange Completed',
  version: 2,
  description: 'Result of the auth exchange flow in handleCallbackUrl',
})
