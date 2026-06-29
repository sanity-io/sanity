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

/**
 * A completed phase of an `uploadSchema` call, passed to `onPhaseComplete`.
 *
 * @internal
 */
export interface UploadSchemaPhase {
  /**
   * - `convert`     — schema → descriptor set. Awaited but CPU-bound; the shared
   *   converter's `WeakMap` cache makes this ~0s on a repeat upload of the same
   *   compiled `Schema` instance.
   * - `claim`       — the permanent-claim request.
   * - `synchronize` — one synchronize iteration (see `iteration`).
   * - `commit`      — the commit request that pins the descriptor.
   * - `total`       — the whole `uploadSchema` call; emitted last, on success only.
   */
  phase: 'convert' | 'claim' | 'synchronize' | 'commit' | 'total'
  /** Elapsed wall-clock time for this phase, in seconds. */
  durationSeconds: number
  /** Zero-based iteration index. Present only for `phase: 'synchronize'`. */
  iteration?: number
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
  /**
   * Optional observability hook. Invoked once per phase as it completes, with
   * the elapsed wall-clock time for that phase. The success-only `total` is
   * emitted last; a failing call emits whatever phases completed but neither
   * `commit` nor `total`.
   *
   * Fire-and-forget: the return value is ignored and any error it throws is
   * swallowed, so instrumentation can never break or slow an upload.
   */
  onPhaseComplete?: (event: UploadSchemaPhase) => void
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

  // Fire-and-forget phase timing. The hook is observation only, so a throwing
  // hook must never surface as an upload failure. `startedAt` is captured before
  // the awaited work and read here at completion.
  const {onPhaseComplete} = options
  function emit(phase: UploadSchemaPhase['phase'], startedAt: number, iteration?: number): void {
    if (!onPhaseComplete) return
    const event: UploadSchemaPhase = {
      phase,
      durationSeconds: (performance.now() - startedAt) / 1000,
    }
    if (iteration !== undefined) event.iteration = iteration
    try {
      onPhaseComplete(event)
    } catch {
      // observability must never break the upload
    }
  }

  const startedTotal = performance.now()

  const startedConvert = performance.now()
  const sync = await sharedConverter.get(schema)
  const descriptorId = sync.set.id
  emit('convert', startedConvert)

  // A permanent claim returns a `commitId` (rather than the temporary claim's
  // `expiresAt`); the descriptor is not pinned until that id is committed below.
  const startedClaim = performance.now()
  const claimResponse = await request<ClaimResponse>({
    url: url('claim'),
    method: 'POST',
    body: {descriptorId, contextKey: options.contextKey, permanent: true},
  })
  emit('claim', startedClaim)

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
      const startedCommit = performance.now()
      await request({
        url: url('commit'),
        method: 'POST',
        body: {contextKey: options.contextKey, id: claimResponse.commitId},
      })
      emit('commit', startedCommit)
      emit('total', startedTotal)
      return descriptorId
    }
    if (i === maxSyncIterations) {
      break
    }
    const startedSync = performance.now()
    syncResult = await request<SchemaSynchronizationResult>({
      url: url('synchronize'),
      method: 'POST',
      body: syncRequest,
    })
    emit('synchronize', startedSync, i)
  }

  throw new Error(`Schema synchronization didn't succeed in ${maxSyncIterations} iterations`)
}
