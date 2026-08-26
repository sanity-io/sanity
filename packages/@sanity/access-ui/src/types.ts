/**
 * An access request as returned by the Access API (`GET /access/requests/me`).
 *
 * Mirrors the DTO from the Access API service. The generated `@sanity/access-api`
 * client is only published to Sanity's internal registry, so this package inlines
 * the small slice of the wire contract it needs.
 *
 * @public
 */
export interface AccessRequest {
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
export type AccessResourceType = 'organization' | 'project'

/**
 * Where the caller stands on requesting access to a resource:
 * - `pending` — a request is in review (less than 2 weeks old)
 * - `denied` — a recent request was declined (less than 2 weeks old); can't re-request yet
 * - `expired` — a prior request aged out; can request again
 * - `none` — no relevant request; can request
 *
 * @public
 */
export type AccessRequestState = 'pending' | 'denied' | 'expired' | 'none'

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
export type SubmitAccessRequestResult =
  | {type: 'submitted'; request: AccessRequest | null}
  | {type: 'denied'; message?: string}
  | {type: 'over-limit'; message?: string}
  | {type: 'email-domain-blocked'; message?: string}
  | {type: 'requests-disabled'; message?: string}
  | {type: 'sso-enforced'; redirectUrl?: string; message?: string}
  | {type: 'error'; error: unknown}

/**
 * Why the Access API says the caller may not request access to a resource.
 * - `saml-enforced` — the organization only admits members through its SSO
 *   login flow, so no admin could ever approve a request.
 * - `resource-not-available` — the target project or organization is gone.
 *
 * @public
 */
export type AccessRequestIneligibleReason = 'saml-enforced' | 'resource-not-available'

/**
 * Whether the caller may usefully request access
 * (`GET /access/{resourceType}/{resourceId}/requests/eligibility`).
 *
 * Answered before the user writes anything, so a futile form is never offered.
 * `redirectUrl` is the org's SSO login page when the API can resolve one.
 *
 * @public
 */
export type AccessRequestEligibility =
  | {eligible: true}
  | {eligible: false; reason: AccessRequestIneligibleReason; redirectUrl?: string}

/**
 * The current user rendered in the request-access screen. A structural subset of
 * `CurrentUser` from `@sanity/types`, so both studio and app callers can pass
 * their own user object without an extra dependency.
 *
 * @public
 */
export interface AccessUser {
  name?: string
  email?: string
  provider?: string
  profileImage?: string
}
