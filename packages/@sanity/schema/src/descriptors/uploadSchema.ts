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
 * Fields common to both claim responses: enough to start synchronizing.
 */
interface BaseClaimResponse {
  synchronization: SchemaSynchronizationResult
}

/**
 * Response to a permanent claim (`permanent: true`). Carries the `commitId` that
 * must be passed to `/commit` to pin the descriptor; until then nothing is
 * retained.
 */
interface PermanentClaimResponse extends BaseClaimResponse {
  commitId: string
}

/**
 * Response to a temporary claim (`permanent: false`). Carries `expiresAt`; the
 * descriptor is retained only until then and there is nothing to commit.
 */
interface TemporaryClaimResponse extends BaseClaimResponse {
  expiresAt: string
}

type ClaimResponse = PermanentClaimResponse | TemporaryClaimResponse

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
 * A completed phase of an upload, passed to `onPhaseComplete`.
 *
 * @internal
 */
export interface UploadSchemaPhase {
  /**
   * - `convert`     — schema → descriptor set. Awaited but CPU-bound; the shared
   *   converter's `WeakMap` cache makes this ~0s on a repeat upload of the same
   *   compiled `Schema` instance.
   * - `claim`       — the claim request (permanent or temporary).
   * - `synchronize` — one synchronize iteration (see `iteration`).
   * - `commit`      — the commit request that pins a permanent claim. Emitted by
   *   the `commit()` thunk returned from `prepareSchemaUpload`, or inline by
   *   `uploadSchema`. Never emitted for a temporary claim.
   * - `total`       — the whole `uploadSchema` call; emitted last, on success
   *   only. `prepareSchemaUpload` does not emit `total` (a standalone caller can
   *   time the awaited promise itself).
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
   * the elapsed wall-clock time for that phase.
   *
   * Fire-and-forget: the return value is ignored and any error it throws is
   * swallowed, so instrumentation can never break or slow an upload.
   */
  onPhaseComplete?: (event: UploadSchemaPhase) => void
}

/**
 * Transport — provide exactly one of `baseUrl` or `requester`. The mutually
 * exclusive shape makes "both" and "neither" a compile-time error.
 */
type TransportOptions =
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

/**
 * Options for {@link prepareSchemaUpload}.
 *
 * @internal
 */
export type PrepareSchemaUploadOptions = BaseUploadSchemaOptions &
  TransportOptions & {
    /**
     * Claim lifecycle for the uploaded descriptor — chosen here because the kind
     * of claim is fixed in the `/claim` request and cannot be changed later:
     *
     * - `'permanent'` — claim with `permanent: true`. The response carries a
     *   `commitId` and the descriptor is **not** retained until committed. The
     *   returned `PreparedSchemaUpload` includes a `commit()` thunk to finalize
     *   it (e.g. after a dependent write succeeds). Never calling `commit()`
     *   leaves the claim to expire — nothing is pinned.
     * - `'temporary'` — claim with `permanent: false`. The response carries
     *   `expiresAt`; there is nothing to commit, so no `commit()` thunk is
     *   returned. The descriptor is retained only until the claim expires (or
     *   until pinned by a referencing permanent descriptor — e.g. a manifest
     *   that lists it).
     */
    claim: 'temporary' | 'permanent'
  }

/**
 * Options for {@link uploadSchema}.
 *
 * @internal
 */
export type UploadSchemaOptions = BaseUploadSchemaOptions & TransportOptions

/**
 * Result of {@link prepareSchemaUpload}: the synchronized descriptor id and,
 * for a permanent claim, a `commit()` thunk to pin it later.
 *
 * @internal
 */
export interface PreparedSchemaUpload {
  /** Content-addressed descriptor id of the synchronized schema. */
  descriptorId: string
  /**
   * Present only for `claim: 'permanent'`. Finalizes the permanent claim by
   * committing it. Safe to skip: not calling it leaves the claim to expire.
   */
  commit?: () => Promise<void>
}

function resolveRequester(options: TransportOptions): DescriptorRequester {
  // The union type already forbids "both"/"neither" for typed callers; these
  // guards keep clear errors for untyped (JS) callers. The property checks also
  // let TypeScript narrow the union, so no non-null assertions are needed.
  if (options.requester !== undefined && options.baseUrl !== undefined) {
    throw new Error('uploadSchema: provide either `requester` or `baseUrl`, not both')
  }
  if (options.requester !== undefined) {
    return options.requester
  }
  if (options.baseUrl !== undefined) {
    return createGetItRequester({baseUrl: options.baseUrl})
  }
  throw new Error('uploadSchema: one of `requester` or `baseUrl` is required')
}

/**
 * Build the fire-and-forget phase emitter. The hook is observation only, so a
 * throwing hook must never surface as an upload failure. Each `startedAt` is
 * captured before the awaited work and read at completion.
 */
