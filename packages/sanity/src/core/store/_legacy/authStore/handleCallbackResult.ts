/** @internal */
export interface HandleCallbackResult {
  hadSessionId: boolean
  loginMethod: string
  path: 'no-session' | 'cookie-auth' | 'token-exchange'
  success: boolean
  durationMs: number
  tokenExchangeDurationMs?: number
  failureReason?: string
}
