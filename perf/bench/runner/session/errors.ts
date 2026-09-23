/**
 * Session failure taxonomy, in its own leaf module so both the session
 * implementations (interaction/pageLoad/inp/soak) and the shared navigation
 * helper can throw typed failures without an import cycle.
 */

export type SessionFailureReason =
  | 'readiness-timeout'
  | 'probe-timeout'
  | 'page-error'
  | 'console-error'
  | 'hermeticity-violation'
  | 'sample-count-mismatch'
  | 'readback-mismatch'
  | 'unexpected-endpoint'

export class SessionError extends Error {
  constructor(
    public reason: SessionFailureReason,
    message: string,
    public diagnostics: string[] = [],
  ) {
    super(`[${reason}] ${message}`)
    this.name = 'SessionError'
  }
}
