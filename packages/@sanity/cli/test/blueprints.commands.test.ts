import {describe, expect, it, vi} from 'vitest'

import infoBlueprintsCommand from '../src/commands/blueprints/infoBlueprintsCommand'
import {type CliCommandArguments, type CliCommandContext} from '../src/types'

vi.mock('@sanity/runtime-cli/actions/blueprints', () => ({
  blueprint: {
    readBlueprintOnDisk: vi.fn(),
  },
  stacks: {
    getStack: vi.fn(),
  },
}))

vi.mock('@sanity/runtime-cli/utils', () => ({
  display: {
    blueprintsFormatting: {
      formatStackInfo: vi.fn(),
    },
  },
}))

describe('blueprints commands', () => {
  const mockContext: CliCommandContext = {
    apiClient: vi.fn().mockReturnValue({
      config: () => ({token: 'test-token'}),
    }),
    output: {
      print: vi.fn(),
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
})
