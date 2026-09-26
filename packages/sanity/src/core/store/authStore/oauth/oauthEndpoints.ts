// Requests to the OAuth 2.1 endpoints of the Sanity API (`/v1/auth/oauth/*`).
//
// These use `fetch` rather than a Sanity client: the token and revocation endpoints are
// form-encoded, unversioned, and must never carry the credentials of the session they manage.

/** @internal */
export interface OAuthTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token?: string
}

/**
 * An error response from an OAuth endpoint. `error` is the RFC 6749 error code when the server
 * sent one, e.g. `invalid_grant` for a refresh token that was already used, expired, or whose
 * session was revoked.
 *
 * @internal
 */
export class OAuthRequestError extends Error {
  readonly statusCode: number
  readonly error: string | undefined

  constructor(statusCode: number, body: unknown) {
    const parsed =
      typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {}
    const error = typeof parsed.error === 'string' ? parsed.error : undefined
    const description =
      typeof parsed.error_description === 'string'
        ? parsed.error_description
        : typeof parsed.message === 'string'
          ? parsed.message
          : undefined
    super(
      `OAuth request failed (${statusCode})${error ? `: ${error}` : ''}${description ? ` - ${description}` : ''}`,
    )
    this.name = 'OAuthRequestError'
    this.statusCode = statusCode
    this.error = error
  }
}

/**
 * An OAuth request that did not answer in time. Transient, like a network error: it says nothing
 * about the session.
 *
 * @internal
 */
export class OAuthRequestTimeoutError extends Error {
  constructor(url: string, timeoutMs: number, cause: unknown) {
    super(`OAuth request timed out after ${timeoutMs}ms: ${url}`, {cause})
    this.name = 'OAuthRequestTimeoutError'
  }
}

/**
 * Checks that a successful token endpoint body is a usable bearer token response. A 200 alone
 * does not guarantee it, and persisting a malformed body would store a credential that can never
 * authenticate.
 */
function toTokenResponse(body: unknown): OAuthTokenResponse {
  const response =
    typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {}
  const {access_token, token_type, expires_in, refresh_token} = response
  if (
    typeof access_token !== 'string' ||
    access_token.length === 0 ||
    typeof token_type !== 'string' ||
    token_type.toLowerCase() !== 'bearer' ||
    typeof expires_in !== 'number' ||
    !Number.isFinite(expires_in) ||
    expires_in <= 0 ||
    (refresh_token !== undefined && (typeof refresh_token !== 'string' || !refresh_token))
  ) {
    throw new Error('OAuth token endpoint returned a malformed token response')
  }
  return {access_token, token_type, expires_in, refresh_token}
}

/** @internal */
export interface OAuthEndpoints {
  authorizeUrl: (params: {
    clientId: string
    redirectUri: string
    codeChallenge: string
    state: string
  }) => string
  exchangeCode: (params: {
    clientId: string
    redirectUri: string
    code: string
    codeVerifier: string
  }) => Promise<OAuthTokenResponse>
  refresh: (params: {clientId: string; refreshToken: string}) => Promise<OAuthTokenResponse>
  revoke: (params: {clientId: string; token: string}) => Promise<void>
}

/**
 * How long an OAuth request may take. A refresh runs under a cross-tab lock that logout waits for,
 * so a request that never settles must not be able to hold it forever.
 */
const OAUTH_REQUEST_TIMEOUT_MS = 30_000

/**
 * @param apiHost - The API origin, e.g. `https://api.sanity.io`
 * @param fetchImpl - `fetch`, injectable for tests
 * @param timeoutMs - Request timeout, injectable for tests
 * @internal
 */
export function createOAuthEndpoints(
  apiHost: string,
  fetchImpl: typeof fetch = (...args) => fetch(...args),
  timeoutMs: number = OAUTH_REQUEST_TIMEOUT_MS,
): OAuthEndpoints {
  const endpoint = (name: 'authorize' | 'token' | 'revoke') => `${apiHost}/v1/auth/oauth/${name}`

  async function postForm<T>(url: string, fields: Record<string, string>): Promise<T> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
    try {
      return await request<T>(url, fields, controller.signal)
    } catch (err) {
      if (controller.signal.aborted) throw new OAuthRequestTimeoutError(url, timeoutMs, err)
      throw err
    } finally {
      clearTimeout(timeoutId)
    }
  }

  async function request<T>(
    url: string,
    fields: Record<string, string>,
    signal: AbortSignal,
  ): Promise<T> {
    const response = await fetchImpl(url, {
      signal,
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(fields).toString(),
      // Never send the cookie of the session these endpoints manage.
      credentials: 'omit',
    })
    const text = await response.text()
    let body: unknown = text
    try {
      body = text ? JSON.parse(text) : undefined
    } catch {
      // Not JSON: keep the raw text for the error message.
    }
    if (!response.ok) throw new OAuthRequestError(response.status, body)
    return body as T
  }

  return {
    authorizeUrl: ({clientId, redirectUri, codeChallenge, state}) => {
      const url = new URL(endpoint('authorize'))
      url.search = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: redirectUri,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        state,
      }).toString()
      return url.toString()
    },

    exchangeCode: async ({clientId, redirectUri, code, codeVerifier}) =>
      toTokenResponse(
        await postForm(endpoint('token'), {
          grant_type: 'authorization_code',
          client_id: clientId,
          redirect_uri: redirectUri,
          code,
          code_verifier: codeVerifier,
        }),
      ),

    refresh: async ({clientId, refreshToken}) =>
      toTokenResponse(
        await postForm(endpoint('token'), {
          grant_type: 'refresh_token',
          client_id: clientId,
          refresh_token: refreshToken,
        }),
      ),

    // RFC 7009: the server answers 200 whether or not the token was valid.
    revoke: async ({clientId, token}) => {
      await postForm(endpoint('revoke'), {client_id: clientId, token})
    },
  }
}
