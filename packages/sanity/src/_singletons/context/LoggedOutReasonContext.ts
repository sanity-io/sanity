import {createContext} from 'sanity/_createContext'

/**
 * Why the studio last logged the user out, surfaced on the auth screen as a
 * banner above the login form. `undefined` when the logged-out state isn't the
 * result of a forced logout (e.g. a normal cold load with no session).
 *
 * Currently a single-member union: forced logout only happens on API-tagged
 * session expiry (`SIO-401-AEX`). Kept as a union so future reasons slot in.
 *
 * @internal
 */
export type LoggedOutReason = 'session-expired'

/** @internal */
export const LoggedOutReasonContext = createContext<LoggedOutReason | undefined>(
  'sanity/_singletons/context/logged-out-reason',
  undefined,
)
