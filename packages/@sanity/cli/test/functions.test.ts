import {describe, expect, it, vi} from 'vitest'

import devFunctionsCommand from '../src/commands/functions/devFunctionsCommand'
import envFunctionsCommand from '../src/commands/functions/envFunctionsCommand'
import logsFunctionsCommand from '../src/commands/functions/logsFunctionsCommand'
import testFunctionsCommand from '../src/commands/functions/testFunctionsCommand'
import {type CliCommandArguments, type CliCommandContext} from '../src/types'

const mockCores = {
  functionDevCore: vi.fn().mockResolvedValue({success: true}),
  functionEnvAddCore: vi.fn().mockResolvedValue({success: true}),
  functionEnvListCore: vi.fn().mockResolvedValue({success: true}),
  functionEnvRemoveCore: vi.fn().mockResolvedValue({success: true}),
  functionLogsCore: vi.fn().mockResolvedValue({success: true}),
  functionTestCore: vi.fn().mockResolvedValue({success: true}),
}

vi.mock('@sanity/runtime-cli/cores/functions', () => mockCores)

const token = 'test-token'
const localBlueprint = {
  projectId: 'a1b2c3',
  stackId: 'ST-d4e5f6',
}
const config = {
  bin: 'sanity',
  log: (message: string) => message,
  token,
}

vi.mock('@sanity/runtime-cli/cores', () => ({
  initBlueprintConfig: vi.fn().mockResolvedValue({
    ok: true,
    value: {...config},
  }),
  initDeployedBlueprintConfig: vi.fn().mockResolvedValue({
    ok: true,
    value: {
      ...config,
      blueprint: localBlueprint,
    },
  }),
}))

vi.mock('@sanity/runtime-cli/actions/blueprints', () => ({
  blueprint: {
    readLocalBlueprint: vi.fn().mockResolvedValue({projectId: 'a1b2c3'}),
  },
}))

describe('functions commands exports', () => {
  it('should be a set of commands', () => {
    expect(devFunctionsCommand).toBeDefined()
    expect(envFunctionsCommand).toBeDefined()
    expect(logsFunctionsCommand).toBeDefined()
    expect(testFunctionsCommand).toBeDefined()
  })
})

