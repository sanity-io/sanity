import {readFileSync} from 'node:fs'

import {type CliCommandArguments, type CliCommandContext} from '@sanity/cli'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import storeManifestSchemas from '../storeSchemasAction'

// Mock dependencies
vi.mock('node:fs', () => ({
  readFileSync: vi.fn((path) => {
    if (path.includes('create-manifest.json')) {
      return JSON.stringify({
        workspaces: [
          {
            name: 'testWorkspace',
            projectId: 'testProjectId',
            dataset: 'testDataset',
            schema: 'testSchema.json',
          },
        ],
      })
    }
    if (path.includes('testSchema.json')) {
      return JSON.stringify({
        _type: 'schema',
        name: 'testSchema',
      })
    }
    throw new Error('File not found')
  }),
}))

type SpinnerInstance = {
  start: Mock<() => SpinnerInstance>
  succeed: Mock<() => SpinnerInstance>
  fail: Mock<() => SpinnerInstance>
  info: Mock<() => SpinnerInstance>
  text: string
  prefixText: string
  suffixText: string
  color: string
}

describe('storeManifestSchemas', () => {
  let mockContext: CliCommandContext
  let spinnerInstance: SpinnerInstance

  beforeEach(() => {
    vi.clearAllMocks()

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

    mockContext = {
      output: {
        spinner: vi.fn().mockReturnValue(spinnerInstance),
        error: vi.fn(),
        success: vi.fn(),
      },
      workDir: '/path/to/workdir',
      apiClient: vi.fn(() => ({
        config: () => ({projectId: 'testProjectId'}),
        withConfig: vi.fn().mockReturnThis(),
        transaction: vi.fn().mockReturnThis(),
        createOrReplace: vi.fn().mockReturnThis(),
        commit: vi.fn().mockResolvedValue({}),
      })),
    } as unknown as CliCommandContext
  })

  it('should store all schemas when no flags are provided', async () => {
    const args: CliCommandArguments<any> = {
      extOptions: {},
      groupOrCommand: 'store',
      argv: [],
      argsWithoutOptions: [],
      extraArguments: [],
    }

    await storeManifestSchemas(args, mockContext)

    expect(spinnerInstance.succeed).toHaveBeenCalledWith(
      expect.stringContaining('Stored 1/1 schemas'),
    )
  })

  it('should store schema for the specified workspace', async () => {
    const args: CliCommandArguments<any> = {
      extOptions: {
        workspace: 'testWorkspace',
      },
      groupOrCommand: 'store',
      argv: [],
      argsWithoutOptions: [],
      extraArguments: [],
    }

    await storeManifestSchemas(args, mockContext)

    expect(spinnerInstance.succeed).toHaveBeenCalledWith(
      expect.stringContaining('Stored 1/1 schemas'),
    )
  })

  it('should use the specified schema path', async () => {
    const args: CliCommandArguments<any> = {
      extOptions: {
        path: './custom/path/to/schemas',
      },
      groupOrCommand: 'store',
      argv: [],
      argsWithoutOptions: [],
      extraArguments: [],
    }

    await storeManifestSchemas(args, mockContext)

    expect(spinnerInstance.succeed).toHaveBeenCalledWith(
      expect.stringContaining('Stored 1/1 schemas'),
    )
  })

  it('should fail if workspace name does not match', async () => {
    const args: CliCommandArguments<any> = {
      extOptions: {
        workspace: 'nonExistentWorkspace',
      },
      groupOrCommand: 'store',
      argv: [],
      argsWithoutOptions: [],
      extraArguments: [],
    }

    await storeManifestSchemas(args, mockContext)

    expect(spinnerInstance.fail).toHaveBeenCalledWith(
      expect.stringContaining('Workspace nonExistentWorkspace not found in manifest'),
    )
  })

  it('should fail if schema path is invalid', async () => {
    // Adjust the mock to simulate an invalid path scenario
    vi.mocked(readFileSync).mockImplementationOnce((path) => {
      throw new Error('File not found')
    })

    const args: CliCommandArguments<any> = {
      extOptions: {
        path: './invalid/path/to/schemas',
      },
      groupOrCommand: 'store',
      argv: [],
      argsWithoutOptions: [],
      extraArguments: [],
    }

    await storeManifestSchemas(args, mockContext)

    expect(spinnerInstance.fail).toHaveBeenCalledWith(
      expect.stringContaining('Manifest not found at'),
    )
  })
})
