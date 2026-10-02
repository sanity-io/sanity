/**
 * The OAuth store's `handleCallbackUrl` result (`auth.experimental_oauth`).
 *
 * @internal
 */
export interface OAuthCallbackResult {
  loginMethod: 'oauth'
  /**
   * - `'already-authenticated'`: the URL carried no authorization response.
   * - `'exchange'`: an authorization response was handled.
   */
  flow: 'already-authenticated' | 'exchange'
  /** Whether the sign-in completed. */
  success: boolean
  /** Wall-clock time for the callback handling, in milliseconds, excluding the settle wait. */
  durationMs: number
  /** Time spent on the token endpoint. Only set for `'exchange'` flow. */
  exchangeDurationMs?: number
  /** Time from storing the exchanged pair until the state was probed authenticated. */
  stateSettleDurationMs?: number
  /** Whether that wait timed out. The callback resolves anyway, so the UI can't hang. */
  stateSettleTimedOut?: boolean
  /** The RFC 6749 error code or a fixed category. Only set when `success` is `false`. */
  failureReason?: string
  /** Structured error for the AuthBoundary. Only set when `success` is `false`. */
  error?: {
    type: 'auth-failed'
    message: string
  }
}
