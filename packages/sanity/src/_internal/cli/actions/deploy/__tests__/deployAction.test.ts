import type * as NodeWorkerThreads from 'node:worker_threads'
import zlib from 'node:zlib'

import {type CliCommandArguments, type CliCommandContext} from '@sanity/cli'
import tar from 'tar-fs'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {
  type DeployStudioWorkerResult,
  type DeployStudioWorkerSuccess,
} from '../../../threads/generateStudioManifest'
import buildSanityStudio from '../../build/buildAction'
import deployStudioAction, {type DeployStudioActionFlags} from '../deployAction'
import * as _helpers from '../helpers'
import {type UserApplication} from '../helpers'

// Mock dependencies
vi.mock('tar-fs')
vi.mock('node:zlib')
vi.mock('../helpers')
vi.mock('../../build/buildAction')
vi.mock('../../schema/deploySchemasAction', () => ({
  deploySchemasAction: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('../../schema/utils/mainfestExtractor', () => ({
  createManifestExtractor: vi.fn(() => vi.fn()),
}))
vi.mock('../../../util/extractClientConfig', () => ({
  extractClientConfig: vi.fn(() => ({projectId: 'test-project', dataset: 'test-dataset'})),
}))

// Mock Worker class - defined inside factory to avoid hoisting issues
const mockWorkerOnce = vi.fn()
const mockWorkerTerminate = vi.fn().mockResolvedValue(0)

vi.mock('node:worker_threads', async (importOriginal) => {
  const actual = await importOriginal<typeof NodeWorkerThreads>()
  return {
    ...actual,
    Worker: class MockWorker {
      once = mockWorkerOnce
      terminate = mockWorkerTerminate
    },
  }
})

vi.mock('read-pkg-up', () => ({
  default: {
    sync: vi.fn(() => ({path: '/fake/path/package.json'})),
  },
}))

const helpers = vi.mocked(_helpers)
const buildSanityStudioMock = vi.mocked(buildSanityStudio)
const tarPackMock = vi.mocked(tar.pack)
const zlibCreateGzipMock = vi.mocked(zlib.createGzip)
type SpinnerInstance = {
  start: Mock<() => SpinnerInstance>
  succeed: Mock<() => SpinnerInstance>
  fail: Mock<() => SpinnerInstance>
}

describe('deployStudioAction', () => {
  let mockContext: CliCommandContext
  let spinnerInstance: SpinnerInstance

  const mockApplication: UserApplication = {
    id: 'app-id',
    appHost: 'app-host',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    urlType: 'internal',
    projectId: 'example',
    organizationId: null,
    title: null,
    type: 'studio',
  }

  const mockWorkerSuccessResult: DeployStudioWorkerSuccess = {
    type: 'success',
    studioManifest: {
      bundleVersion: 'vX',
      workspaces: [
        {
          name: 'default',
          projectId: 'example',
          dataset: 'production',
          schemaDescriptorId: 'schema-123',
        },
      ],
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()

    spinnerInstance = {
      start: vi.fn(() => spinnerInstance),
      succeed: vi.fn(() => spinnerInstance),
      fail: vi.fn(() => spinnerInstance),
    }

    // Setup worker mock to simulate successful message response
    mockWorkerOnce.mockImplementation(
      (event: string, callback: (result: DeployStudioWorkerResult) => void) => {
        if (event === 'message') {
          // Simulate async worker response using Promise to ensure it runs after all listeners are registered
          void Promise.resolve().then(() => callback(mockWorkerSuccessResult))
        }
      },
    )

    mockContext = {
      apiClient: vi.fn().mockReturnValue({
        withConfig: vi.fn().mockReturnThis(),
      }),
      workDir: '/fake/work/dir',
      chalk: {cyan: vi.fn((str) => str), red: vi.fn((str) => str), gray: vi.fn((str) => str)},
      output: {
        error: vi.fn((str) => str),
        print: vi.fn(),
        spinner: vi.fn().mockReturnValue(spinnerInstance),
      },
      prompt: {single: vi.fn()},
      cliConfig: {},
      telemetry: {
        updateUserProperties: vi.fn(),
        log: vi.fn(),
        trace: vi.fn(() => ({start: vi.fn(), error: vi.fn(), complete: vi.fn()}) as any),
      },
    } as unknown as CliCommandContext
  })

  it('builds and deploys the studio if the directory is empty', async () => {
    const mockSpinner = mockContext.output.spinner('')

    // Mock utility functions
    helpers.dirIsEmptyOrNonExistent.mockResolvedValueOnce(true)
    helpers.getInstalledSanityVersion.mockResolvedValueOnce('vX')
    helpers.getOrCreateStudio.mockResolvedValueOnce(mockApplication)
    helpers.createDeployment.mockResolvedValueOnce({location: 'https://app-host.sanity.studio'})
    buildSanityStudioMock.mockResolvedValueOnce({didCompile: true})
    tarPackMock.mockReturnValue({pipe: vi.fn(() => 'tarball')} as unknown as ReturnType<
      typeof tar.pack
    >)
    zlibCreateGzipMock.mockReturnValue('gzipped' as unknown as ReturnType<typeof zlib.createGzip>)

    await deployStudioAction(
      {
        argsWithoutOptions: ['customSourceDir'],
        extOptions: {},
      } as CliCommandArguments<DeployStudioActionFlags>,
      mockContext,
    )

    // Check that buildSanityStudio was called
    expect(buildSanityStudioMock).toHaveBeenCalledWith(
      expect.objectContaining({
        extOptions: {build: true},
        argsWithoutOptions: ['customSourceDir'],
      }),
      mockContext,
      {basePath: '/'},
    )
    expect(helpers.dirIsEmptyOrNonExistent).toHaveBeenCalledWith(
      expect.stringContaining('customSourceDir'),
    )
    expect(helpers.getOrCreateStudio).toHaveBeenCalledWith(
      expect.objectContaining({
        client: expect.anything(),
        context: expect.anything(),
      }),
    )
    expect(helpers.createDeployment).toHaveBeenCalledWith({
      client: expect.anything(),
      applicationId: 'app-id',
      version: 'vX',
      isAutoUpdating: false,
      tarball: 'tarball',
      manifest: mockWorkerSuccessResult.studioManifest,
    })

    expect(mockContext.output.print).toHaveBeenCalledWith(
      '\nSuccess! Studio deployed to https://app-host.sanity.studio',
    )
    expect(mockSpinner.succeed).toHaveBeenCalled()
  })

  it('builds and deploys the studio if the directory is empty and hostname in config', async () => {
    const mockSpinner = mockContext.output.spinner('')
    mockContext.cliConfig = {studioHost: 'app-host'}

    // Mock utility functions
    helpers.dirIsEmptyOrNonExistent.mockResolvedValueOnce(true)
    helpers.getInstalledSanityVersion.mockResolvedValueOnce('vX')
    helpers.getOrCreateUserApplicationFromConfig.mockResolvedValueOnce(mockApplication)
    helpers.createDeployment.mockResolvedValueOnce({location: 'https://app-host.sanity.studio'})
    buildSanityStudioMock.mockResolvedValueOnce({didCompile: true})
    tarPackMock.mockReturnValue({pipe: vi.fn(() => 'tarball')} as unknown as ReturnType<
      typeof tar.pack
    >)
    zlibCreateGzipMock.mockReturnValue('gzipped' as unknown as ReturnType<typeof zlib.createGzip>)

    await deployStudioAction(
      {
        argsWithoutOptions: ['customSourceDir'],
        extOptions: {},
      } as CliCommandArguments<DeployStudioActionFlags>,
      mockContext,
    )

    // Check that buildSanityStudio was called
    expect(buildSanityStudioMock).toHaveBeenCalledWith(
      expect.objectContaining({
        extOptions: {build: true},
        argsWithoutOptions: ['customSourceDir'],
      }),
      mockContext,
      {basePath: '/'},
    )
    expect(helpers.dirIsEmptyOrNonExistent).toHaveBeenCalledWith(
      expect.stringContaining('customSourceDir'),
    )
    expect(helpers.getOrCreateUserApplicationFromConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        client: expect.anything(),
        context: expect.anything(),
        appHost: 'app-host',
      }),
    )
    expect(helpers.createDeployment).toHaveBeenCalledWith({
      client: expect.anything(),
      applicationId: 'app-id',
      version: 'vX',
      isAutoUpdating: false,
      tarball: 'tarball',
      manifest: mockWorkerSuccessResult.studioManifest,
    })

    expect(mockContext.output.print).toHaveBeenCalledWith(
      '\nSuccess! Studio deployed to https://app-host.sanity.studio',
    )
    expect(mockSpinner.succeed).toHaveBeenCalled()
  })

  it('prompts the user if the directory is not empty', async () => {
    const mockSpinner = mockContext.output.spinner('')

    helpers.dirIsEmptyOrNonExistent.mockResolvedValueOnce(false)
    ;(mockContext.prompt.single as Mock<typeof mockContext.prompt.single>).mockResolvedValueOnce(
      true,
    ) // User confirms to proceed
    helpers.getInstalledSanityVersion.mockResolvedValueOnce('vX')
    helpers.getOrCreateStudio.mockResolvedValueOnce(mockApplication)
    helpers.createDeployment.mockResolvedValueOnce({location: 'https://app-host.sanity.studio'})
    buildSanityStudioMock.mockResolvedValueOnce({didCompile: true})
    tarPackMock.mockReturnValue({pipe: vi.fn(() => 'tarball')} as unknown as ReturnType<
      typeof tar.pack
    >)
    zlibCreateGzipMock.mockReturnValue('gzipped' as unknown as ReturnType<typeof zlib.createGzip>)

    await deployStudioAction(
      {
        argsWithoutOptions: ['customSourceDir'],
        extOptions: {},
      } as CliCommandArguments<DeployStudioActionFlags>,
      mockContext,
    )

    expect(helpers.dirIsEmptyOrNonExistent).toHaveBeenCalledWith(
      expect.stringContaining('customSourceDir'),
    )
    expect(mockContext.prompt.single).toHaveBeenCalledWith({
      type: 'confirm',
      message: expect.stringContaining('is not empty, do you want to proceed?'),
      default: false,
    })
    expect(buildSanityStudioMock).toHaveBeenCalled()
    expect(mockSpinner.start).toHaveBeenCalled()
    expect(mockSpinner.succeed).toHaveBeenCalled()
  })

  it('does not proceed if build fails', async () => {
    const mockSpinner = mockContext.output.spinner('')

    helpers.dirIsEmptyOrNonExistent.mockResolvedValueOnce(true)
    buildSanityStudioMock.mockResolvedValueOnce({didCompile: false})

    await deployStudioAction(
      {
        argsWithoutOptions: ['customSourceDir'],
        extOptions: {},
      } as CliCommandArguments<DeployStudioActionFlags>,
      mockContext,
    )

    expect(buildSanityStudioMock).toHaveBeenCalled()
    expect(helpers.createDeployment).not.toHaveBeenCalled()
    expect(mockSpinner.fail).not.toHaveBeenCalled()
  })

  it('fails if the directory does not exist', async () => {
    const mockSpinner = mockContext.output.spinner('')

    helpers.checkDir.mockRejectedValueOnce(new Error('Example error'))
    helpers.dirIsEmptyOrNonExistent.mockResolvedValue(true)
    buildSanityStudioMock.mockResolvedValueOnce({didCompile: true})

    await expect(
      deployStudioAction(
        {
          argsWithoutOptions: ['nonexistentDir'],
          extOptions: {},
        } as CliCommandArguments<DeployStudioActionFlags>,
        mockContext,
      ),
    ).rejects.toThrow('Example error')

    expect(mockSpinner.fail).toHaveBeenCalled()
  })

  it('throws an error if "graphql" is passed as a source directory', async () => {
    await expect(
      deployStudioAction(
        {
          argsWithoutOptions: ['graphql'],
          extOptions: {},
        } as CliCommandArguments<DeployStudioActionFlags>,
        mockContext,
      ),
    ).rejects.toThrow('Did you mean `sanity graphql deploy`?')
  })

  it('returns an error if API responds with 402', async () => {
    // Mock utility functions
    helpers.dirIsEmptyOrNonExistent.mockResolvedValueOnce(true)
    helpers.getInstalledSanityVersion.mockResolvedValueOnce('vX')
    helpers.getOrCreateStudio.mockRejectedValueOnce({
      statusCode: 402,
      message: 'Application limit reached',
      error: 'Payment Required',
    })
    buildSanityStudioMock.mockResolvedValueOnce({didCompile: true})
    tarPackMock.mockReturnValue({pipe: vi.fn(() => 'tarball')} as unknown as ReturnType<
      typeof tar.pack
    >)
    zlibCreateGzipMock.mockReturnValue('gzipped' as unknown as ReturnType<typeof zlib.createGzip>)

    await deployStudioAction(
      {
        argsWithoutOptions: ['customSourceDir'],
        extOptions: {},
      } as CliCommandArguments<DeployStudioActionFlags>,
      mockContext,
    )

    expect(helpers.dirIsEmptyOrNonExistent).toHaveBeenCalledWith(
      expect.stringContaining('customSourceDir'),
    )
    expect(helpers.getOrCreateStudio).toHaveBeenCalledWith(
      expect.objectContaining({
        client: expect.anything(),
        context: expect.anything(),
        spinner: expect.anything(),
      }),
    )

    expect(mockContext.output.error).toHaveBeenCalledWith('Application limit reached')
  })
})
