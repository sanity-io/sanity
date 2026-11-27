import {isPlainObject} from '../../util/isPlainObject'

/** What reading a dataset's embeddings settings needs of a client; a `SanityClient` has it */
export interface EmbeddingsClient {
  config: () => {apiHost?: string; projectId?: string; dataset?: string}
  datasets: {getEmbeddingsSettings: (dataset: string) => Promise<unknown>}
}

interface EmbeddingsEntry {
  ready: Promise<boolean>
  readAt: number
  maxAge: number
}

/** Embeddings are turned on or off rarely, so an answer stands for a while */
const MAX_AGE = 5 * 60_000
/** A failed reading is tried again sooner: it says nothing about the dataset */
const FAILED_MAX_AGE = 30_000

// Every tab on the same dataset shares one reading, across the time the tool is left and come
// back to
const entries = new Map<string, EmbeddingsEntry>()

async function read(client: EmbeddingsClient, dataset: string, entry: EmbeddingsEntry) {
  try {
    const settings = await client.datasets.getEmbeddingsSettings(dataset)
    return isPlainObject(settings) && settings.enabled === true && settings.status === 'ready'
  } catch {
    // No access to the settings, or no answer: the dataset is treated as having no embeddings,
    // which keeps queries to what every dataset can run
    entry.maxAge = FAILED_MAX_AGE
    return false
  }
}

/**
 * Whether the client's dataset has embeddings ready, so that `text::semanticSimilarity()` can
 * run on it. Read once per dataset for a few minutes; `false` when the settings cannot be read.
 */
export function hasDatasetEmbeddings(client: EmbeddingsClient): Promise<boolean> {
  const {apiHost, projectId, dataset} = client.config()
  if (!projectId || !dataset) return Promise.resolve(false)
  const key = `${apiHost ?? ''}|${projectId}|${dataset}`
  const cached = entries.get(key)
  if (cached && Date.now() - cached.readAt < cached.maxAge) return cached.ready
  const entry: EmbeddingsEntry = {
    ready: Promise.resolve(false),
    readAt: Date.now(),
    maxAge: MAX_AGE,
  }
  entry.ready = read(client, dataset, entry)
  entries.set(key, entry)
  return entry.ready
}

/** Forgets every reading; for tests */
export function resetDatasetEmbeddings(): void {
  entries.clear()
}
