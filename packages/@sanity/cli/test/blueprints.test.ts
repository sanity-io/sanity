import {describe, expect, it, vi} from 'vitest'

import addBlueprintsCommand from '../src/commands/blueprints/addBlueprintsCommand'
import configBlueprintsCommand from '../src/commands/blueprints/configBlueprintsCommand'
import deployBlueprintsCommand from '../src/commands/blueprints/deployBlueprintsCommand'
import destroyBlueprintsCommand from '../src/commands/blueprints/destroyBlueprintsCommand'
import doctorBlueprintsCommand from '../src/commands/blueprints/doctorBlueprintsCommand'
import infoBlueprintsCommand from '../src/commands/blueprints/infoBlueprintsCommand'
import initBlueprintsCommand from '../src/commands/blueprints/initBlueprintsCommand'
import logsBlueprintsCommand from '../src/commands/blueprints/logsBlueprintsCommand'
import planBlueprintsCommand from '../src/commands/blueprints/planBlueprintsCommand'
import stacksBlueprintsCommand from '../src/commands/blueprints/stacksBlueprintsCommand'
import {type CliCommandArguments, type CliCommandContext} from '../src/types'

// Mock all blueprint cores
const mockCores = {
  blueprintConfigCore: vi.fn().mockResolvedValue({success: true}),
  blueprintDeployCore: vi.fn().mockResolvedValue({success: true}),
  blueprintDestroyCore: vi.fn().mockResolvedValue({success: true}),
  blueprintDoctorCore: vi.fn().mockResolvedValue({success: true}),
  blueprintInfoCore: vi.fn().mockResolvedValue({success: true}),
  blueprintInitCore: vi.fn().mockResolvedValue({success: true}),
  blueprintLogsCore: vi.fn().mockResolvedValue({success: true}),
  blueprintPlanCore: vi.fn().mockResolvedValue({success: true}),
  blueprintStacksCore: vi.fn().mockResolvedValue({success: true}),
}

const fnsMockCores = {
  functionAddCore: vi.fn().mockResolvedValue({success: true}),
}

vi.mock('@sanity/runtime-cli/cores/blueprints', () => mockCores)
vi.mock('@sanity/runtime-cli/cores/functions', () => fnsMockCores)

const token = 'test-token'
const localBlueprint = {
  projectId: 'a1b2c3',
  stackId: 'ST-1a2b3c4d5e',
}
const config = {
  bin: 'sanity',
  log: (message: string) => message,
  token,
}

vi.mock('@sanity/runtime-cli/cores', () => ({
  initBlueprintConfig: vi.fn().mockResolvedValue({
    ok: true,
    value: {
      ...config,
    },
  }),
  initDeployedBlueprintConfig: vi.fn().mockResolvedValue({
    ok: true,
    value: {
      ...config,
      blueprint: localBlueprint,
    },
  }),
}))

describe('blueprints commands exports', () => {
  it('should be a set of commands', async () => {
    expect(addBlueprintsCommand).toBeDefined()
    expect(configBlueprintsCommand).toBeDefined()
    expect(deployBlueprintsCommand).toBeDefined()
    expect(destroyBlueprintsCommand).toBeDefined()
    expect(doctorBlueprintsCommand).toBeDefined()
    expect(infoBlueprintsCommand).toBeDefined()
    expect(initBlueprintsCommand).toBeDefined()
    expect(logsBlueprintsCommand).toBeDefined()
    expect(planBlueprintsCommand).toBeDefined()
    expect(stacksBlueprintsCommand).toBeDefined()
  })
})

describe('blueprints commands with mocked cores', () => {
  const emptyArgs: CliCommandArguments = {
    groupOrCommand: 'blueprints',
    argv: [],
    extraArguments: [],
    extOptions: {},
    argsWithoutOptions: [],
  }

  const mockContext: CliCommandContext = {
    apiClient: vi.fn().mockReturnValue({
      config: () => ({token}),
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
    it('should call functionAddCore with "function" argument', async () => {
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

      expect(fnsMockCores.functionAddCore).toHaveBeenCalledWith({
        ...config,
        flags: {
          name: 'test-function',
          type: 'document-publish',
          language: 'ts',
          example: undefined,
          javascript: undefined,
          helpers: false,
          installer: undefined,
          install: undefined,
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

  describe('config command', () => {
    it('should call blueprintConfigCore with flags', async () => {
      const args: CliCommandArguments = {
        ...emptyArgs,
        extOptions: {
          'edit': true,
          'project-id': 'proj123',
          'stack-id': 'ST-1a2b3c4d5e',
        },
      }

      // sanity blueprints config --edit --project-id proj123 --stack-id ST-1a2b3c4d5e
      await configBlueprintsCommand.action(args, mockContext)

      expect(mockCores.blueprintConfigCore).toHaveBeenCalledWith({
        ...config,
        flags: {
          'project-id': 'proj123',
          'stack': 'ST-1a2b3c4d5e',
          'test-config': undefined,
          'edit': true,
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
        ...config,
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
        ...config,
        flags: {
          'no-wait': true,
          'force': true,
          'project-id': undefined,
          'stack-id': undefined,
        },
      })
    })
  })

  describe('doctor command', () => {
    it('should call blueprintDoctorCore with verbose flag', async () => {
      const args: CliCommandArguments = {
        ...emptyArgs,
        extOptions: {verbose: true},
      }

      // sanity blueprints doctor --verbose
      await doctorBlueprintsCommand.action(args, mockContext)

      expect(mockCores.blueprintDoctorCore).toHaveBeenCalledWith({
        bin: 'sanity',
        log: expect.any(Function),
        token,
        flags: {verbose: true, fix: false, json: false},
      })
    })
  })

  describe('info command', () => {
    it('should call blueprintInfoCore with stack id', async () => {
      const args: CliCommandArguments = {
        ...emptyArgs,
        extOptions: {
          stack: 'ST-1a2b3c4d5e',
        },
      }

      // sanity blueprints info --stack ST-1a2b3c4d5e
      await infoBlueprintsCommand.action(args, mockContext)

      expect(mockCores.blueprintInfoCore).toHaveBeenCalledWith({
        ...config,
        blueprint: localBlueprint,
        flags: {},
      })
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
        token,
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
        ...config,
        blueprint: localBlueprint,
        flags: {watch: true},
      })
    })
  })

  describe('plan command', () => {
    it('should call blueprintPlanCore with blueprint', async () => {
      const args: CliCommandArguments = {
        ...emptyArgs,
        extOptions: {verbose: true},
      }

      // sanity blueprints plan --verbose
      await planBlueprintsCommand.action(args, mockContext)

      expect(mockCores.blueprintPlanCore).toHaveBeenCalledWith({
        ...config,
        flags: {verbose: true},
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
        ...config,
        flags: {'project-id': 'proj123'},
      })
    })
  })
})
