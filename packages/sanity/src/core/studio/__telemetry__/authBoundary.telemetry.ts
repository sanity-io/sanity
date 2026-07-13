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

/**
 * Fired when handleCallbackUrl completes in the auth store.
 *
 * Successful exchange flows resolve only after the post-exchange auth state
 * has been probed (with the exchanged credential) and handed to the state
 * chain, but `durationMs` deliberately keeps its original meaning (exchange
 * + probe, excluding that settle wait) so aggregations stay comparable
 * across releases — hence no version bump. The settle wait is reported
 * separately in the additive `stateSettleDurationMs` / `stateSettleTimedOut`
 * fields.
 */
export const SessionTokenExchangeCompleted = defineEvent<{
  loginMethod: 'dual' | 'cookie' | 'token'
  flow: 'already-authenticated' | 'exchange'
  success: boolean
  durationMs: number
  exchangeDurationMs?: number
  probeDurationMs?: number
  authMethod?: 'cookie' | 'token'
  failureReason?: string
  stateSettleDurationMs?: number
  stateSettleTimedOut?: boolean
}>({
  name: 'Session Token Exchange Completed',
  version: 2,
  description: 'Result of the auth exchange flow in handleCallbackUrl',
})
