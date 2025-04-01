import {type CliOutputter} from '@sanity/cli'
import {type SanityClient} from '@sanity/client'
import {type SanityDocumentLike} from '@sanity/types'
import {vi} from 'vitest'

import {type SchemaStoreContext} from '../../../../src/_internal/cli/actions/schema/schemaStoreTypes'
import {type ManifestJsonReader} from '../../../../src/_internal/cli/actions/schema/utils/manifestReader'
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

/**
 * NOT built for reuse outside schema store tests
 */
export function createMockSanityClient(
  config: {projectId: string; dataset: string},
  overrides?: Partial<SanityClient>,
) {
  //dataset -> id -> schema
  const mockStores: Record<string, Record<string, SanityDocumentLike | undefined>> = {}

  let dataset = config.dataset
  const client = {
    config: () => ({
      ...config,
      dataset,
    }),
    withConfig: (newConfig: ANY) => {
      if (newConfig && 'dataset' in newConfig) {
        dataset = newConfig?.dataset
      }
      return client
    },
    createOrReplace: vi.fn((document: SanityDocumentLike) => {
      const datasetStore = mockStores[dataset] ?? {}
      mockStores[dataset] = {
        ...datasetStore,
        [document._id]: document,
      }
      return document
    }),
    delete: vi.fn((id: string) => {
      const datasetStore = mockStores[dataset] ?? {}
      const doc = datasetStore[id]
      delete datasetStore[id]
      mockStores[dataset] = datasetStore
      return {results: doc ? [doc] : []}
    }),
    fetch: () => Object.values(mockStores[dataset] ?? {}),
    getDocument: (id: string) => {
      return mockStores[dataset]?.[id]
    },
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
