import {BehaviorSubject} from 'rxjs'

import {
  type BroadcastedState,
  type BroadcastedStateStorage,
  createBroadcastState,
} from '../utils/createBroadcastState'
import {type OAuthTokens} from './createOAuthAuthStore'

/**
 * Where the OAuth store keeps its token pair. Besides the pair itself, it knows which session
 * every access token it held belongs to, and which sessions this tab signed out of.
 *
 * A session is identified by `signedInAt`, which a renewal carries over from the pair it renews,
 * so every pair from one sign-in shares it.
 *
 * @internal
 */
export interface OAuthTokenStorage extends Pick<
  BroadcastedState<OAuthTokens>,
  'value' | 'get' | 'update'
> {
  /**
   * The session of the pair that carried `accessToken`, here or in another tab, or `null` when
   * this storage never held it.
   */
  sessionOf(accessToken: string): number | undefined | null
  /**
   * Signs this tab out of the session of `tokens`. A pair from that session that another tab
   * stores later, such as a renewal that was in flight during the logout, is cleared again and
   * handed to `onDiscard`, so a signed-out session never comes back. A new sign-in starts a new
   * session and is taken over as usual.
   */
  endSession(tokens: OAuthTokens): void
}

/**
 * Shared by the tabs of this origin when `persisted` is given: kept in localStorage and
 * broadcast. Without it, the pair stays private to this tab.
 *
 * @internal
 */
export function createOAuthTokenStorage(options: {
  broadcastKey: string
  persisted: BroadcastedStateStorage<OAuthTokens> | undefined
  onDiscard: (tokens: OAuthTokens) => void
}): OAuthTokenStorage {
  const {broadcastKey, persisted, onDiscard} = options
  const sessions = new Map<string, number | undefined>()
  const endedSessions = new Set<number | undefined>()
  const remember = (tokens: OAuthTokens | undefined) => {
    if (tokens) sessions.set(tokens.accessToken, tokens.signedInAt)
  }

  const state = persisted
    ? createBroadcastState<OAuthTokens>(broadcastKey, (current) => current, persisted, {
        accept: (tokens) => {
          if (endedSessions.has(tokens.signedInAt)) {
            onDiscard(tokens)
            return false
          }
          remember(tokens)
          return true
        },
      })
    : createTabState<OAuthTokens>()
  remember(state.get())

  return {
    value: state.value,
    get: state.get,
    update(tokens) {
      remember(tokens)
      state.update(tokens)
    },
    sessionOf: (accessToken) => (sessions.has(accessToken) ? sessions.get(accessToken) : null),
    endSession: (tokens) => {
      endedSessions.add(tokens.signedInAt)
    },
  }
}

/** State kept in this tab only, with the shape of a broadcast state. */
function createTabState<T>(): Pick<BroadcastedState<T>, 'value' | 'get' | 'update'> {
  const subject = new BehaviorSubject<T | undefined>(undefined)
  return {
    value: subject.asObservable(),
    get: () => subject.getValue(),
    update: (value) => subject.next(value),
  }
}