function makeEmit(onPhaseComplete: ((event: UploadSchemaPhase) => void) | undefined) {
  return function emit(
    phase: UploadSchemaPhase['phase'],
    startedAt: number,
    iteration?: number,
  ): void {
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
}

/**
 * Convert a Sanity schema to a descriptor set, claim its id, and synchronize
 * until complete — but do **not** commit. For a permanent claim, the returned
 * `commit()` thunk finalizes the claim when the caller is ready (e.g. after a
 * dependent write succeeds); for a temporary claim no thunk is returned. This is
 * the building block `uploadSchema` is built on, exposed for callers that need
 * to control the claim/commit lifecycle.
 *
 * @internal
 */
export async function prepareSchemaUpload(
  schema: Schema,
  options: PrepareSchemaUploadOptions,
): Promise<PreparedSchemaUpload> {
  const requester = resolveRequester(options)

  const apiVersion = options.apiVersion ?? DEFAULT_API_VERSION
  const maxSyncIterations = options.maxSyncIterations ?? DEFAULT_MAX_SYNC_ITERATIONS
  if (!Number.isInteger(maxSyncIterations) || maxSyncIterations < 0) {
    throw new Error('uploadSchema: `maxSyncIterations` must be a non-negative integer')
  }

  const {contextKey} = options
  const permanent = options.claim === 'permanent'

  // Headers are invariant across every request in a single call, so merge them
  // once rather than per request.
  const headers = mergeHeaders(options.token, options.headers)
  function request<T>(opts: {url: string; method: 'GET' | 'POST'; body?: unknown}): Promise<T> {
    return requester<T>({...opts, headers})
  }

  function url(path: string): string {
    return `/${apiVersion}/descriptors/${path}`
  }

  const emit = makeEmit(options.onPhaseComplete)

  const startedConvert = performance.now()
  const sync = await sharedConverter.get(schema)
  const descriptorId = sync.set.id
  emit('convert', startedConvert)

  // A permanent claim returns a `commitId` (the descriptor is not pinned until
  // it is committed); a temporary claim returns `expiresAt` and has nothing to
  // commit. The `permanent` flag in the request body is what selects between
  // them, so the lifecycle must be decided here, before any commit could run.
  const startedClaim = performance.now()
  const claimResponse = await request<ClaimResponse>({
    url: url('claim'),
    method: 'POST',
    body: {descriptorId, contextKey, permanent},
  })
  emit('claim', startedClaim)

  let commitId: string | undefined
  if (permanent) {
    commitId = (claimResponse as PermanentClaimResponse).commitId
    if (!commitId) {
      throw new Error('uploadSchema: claim response is missing `commitId` for the permanent claim')
    }
  }

  let syncResult: SchemaSynchronizationResult = claimResponse.synchronization
  // Completeness is checked at the top of each pass — before the iteration
  // budget is consumed — so an already-complete claim is ready even when
  // `maxSyncIterations` is 0. The `<=` lets the final pass detect completeness
  // (or break) after the last synchronize request.
  for (let i = 0; i <= maxSyncIterations; i++) {
    const syncRequest = processSchemaSynchronization(sync, syncResult)
    if (syncRequest === null) {
      // Synchronization is complete. For a permanent claim, hand back a `commit`
      // thunk so the caller can pin the descriptor when ready; for a temporary
      // claim there is nothing to commit. The iteration-exhaustion path below
      // intentionally throws rather than returning a partially-synced upload.
      const commit = permanent
        ? async (): Promise<void> => {
            const startedCommit = performance.now()
            await request({
              url: url('commit'),
              method: 'POST',
              body: {contextKey, id: commitId},
            })
            emit('commit', startedCommit)
          }
        : undefined
      return {descriptorId, commit}
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

/**
 * Convert a Sanity schema to a descriptor set and upload it permanently:
 * permanently claim the id, run the synchronization loop until complete, then
 * commit the claim to pin the descriptor. Returns the content-addressed
 * descriptor id.
 *
 * A convenience over {@link prepareSchemaUpload} — it prepares a permanent claim
 * and commits it inline. Callers that need a temporary claim, or that need to
 * commit in a later step, should use `prepareSchemaUpload` directly.
 *
 * @internal
 */
export async function uploadSchema(schema: Schema, options: UploadSchemaOptions): Promise<string> {
  const startedTotal = performance.now()
  const emit = makeEmit(options.onPhaseComplete)

  const {descriptorId, commit} = await prepareSchemaUpload(schema, {...options, claim: 'permanent'})
  // `claim: 'permanent'` always yields a `commit` thunk; the assertion documents
  // that invariant rather than guarding a reachable branch.
  await commit!()

  emit('total', startedTotal)
  return descriptorId
}
