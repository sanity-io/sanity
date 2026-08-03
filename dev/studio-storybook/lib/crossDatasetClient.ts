/**
 * A mock client that can answer for MORE THAN ONE dataset.
 *
 * ## Why the existing mocks are not enough
 *
 * Both `createMockSanityClient` (upstream) and `createMockContentLakeClient` (this folder) model a
 * client as a single thing with a fixed identity. Their `withConfig()` returns **the same object**:
 *
 * ```ts
 * withConfig: () => mockClient        // upstream
 * client.withConfig = () => client    // mockContentLake
 * ```
 *
 * That is a deliberate and correct simplification for a single-dataset story, and it is exactly
 * wrong for a cross-dataset one. `StudioCrossDatasetReferenceInput` does this:
 *
 * ```ts
 * const crossDatasetClient = client
 *   .withConfig({dataset: schemaType.dataset, apiVersion: …})
 *   .clone()
 * ```
 *
 * and then `createGetReferenceInfo` reads `client.config()` off the result and expects to get the
 * OTHER dataset back. Against the existing mocks that call chain fails twice over: `.clone()` does
 * not exist on the upstream mock at all, and even if it did, `config()` would keep reporting the
 * original dataset, so every reference would resolve against the wrong documents while appearing
 * to work.
 *
 * This is what blocked `Customisation`'s Tasks surfaces: `taskSchema` declares
 * `target.document` as a `crossDatasetReference` into a `playground` dataset, so mounting
 * `FormEdit` or `FormCreate` reaches this code path immediately. Recorded as ledger #57.
 *
 * ## What this adds
 *
 * One GROQ-backed lake per `projectId:dataset` pair, and a thin routing layer over them that keeps
 * three things honest:
 *
 * - `config()` reports the config of the client you are actually holding
 * - `withConfig(next)` returns a NEW client whose config is the merge, routed to that pair's
 *   documents (falling back to an empty dataset rather than to the original one, so a query
 *   against an unconfigured dataset returns nothing instead of silently returning the wrong thing)
 * - `clone()` returns an equivalent client, because the studio calls it
 *
 * Everything else delegates to `createMockContentLakeClient`, so GROQ execution, draft handling,
 * latency and the error path behave exactly as they do in the single-dataset stories.
 */
import {type SanityClient} from '@sanity/client'

import {createMockContentLakeClient, type SanityDocumentLike} from './mockContentLake'

export interface DatasetFixture {
  projectId?: string
  dataset: string
  documents: SanityDocumentLike[]
}

export interface CrossDatasetClientOptions {
  /** The project every dataset belongs to unless it names its own. */
  projectId?: string
  /** The dataset the returned client starts on. */
  dataset?: string
  /** One entry per dataset the stories need to reach. */
  datasets: DatasetFixture[]
  /** Passed through to each underlying lake. */
  delay?: number
  onQuery?: (query: string, params: Record<string, unknown>) => void
}

interface ClientConfig {
  projectId: string
  dataset: string
  apiVersion: string
  [key: string]: unknown
}

const key = (projectId: string, dataset: string) => `${projectId}:${dataset}`

export function createCrossDatasetMockClient(options: CrossDatasetClientOptions): SanityClient {
  const {
    projectId: defaultProjectId = 'mock-project',
    dataset: initialDataset = options.datasets[0]?.dataset ?? 'production',
    datasets,
    delay,
    onQuery,
  } = options

  // One lake per pair, built once. Building lazily would be cheaper but would also mean a story's
  // first query pays the construction cost, which shows up as a flake in the interaction gate.
  const lakes = new Map<string, SanityClient>()
  for (const entry of datasets) {
    const pid = entry.projectId ?? defaultProjectId
    lakes.set(
      key(pid, entry.dataset),
      createMockContentLakeClient({documents: entry.documents, delay, onQuery}),
    )
  }

  /**
   * A pair with no fixture gets an EMPTY lake rather than the nearest one. Falling back to another
   * dataset's documents would make a misconfigured story pass while asserting something untrue,
   * which is the specific failure this whole file exists to prevent.
   */
  const lakeFor = (config: ClientConfig): SanityClient => {
    const k = key(config.projectId, config.dataset)
    if (!lakes.has(k)) {
      lakes.set(k, createMockContentLakeClient({documents: [], delay, onQuery}))
    }
    return lakes.get(k) as SanityClient
  }

  function build(config: ClientConfig): SanityClient {
    const lake = lakeFor(config)

    const client = {
      ...(lake as unknown as Record<string, unknown>),

      config: () => config,

      withConfig: (next: Partial<ClientConfig> = {}) => build({...config, ...next}),

      clone: () => build({...config}),

      // `getUrl` is read by a few surfaces to build links; keep it pointed at the pair this client
      // is actually on rather than at whatever the base lake reported.
      getUrl: (uri: string) =>
        `https://${config.projectId}.api.sanity.io/v${config.apiVersion}/${uri.replace(/^\//, '')}`,

      fetch: (query: string, params?: Record<string, unknown>) =>
        (lake as unknown as {fetch: (q: string, p?: unknown) => Promise<unknown>}).fetch(
          query,
          params,
        ),

      observable: {
        ...((lake as unknown as {observable: Record<string, unknown>}).observable ?? {}),
      },
    } as unknown as SanityClient

    return client
  }

  return build({
    projectId: defaultProjectId,
    dataset: initialDataset,
    apiVersion: '2025-02-19',
  })
}
