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

const localBlueprint = {
  projectId: 'a1b2c3',
  stackId: 'ST-d4e5f6',
}
// Mock getBlueprintAndStack to return a projectId and stackId without issues or deployedStack
vi.mock('@sanity/runtime-cli/actions/blueprints', () => ({
  getBlueprintAndStack: vi.fn().mockResolvedValue({localBlueprint}),
}))
vi.mock('@sanity/runtime-cli/cores', () => ({
  initBlueprintConfig: vi.fn().mockResolvedValue({
    ok: true,
    value: {
      bin: 'sanity',
      log: vi.fn(),
    },
  }),
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
          'no-fn-helpers': true,
        },
      }

      // sanity blueprints add function --name test-function --fn-type document-publish --lang ts
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
          'fn-helpers': false,
        },
      })
    })

    it('should error when no resource type provided', async () => {
      // sanity blueprints add
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

      // sanity blueprints init my-dir --blueprint-type studio --project-id proj123 --stack-name test-stack
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

      // sanity blueprints deploy --no-wait
      await deployBlueprintsCommand.action(args, mockContext)

      expect(mockCores.blueprintDeployCore).toHaveBeenCalledWith({
        bin: 'sanity',
        log: expect.any(Function),
        auth: {token: 'test-token', projectId: localBlueprint.projectId},
        ...localBlueprint,
        blueprint: localBlueprint,
        flags: {'no-wait': true},
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

      // sanity blueprints destroy --force --no-wait
      await destroyBlueprintsCommand.action(args, mockContext)

      expect(mockCores.blueprintDestroyCore).toHaveBeenCalledWith({
        bin: 'sanity',
        log: expect.any(Function),
        token: 'test-token',
        blueprint: localBlueprint,
        flags: {
          'no-wait': true,
          'force': true,
          'project-id': undefined,
          'stack-id': undefined,
        },
      })
    })
  })

  describe('config command', () => {
    it('should call blueprintConfigCore with flags', async () => {
      const args: CliCommandArguments = {
        ...emptyArgs,
        extOptions: {
          'edit': true,
          'project-id': 'proj123',
          'stack-id': 'stack123',
        },
      }

      // sanity blueprints config --edit --project-id proj123 --stack-id stack123
      await configBlueprintsCommand.action(args, mockContext)

      expect(mockCores.blueprintConfigCore).toHaveBeenCalledWith({
        bin: 'sanity',
        log: expect.any(Function),
        blueprint: localBlueprint,
        token: 'test-token',
        flags: {
          'project-id': 'proj123',
          'stack-id': 'stack123',
          'test-config': undefined,
          'edit': true,
        },
      })
    })
  })

  describe('info command', () => {
    it('should call blueprintInfoCore with stack id', async () => {
      const args: CliCommandArguments = {
        ...emptyArgs,
        extOptions: {
          id: 'stack123',
        },
      }

      // sanity blueprints info --id stack123
      await infoBlueprintsCommand.action(args, mockContext)

      expect(mockCores.blueprintInfoCore).toHaveBeenCalledWith({
        bin: 'sanity',
        log: expect.any(Function),
        auth: {token: 'test-token', projectId: localBlueprint.projectId},
        stackId: localBlueprint.stackId,
        deployedStack: undefined,
        flags: {id: 'stack123'},
      })
    })
  })

  describe('logs command', () => {
    it('should call blueprintLogsCore with watch flag', async () => {
      const args: CliCommandArguments = {
        ...emptyArgs,
        extOptions: {
          watch: true,
        },
      }

      // sanity blueprints logs --watch
      await logsBlueprintsCommand.action(args, mockContext)

      expect(mockCores.blueprintLogsCore).toHaveBeenCalledWith({
        bin: 'sanity',
        log: expect.any(Function),
        auth: {token: 'test-token', projectId: localBlueprint.projectId},
        stackId: localBlueprint.stackId,
        flags: {watch: true},
      })
    })
  })

  describe('plan command', () => {
    it('should call blueprintPlanCore with blueprint', async () => {
      // sanity blueprints plan
      await planBlueprintsCommand.action(emptyArgs, mockContext)

      expect(mockCores.blueprintPlanCore).toHaveBeenCalledWith({
        bin: 'sanity',
        log: expect.any(Function),
        blueprint: localBlueprint,
      })
    })
  })

  describe('stacks command', () => {
    it('should call blueprintStacksCore with project id', async () => {
      const args: CliCommandArguments = {
        ...emptyArgs,
        extOptions: {
          'project-id': 'proj123',
        },
      }

      // sanity blueprints stacks --project-id proj123
      await stacksBlueprintsCommand.action(args, mockContext)

      expect(mockCores.blueprintStacksCore).toHaveBeenCalledWith({
        bin: 'sanity',
        log: expect.any(Function),
        token: 'test-token',
        blueprint: localBlueprint,
        flags: {projectId: 'proj123'},
      })
    })
  })
})
