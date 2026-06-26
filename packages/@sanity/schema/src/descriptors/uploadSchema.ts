import {type Schema} from '@sanity/types'

import {DescriptorConverter} from './convert'
import {processSchemaSynchronization, type SchemaSynchronizationResult} from './sync'
import {createGetItRequester, type DescriptorRequester, type RequestHeaders} from './transport'

const DEFAULT_API_VERSION = 'v2025-06-01'
const DEFAULT_MAX_SYNC_ITERATIONS = 5

// A single shared converter so its `WeakMap` cache survives across calls. The
// converted descriptor set is deterministic and content-addressed, so sharing
// is purely an optimization — repeat uploads of the same compiled `Schema`
// instance skip the (type-traversal + hashing) conversion.
const sharedConverter = new DescriptorConverter()

/**
 * The permanent-claim response shape `uploadSchema` reads: the info needed to
 * start synchronization, plus the `commitId` that must be passed to `/commit`
 * to finalize the permanent claim.
 */
interface ClaimResponse {
  synchronization: SchemaSynchronizationResult
  commitId: string
}

/**
 * Merge an optional bearer token and per-call headers. A caller-supplied
 * `Authorization` header wins over the derived token; the match is
 * case-insensitive (HTTP header names are), so a lowercase `authorization`
 * suppresses the derived header rather than producing a duplicate.
 */
function mergeHeaders(
  token: string | undefined,
  headers: RequestHeaders | undefined,
): RequestHeaders {
  const hasAuthHeader = headers
    ? Object.keys(headers).some((key) => key.toLowerCase() === 'authorization')
    : false
  return {
    ...(token && !hasAuthHeader ? {Authorization: `Bearer ${token}`} : {}),
    ...headers,
  }
}

interface BaseUploadSchemaOptions {
  /** Context key the server uses to scope/optimize synchronization, e.g. `studio:<appId>`. */
  contextKey: string
  /** Headers applied to every request. */
  headers?: RequestHeaders
  /** Convenience auth applied as `Authorization: Bearer <token>` on every request. */
  token?: string
  /** Descriptor API version path segment. Default 'v2025-06-01'. */
  apiVersion?: string
  /** Max synchronize iterations before throwing. Default 5. */
  maxSyncIterations?: number
}

/**
 * Transport — provide exactly one of `baseUrl` or `requester`. The mutually
 * exclusive shape makes "both" and "neither" a compile-time error.
 *
 * @internal
 */
export type UploadSchemaOptions = BaseUploadSchemaOptions &
  (
    | {
        /** Base URL for the bundled get-it transport. */
        baseUrl: string
        requester?: never
      }
    | {
        /** Bring-your-own transport. Use instead of `baseUrl` to control auth, retries, etc. */
        requester: DescriptorRequester
        baseUrl?: never
      }
  )

/**
 * Convert a Sanity schema to a descriptor set and upload it permanently:
 * permanently claim the id, run the synchronization loop until complete, then
 * commit the claim to pin the descriptor. Returns the content-addressed
 * descriptor id.
 *
 * @internal
 */
export async function uploadSchema(schema: Schema, options: UploadSchemaOptions): Promise<string> {
  // The union type already forbids "both"/"neither" for typed callers; these
  // guards keep clear errors for untyped (JS) callers. The property checks also
  // let TypeScript narrow the union, so no non-null assertions are needed.
  if (options.requester !== undefined && options.baseUrl !== undefined) {
    throw new Error('uploadSchema: provide either `requester` or `baseUrl`, not both')
  }

  let requester: DescriptorRequester
  if (options.requester !== undefined) {
    requester = options.requester
  } else if (options.baseUrl !== undefined) {
    requester = createGetItRequester({baseUrl: options.baseUrl})
  } else {
    throw new Error('uploadSchema: one of `requester` or `baseUrl` is required')
  }

  const apiVersion = options.apiVersion ?? DEFAULT_API_VERSION
  const maxSyncIterations = options.maxSyncIterations ?? DEFAULT_MAX_SYNC_ITERATIONS
  if (!Number.isInteger(maxSyncIterations) || maxSyncIterations < 0) {
    throw new Error('uploadSchema: `maxSyncIterations` must be a non-negative integer')
  }

  // Headers are invariant across the claim/synchronize requests in a single
  // call, so merge them once rather than per request.
  const headers = mergeHeaders(options.token, options.headers)
  function request<T>(opts: {url: string; method: 'GET' | 'POST'; body?: unknown}): Promise<T> {
    return requester<T>({...opts, headers})
  }

  function url(path: string): string {
    return `/${apiVersion}/descriptors/${path}`
  }

  const sync = await sharedConverter.get(schema)
  const descriptorId = sync.set.id

  // A permanent claim returns a `commitId` (rather than the temporary claim's
  // `expiresAt`); the descriptor is not pinned until that id is committed below.
  const claimResponse = await request<ClaimResponse>({
    url: url('claim'),
    method: 'POST',
    body: {descriptorId, contextKey: options.contextKey, permanent: true},
  })

  if (!claimResponse.commitId) {
    throw new Error('uploadSchema: claim response is missing `commitId` for the permanent claim')
  }

  let syncResult: SchemaSynchronizationResult = claimResponse.synchronization
  // Completeness is checked at the top of each pass — before the iteration
  // budget is consumed — so an already-complete claim commits even when
  // `maxSyncIterations` is 0. The `<=` lets the final pass detect completeness
  // (or break) after the last synchronize request.
  for (let i = 0; i <= maxSyncIterations; i++) {
    const syncRequest = processSchemaSynchronization(sync, syncResult)
    if (syncRequest === null) {
      // Synchronization is complete — finalize the permanent claim so the
      // descriptor survives indefinitely. Only commit on success; the
      // iteration-exhaustion path below intentionally leaves the claim
      // uncommitted (it will expire) rather than pinning a partial upload.
      await request({
        url: url('commit'),
        method: 'POST',
        body: {contextKey: options.contextKey, id: claimResponse.commitId},
      })
      return descriptorId
    }
    if (i === maxSyncIterations) {
      break
    }
    syncResult = await request<SchemaSynchronizationResult>({
      url: url('synchronize'),
      method: 'POST',
      body: syncRequest,
    })
  }

  throw new Error(`Schema synchronization didn't succeed in ${maxSyncIterations} iterations`)
}
