import {type SanityClient} from '@sanity/client'

import {
  type AccessRequest,
  type AccessRequestEligibilityState,
  type AccessResourceType,
  type SubmitAccessRequestResult,
} from './types'

/**
 * The Access API only accepts notes up to this length.
 *
 * @public
 */
export const MAX_ACCESS_REQUEST_NOTE_LENGTH = 150

const ACCESS_API_VERSION = '2024-07-01'

/**
 * Structured 403 code thrown by the Access API when the target organization
 * only admits members through its SSO login flow.
 */
const SAML_ENFORCEMENT_REQUIRED = 'saml_enforcement_required'

function withAccessApiVersion(client: SanityClient): SanityClient {
  return client.withConfig({apiVersion: ACCESS_API_VERSION})
}

/**
 * Fetches the caller's own access requests across all resources
 * (`GET /access/requests/me`).
 *
 * @public
 */
export async function listMyAccessRequests(client: SanityClient): Promise<AccessRequest[]> {
  const requests = await withAccessApiVersion(client).request<AccessRequest[] | null>({
    url: '/access/requests/me',
    tag: 'access-ui.list-requests',
  })
  return requests ?? []
}

/**
 * Asks what the request-access screen should show
 * (`GET /access/{resourceType}/{resourceId}/requests/state`).
 *
 * Runs before the form is offered, so a user in a SAML-enforced organization is
 * pointed at SSO instead of writing a note no administrator can action.
 *
 * `origin` is carried opaquely to the login page so the user returns where they
 * started. Never throws: an unreachable or older API answers `eligible`,
 * leaving the form in place and the submit-time 403 as the backstop.
 *
 * @public
 */
export async function fetchAccessRequestStatus(options: {
  client: SanityClient
  resourceType: AccessResourceType
  resourceId: string
  origin?: string
}): Promise<AccessRequestEligibilityState> {
  const {client, resourceType, resourceId, origin} = options
  try {
    const status = await withAccessApiVersion(client).request<AccessRequestEligibilityState | null>(
      {
        url: `/access/${resourceType}/${resourceId}/requests/state`,
        tag: 'access-ui.request-state',
        query: origin ? {returnQuery: new URLSearchParams({origin}).toString()} : undefined,
      },
    )
    return status ?? {state: 'eligible'}
  } catch {
    return {state: 'eligible'}
  }
}

interface ErrorResponseDetails {
  statusCode?: number
  message?: string
  code?: string
  redirectUrl?: string
}

function getErrorResponseDetails(err: unknown): ErrorResponseDetails {
  if (typeof err !== 'object' || err === null) return {}
  const response = (err as {response?: unknown}).response
  if (typeof response !== 'object' || response === null) return {}
  const {statusCode} = response as {statusCode?: unknown}
  const body = (response as {body?: unknown}).body
  const details: ErrorResponseDetails = {
    statusCode: typeof statusCode === 'number' ? statusCode : undefined,
  }
  if (typeof body === 'object' && body !== null) {
    const {message, code, redirectUrl} = body as {
      message?: unknown
      code?: unknown
      redirectUrl?: unknown
    }
    details.message = typeof message === 'string' ? message : undefined
    details.code = typeof code === 'string' ? code : undefined
    details.redirectUrl = typeof redirectUrl === 'string' ? redirectUrl : undefined
  }
  return details
}

function mapSubmitError(err: unknown): SubmitAccessRequestResult {
  const {statusCode, message, code, redirectUrl} = getErrorResponseDetails(err)

  if (statusCode === 403 && code === SAML_ENFORCEMENT_REQUIRED) {
    return {type: 'sso-enforced', redirectUrl, message}
  }
  if (statusCode === 429) {
    return {type: 'over-limit', message}
  }
  if (statusCode === 409) {
    if (message?.includes('email domain')) return {type: 'email-domain-blocked', message}
    if (message?.includes('disabled for organization')) return {type: 'requests-disabled', message}
    return {type: 'denied', message: message?.replace(/^Conflict -\s*/, '')}
  }
  return {type: 'error', error: err}
}

/**
 * Submits an access request (`POST /access/{resourceType}/{resourceId}/requests`)
 * and maps the Access API's error contract to a {@link SubmitAccessRequestResult}.
 * Never throws for API rejections; unexpected failures come back as
 * `{type: 'error'}` so callers decide how to surface them.
 *
 * @public
 */
export async function submitAccessRequest(options: {
  client: SanityClient
  resourceType: AccessResourceType
  resourceId: string
  note?: string
  requestUrl?: string
}): Promise<SubmitAccessRequestResult> {
  const {client, resourceType, resourceId, note, requestUrl} = options
  try {
    const request = await withAccessApiVersion(client).request<AccessRequest | null>({
      url: `/access/${resourceType}/${resourceId}/requests`,
      method: 'post',
      tag: 'access-ui.submit-request',
      body: {note, requestUrl, type: 'access'},
    })
    return {type: 'submitted', request}
  } catch (err) {
    return mapSubmitError(err)
  }
}