describe('functions commands with mocked cores', () => {
  const emptyArgs: CliCommandArguments = {
    groupOrCommand: 'functions',
    argv: [],
    extraArguments: [],
    extOptions: {},
    argsWithoutOptions: [],
  }

  const mockContext: CliCommandContext = {
    apiClient: vi.fn().mockReturnValue({
      config: () => ({token, projectId: 'a1b2c3', dataset: 'production'}),
    }),
    output: {
      print: vi.fn(),
      error: vi.fn(),
    },
    prompt: {
      single: vi.fn(),
    },
    chalk: {
      yellow: (s: string) => s,
      cyan: (s: string) => s,
      green: (s: string) => s,
    },
  } as unknown as CliCommandContext

  describe('dev command', () => {
    it('should call functionDevCore with default flags', async () => {
      // sanity functions dev
      await devFunctionsCommand.action(emptyArgs, mockContext)

      expect(mockCores.functionDevCore).toHaveBeenCalledWith({
        ...config,
        flags: {
          host: 'localhost',
          port: 8080,
          timeout: undefined,
        },
      })
    })

    it('should call functionDevCore with custom port', async () => {
      const args: CliCommandArguments = {
        ...emptyArgs,
        extOptions: {port: 3000},
      }

      // sanity functions dev --port 3000
      await devFunctionsCommand.action(args, mockContext)

      expect(mockCores.functionDevCore).toHaveBeenCalledWith({
        ...config,
        flags: {
          host: 'localhost',
          port: 3000,
          timeout: undefined,
        },
      })
    })
  })

  describe('env command', () => {
    it('should call functionEnvAddCore with name, key, and value', async () => {
      const args: CliCommandArguments = {
        ...emptyArgs,
        argsWithoutOptions: ['add', 'my-function', 'API_KEY', 'secret123'],
      }

      // sanity functions env add my-function API_KEY secret123
      await envFunctionsCommand.action(args, mockContext)

      expect(mockCores.functionEnvAddCore).toHaveBeenCalledWith({
        ...config,
        blueprint: localBlueprint,
        args: {name: 'my-function', key: 'API_KEY', value: 'secret123'},
      })
    })

    it('should call functionEnvListCore with function name', async () => {
      const args: CliCommandArguments = {
        ...emptyArgs,
        argsWithoutOptions: ['list', 'my-function'],
      }

      // sanity functions env list my-function
      await envFunctionsCommand.action(args, mockContext)

      expect(mockCores.functionEnvListCore).toHaveBeenCalledWith({
        ...config,
        blueprint: localBlueprint,
        args: {name: 'my-function'},
      })
    })

    it('should call functionEnvRemoveCore with name and key', async () => {
      const args: CliCommandArguments = {
        ...emptyArgs,
        argsWithoutOptions: ['remove', 'my-function', 'API_KEY'],
      }

      // sanity functions env remove my-function API_KEY
      await envFunctionsCommand.action(args, mockContext)

      expect(mockCores.functionEnvRemoveCore).toHaveBeenCalledWith({
        ...config,
        blueprint: localBlueprint,
        args: {name: 'my-function', key: 'API_KEY'},
      })
    })

    it('should error when no subcommand provided', async () => {
      await expect(envFunctionsCommand.action(emptyArgs, mockContext)).rejects.toThrow(
        'You must specify if you want to list, add or remove',
      )
    })

    it('should error when add is missing key or value', async () => {
      const args: CliCommandArguments = {
        ...emptyArgs,
        argsWithoutOptions: ['add', 'my-function'],
      }

      await expect(envFunctionsCommand.action(args, mockContext)).rejects.toThrow(
        'You must specify the name, key and value arguments',
      )
    })
  })

  describe('logs command', () => {
    it('should call functionLogsCore with function name and flags', async () => {
      const args: CliCommandArguments = {
        ...emptyArgs,
        argsWithoutOptions: ['my-function'],
        extOptions: {watch: true},
      }

      // sanity functions logs my-function --watch
      await logsFunctionsCommand.action(args, mockContext)

      expect(mockCores.functionLogsCore).toHaveBeenCalledWith({
        ...config,
        blueprint: localBlueprint,
        helpText: expect.any(String),
        error: expect.any(Function),
        args: {name: 'my-function'},
        flags: {
          limit: 50,
          json: false,
          utc: false,
          delete: false,
          force: false,
          watch: true,
        },
      })
    })

    it('should error when no function name provided', async () => {
      await expect(logsFunctionsCommand.action(emptyArgs, mockContext)).rejects.toThrow(
        'You must provide a function name as the first argument',
      )
    })
  })

  describe('test command', () => {
    it('should call functionTestCore with function name and flags', async () => {
      const args: CliCommandArguments = {
        ...emptyArgs,
        argsWithoutOptions: ['my-function'],
        extOptions: {
          event: 'create',
          data: '{"foo": "bar"}',
        },
      }

      // sanity functions test my-function --event create --data '{"foo": "bar"}'
      await testFunctionsCommand.action(args, mockContext)

      expect(mockCores.functionTestCore).toHaveBeenCalledWith({
        ...config,
        args: {name: 'my-function'},
        helpText: expect.any(String),
        error: expect.any(Function),
        flags: expect.objectContaining({
          event: 'create',
          data: '{"foo": "bar"}',
          timeout: 10,
        }),
      })
    })

    it('should error when no function name provided', async () => {
      await expect(testFunctionsCommand.action(emptyArgs, mockContext)).rejects.toThrow(
        'You must provide a function name as the first argument',
      )
    })

    it('should error when update event missing before/after pairs', async () => {
      const args: CliCommandArguments = {
        ...emptyArgs,
        argsWithoutOptions: ['my-function'],
        extOptions: {event: 'update'},
      }

      await expect(testFunctionsCommand.action(args, mockContext)).rejects.toThrow(
        'When using --event=update',
      )
    })
  })
})
