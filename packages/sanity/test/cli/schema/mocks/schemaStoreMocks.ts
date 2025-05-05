import {type CliOutputter} from '@sanity/cli'
import {type ClientConfig, type SanityClient} from '@sanity/client'
import {type SanityDocumentLike} from '@sanity/types'
import {vi} from 'vitest'

import {type SchemaStoreContext} from '../../../../src/_internal/cli/actions/schema/schemaStoreTypes'
import {type ManifestJsonReader} from '../../../../src/_internal/cli/actions/schema/utils/manifestReader'
import {
  SANITY_WORKSPACE_SCHEMA_ID_PREFIX,
  SANITY_WORKSPACE_SCHEMA_TYPE,
} from '../../../../src/_internal/manifest/manifestTypes'
import {type createSchemaStoreFixture} from './schemaStoreFixture'

// test code :shrug:
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ANY = any

export function createMockSchemaStoreContext(
  fixture: ReturnType<typeof createSchemaStoreFixture>,
  overrides?: Partial<SchemaStoreContext>,
) {
  const {staticDate, workDir, files, testWorkspace} = fixture

  const {client, mockStores} = createMockSanityClient(testWorkspace)

  const {outputLog, mockOutput} = createMockCliOutputter()
  const mockJsonReader = createMockJsonReader({
    staticDate,
    files,
  })

  return {
    context: {
      output: mockOutput,
      apiClient: () => client,
      manifestExtractor: vi.fn(async (manifestDir: string) => {
        mockOutput.print(`Logging mock: generate manifest to "${manifestDir}"`)
      }),
      jsonReader: mockJsonReader,
      workDir,
      telemetry: {
        updateUserProperties: vi.fn(),
        log: vi.fn(),
        trace: vi.fn(() => ({start: vi.fn(), error: vi.fn(), complete: vi.fn()}) as any),
      },
      ...overrides,
    } satisfies SchemaStoreContext,
    outputLog,
    apiClient: client,
    mockStores,
  }
}

export function createMockCliOutputter() {
  const log: ANY = []

  // we want control characters here: its needed to remove chalk colors for better readability in test logs
  // eslint-disable-next-line no-control-regex
  const stripAnsi = (str: string) => str.replace(/\x1B\[[0-9;]*m/g, '')
  const noChalkLog = (args: ANY[]) =>
    args.map((arg) => (typeof arg === 'string' ? stripAnsi(arg) : arg))

  const pushLog =
    (method: string) =>
    (...args: ANY[]) => {
      const noChalk = noChalkLog(args)
      // if only a single argument, remove the array to "compress" the test log a bit
      log.push({[method]: noChalk.length === 1 ? noChalk[0] : noChalk})
    }

  const mockOutput: CliOutputter = {
    print: pushLog('print'),
    spinner: () => {
      return {
        start: pushLog('spinnerStart'),
        succeed: pushLog('spinnerSucceed'),
        fail: pushLog('spinnerFail'),
        info: pushLog('spinnerInfo'),
      } as ANY
    },
    warn: pushLog('warn'),
    error: pushLog('error'),
    success: pushLog('success'),
  } as unknown as CliOutputter

  return {
    mockOutput,
    outputLog: log,
  }
}

export function getMockStoreKey({
  projectId,
  dataset,
}: {projectId: string; dataset: string} | ClientConfig) {
  return `${projectId}-${dataset}`
}

/**
 * NOT built for reuse outside schema store tests
 */
export function createMockSanityClient(
  config: {
    projectId: string
    dataset: string
    mockStores?: Record<string, Record<string, SanityDocumentLike | undefined>>
  },
  overrides?: Partial<SanityClient>,
) {
  //dataset -> id -> schema
  const mockStores: Record<
    string,
    Record<string, SanityDocumentLike | undefined>
  > = config.mockStores ?? {}

  const storeKey = getMockStoreKey(config)
  const client = {
    config: () => config,
    withConfig: (newConfig: ANY) => {
      return createMockSanityClient(
        {
          ...config,
          ...newConfig,
          mockStores,
        },
        overrides,
      ).client
    },
    createOrReplace: vi.fn(async (document: SanityDocumentLike) => {
      const datasetStore = mockStores[storeKey] ?? {}
      mockStores[storeKey] = {
        ...datasetStore,
        [document._id]: document,
      }
      return document
    }),
    delete: vi.fn(async (id: string) => {
      const datasetStore = mockStores[storeKey] ?? {}
      const doc = datasetStore[id]
      delete datasetStore[id]
      mockStores[storeKey] = datasetStore
      return {results: doc ? [doc] : []}
    }),
    fetch: async () => {
      return Object.values(mockStores[storeKey] ?? {})
    },
    getDocument: async (id: string) => {
      return mockStores[storeKey]?.[id]
    },
    request: vi.fn(async (requestConfig) => {
      //super rough fake of schema store api
      if (requestConfig.method === 'PUT') {
        const docSchema = requestConfig.body.schemas
        if (Array.isArray(docSchema)) {
          for (const workspaceSchema of docSchema) {
            const idName = workspaceSchema.workspace.name.replaceAll(
              new RegExp(`[^a-zA-Z0-9-_]`, 'g'),
              '_',
            )
            const id = workspaceSchema.tag
              ? `${SANITY_WORKSPACE_SCHEMA_ID_PREFIX}.${idName}.tag.${workspaceSchema.tag}`
              : `${SANITY_WORKSPACE_SCHEMA_ID_PREFIX}.${idName}`

            await client.createOrReplace({
              _type: SANITY_WORKSPACE_SCHEMA_TYPE,
              _id: id,
              ...workspaceSchema,
            })
          }
        }
        return undefined
      } else if (requestConfig.method === 'DELETE') {
        await client.delete(requestConfig.url.split('/').slice(-1)[0])
        return {deleted: true}
      }
      if (requestConfig.url.endsWith('/schemas')) {
        return Object.values(mockStores[storeKey] ?? {})
      }
      return mockStores[storeKey]?.[requestConfig.url.split('/').slice(-1)[0]]
    }),
    ...overrides,
  } as unknown as SanityClient
  return {
    client,
    mockStores,
  }
}

export function createMockJsonReader({
  files,
  staticDate,
  fallbackReader,
}: {
  files: Record<string, unknown>
  staticDate: string
  fallbackReader?: ManifestJsonReader
}): ManifestJsonReader {
  return async <T>(path: string) => {
    const fileContent = files[path]
    if (!fileContent) {
      return fallbackReader?.(path)
    }
    return {
      parsedJson: fileContent as T,
      path,
      lastModified: staticDate,
    }
  }
}
