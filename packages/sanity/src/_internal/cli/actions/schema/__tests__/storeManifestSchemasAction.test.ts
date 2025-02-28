import {readFileSync} from 'node:fs'

import {type CliCommandArguments, type CliCommandContext} from '@sanity/cli'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {MANIFEST_FILENAME} from '../../manifest/extractManifestAction'
import {type StoreManifestSchemasFlags} from '../storeSchemasAction'

// Test fixtures
const TEST_WORKSPACE = {
  name: 'testWorkspace',
  projectId: 'testProjectId',
  dataset: 'testDataset',
  schema: 'testSchema.json',
}

const TEST_MANIFEST = {
  workspaces: [TEST_WORKSPACE],
}

const TEST_MANIFEST_MULTI = {
  workspaces: [
    TEST_WORKSPACE,
    {
      name: 'anotherWorkspace',
      projectId: 'testProjectId',
      dataset: 'anotherDataset',
      schema: 'anotherSchema.json',
    },
  ],
}

const TEST_SCHEMA = {
  _type: 'schema',
  name: 'testSchema',
}

// Mock entire modules like in deployAction.test.ts
vi.mock('node:fs', () => ({
  readFileSync: vi.fn(),
  statSync: vi.fn().mockReturnValue({
    mtime: new Date('2023-01-01T00:00:00.000Z'),
  }),
}))

vi.mock('../../manifest/extractManifestAction', () => ({
  extractManifestSafe: vi.fn().mockResolvedValue(undefined),
  MANIFEST_FILENAME: 'sanity.manifest.json',
}))

