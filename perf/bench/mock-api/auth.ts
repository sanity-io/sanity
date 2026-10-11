import {BENCH_USER, FAKE_SESSION_ID, FAKE_TOKEN} from '../constants'
import {AUTH_PROBE, AUTH_PROVIDERS} from './project'

export interface AuthRequest {
  method: string
  /** Version-stripped path, e.g. `/users/me`. */
  path: string
  query: URLSearchParams
  /** The raw `authorization` header, if any. */
  authorization: string | undefined
  /**
   * Logged-out scenarios: only requests carrying FAKE_TOKEN are treated as
   * signed in. Off (the default), every request is signed in regardless of
   * credentials — what every recorded scenario has measured since the bench
   * began, so turning this on is strictly per scenario.
   */
  requireToken: boolean
  /**
   * A login callback already exchanged a session id (see `startsSession`).
   * Stands in for the session cookie the real API sets during that exchange:
   * from then on credential-less (cookie) requests are signed in too.
   */
  hasSession: boolean
}

export interface AuthResponse {
  status: number
  body: unknown
  /** This response starts a session (the caller sets `hasSession` from now on). */
  startsSession?: true
}

/**
 * Responses for the auth endpoints (`/users/me`, `/auth/*`), or undefined for
 * any other path. Logged-out responses follow e2e/tests/auth/helpers.ts:
 * `/users/me` answers 200 `{}` (no user) rather than 401, which studio
 * versions of every age read as signed out, and `/auth/id` answers 401.
 */
export function handleAuth(request: AuthRequest): AuthResponse | undefined {
  const {method, path, query, authorization, requireToken, hasSession} = request
  const signedIn = !requireToken || hasSession || authorization === `Bearer ${FAKE_TOKEN}`

  if (path === '/users/me') {
    return {status: 200, body: signedIn ? BENCH_USER : {}}
  }
  if (path === '/auth/id') {
    return signedIn
      ? {status: 200, body: AUTH_PROBE()}
      : {status: 401, body: {statusCode: 401, error: 'Unauthorized', message: 'Unauthorized'}}
  }
  if (path === '/auth/providers') {
    return {status: 200, body: AUTH_PROVIDERS}
  }
  if (path === '/auth/fetch' && method === 'GET') {
    // The login callback: exchange the fake provider's session id for the
    // token. The real API also sets a session cookie here, which the dual
    // login flow probes right after (`/auth/id` with credentials) — hence
    // `startsSession`, since the mock can't set a cookie across origins
    return query.get('sid') === FAKE_SESSION_ID
      ? {status: 200, body: {token: FAKE_TOKEN}, startsSession: true}
      : {status: 401, body: {statusCode: 401, error: 'Unauthorized', message: 'Invalid session'}}
  }
  if (path === '/auth/logout') {
    return {status: 200, body: {ok: true}}
  }
  return undefined
}
