import {type SanityClient} from '@sanity/client'

const MAX_BATCH_SIZE = 100

interface PendingType {
  resolve: (type: string | undefined) => void
  reject: (error: unknown) => void
}

/** Batches metadata reads and shares each target's result for one validation run. */
export function createBatchedGetDocumentType(
  getClient: () => SanityClient,
  signal?: AbortSignal,
): (id: string) => Promise<string | undefined> {
  const cache = new Map<string, Promise<string | undefined>>()
  let pending = new Map<string, PendingType>()
  let timer: ReturnType<typeof setTimeout> | undefined

  async function flush() {
    clearTimeout(timer)
    timer = undefined
    const batch = pending
    pending = new Map()
    try {
      signal?.throwIfAborted()
      const documents = await getClient().fetch<{_id: string; _type: string}[]>(
        '*[_id in $ids]{_id, _type}',
        {ids: [...batch.keys()]},
        {perspective: 'raw', useCdn: false, signal, tag: 'validation.reference-types'},
      )
      const types = new Map(documents.map((document) => [document._id, document._type]))
      for (const [id, check] of batch) check.resolve(types.get(id))
    } catch (error) {
      for (const check of batch.values()) check.reject(error)
    }
  }

  return (id) => {
    if (signal?.aborted) return Promise.reject(signal.reason)
    const cached = cache.get(id)
    if (cached) return cached
    const result = new Promise<string | undefined>((resolve, reject) => {
      pending.set(id, {resolve, reject})
    })
    cache.set(id, result)
    if (pending.size >= MAX_BATCH_SIZE) void flush()
    else timer ??= setTimeout(() => void flush(), 0)
    return result
  }
}
