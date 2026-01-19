import {type CliCommandContext} from '@sanity/cli'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {buildStaticFiles} from '../../../server'

vi.mock('../../../server', () => ({
  buildStaticFiles: vi.fn().mockResolvedValue({chunks: []}),
}))

vi.mock('../../../util/checkStudioDependencyVersions', () => ({
  checkStudioDependencyVersions: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../../util/checkRequiredDependencies', () => ({
  checkRequiredDependencies: vi
    .fn()
    .mockResolvedValue({didInstall: false, installedSanityVersion: '3.0.0'}),
}))

vi.mock('rimraf', () => ({
  rimraf: vi.fn().mockResolvedValue(undefined),
}))

const createOutput = () => {
  const spinnerInstance = {
    start: () => spinnerInstance,
    succeed: () => spinnerInstance,
    fail: () => spinnerInstance,
    text: '',
  }
  return {
    spinner: () => spinnerInstance,
    print: () => {},
    warn: () => {},
  }
}

const createContext = (cliConfig = {}) =>
  ({
    workDir: '/project',
    cliConfig,
    output: createOutput(),
    prompt: {
      single: vi.fn().mockResolvedValue(true),
    },
    telemetry: {trace: () => ({start: vi.fn(), log: vi.fn(), complete: vi.fn(), error: vi.fn()})},
  }) as unknown as CliCommandContext

const createCliArguments = (options = {}) => ({
  extOptions: {yes: true, ...options},
  argv: [],
  argsWithoutOptions: [],
  extraArguments: [],
  groupOrCommand: 'build',
})

describe('buildAction', () => {
  beforeEach(() => {
    vi.mocked(buildStaticFiles).mockClear()
  })

  it('passes schemaExtraction config from cliConfig to buildStaticFiles', async () => {
    const schemaExtraction = {
      enabled: true as const,
      path: '/custom/schema.json',
      workspace: 'my-workspace',
      enforceRequiredFields: true,
    }

    const buildAction = (await import('../buildAction')).default
    await buildAction(createCliArguments(), createContext({schemaExtraction}))

    expect(buildStaticFiles).toHaveBeenCalledWith(
      expect.objectContaining({
        schemaExtraction,
      }),
    )
  })

  it('passes undefined schemaExtraction when not configured', async () => {
    const buildAction = (await import('../buildAction')).default
    await buildAction(createCliArguments(), createContext({}))

    expect(buildStaticFiles).toHaveBeenCalledWith(
      expect.objectContaining({
        schemaExtraction: undefined,
      }),
    )
  })
})