// Group tests by functional area
describe('storeManifestSchemas', () => {
  // Shared variables for all tests
  let storeManifestSchemas: (
    args: CliCommandArguments<StoreManifestSchemasFlags>,
    context: CliCommandContext,
  ) => Promise<Error | undefined>
  let mockContext: CliCommandContext
  let spinnerInstance: any
  let mockCommit: Mock
  let mockApiClient: any
  let mockError: Error | null = null

  // More concise helpers like in deployAction.test.ts
  const createArgs = (
    flags: Partial<StoreManifestSchemasFlags> = {},
  ): CliCommandArguments<StoreManifestSchemasFlags> => ({
    extOptions: flags,
    groupOrCommand: 'store',
    argv: [],
    argsWithoutOptions: [],
    extraArguments: [],
  })

  const mockManifestFile = (manifest = TEST_MANIFEST) => {
    vi.mocked(readFileSync).mockImplementation((filepath) => {
      if (String(filepath).includes(MANIFEST_FILENAME)) {
        return JSON.stringify(manifest)
      } else if (
        String(filepath).includes('testSchema.json') ||
        String(filepath).includes('anotherSchema.json')
      ) {
        return JSON.stringify(TEST_SCHEMA)
      }
      throw new Error(`File not found: ${filepath}`)
    })
  }

  const simulateApiError = () => {
    mockError = new Error('API error')
    mockCommit.mockRejectedValueOnce(mockError)
  }

  // Clean setup before each test, similar to deployAction.test.ts
  beforeEach(async () => {
    // Clear mocks and state
    vi.clearAllMocks()
    mockError = null

    // Reset module imports
    vi.resetModules()

    // Environment setup
    process.env.SANITY_CLI_SCHEMA_STORE_ENABLED = 'true'

    // Import modules fresh for each test (avoids caching issues)
    const storeSchemasModule = await import('../storeSchemasAction')
    storeManifestSchemas = storeSchemasModule.default

    // Mock spinner (similar to deployAction.test.ts approach)
    spinnerInstance = {
      start: vi.fn(() => spinnerInstance),
      succeed: vi.fn(() => spinnerInstance),
      fail: vi.fn(() => spinnerInstance),
      info: vi.fn(() => spinnerInstance),
      text: '',
      prefixText: '',
      suffixText: '',
      color: '',
    }

    // API client mock chain (similar to deployAction.test.ts approach)
    mockCommit = vi.fn().mockResolvedValue({transactionId: 'mock-transaction'})
    mockApiClient = {
      config: () => ({projectId: 'testProjectId'}),
      withConfig: vi.fn().mockReturnThis(),
      transaction: vi.fn().mockReturnThis(),
      createOrReplace: vi.fn().mockReturnThis(),
      commit: mockCommit,
    }

    // Context mock
    mockContext = {
      output: {
        print: vi.fn(),
        spinner: vi.fn().mockReturnValue(spinnerInstance),
        error: vi.fn(),
        success: vi.fn(),
      },
      workDir: '/path/to/workdir',
      apiClient: vi.fn(() => mockApiClient),
    } as unknown as CliCommandContext

    // Default manifest fixture
    mockManifestFile()
  })

  // Group tests by functionality
  describe('basic functionality', () => {
    it('should store all schemas when no flags are provided', async () => {
      await storeManifestSchemas(createArgs(), mockContext)

      expect(mockCommit).toHaveBeenCalled()
      expect(spinnerInstance.succeed).toHaveBeenCalledWith('Stored 1/1 schemas')
      expect(mockContext.output.print).toHaveBeenCalledWith(
        expect.stringContaining('sanity schema list'),
      )
    })

    it('should store schema for the specified workspace', async () => {
      await storeManifestSchemas(createArgs({workspace: 'testWorkspace'}), mockContext)

      expect(mockCommit).toHaveBeenCalled()
      expect(spinnerInstance.succeed).toHaveBeenCalledWith('Stored 1 schemas')
    })

    it('should handle multiple workspaces', async () => {
      mockManifestFile(TEST_MANIFEST_MULTI)

      await storeManifestSchemas(createArgs(), mockContext)

      expect(mockCommit).toHaveBeenCalledTimes(2)
      expect(spinnerInstance.succeed).toHaveBeenCalledWith('Stored 2/2 schemas')
    })
  })

  describe('flag handling', () => {
    it('should add id-prefix when specified', async () => {
      await storeManifestSchemas(createArgs({'id-prefix': 'test-prefix'}), mockContext)

      expect(mockApiClient.createOrReplace).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: expect.stringContaining('test-prefix'),
        }),
      )
    })

    it('should handle verbose output mode', async () => {
      await storeManifestSchemas(createArgs({verbose: true}), mockContext)

      expect(mockContext.output.print).toHaveBeenCalledWith(expect.stringContaining('schemaId:'))
    })
  })

  describe('error handling', () => {
    it('should handle schema loading failure', async () => {
      vi.mocked(readFileSync).mockImplementation((filepath) => {
        if (String(filepath).includes(MANIFEST_FILENAME)) {
          return JSON.stringify(TEST_MANIFEST)
        }
        throw new Error('Schema file not found')
      })

      const result = await storeManifestSchemas(createArgs(), mockContext)

      expect(result).toBeInstanceOf(Error)
      expect(spinnerInstance.fail).toHaveBeenCalled()
    })

    it('should continue on non-required schema failure', async () => {
      vi.mocked(readFileSync).mockImplementation((filepath) => {
        if (String(filepath).includes(MANIFEST_FILENAME)) {
          return JSON.stringify(TEST_MANIFEST)
        }
        throw new Error('Schema file not found')
      })

      await storeManifestSchemas(createArgs({'schema-required': false}), mockContext)

      expect(spinnerInstance.fail).toHaveBeenCalled()
      expect(mockContext.output.print).toHaveBeenCalledWith(
        expect.stringContaining('sanity schema list'),
      )
    })

    it('should fail on schema-required failure', async () => {
      vi.mocked(readFileSync).mockImplementation((filepath) => {
        if (String(filepath).includes(MANIFEST_FILENAME)) {
          return JSON.stringify(TEST_MANIFEST)
        }
        throw new Error('Schema file not found')
      })

      await expect(
        storeManifestSchemas(createArgs({'schema-required': true}), mockContext),
      ).rejects.toThrow()
    })

    it('should handle API errors', async () => {
      simulateApiError()

      const result = await storeManifestSchemas(createArgs(), mockContext)

      expect(result).toBe(mockError)
      expect(spinnerInstance.fail).toHaveBeenCalled()
    })

    it('should handle invalid workspace name', async () => {
      const args = createArgs({workspace: 'nonExistentWorkspace'})
      const result = await storeManifestSchemas(args, mockContext)

      expect(result).toBeInstanceOf(Error)
      expect(spinnerInstance.fail).toHaveBeenCalledWith(
        expect.stringContaining('Workspace nonExistentWorkspace not found in manifest'),
      )
    })
  })

  describe('manifest handling', () => {
    it('should handle missing manifest by attempting to extract it', async () => {
      let manifestFound = false
      vi.mocked(readFileSync).mockImplementation((filepath) => {
        if (String(filepath).includes(MANIFEST_FILENAME)) {
          if (!manifestFound) {
            manifestFound = true
            throw new Error('File not found')
          }
          return JSON.stringify(TEST_MANIFEST)
        } else if (String(filepath).includes('testSchema.json')) {
          return JSON.stringify(TEST_SCHEMA)
        }
        throw new Error(`File not found: ${filepath}`)
      })

      await storeManifestSchemas(createArgs(), mockContext)

      expect(spinnerInstance.succeed).toHaveBeenCalledWith('Stored 1/1 schemas')
    })

    it('should handle manifest extraction failure', async () => {
      vi.mocked(readFileSync).mockImplementation(() => {
        throw new Error('File not found')
      })

      const result = await storeManifestSchemas(createArgs(), mockContext)

      expect(result).toBeInstanceOf(Error)
      expect(mockContext.output.print).toHaveBeenCalledWith(
        expect.stringContaining('sanity schema list'),
      )
    })
  })

  describe('feature flag handling', () => {
    it('should not run when feature flag is disabled', async () => {
      process.env.SANITY_CLI_SCHEMA_STORE_ENABLED = 'false'
      vi.resetModules()
      const storeSchemasModule = await import('../storeSchemasAction')
      const storeManifestSchemasWithFlag = storeSchemasModule.default

      const result = await storeManifestSchemasWithFlag(createArgs(), mockContext)

      expect(result).toBeUndefined()
      expect(spinnerInstance.start).not.toHaveBeenCalled()

      process.env.SANITY_CLI_SCHEMA_STORE_ENABLED = 'true'
    })
  })

  it('should handle invalid manifest path', async () => {
    vi.mocked(readFileSync).mockImplementation(() => {
      throw new Error('File not found')
    })

    const args: CliCommandArguments<any> = {
      extOptions: {
        'manifest-dir': './invalid/dir/to/schemas',
      },
      groupOrCommand: 'store',
      argv: [],
      argsWithoutOptions: [],
      extraArguments: [],
    }

    const result = await storeManifestSchemas(args, mockContext)

    expect(result).toBeInstanceOf(Error)
    expect(spinnerInstance.fail).toHaveBeenCalledWith(
      expect.stringContaining('Failed to read manifest at'),
    )
  })
})
