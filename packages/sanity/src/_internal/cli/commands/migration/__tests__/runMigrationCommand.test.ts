import {type CliCommandArguments, type CliCommandContext} from '@sanity/cli'
import {beforeAll, beforeEach, describe, expect, it, vi} from 'vitest'

import runMigrationCommand from '../runMigrationCommand'

// Mock all dependencies before importing the module under test
vi.mock('@sanity/migrate', () => ({
  DEFAULT_MUTATION_CONCURRENCY: 2,
  MAX_MUTATION_CONCURRENCY: 6,
  dryRun: vi.fn(async function* () {
    // Yield nothing - empty generator
  }),
  run: vi.fn(),
}))

vi.mock('esbuild-register/dist/node', () => ({
  register: vi.fn(),
}))

vi.mock('console-table-printer', () => ({
  Table: vi.fn().mockImplementation(() => ({
    addRow: vi.fn(),
    printTable: vi.fn(),
  })),
}))

vi.mock('../utils/resolveMigrationScript', () => ({
  resolveMigrationScript: vi.fn(() => []),
  isLoadableMigrationScript: vi.fn(() => false),
}))

vi.mock('../listMigrationsCommand', () => ({
  resolveMigrations: vi.fn(() => Promise.resolve([])),
}))

vi.mock('../prettyMutationFormatter', () => ({
  prettyFormat: vi.fn(),
}))

vi.mock('../utils/ensureApiVersionFormat', () => ({
  ensureApiVersionFormat: vi.fn((v) => v || '2021-03-25'),
}))

vi.mock('../../debug', () => ({
  debug: vi.fn(),
}))

beforeAll(() => {
  // Define __DEV__ global before tests run
  ;(globalThis as any).__DEV__ = true
})

