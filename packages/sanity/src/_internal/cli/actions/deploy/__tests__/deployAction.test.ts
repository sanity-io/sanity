import zlib from 'node:zlib'

import {type CliCommandArguments, type CliCommandContext, type CliConfig} from '@sanity/cli'
import tar from 'tar-fs'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import buildSanityStudio from '../../build/buildAction'
import deployStudioAction, {type DeployStudioActionFlags} from '../deployAction'
import * as _helpers from '../helpers'
import {type UserApplication} from '../helpers'

// Mock dependencies
vi.mock('tar-fs')
vi.mock('node:zlib')
vi.mock('../helpers')
vi.mock('../../build/buildAction')

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
    title: null,
    type: 'studio',
  }

  beforeEach(() => {
    vi.clearAllMocks()

    spinnerInstance = {
      start: vi.fn(() => spinnerInstance),
      succeed: vi.fn(() => spinnerInstance),
      fail: vi.fn(() => spinnerInstance),
    }

    mockContext = {
      apiClient: vi.fn().mockReturnValue({
        withConfig: vi.fn().mockReturnThis(),
      }),
      workDir: '/fake/work/dir',
      chalk: {cyan: vi.fn((str) => str), red: vi.fn((str) => str)},
      output: {
        error: vi.fn((str) => str),
        print: vi.fn(),
        spinner: vi.fn().mockReturnValue(spinnerInstance),
      },
      prompt: {single: vi.fn()},
      cliConfig: {},
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
      isCoreApp: false,
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
      isCoreApp: false,
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

  it('handles core app deployment correctly', async () => {
    // Create a mock application with all required properties
    const mockCoreApp: UserApplication = {
      id: 'core-app-id',
      appHost: 'core-app-host',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      urlType: 'internal',
      projectId: null,
      title: null,
      type: 'coreApp',
    }

    mockContext = {
      ...mockContext,
      cliConfig: {
        api: {
          organizationId: 'org-id',
        },
        // eslint-disable-next-line camelcase
        __experimental_coreAppConfiguration: {
          appHost: 'core-app-host',
        },
      } as CliConfig,
    }

    helpers.dirIsEmptyOrNonExistent.mockResolvedValueOnce(true)
    helpers.getInstalledSanityVersion.mockResolvedValueOnce('vX')
    helpers.getOrCreateUserApplicationFromConfig.mockResolvedValueOnce(mockCoreApp)
    helpers.createDeployment.mockResolvedValueOnce({location: 'https://core-app-host'})
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

    expect(helpers.getOrCreateUserApplicationFromConfig).toHaveBeenCalled()
    expect(helpers.createDeployment).toHaveBeenCalledWith(
      expect.objectContaining({
        isCoreApp: true,
      }),
    )
    expect(mockContext.output.print).toHaveBeenCalledWith('\nSuccess! Application deployed')
  })
})
