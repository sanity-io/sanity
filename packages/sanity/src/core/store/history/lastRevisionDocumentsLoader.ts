import {type SanityClient} from '@sanity/client'
import {type SanityDocument} from '@sanity/types'
import DataLoader from 'dataloader'
import {defer, type Observable} from 'rxjs'

import {runWithHistoryRequestSlot} from './historyRequestLimiter'

const MAX_IDS_PER_REQUEST = 10

/**
 * How long loads are collected before they are sent. The rows of a virtualized table mount over a
 * few frames while it scrolls, so this spans more than a single tick.
 */
const BATCH_WINDOW_MS = 20

type LastRevisionLoader = DataLoader<string, SanityDocument | null>

const loaders = new WeakMap<SanityClient, LastRevisionLoader>()

async function fetchLastRevisions(
  client: SanityClient,
  ids: readonly string[],
): Promise<(SanityDocument | null)[]> {
  const {documents} = await client.request<{documents: SanityDocument[]}>({
    url: `/data/history/${client.config().dataset}/documents/${[...new Set(ids)].join(',')}?lastRevision=true`,
    tag: 'history.last-revision',
  })
  const documentsById = new Map(documents.map((document) => [document._id, document]))
  return ids.map((id) => documentsById.get(id) ?? null)
}

function getLoader(client: SanityClient): LastRevisionLoader {
  let loader = loaders.get(client)
  if (!loader) {
    loader = new DataLoader(
      (ids) => runWithHistoryRequestSlot(() => fetchLastRevisions(client, ids)),
      {
        batchScheduleFn: (dispatch) => setTimeout(dispatch, BATCH_WINDOW_MS),
        maxBatchSize: MAX_IDS_PER_REQUEST,
        // Callers cache what they need: a revision stays the last one only while nothing restores
        // the document.
        cache: false,
      },
    )
    loaders.set(client, loader)
  }
  return loader
}

/**
 * Loads the last revision of each document from the History API, `null` for a document it has no
 * history of. The ids loaded by every caller within a short window are sent together, up to 10
 * per request, and each request waits for a slot from the shared history request limiter.
 *
 * @internal
 */
export function loadLastRevisionDocuments(
  client: SanityClient,
  ids: string[],
): Observable<(SanityDocument | null)[]> {
  return defer(() => {
    const loader = getLoader(client)
    return Promise.all(ids.map((id) => loader.load(id)))
  })
}
