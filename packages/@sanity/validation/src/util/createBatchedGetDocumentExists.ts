import {type SanityClient} from '@sanity/client'

interface AvailabilityResponse {
  omitted: {id: string; reason: 'existence' | 'permission'}[]
}

/** The amount of time reserved for waiting for new IDs. */
const BUFFER_TIME = 250

/** The upper limit for IDs sent to the `doc` endpoint at once. */
export const MAX_BUFFER_SIZE = 100

/** The `doc` endpoint is expensive, so batches are sent one at a time. */
export const MAX_REQUEST_CONCURRENCY = 1

interface PendingCheck {
  reject: (reason: unknown) => void
  resolve: (exists: boolean) => void
  settled: boolean
  signal?: AbortSignal
  onAbort?: () => void
}

type Batch = Map<string, PendingCheck[]>

function settleCheck(check: PendingCheck, result: {exists: boolean} | {error: unknown}): void {
  if (check.settled) return
  check.settled = true
  if (check.signal && check.onAbort) {
    check.signal.removeEventListener('abort', check.onAbort)
  }
  if ('error' in result) check.reject(result.error)
  else check.resolve(result.exists)
}

export function createBatchedGetDocumentExists(
  client: SanityClient,
  defaultSignal?: AbortSignal,
): (options: {id: string; signal?: AbortSignal}) => Promise<boolean> {
  let buffer: Batch = new Map()
  const queuedBatches: Batch[] = []
  let bufferTimer: ReturnType<typeof setTimeout> | undefined
  let draining = false

  const rejectBatch = (batch: Batch, reason: unknown) => {
    for (const checks of batch.values()) {
      for (const check of checks) settleCheck(check, {error: reason})
    }
  }

  const rejectPending = (reason: unknown) => {
    if (bufferTimer !== undefined) clearTimeout(bufferTimer)
    bufferTimer = undefined
    rejectBatch(buffer, reason)
    buffer = new Map()
    for (const batch of queuedBatches.splice(0)) rejectBatch(batch, reason)
  }

  const flush = () => {
    if (bufferTimer !== undefined) clearTimeout(bufferTimer)
    bufferTimer = undefined
    if (buffer.size === 0) return

    queuedBatches.push(buffer)
    buffer = new Map()
    void drain()
  }

  const scheduleFlush = () => {
    if (buffer.size >= MAX_BUFFER_SIZE) {
      flush()
    } else if (bufferTimer === undefined) {
      bufferTimer = setTimeout(flush, BUFFER_TIME)
    }
  }

  async function drain() {
    if (draining) return
    draining = true
    try {
      while (queuedBatches.length > 0) {
        defaultSignal?.throwIfAborted()
        const batch = queuedBatches.shift()
        if (!batch) continue
        const ids = [...batch.entries()]
          .filter(([, checks]) => checks.some((check) => !check.settled))
          .map(([id]) => id)
        if (ids.length === 0) continue

        try {
          // The endpoint is intentionally limited to one request at a time.
          // oxlint-disable-next-line no-await-in-loop
          const availability = await client.request<AvailabilityResponse>({
            url: client.getDataUrl('doc', ids.join(',')),
            query: {excludeContent: 'true'},
            signal: defaultSignal,
            tag: 'documents-availability',
          })
          const missingIds = new Set(
            availability.omitted.filter(({reason}) => reason === 'existence').map(({id}) => id),
          )
          for (const id of ids) {
            for (const check of batch.get(id) ?? []) {
              settleCheck(check, {exists: !missingIds.has(id)})
            }
          }
        } catch (error) {
          rejectBatch(batch, error)
          rejectPending(error)
          return
        }
      }
    } catch (error) {
      rejectPending(error)
    } finally {
      draining = false
    }
  }

  return function getDocumentExists(options) {
    const signal = options.signal || defaultSignal
    if (signal?.aborted) return Promise.reject(signal.reason)

    return new Promise<boolean>((resolve, reject) => {
      const check: PendingCheck = {reject, resolve, settled: false, signal}
      if (signal) {
        check.onAbort = () => settleCheck(check, {error: signal.reason})
        signal.addEventListener('abort', check.onAbort, {once: true})
      }

      const checks = buffer.get(options.id)
      if (checks) checks.push(check)
      else buffer.set(options.id, [check])
      scheduleFlush()
    })
  }
}
