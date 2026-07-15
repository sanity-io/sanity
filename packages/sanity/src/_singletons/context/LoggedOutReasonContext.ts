import {createContext} from 'sanity/_createContext'

/**
 * Why the studio last logged the user out, surfaced on the auth screen as a
 * banner above the login form. `undefined` when the logged-out state isn't the
 * result of a forced logout (e.g. a normal cold load with no session).
 *
 * Mirrors the API's invalid-session 401 codes: `session-expired` for
 * `SIO-401-AEX`, `session-not-found` for `SIO-401-ANF` (session revoked,
 * purged, or the stored token is stale).
 *
 * @internal
 */
export type LoggedOutReason = 'session-expired' | 'session-not-found'

/** @internal */
export const LoggedOutReasonContext = createContext<LoggedOutReason | undefined>(
  'sanity/_singletons/context/logged-out-reason',
  undefined,
)