describe('runMigrationCommand', () => {
  let mockContext: CliCommandContext

  beforeEach(() => {
    vi.clearAllMocks()

    mockContext = {
      apiClient: vi.fn().mockReturnValue({
        config: vi.fn().mockReturnValue({
          projectId: 'test-project',
          dataset: undefined, // No dataset configured
          apiHost: 'https://api.sanity.io',
          token: 'test-token',
        }),
      }),
      workDir: '/fake/work/dir',
      chalk: {
        cyan: vi.fn((str) => str),
        red: vi.fn((str) => str),
        yellow: vi.fn((str) => str),
        bold: vi.fn((str) => str),
        green: vi.fn((str) => str),
        blue: vi.fn((str) => str),
      },
      output: {
        error: vi.fn(),
        print: vi.fn(),
        spinner: vi.fn().mockReturnValue({
          start: vi.fn().mockReturnThis(),
          stop: vi.fn().mockReturnThis(),
          succeed: vi.fn().mockReturnThis(),
          fail: vi.fn().mockReturnThis(),
          text: '',
          stopAndPersist: vi.fn().mockReturnThis(),
        }),
      },
      prompt: {single: vi.fn()},
      cliConfig: {},
    } as unknown as CliCommandContext
  })

  describe('validation errors', () => {
    it('throws an error when dataset is not configured and --dataset flag is not provided', async () => {
      const args: CliCommandArguments = {
        argsWithoutOptions: ['test-migration'],
        argv: ['migration', 'run', 'test-migration'],
        extOptions: {},
        groupOrCommand: 'migration',
        coreOptions: {},
        extraArguments: [],
      }

      // Mock to return a valid migration script to get past the script resolution check
      const {resolveMigrationScript, isLoadableMigrationScript} =
        await import('../utils/resolveMigrationScript')
      vi.mocked(resolveMigrationScript).mockReturnValue([
        {
          absolutePath: '/fake/work/dir/migrations/test-migration.ts',
          relativePath: 'test-migration.ts',
          mod: {default: {documentTypes: ['*']}},
        },
      ] as any)
      vi.mocked(isLoadableMigrationScript).mockReturnValue(true)

      await expect(runMigrationCommand.action(args, mockContext)).rejects.toThrow(
        'sanity.cli.js does not contain a dataset name ("api.dataset") and no --dataset option was provided.',
      )
    })

    it('throws an error when projectId is not configured and --project flag is not provided', async () => {
      // Update mock to have no projectId
      mockContext.apiClient = vi.fn().mockReturnValue({
        config: vi.fn().mockReturnValue({
          projectId: undefined,
          dataset: 'production',
          apiHost: 'https://api.sanity.io',
          token: 'test-token',
        }),
      })

      const args: CliCommandArguments = {
        argsWithoutOptions: ['test-migration'],
        argv: ['migration', 'run', 'test-migration'],
        extOptions: {},
        groupOrCommand: 'migration',
        coreOptions: {},
        extraArguments: [],
      }

      const {resolveMigrationScript, isLoadableMigrationScript} =
        await import('../utils/resolveMigrationScript')
      vi.mocked(resolveMigrationScript).mockReturnValue([
        {
          absolutePath: '/fake/work/dir/migrations/test-migration.ts',
          relativePath: 'test-migration.ts',
          mod: {default: {documentTypes: ['*']}},
        },
      ] as any)
      vi.mocked(isLoadableMigrationScript).mockReturnValue(true)

      await expect(runMigrationCommand.action(args, mockContext)).rejects.toThrow(
        'sanity.cli.js does not contain a project identifier ("api.projectId") and no --project option was provided.',
      )
    })

    it('throws an error when dataset is the placeholder value and --dataset flag or config is not provided', async () => {
      // Config has the placeholder dataset value which should be treated as no dataset
      mockContext.apiClient = vi.fn().mockReturnValue({
        config: vi.fn().mockReturnValue({
          projectId: 'test-project',
          dataset: '~dummy-placeholder-dataset-',
          apiHost: 'https://api.sanity.io',
          token: 'test-token',
        }),
      })

      const args: CliCommandArguments = {
        argsWithoutOptions: ['test-migration'],
        argv: ['migration', 'run', 'test-migration'],
        extOptions: {},
        groupOrCommand: 'migration',
        coreOptions: {},
        extraArguments: [],
      }

      const {resolveMigrationScript, isLoadableMigrationScript} =
        await import('../utils/resolveMigrationScript')
      vi.mocked(resolveMigrationScript).mockReturnValue([
        {
          absolutePath: '/fake/work/dir/migrations/test-migration.ts',
          relativePath: 'test-migration.ts',
          mod: {default: {documentTypes: ['*']}},
        },
      ] as any)
      vi.mocked(isLoadableMigrationScript).mockReturnValue(true)

      await expect(runMigrationCommand.action(args, mockContext)).rejects.toThrow(
        'sanity.cli.js does not contain a dataset name ("api.dataset") and no --dataset option was provided.',
      )
    })

    it('does not throw dataset validation error when dataset is configured in config', async () => {
      // Config has dataset configured
      mockContext.apiClient = vi.fn().mockReturnValue({
        config: vi.fn().mockReturnValue({
          projectId: 'test-project',
          dataset: 'production', // dataset is configured
          apiHost: 'https://api.sanity.io',
          token: 'test-token',
        }),
      })

      const args: CliCommandArguments = {
        argsWithoutOptions: ['test-migration'],
        argv: ['migration', 'run', 'test-migration'],
        extOptions: {},
        groupOrCommand: 'migration',
        coreOptions: {},
        extraArguments: [],
      }

      const {resolveMigrationScript, isLoadableMigrationScript} =
        await import('../utils/resolveMigrationScript')
      vi.mocked(resolveMigrationScript).mockReturnValue([
        {
          absolutePath: '/fake/work/dir/migrations/test-migration.ts',
          relativePath: 'test-migration.ts',
          mod: {default: {documentTypes: ['*']}},
        },
      ] as any)
      vi.mocked(isLoadableMigrationScript).mockReturnValue(true)

      // This should not throw the dataset validation error since dataset is configured
      // The command will continue to execute (dry run) and complete normally
      await expect(runMigrationCommand.action(args, mockContext)).resolves.toBeUndefined()
    })
  })
})
