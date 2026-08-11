import {SanityClient} from '@sanity/client'
import {ReactNode} from 'react'
/**
 * An access request as returned by the Access API (`GET /access/requests/me`).
 *
 * Mirrors the DTO from the Access API service. The generated `@sanity/access-api`
 * client is only published to Sanity's internal registry, so this package inlines
 * the small slice of the wire contract it needs.
 *
 * @public
 */
interface AccessRequest {
  id: string
  status: 'pending' | 'accepted' | 'declined'
  resourceId: string
  resourceType: 'organization' | 'project'
  createdAt: string
  updatedAt: string
  updatedByUserId: string
  requestedByUserId: string
  requestedRole?: string
  type: 'access' | 'role'
  note?: string
}
/**
 * The kind of resource an access request targets.
 *
 * @public
 */
type AccessResourceType = 'organization' | 'project'
/**
 * Where the caller stands on requesting access to a resource:
 * - `pending` — a request is in review (less than 2 weeks old)
 * - `denied` — a recent request was declined (less than 2 weeks old); can't re-request yet
 * - `expired` — a prior request aged out; can request again
 * - `none` — no relevant request; can request
 *
 * @public
 */
type AccessRequestState = 'pending' | 'denied' | 'expired' | 'none'
/**
 * Outcome of submitting an access request, mapping the Access API's error
 * contract to a discriminated union:
 * - `submitted` — the request was created
 * - `denied` — 409; a recent request was declined or is already pending
 * - `over-limit` — 429; the caller is over their cross-project request limit
 * - `email-domain-blocked` — 409; the caller's email domain may not request access
 * - `requests-disabled` — 409; the organization has disabled access requests
 * - `sso-enforced` — 403 `saml_enforcement_required`; the organization only admits
 *   members through its SSO login flow, so the request can never be approved.
 *   `redirectUrl` is the IdP login URL when the API provides one.
 * - `error` — any other failure
 *
 * @public
 */
type SubmitAccessRequestResult =
  | {
      type: 'submitted'
      request: AccessRequest | null
    }
  | {
      type: 'denied'
      message?: string
    }
  | {
      type: 'over-limit'
      message?: string
    }
  | {
      type: 'email-domain-blocked'
      message?: string
    }
  | {
      type: 'requests-disabled'
      message?: string
    }
  | {
      type: 'sso-enforced'
      redirectUrl?: string
      message?: string
    }
  | {
      type: 'error'
      error: unknown
    }
/**
 * The current user rendered in the request-access screen. A structural subset of
 * `CurrentUser` from `@sanity/types`, so both studio and app callers can pass
 * their own user object without an extra dependency.
 *
 * @public
 */
interface AccessUser {
  name?: string
  email?: string
  provider?: string
  profileImage?: string
}
/**
 * The Access API only accepts notes up to this length.
 *
 * @public
 */
declare const MAX_ACCESS_REQUEST_NOTE_LENGTH = 150
/**
 * Fetches the caller's own access requests across all resources
 * (`GET /access/requests/me`).
 *
 * @public
 */
declare function listMyAccessRequests(client: SanityClient): Promise<AccessRequest[]>
/**
 * Submits an access request (`POST /access/{resourceType}/{resourceId}/requests`)
 * and maps the Access API's error contract to a {@link SubmitAccessRequestResult}.
 * Never throws for API rejections; unexpected failures come back as
 * `{type: 'error'}` so callers decide how to surface them.
 *
 * @public
 */
declare function submitAccessRequest(options: {
  client: SanityClient
  resourceType: AccessResourceType
  resourceId: string
  note?: string
  requestUrl?: string
}): Promise<SubmitAccessRequestResult>
/**
 * Derives where the caller stands on requesting access to a resource from
 * their existing access requests.
 *
 * A declined request blocks re-requesting for two weeks. A pending request
 * younger than two weeks is in review; older pending requests count as
 * expired, and the caller may request again.
 *
 * @public
 */
declare function deriveAccessRequestState(
  requests: AccessRequest[] | null | undefined,
  resourceId: string,
  now?: number,
): AccessRequestState
/**
 * All user-facing strings in the request-access screen. Every label can be
 * overridden, so hosts with their own i18n stack (studio i18n, react-i18next)
 * inject translated copy while standalone hosts get the English defaults.
 *
 * @public
 */
interface RequestAccessLabels {
  title: ReactNode
  sentTitle: ReactNode
  errorTitle: ReactNode
  describeNoAccess: (context: {email?: string}) => ReactNode
  promptProject: ReactNode
  promptOrganization: ReactNode
  notePlaceholder: string
  noteAriaLabel: string
  submit: ReactNode
  submitted: ReactNode
  sentDescription: ReactNode
  pendingMessage: ReactNode
  deniedMessage: (context: {message?: string}) => ReactNode
  overLimitMessage: (context: {message?: string}) => ReactNode
  expiredMessage: ReactNode
  ssoEnforcedMessage: (context: {providerTitle?: string}) => ReactNode
  ssoSignInCta: ReactNode
  submitFailedMessage: ReactNode
  wrongAccount: ReactNode
  signOut: ReactNode
}
/**
 * Human-readable title for a login provider id, e.g. `google` → `Google`,
 * `saml-xyz` → `SAML/SSO`.
 *
 * @public
 */
declare function getProviderTitle(provider?: string): string | undefined
/** @public */
interface RequestAccessFormProps {
  /** Client authenticated as the requesting user. The Access API version is applied internally. */
  client: SanityClient
  resourceType?: AccessResourceType
  /** Project or organization id to request access to. */
  resourceId: string
  /** The signed-in user, rendered in the description and account footer. */
  currentUser?: AccessUser | null
  /**
   * Called when the user chooses "Sign out". The account footer's sign-out
   * action is only rendered when provided; hosts own the actual sign-out
   * mechanism (studio: `auth.logout()`, dashboard: logout route navigation).
   */
  onSignOut?: () => void
  /** Called after a request is successfully submitted, e.g. for analytics. */
  onRequestSubmitted?: () => void
  /** Optional slot rendered above the title, e.g. a resource preview. */
  preview?: ReactNode
  /** Label overrides for hosts with their own i18n stack. */
  labels?: Partial<RequestAccessLabels>
}
/**
 * The shared request-access screen: explains that the signed-in account lacks
 * access, lets the user request it with an optional note, and reflects the
 * request lifecycle (pending, denied, expired, over-limit, SSO-enforced).
 *
 * Fetches the caller's existing requests on mount and suspends while loading;
 * an internal `Suspense` boundary renders a spinner, so hosts can mount it
 * directly. Remount with a `key` when `client` or `resourceId` change.
 *
 * @public
 */
declare function RequestAccessForm(props: RequestAccessFormProps): import('react').JSX.Element
export {
  type AccessRequest,
  type AccessRequestState,
  type AccessResourceType,
  type AccessUser,
  MAX_ACCESS_REQUEST_NOTE_LENGTH,
  RequestAccessForm,
  type RequestAccessFormProps,
  type RequestAccessLabels,
  type SubmitAccessRequestResult,
  deriveAccessRequestState,
  getProviderTitle,
  listMyAccessRequests,
  submitAccessRequest,
}
//# sourceMappingURL=index.d.ts.map
