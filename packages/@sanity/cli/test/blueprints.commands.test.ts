import {describe, expect, it, vi} from 'vitest'

import addBlueprintsCommand from '../src/commands/blueprints/addBlueprintsCommand'
import configBlueprintsCommand from '../src/commands/blueprints/configBlueprintsCommand'
import deployBlueprintsCommand from '../src/commands/blueprints/deployBlueprintsCommand'
import infoBlueprintsCommand from '../src/commands/blueprints/infoBlueprintsCommand'
import initBlueprintsCommand from '../src/commands/blueprints/initBlueprintsCommand'
import logsBlueprintsCommand from '../src/commands/blueprints/logsBlueprintsCommand'
import planBlueprintsCommand from '../src/commands/blueprints/planBlueprintsCommand'
import stacksBlueprintsCommand from '../src/commands/blueprints/stacksBlueprintsCommand'
import {type CliCommandArguments, type CliCommandContext} from '../src/types'

vi.mock('@sanity/runtime-cli/actions/blueprints', () => ({
  blueprint: {
    readBlueprintOnDisk: vi.fn(),
    findBlueprintFile: vi.fn(),
    writeBlueprintToDisk: vi.fn(),
    writeConfigFile: vi.fn(),
    readConfigFile: vi.fn(),
  },
  stacks: {
    getStack: vi.fn(),
    listStacks: vi.fn(),
    createStack: vi.fn(),
    updateStack: vi.fn(),
  },
  projects: {
    listProjects: vi.fn(),
  },
  logs: {
    getLogs: vi.fn(),
  },
  assets: {
    uploadAssets: vi.fn(),
    stashAsset: vi.fn(),
  },
}))

