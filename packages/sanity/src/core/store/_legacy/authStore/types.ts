import {SanityClient} from '@sanity/client'
import {CurrentUser} from '@sanity/types'
import {Observable} from 'rxjs'
import {WorkspaceSummary} from '../../../config'

/**
 * The interface used by the Studio that produces a `SanityClient` and
 * `CurrentUser` that gets passed to the resulting `Workspace`s and `Source`s.
 *
 * NOTE: This interface is primarily for internal use. Refer to
 * `createAuthStore` instead.
 *
 * @internal
 */
export interface AuthStore {
  /**
   * Emits `AuthState`s. This should update when the user's auth state changes.
   * E.g. After a login, a new `AuthState` could be emitted with a non-null
   * `currentUser` and `authenticated: true`
   *
   * NOTE: all auth store implementations should emit on subscribe using
   * something like shareReplay(1) to ensure all new subscribers get an
   * `AuthState` value on subscribe
   */
  state: Observable<AuthState>
  /**
   * Emits auth tokens, or `null` if not configured to use them or they do not exist
   */
  token?: Observable<string | null>
  /**
   * Custom auth stores are expected to implement a UI that initiates the user's
   * authentication. For the typical case in `createAuthStore`, this means
   * loading the providers and showing them as options to the user.
   */
  LoginComponent?: React.ComponentType<LoginComponentProps>
  /**
   * Custom auth stores can implement a function that runs when the user logs
   * out. The implementation is expected to remove all credentials both locally
   * and on the server.
   */
  logout?: () => void
  /**
   * Custom auth stores can implement a function that is designated to run when
   * the Studio loads (e.g. to trade a session ID for a token in cookie-less
   * mode). Within the Studio, this is called within the `AuthBoundary`.
   */
  handleCallbackUrl?: () => Promise<void>
}

/**
 * The unit an `AuthStore` emits to determine the user's authentication state.
 *
 * @internal
 */
export interface AuthState {
  /**
   * Similar to a logged-in flag. This state is used in places like the
   * `AuthBoundary` to determine whether or not it should render the
   * `NotAuthenticatedComponent`. Implementers may choose to set this to `true`
   * while also also emitting a `currentUser` of `null` if a `null` user is
   * accepted (e.g. a project that doesn't require a login)
   */
  authenticated: boolean
  /**
   * The value of the user logged in or `null` if none is provided
   */
  currentUser: CurrentUser | null
  /**
   * A client that is expected to be pre-configured to allow for any downstream
   * requests in the Studio
   */
  client: SanityClient
}

/** @internal */
export type LoginComponentProps = Omit<WorkspaceSummary, 'type' | '__internal'>
