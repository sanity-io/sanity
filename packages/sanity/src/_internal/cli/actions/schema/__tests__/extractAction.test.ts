import {type CliCommandContext} from '@sanity/cli'
import {describe, expect, it, vi} from 'vitest'

import extractAction, {type ExtractFlags} from '../extractAction'
import {extractSchemaToFile} from '../schemaExtractorApi'

vi.mock('../schemaExtractorApi', () => ({
  extractSchemaToFile: vi.fn().mockResolvedValue([]),
  DEFAULT_WATCH_PATTERNS: [],
}))

const createContext = (cliConfig = {}) =>
  ({
    workDir: '/work',
    cliConfig,
    output: {spinner: () => ({start: () => ({succeed: vi.fn(), fail: vi.fn()})})},
    telemetry: {trace: () => ({start: vi.fn(), log: vi.fn(), complete: vi.fn()})},
  }) as unknown as CliCommandContext

const createCliArguments = (options: ExtractFlags = {}) => ({
  extOptions: options,
  argv: [],
  argsWithoutOptions: [],
  extraArguments: [],
  groupOrCommand: 'extract',
})

describe('extractAction', () => {
  it('extract is called with options from config', async () => {
    await extractAction(
      createCliArguments(),
      createContext({
        schemaExtraction: {
          workspace: 'my-workspace',
          enforceRequiredFields: true,
          path: '/custom/path.json',
        },
      }),
    )

    expect(extractSchemaToFile).toHaveBeenCalledWith({
      workDir: '/work',
      outputPath: '/custom/path.json',
      workspaceName: 'my-workspace',
      enforceRequiredFields: true,
      format: 'groq-type-nodes',
    })
  })

  it('extract flags supersede config options', async () => {
    await extractAction(
      createCliArguments({
        'workspace': 'flag-workspace',
        'format': 'flag-format',
        'enforce-required-fields': false,
        'path': '/flag/path.json',
      }),
      createContext({
        schemaExtraction: {
          workspace: 'config-workspace',
          enforceRequiredFields: true,
          path: '/config/path.json',
        },
      }),
    )

    expect(extractSchemaToFile).toHaveBeenCalledWith({
      workDir: '/work',
      outputPath: '/flag/path.json',
      workspaceName: 'flag-workspace',
      enforceRequiredFields: false,
      format: 'flag-format',
    })
  })
})