vi.mock('@sanity/runtime-cli/utils', () => ({
  display: {
    blueprintsFormatting: {
      formatStackInfo: vi.fn(),
      formatDeploymentLogs: vi.fn(),
      formatDeploymentPlan: vi.fn(),
      formatTitle: vi.fn(),
      formatResourceTree: vi.fn(),
      formatStacksListing: vi.fn(),
    },
    logsFormatting: {
      organizeLogsByDay: vi.fn(),
      formatLogsByDay: vi.fn(),
    },
    colors: {
      bold: (str: string) => str,
      yellow: (str: string) => str,
      green: (str: string) => str,
      red: (str: string) => str,
    },
  },
}))

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
    },
    prompt: {
      single: vi.fn(),
    },
  } as unknown as CliCommandContext

  describe('info command', () => {
    it('should call getStack with correct args when stack ID is provided', async () => {
      const {blueprint, stacks} = await import('@sanity/runtime-cli/actions/blueprints')
      const {display} = await import('@sanity/runtime-cli/utils')

      // @ts-expect-error - Mocking imported function
      blueprint.readBlueprintOnDisk.mockResolvedValue({
        projectId: 'test-project',
        errors: [],
      })

      // @ts-expect-error - Mocking imported function
      stacks.getStack.mockResolvedValue({
        ok: true,
        stack: {id: 'test-stack', name: 'Test Stack'},
      })

      // @ts-expect-error - Mocking imported function
      display.blueprintsFormatting.formatStackInfo.mockReturnValue('formatted stack info')

      const args: CliCommandArguments<{id?: string}> = {
        groupOrCommand: 'blueprints',
        argv: [],
        extraArguments: [],
        extOptions: {id: 'test-stack'},
        argsWithoutOptions: [],
      }

      await infoBlueprintsCommand.action(args, mockContext)

      expect(stacks.getStack).toHaveBeenCalledWith({
        stackId: 'test-stack',
        auth: {token: 'test-token', projectId: 'test-project'},
      })
      expect(mockContext.output.print).toHaveBeenCalledWith('formatted stack info')
    })
  })

  describe('init command', () => {
    it('should exit early if no API token is found', async () => {
      const mockContextWithoutToken = {
        ...mockContext,
        apiClient: vi.fn().mockReturnValue({
          config: () => ({token: null}),
        }),
      }

      const args = emptyArgs

      await initBlueprintsCommand.action(args, mockContextWithoutToken)

      expect(mockContextWithoutToken.output.print).toHaveBeenCalledWith(
        'No API token found. Please run `sanity login` first.',
      )
    })

    it('should exit early if blueprint file already exists', async () => {
      const {blueprint} = await import('@sanity/runtime-cli/actions/blueprints')
      // @ts-expect-error - Mocking imported function
      blueprint.findBlueprintFile.mockReturnValue({fileName: 'existing-blueprint.json'})

      const args = emptyArgs

      await initBlueprintsCommand.action(args, mockContext)

      expect(mockContext.output.print).toHaveBeenCalledWith(
        'A blueprint file already exists: existing-blueprint.json',
      )
    })

    it('should exit early if no projects are found', async () => {
      const {blueprint, projects} = await import('@sanity/runtime-cli/actions/blueprints')
      // @ts-expect-error - Mocking imported function
      blueprint.findBlueprintFile.mockReturnValue(null)
      // @ts-expect-error - Mocking imported function
      projects.listProjects.mockResolvedValue({ok: true, projects: []})

      const args = emptyArgs

      await initBlueprintsCommand.action(args, mockContext)

      expect(mockContext.output.print).toHaveBeenCalledWith(
        'No Projects found. Please create a Project in Sanity.io first.',
      )
    })

    it('should create blueprint file and config when successful', async () => {
      const {blueprint, projects} = await import('@sanity/runtime-cli/actions/blueprints')
      // @ts-expect-error - Mocking imported function
      blueprint.findBlueprintFile.mockReturnValue(null)
      // @ts-expect-error - Mocking imported function
      projects.listProjects.mockResolvedValue({
        ok: true,
        projects: [{id: 'test-project', displayName: 'Test Project'}],
      })

      // @ts-expect-error - Mocking imported function
      mockContext.prompt.single.mockResolvedValueOnce('json').mockResolvedValueOnce('test-project')

      const args = emptyArgs

      await initBlueprintsCommand.action(args, mockContext)

      expect(blueprint.writeBlueprintToDisk).toHaveBeenCalledWith({
        path: expect.stringContaining('blueprint.json'),
        fileType: 'json',
      })
      expect(blueprint.writeConfigFile).toHaveBeenCalledWith({projectId: 'test-project'})
      expect(mockContext.output.print).toHaveBeenCalledWith(
        'Created new blueprint: ./blueprint.json',
      )
    })
  })

  describe('deploy command', () => {
    it('should exit early if no API token is found', async () => {
      const mockContextWithoutToken = {
        ...mockContext,
        apiClient: vi.fn().mockReturnValue({
          config: () => ({token: null}),
        }),
      }

      const args = emptyArgs

      await deployBlueprintsCommand.action(args, mockContextWithoutToken)

      expect(mockContextWithoutToken.output.print).toHaveBeenCalledWith(
        'No API token found. Please run `sanity login` first.',
      )
    })

    it('should deploy blueprint when successful', async () => {
      const {blueprint, stacks, assets} = await import('@sanity/runtime-cli/actions/blueprints')

      // @ts-expect-error - Mocking imported function
      blueprint.readBlueprintOnDisk.mockResolvedValue({
        projectId: 'test-project',
        stackId: null,
        errors: [],
        parsedBlueprint: {
          resources: [],
        },
        fileInfo: {
          fileName: 'blueprint.json',
        },
        deployedStack: null,
      })

      // @ts-expect-error - Mocking imported function
      stacks.createStack.mockResolvedValue({
        ok: true,
        stack: {id: 'test-stack', name: 'Test Stack'},
      })

      // @ts-expect-error - Mocking imported function
      assets.stashAsset.mockResolvedValue({
        success: true,
        assetId: 'test-asset',
      })

      // @ts-expect-error - Mocking imported function
      mockContext.prompt.single.mockResolvedValue('Test Stack')

      const args = emptyArgs

      await deployBlueprintsCommand.action(args, mockContext)

      expect(stacks.createStack).toHaveBeenCalledWith({
        stackPayload: {
          name: 'Test Stack',
          projectId: 'test-project',
          document: {resources: []},
        },
        auth: {token: 'test-token', projectId: 'test-project'},
      })
    })
  })

  describe('logs command', () => {
    it('should exit early if no API token is found', async () => {
      const mockContextWithoutToken = {
        ...mockContext,
        apiClient: vi.fn().mockReturnValue({
          config: () => ({token: null}),
        }),
      }

      const args = emptyArgs

      await logsBlueprintsCommand.action(args, mockContextWithoutToken)

      expect(mockContextWithoutToken.output.print).toHaveBeenCalledWith(
        'No API token found. Please run `sanity login` first.',
      )
    })

    it('should show deployment logs when successful', async () => {
      const {blueprint, logs} = await import('@sanity/runtime-cli/actions/blueprints')
      const {display} = await import('@sanity/runtime-cli/utils')

      // @ts-expect-error - Mocking imported function
      blueprint.readBlueprintOnDisk.mockResolvedValue({
        projectId: 'test-project',
        stackId: 'test-stack',
        errors: [],
        parsedBlueprint: {
          resources: [],
        },
        fileInfo: {
          fileName: 'blueprint.json',
        },
        deployedStack: {
          id: 'test-stack',
          name: 'Test Stack',
          projectId: 'test-project',
        },
      })

      // @ts-expect-error - Mocking imported function
      logs.getLogs.mockResolvedValue({
        ok: true,
        logs: ['log1', 'log2'],
      })

      // @ts-expect-error - Mocking imported function
      display.blueprintsFormatting.formatTitle.mockReturnValue('Blueprint Test Stack')
      // @ts-expect-error - Mocking imported function
      display.logsFormatting.organizeLogsByDay.mockReturnValue({})
      // @ts-expect-error - Mocking imported function
      display.logsFormatting.formatLogsByDay.mockReturnValue('formatted logs')

      const args = emptyArgs

      await logsBlueprintsCommand.action(args, mockContext)

      expect(logs.getLogs).toHaveBeenCalledWith('test-stack', {
        token: 'test-token',
        projectId: 'test-project',
      })
      expect(mockContext.output.print).toHaveBeenCalledWith('formatted logs')
    })
  })

  describe('plan command', () => {
    it('should show plan even without API token', async () => {
      const {blueprint} = await import('@sanity/runtime-cli/actions/blueprints')
      const {display} = await import('@sanity/runtime-cli/utils')

      // @ts-expect-error - Mocking imported function
      blueprint.readBlueprintOnDisk.mockResolvedValue({
        projectId: 'test-project',
        stackId: 'test-stack',
        errors: [],
        parsedBlueprint: {
          resources: [],
        },
        fileInfo: {
          fileName: 'blueprint.json',
        },
      })

      // @ts-expect-error - Mocking imported function
      display.blueprintsFormatting.formatTitle.mockReturnValue('Blueprint test-stack')
      // @ts-expect-error - Mocking imported function
      display.blueprintsFormatting.formatResourceTree.mockReturnValue('Resource tree')

      const mockContextWithoutToken = {
        ...mockContext,
        apiClient: vi.fn().mockReturnValue({
          config: () => ({token: null}),
        }),
      }

      const args = emptyArgs

      await planBlueprintsCommand.action(args, mockContextWithoutToken)

      expect(mockContextWithoutToken.output.print).toHaveBeenCalledWith(
        'Blueprint test-stack Plan\n',
      )
      expect(mockContextWithoutToken.output.print).toHaveBeenCalledWith(
        'Blueprint document: (blueprint.json)',
      )
      expect(mockContextWithoutToken.output.print).toHaveBeenCalledWith('Resource tree')
      expect(mockContextWithoutToken.output.print).toHaveBeenCalledWith(
        '\nRun `sanity blueprints deploy` to deploy these changes',
      )
    })
  })

  describe('stacks command', () => {
    it('should exit early if no API token is found', async () => {
      const mockContextWithoutToken = {
        ...mockContext,
        apiClient: vi.fn().mockReturnValue({
          config: () => ({token: null}),
        }),
      }

      const args = emptyArgs

      await stacksBlueprintsCommand.action(args, mockContextWithoutToken)

      expect(mockContextWithoutToken.output.print).toHaveBeenCalledWith(
        'No API token found. Please run `sanity login` first.',
      )
    })

    it('should list stacks when successful', async () => {
      const {blueprint, stacks} = await import('@sanity/runtime-cli/actions/blueprints')
      const {display} = await import('@sanity/runtime-cli/utils')

      // @ts-expect-error - Mocking imported function
      blueprint.readBlueprintOnDisk.mockResolvedValue({
        projectId: 'test-project',
        errors: [],
        stackId: 'test-stack',
      })

      // @ts-expect-error - Mocking imported function
      stacks.listStacks.mockResolvedValue({
        ok: true,
        stacks: [
          {id: 'stack1', name: 'Stack 1'},
          {id: 'stack2', name: 'Stack 2'},
        ],
      })

      // @ts-expect-error - Mocking imported function
      display.blueprintsFormatting.formatStacksListing.mockReturnValue('formatted stacks')

      const args = emptyArgs

      await stacksBlueprintsCommand.action(args, mockContext)

      expect(stacks.listStacks).toHaveBeenCalledWith({
        token: 'test-token',
        projectId: 'test-project',
      })
      expect(mockContext.output.print).toHaveBeenCalledWith('formatted stacks')
    })
  })

  describe('add command', () => {
    it('should exit early if no API token is found', async () => {
      const mockContextWithoutToken = {
        ...mockContext,
        apiClient: vi.fn().mockReturnValue({
          config: () => ({token: null}),
        }),
      }

      const args = emptyArgs

      await addBlueprintsCommand.action(args, mockContextWithoutToken)

      expect(mockContextWithoutToken.output.print).toHaveBeenCalledWith(
        'No API token found. Please run `sanity login` first.',
      )
    })
  })

  describe('config command', () => {
    it('should exit early if no API token is found', async () => {
      const mockContextWithoutToken = {
        ...mockContext,
        apiClient: vi.fn().mockReturnValue({
          config: () => ({token: null}),
        }),
      }

      const args = emptyArgs

      await configBlueprintsCommand.action(args, mockContextWithoutToken)

      expect(mockContextWithoutToken.output.print).toHaveBeenCalledWith(
        'No API token found. Please run `sanity login` first.',
      )
    })
  })
})
