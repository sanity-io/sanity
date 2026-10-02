import {type LoginMethod} from '../../../config/auth/types'

/**
 * The classic store's `handleCallbackUrl` result (`createClassicAuthStore`, and custom
 * auth stores).
 *
 * @internal
 */
export interface ClassicCallbackResult {
  /** The login method configured for this auth store (e.g. `'cookie'` or `'token'`). */
  loginMethod: LoginMethod
  /**
   * Which auth flow was taken:
   * - `'already-authenticated'`: No sid in hash - user was already authenticated or not.
   * - `'exchange'`: sid was present, went through /auth/exchange + probe flow.
   */
  flow: 'already-authenticated' | 'exchange'
  /** Whether the auth flow completed successfully. */
  success: boolean
  /** Total wall-clock time for the callback handling, in milliseconds. */
  durationMs: number
  /** Time spent on the /auth/exchange call specifically. Only set for `'exchange'` flow. */
  exchangeDurationMs?: number
  /** Time spent on the /users/me probe calls. Only set for `'exchange'` flow. */
  probeDurationMs?: number
  /** Which auth method was selected by the probes. Only set when `success` is `true` and flow is `'exchange'`. */
  authMethod?: 'cookie' | 'token'
  /**
   * Time from applying the exchanged credential until the post-exchange
   * state was probed and emitted. Only set for the successful `'exchange'`
   * flow, whose resolution is deferred until the state reflects the exchange.
   * Not included in `durationMs`, which keeps its original meaning
   * (exchange + probe) for cross-release comparability.
   */
  stateSettleDurationMs?: number
  /**
   * Whether the post-exchange probe timed out before completing. The
   * callback resolved anyway so the UI can't hang, but the current auth
   * state may not reflect the exchange yet.
   */
  stateSettleTimedOut?: boolean
  /** Human-readable reason for failure. Only set when `success` is `false`. */
  failureReason?: string
  /**
   * Structured error for the AuthBoundary to render appropriate UI.
   * Only set when `success` is `false` and flow is `'exchange'`.
   *
   * - `'cookie-blocked'`: cookie-only mode and the cookie probe failed.
   *   The browser likely has strict cookie policies.
   * - `'auth-failed'`: all probe methods failed. The user should retry.
   */
  error?: {
    type: 'cookie-blocked' | 'auth-failed'
    message: string
  }
}
