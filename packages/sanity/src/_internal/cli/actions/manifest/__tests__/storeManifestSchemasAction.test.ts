import {type CliCommandArguments, type CliCommandContext} from '@sanity/cli'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import storeManifestSchemas from '../../schema/storeSchemasAction'

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

  it('should store schemas for the specified workspace', async () => {
    const args: CliCommandArguments<any> = {
      extOptions: {
        path: './path/to/schemas',
        workspace: 'testWorkspace',
      },
      groupOrCommand: 'store',
      argv: [],
      argsWithoutOptions: [],
      extraArguments: [],
    }

    await storeManifestSchemas(args, mockContext)

    expect(spinnerInstance.succeed).toHaveBeenCalledWith(expect.stringContaining('Schema stored'))
  })

  it('should fail if workspace name does not match', async () => {
    const args: CliCommandArguments<any> = {
      extOptions: {
        path: './path/to/schemas',
        workspace: 'nonExistentWorkspace',
      },
      groupOrCommand: 'store',
      argv: [],
      argsWithoutOptions: [],
      extraArguments: [],
    }

    await storeManifestSchemas(args, mockContext)

    expect(mockContext.output.error).toHaveBeenCalledWith(
      expect.stringContaining('Workspace nonExistentWorkspace not found in manifest'),
    )
  })
})
