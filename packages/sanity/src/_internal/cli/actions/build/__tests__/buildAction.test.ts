import {type CliCommandContext} from '@sanity/cli'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {buildStaticFiles} from '../../../server'
import {compareDependencyVersions} from '../../../util/compareDependencyVersions'

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

vi.mock('../../../util/compareDependencyVersions', () => ({
  compareDependencyVersions: vi.fn().mockResolvedValue([]),
}))

vi.mock('../../../util/getAutoUpdatesImportMap', () => ({
  getAutoUpdatesImportMap: vi.fn().mockReturnValue({}),
}))

vi.mock('../../../server/buildVendorDependencies', () => ({
  buildVendorDependencies: vi.fn().mockResolvedValue({}),
}))

let mockIsInteractive = false
vi.mock('../../../util/isInteractive', () => ({
  get isInteractive() {
    return mockIsInteractive
  },
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
    telemetry: {
      trace: () => ({
        start: vi.fn(),
        log: vi.fn(),
        complete: vi.fn(),
        error: vi.fn(),
      }),
    },
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
    mockIsInteractive = false
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

  describe('version mismatch warning', () => {
    const versionMismatchResult = [
      {pkg: 'sanity', installed: '3.0.0', remote: '3.1.0'},
      {pkg: '@sanity/vision', installed: '3.0.0', remote: '3.1.0'},
    ]

    const autoUpdatesCliConfig = {
      deployment: {autoUpdates: true},
    }

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('includes version mismatch details in the interactive prompt message', async () => {
      vi.mocked(compareDependencyVersions).mockResolvedValueOnce(versionMismatchResult)
      mockIsInteractive = true

      const promptSingle = vi.fn().mockResolvedValue('continue')
      const context = createContext(autoUpdatesCliConfig)
      ;(context as any).prompt = {single: promptSingle}

      const buildAction = (await import('../buildAction')).default
      await buildAction(createCliArguments({yes: false}), context)

      expect(promptSingle).toHaveBeenCalledOnce()
      const promptMessage = promptSingle.mock.calls[0][0].message as string
      expect(promptMessage).toContain('sanity (local version: 3.0.0, runtime version: 3.1.0)')
      expect(promptMessage).toContain(
        '@sanity/vision (local version: 3.0.0, runtime version: 3.1.0)',
      )
    })

    it('includes version mismatch details in non-interactive console.warn', async () => {
      vi.mocked(compareDependencyVersions).mockResolvedValueOnce(versionMismatchResult)
      mockIsInteractive = false

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const buildAction = (await import('../buildAction')).default
      await buildAction(createCliArguments(), createContext(autoUpdatesCliConfig))

      expect(warnSpy).toHaveBeenCalledOnce()
      const warnMessage = warnSpy.mock.calls[0][0] as string
      expect(warnMessage).toContain('sanity (local version: 3.0.0, runtime version: 3.1.0)')
      expect(warnMessage).toContain('@sanity/vision (local version: 3.0.0, runtime version: 3.1.0)')
    })
  })
})
