import {type SanityClient} from '@sanity/client'
import {type CurrentUser} from '@sanity/types'
import {NEVER, type Observable, of, throwError} from 'rxjs'

/**
 * A fabricated Sanity **Access API**, for the Stubbed lane.
 *
 * ## What this stands in for, and why it cannot be reached otherwise
 *
 * `RequestAccessScreen` talks to two endpoints on the Sanity backend that no other part of the
 * studio touches:
 *
 *   GET  /access/requests/me              — every access request the signed-in user has made
 *   POST /access/project/:projectId/requests — submit a new one
 *
 * Reaching them for real requires being authenticated as a user who has **zero roles on the
 * project being opened**, through a third-party identity provider. There is no configuration,
 * no fixture and no dataset that produces that: it is a property of the account you are signed
 * in as, resolved server-side. So the screen is invisible from a story, from a dev studio, and
 * from anything short of maintaining a second Sanity account deliberately locked out of a
 * project.
 *
 * That is what puts its stories in the Stubbed lane rather than the Studio lane. The component
 * is real and shipped; the endpoint underneath it is invented here.
 *
 * ## The relative-date trap
 *
 * The screen classifies a request by age:
 *
 *   isAfter(addWeeks(new Date(request.createdAt), 2), new Date())   → pending
 *   isBefore(addWeeks(new Date(request.createdAt), 2), new Date())  → expired
 *
 * A fixture with a hardcoded `createdAt` therefore renders as *pending* when it is written and
 * silently becomes *expired* two weeks later — same story, same name, different screen, no gate
 * anywhere that would notice. So every timestamp here is computed as an offset from the moment
 * the story renders, and `daysAgo` is the only way to build one.
 */

/** A timestamp N days before now. Never write a literal date into an access-request fixture. */
export function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

/** Mirrors the `AccessRequest` interface exported by RequestAccessScreen.tsx. */
export interface StubAccessRequest {
  id: string
  status: 'pending' | 'accepted' | 'declined'
  resourceId: string
  resourceType: 'project'
  createdAt: string
  updatedAt: string
  updatedByUserId: string
  requestedByUserId: string
  requestedRole: string
  type: 'access' | 'role'
  note: string
}

export const STUB_PROJECT_ID = 'acme3x9k'

export function accessRequest(
  partial: Partial<StubAccessRequest> & Pick<StubAccessRequest, 'status' | 'createdAt'>,
): StubAccessRequest {
  return {
    id: `req-${partial.status}-${partial.createdAt}`,
    resourceId: STUB_PROJECT_ID,
    resourceType: 'project',
    updatedAt: partial.createdAt,
    updatedByUserId: 'u-admin',
    requestedByUserId: 'u-ada',
    requestedRole: 'viewer',
    type: 'access',
    note: '',
    ...partial,
  }
}

export interface AccessApiStubOptions {
  /** What GET /access/requests/me returns. */
  requests?: StubAccessRequest[]
  /** Hold the GET open forever, so the screen stays on its loading branch. */
  pending?: boolean
  /** Fail the GET, so the screen falls back to NotAuthenticatedScreen. */
  failing?: boolean
  /**
   * How a submitted request should fail. The screen reads `statusCode` and
   * `response.body.message` off the rejection, and branches on 429 (over the cross-project
   * limit) and 409 (already denied) specifically.
   */
  submitError?: {statusCode: number; message: string}
}

/**
 * A client whose only real behaviour is the Access API. Everything else is absent rather than
 * approximated: this screen reads `config().projectId`, calls `withConfig`, and makes exactly
 * two requests, so a client that pretends to do more would be inventing a contract nobody
 * checks.
 */
export function createAccessApiClient(options: AccessApiStubOptions = {}): SanityClient {
  const {requests = [], pending = false, failing = false, submitError} = options

  const get = (): Observable<StubAccessRequest[] | null> => {
    if (pending) return NEVER
    if (failing) return throwError(() => new Error('Access API unreachable'))
    return of(requests)
  }

  const post = (): Promise<StubAccessRequest | null> => {
    if (submitError) {
      // The shape the screen destructures: `err?.response?.statusCode` and
      // `err?.response?.body?.message`. A plain Error would take the generic toast branch
      // instead of the 429 / 409 ones, which is the branch we are trying to show.
      return Promise.reject({
        response: {statusCode: submitError.statusCode, body: {message: submitError.message}},
      })
    }
    return Promise.resolve(accessRequest({status: 'pending', createdAt: daysAgo(0)}))
  }

  const client = {
    config: () => ({projectId: STUB_PROJECT_ID, dataset: 'production'}),
    withConfig: () => client,
    clone: () => client,
    observable: {request: get},
    request: post,
  }

  // oxlint-disable-next-line no-unsafe-type-assertion -- deliberately partial; see above
  return client as unknown as SanityClient
}

/**
 * The `ActiveWorkspaceMatcherContext` value this screen family reads. Seeds the context rather
 * than mounting `ActiveWorkspaceMatcherProvider`, which would want a router, a config resolver
 * and a real auth flow in order to supply the two fields actually used. That is the standing
 * move in this storybook wherever a provider demands more of the world than the component
 * demands of the provider (see `stories/screens/NotAuthenticatedScreen.stories.tsx`).
 */
export function activeWorkspaceValue(user: CurrentUser | null, client: SanityClient | null) {
  return {
    activeWorkspace: {
      name: 'default',
      title: 'Acme Content',
      auth: {
        state: of({authenticated: Boolean(user), currentUser: user, client}),
        logout: () => undefined,
      },
    },
    setActiveWorkspace: () => undefined,
  }
}

/**
 * Signed in through Google with an empty `roles` array. That combination is the entire
 * precondition for this screen: `AuthBoundary` sets `loggedIn` to `unauthorized` when an
 * authenticated user has no roles, then sends third-party providers here and `sanity`-provider
 * users to `NotAuthenticatedScreen` instead.
 */
export const lockedOutUser: CurrentUser = {
  id: 'u-ada',
  name: 'Ada Okafor',
  email: 'ada@example.com',
  provider: 'google',
  role: '',
  roles: [],
}
