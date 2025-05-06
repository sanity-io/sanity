import {describe, expect, it, vi} from 'vitest'

import addBlueprintsCommand from '../src/commands/blueprints/addBlueprintsCommand'
import configBlueprintsCommand from '../src/commands/blueprints/configBlueprintsCommand'
import deployBlueprintsCommand from '../src/commands/blueprints/deployBlueprintsCommand'
import destroyBlueprintsCommand from '../src/commands/blueprints/destroyBlueprintsCommand'
import infoBlueprintsCommand from '../src/commands/blueprints/infoBlueprintsCommand'
import initBlueprintsCommand from '../src/commands/blueprints/initBlueprintsCommand'
import logsBlueprintsCommand from '../src/commands/blueprints/logsBlueprintsCommand'
import planBlueprintsCommand from '../src/commands/blueprints/planBlueprintsCommand'
import stacksBlueprintsCommand from '../src/commands/blueprints/stacksBlueprintsCommand'
import {type CliCommandArguments, type CliCommandContext} from '../src/types'

// Mock all blueprint cores
const mockCores = {
  blueprintAddCore: vi.fn().mockResolvedValue({success: true}),
  blueprintConfigCore: vi.fn().mockResolvedValue({success: true}),
  blueprintDeployCore: vi.fn().mockResolvedValue({success: true}),
  blueprintDestroyCore: vi.fn().mockResolvedValue({success: true}),
  blueprintInfoCore: vi.fn().mockResolvedValue({success: true}),
  blueprintInitCore: vi.fn().mockResolvedValue({success: true}),
  blueprintLogsCore: vi.fn().mockResolvedValue({success: true}),
  blueprintPlanCore: vi.fn().mockResolvedValue({success: true}),
  blueprintStacksCore: vi.fn().mockResolvedValue({success: true}),
}

vi.mock('@sanity/runtime-cli/cores/blueprints', () => mockCores)

// Mock display.errors.presentBlueprintIssues to return a string
vi.mock('@sanity/runtime-cli/utils', () => ({
  display: {
    errors: {
      presentBlueprintIssues: () => 'mocked blueprint issues',
    },
  },
}))

describe('blueprints commands', () => {
  it('should be a set of commands', async () => {
    expect(addBlueprintsCommand).toBeDefined()
    expect(configBlueprintsCommand).toBeDefined()
    expect(deployBlueprintsCommand).toBeDefined()
    expect(destroyBlueprintsCommand).toBeDefined()
    expect(infoBlueprintsCommand).toBeDefined()
    expect(initBlueprintsCommand).toBeDefined()
    expect(logsBlueprintsCommand).toBeDefined()
    expect(planBlueprintsCommand).toBeDefined()
    expect(stacksBlueprintsCommand).toBeDefined()
  })
})

describe('blueprints commands', () => {
  const emptyArgs: CliCommandArguments = {
    groupOrCommand: 'blueprints',
    argv: [],
    extraArguments: [],
    extOptions: {},
    argsWithoutOptions: [],
  }

  const mockContext: CliCommandContext = {
    apiClient: vi.fn().mockReturnValue({
      config: () => ({token: 'test-token'}),
    }),
    output: {
      print: vi.fn(),
      error: vi.fn(),
    },
    prompt: {
      single: vi.fn(),
    },
  } as unknown as CliCommandContext

  describe('add command', () => {
    it('should call blueprintAddCore with function type', async () => {
      const args: CliCommandArguments = {
        ...emptyArgs,
        argsWithoutOptions: ['function'],
        extOptions: {
          'name': 'test-function',
          'fn-type': 'document-publish',
          'lang': 'ts',
        },
      }

      await addBlueprintsCommand.action(args, mockContext)

      expect(mockCores.blueprintAddCore).toHaveBeenCalledWith({
        bin: 'sanity',
        log: expect.any(Function),
        args: {type: 'function'},
        flags: {
          'name': 'test-function',
          'fn-type': 'document-publish',
          'language': 'ts',
          'javascript': undefined,
        },
      })
    })

    it('should error when no resource type provided', async () => {
      await addBlueprintsCommand.action(emptyArgs, mockContext)
      expect(mockContext.output.error).toHaveBeenCalledWith(
        'Resource type is required. Available types: function',
      )
    })
  })

  describe('init command', () => {
    it('should call blueprintInitCore with directory and flags', async () => {
      const args: CliCommandArguments = {
        ...emptyArgs,
        argsWithoutOptions: ['my-dir'],
        extOptions: {
          'blueprint-type': 'studio',
          'project-id': 'proj123',
          'stack-name': 'test-stack',
        },
      }

      await initBlueprintsCommand.action(args, mockContext)

      expect(mockCores.blueprintInitCore).toHaveBeenCalledWith({
        bin: 'sanity',
        log: expect.any(Function),
        token: 'test-token',
        args: {
          dir: 'my-dir',
        },
        flags: {
          'blueprint-type': 'studio',
          'project-id': 'proj123',
          'stack-id': undefined,
          'stack-name': 'test-stack',
        },
      })
    })
  })

  describe('deploy command', () => {
    it('should call blueprintDeployCore with stack details', async () => {
      const args: CliCommandArguments = {
        ...emptyArgs,
        extOptions: {
          'no-wait': true,
        },
      }

      // Mock getBlueprintAndStack -- it's not under test, just need to return a value
      vi.mock('@sanity/runtime-cli/actions/blueprints', () => ({
        getBlueprintAndStack: vi.fn().mockResolvedValue({
          localBlueprint: {
            projectId: 'proj123',
            stackId: 'stack123',
          },
          deployedStack: undefined,
          issues: null,
        }),
      }))

      await deployBlueprintsCommand.action(args, mockContext)

      expect(mockCores.blueprintDeployCore).toHaveBeenCalledWith({
        bin: 'sanity',
        log: expect.any(Function),
        auth: {
          token: 'test-token',
          projectId: 'proj123',
        },
        projectId: 'proj123',
        stackId: 'stack123',
        deployedStack: undefined,
        blueprint: {
          projectId: 'proj123',
          stackId: 'stack123',
        },
        flags: {
          'no-wait': true,
        },
      })
    })
  })

  describe('destroy command', () => {
    it('should call blueprintDestroyCore with force flag', async () => {
      const args: CliCommandArguments = {
        ...emptyArgs,
        extOptions: {
          'force': true,
          'no-wait': true,
        },
      }

      // Mock getBlueprintAndStack
      vi.mock('@sanity/runtime-cli/actions/blueprints', () => ({
        getBlueprintAndStack: vi.fn().mockResolvedValue({
          localBlueprint: {
            projectId: 'proj123',
            stackId: 'stack123',
          },
        }),
      }))

      await destroyBlueprintsCommand.action(args, mockContext)

      expect(mockCores.blueprintDestroyCore).toHaveBeenCalledWith({
        bin: 'sanity',
        log: expect.any(Function),
        token: 'test-token',
        blueprint: expect.any(Object),
        flags: {
          'no-wait': true,
          'force': true,
          'project-id': undefined,
          'stack-id': undefined,
        },
      })
    })
  })
})
