import type * as SanityCodegen from '@sanity/codegen'
import {readConfig, runTypegenGenerate, TypesGeneratedTrace} from '@sanity/codegen'
import {type Ora} from 'ora'
import {describe, expect, test, vi} from 'vitest'

import {type CliCommandArguments, type CliCommandContext, type CliOutputter} from '../../../types'
import {getCliConfig} from '../../../util/getCliConfig'
import generateAction, {type TypegenGenerateTypesCommandFlags} from '../generateAction'

vi.mock('@sanity/codegen', async (importOriginal) => {
  const original = await importOriginal<typeof SanityCodegen>()
  return {
    ...original,
    readConfig: vi.fn(),
    runTypegenGenerate: vi.fn(),
  }
})

vi.mock('../../../util/getCliConfig', () => ({
  getCliConfig: vi.fn(),
}))

vi.mock('node:fs/promises', () => ({
  stat: vi.fn().mockResolvedValue({
    isFile: () => true,
  }),
}))

const oraHandler = vi.fn<(message: string) => Ora>(() => ora)
const ora = {
  start: (message: string) => oraHandler(`  ${message}`),
  succeed: (message: string) => oraHandler(`✓ ${message}`),
  fail: (message: string) => oraHandler(`× ${message}`),
  warn: (message: string) => oraHandler(`⚠ ${message}`),
  // eslint-disable-next-line accessor-pairs
  set text(message: string) {
    oraHandler(`  ${message}`)
  },
} as Ora
const spinner = vi.fn().mockReturnValue(ora) as CliOutputter['spinner']

const trace = {
  start: vi.fn(),
  log: vi.fn(),
  complete: vi.fn(),
  error: vi.fn(),
}
const telemetry = {
  trace: vi.fn().mockReturnValue(trace),
  updateUserProperties: vi.fn(),
  log: vi.fn(),
} as CliCommandContext['telemetry']

describe(generateAction.name, () => {
  test(`sends telemetry traces`, async () => {
    const workDir = '/work-dir'
    const schemaPath = './schema.json'
    const overloadClientMethods = true
    const configPath = './custom-sanity-typegen.json'
    const generates = './custom-output-folder/sanity.types.ts'

    const mockConfig = {
      generates,
      schema: schemaPath,
      overloadClientMethods,
      formatGeneratedCode: true,
      path: './src/**/*.{ts,js}',
    }

    // Mock getCliConfig to return a config without typegen (triggers legacy config path)
    vi.mocked(getCliConfig).mockResolvedValue({
      config: {},
      path: '/work-dir/sanity.cli.ts',
    })

    // readConfig returns legacy typegen config
    vi.mocked(readConfig).mockResolvedValue(mockConfig)

    const mockResult = {
      code: '/* generated types */',
      duration: 100,
      emptyUnionTypeNodesGenerated: 0,
      filesWithErrors: 1,
      outputSize: 874,
      queriesCount: 2,
      queryFilesCount: 1,
      schemaTypesCount: 2,
      typeNodesGenerated: 8,
      unknownTypeNodesGenerated: 0,
      unknownTypeNodesRatio: 0,
    }

    vi.mocked(runTypegenGenerate).mockResolvedValue(mockResult)

    await generateAction(
      {
        extOptions: {'config-path': configPath},
      } as CliCommandArguments<TypegenGenerateTypesCommandFlags>,
      {
        output: {spinner: spinner},
        workDir,
        telemetry,
      } as CliCommandContext,
    )

    // Verify config was loaded
    expect(readConfig).toHaveBeenCalledWith(configPath)

    // Verify runTypegenGenerate was called with correct parameters
    expect(runTypegenGenerate).toHaveBeenCalledWith({
      config: mockConfig,
      workDir,
    })

    // Verify spinner messages
    const logs = oraHandler.mock.calls.map(([message]) => message).join('\n')
    expect(logs).toMatchInlineSnapshot(`
      "  Loading config…
      ✓ Config loaded from ./custom-sanity-typegen.json"
    `)

    // Verify telemetry
    expect(telemetry.trace).toHaveBeenCalledWith(TypesGeneratedTrace)
    expect(trace.start).toHaveBeenCalledTimes(1)
    expect(trace.complete).toHaveBeenCalledTimes(1)
    expect(trace.error).not.toHaveBeenCalled()
    expect(trace.log.mock.lastCall).toMatchInlineSnapshot(`
      [
        {
          "configMethod": "legacy",
          "configOverloadClientMethods": true,
          "emptyUnionTypeNodesGenerated": 0,
          "filesWithErrors": 1,
          "outputSize": 874,
          "queriesCount": 2,
          "queryFilesCount": 1,
          "schemaTypesCount": 2,
          "typeNodesGenerated": 8,
          "unknownTypeNodesGenerated": 0,
          "unknownTypeNodesRatio": 0,
        },
      ]
    `)
  })
})
