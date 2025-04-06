import zlib from 'node:zlib'

import {type CliCommandArguments, type CliCommandContext, type CliConfig} from '@sanity/cli'
import tar from 'tar-fs'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import buildSanityStudio from '../../build/buildAction'
import * as _helpers from '../../deploy/helpers'
import {type UserApplication} from '../../deploy/helpers'
import deployAppAction, {type DeployAppActionFlags} from '../deployAction'

// Mock dependencies
vi.mock('tar-fs')
vi.mock('node:zlib')
vi.mock('../../deploy/helpers')
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

describe('deployAppAction', () => {
  let mockContext: CliCommandContext
  let spinnerInstance: SpinnerInstance

  const mockApp: UserApplication = {
    id: 'app-id',
    appHost: 'app-host',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    urlType: 'internal',
    projectId: null,
    organizationId: 'org-id',
    title: null,
    type: 'coreApp',
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
      cliConfig: {
        app: {
          entry: 'app',
          organizationId: 'org-id',
        },
      },
    } as unknown as CliCommandContext
  })

  it('builds and deploys the app if the directory is empty', async () => {
    const mockSpinner = mockContext.output.spinner('')

    // Mock utility functions
    helpers.dirIsEmptyOrNonExistent.mockResolvedValueOnce(true)
    helpers.getInstalledSanityVersion.mockResolvedValueOnce('vX')
    helpers.getOrCreateApplication.mockResolvedValueOnce(mockApp)
    helpers.createDeployment.mockResolvedValueOnce({location: 'https://app-host'})
    buildSanityStudioMock.mockResolvedValueOnce({didCompile: true})
    tarPackMock.mockReturnValue({pipe: vi.fn(() => 'tarball')} as unknown as ReturnType<
      typeof tar.pack
    >)
    zlibCreateGzipMock.mockReturnValue('gzipped' as unknown as ReturnType<typeof zlib.createGzip>)

    await deployAppAction(
      {
        argsWithoutOptions: ['customSourceDir'],
        extOptions: {},
      } as CliCommandArguments<DeployAppActionFlags>,
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
    expect(helpers.getOrCreateApplication).toHaveBeenCalledWith(
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
      isApp: true,
    })

    expect(mockContext.output.print).toHaveBeenCalledWith('\nSuccess! Application deployed')
    expect(mockSpinner.succeed).toHaveBeenCalled()
  })

  it('builds and deploys the app if app ID is in config', async () => {
    const mockSpinner = mockContext.output.spinner('')
    mockContext.cliConfig = {
      // eslint-disable-next-line camelcase
      app: {
        id: 'configured-app-id',
        organizationId: 'org-id',
      },
    } as CliConfig

    // Mock utility functions
    helpers.dirIsEmptyOrNonExistent.mockResolvedValueOnce(true)
    helpers.getInstalledSanityVersion.mockResolvedValueOnce('vX')
    helpers.getOrCreateUserApplicationFromConfig.mockResolvedValueOnce(mockApp)
    helpers.createDeployment.mockResolvedValueOnce({location: 'https://app-host'})
    buildSanityStudioMock.mockResolvedValueOnce({didCompile: true})
    tarPackMock.mockReturnValue({pipe: vi.fn(() => 'tarball')} as unknown as ReturnType<
      typeof tar.pack
    >)
    zlibCreateGzipMock.mockReturnValue('gzipped' as unknown as ReturnType<typeof zlib.createGzip>)

    await deployAppAction(
      {
        argsWithoutOptions: ['customSourceDir'],
        extOptions: {},
      } as CliCommandArguments<DeployAppActionFlags>,
      mockContext,
    )

    expect(helpers.dirIsEmptyOrNonExistent).toHaveBeenCalledWith(
      expect.stringContaining('customSourceDir'),
    )
    expect(helpers.getOrCreateUserApplicationFromConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        client: expect.anything(),
        context: expect.anything(),
        appId: 'configured-app-id',
      }),
    )
    expect(helpers.createDeployment).toHaveBeenCalledWith({
      client: expect.anything(),
      applicationId: 'app-id',
      version: 'vX',
      isAutoUpdating: false,
      tarball: 'tarball',
      isApp: true,
    })

    expect(mockContext.output.print).toHaveBeenCalledWith('\nSuccess! Application deployed')
    expect(mockSpinner.succeed).toHaveBeenCalled()
  })

  it('prompts the user if the directory is not empty', async () => {
    const mockSpinner = mockContext.output.spinner('')

    helpers.dirIsEmptyOrNonExistent.mockResolvedValueOnce(false)
    ;(mockContext.prompt.single as Mock<typeof mockContext.prompt.single>).mockResolvedValueOnce(
      true,
    ) // User confirms to proceed
    helpers.getInstalledSanityVersion.mockResolvedValueOnce('vX')
    helpers.getOrCreateApplication.mockResolvedValueOnce(mockApp)
    helpers.createDeployment.mockResolvedValueOnce({location: 'https://app-host'})
    buildSanityStudioMock.mockResolvedValueOnce({didCompile: true})
    tarPackMock.mockReturnValue({pipe: vi.fn(() => 'tarball')} as unknown as ReturnType<
      typeof tar.pack
    >)
    zlibCreateGzipMock.mockReturnValue('gzipped' as unknown as ReturnType<typeof zlib.createGzip>)

    await deployAppAction(
      {
        argsWithoutOptions: ['customSourceDir'],
        extOptions: {},
      } as CliCommandArguments<DeployAppActionFlags>,
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

    await deployAppAction(
      {
        argsWithoutOptions: ['customSourceDir'],
        extOptions: {},
      } as CliCommandArguments<DeployAppActionFlags>,
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
      deployAppAction(
        {
          argsWithoutOptions: ['nonexistentDir'],
          extOptions: {},
        } as CliCommandArguments<DeployAppActionFlags>,
        mockContext,
      ),
    ).rejects.toThrow('Example error')

    expect(mockSpinner.fail).toHaveBeenCalled()
  })

  it('skips build when --no-build flag is passed', async () => {
    // Mock utility functions
    helpers.dirIsEmptyOrNonExistent.mockResolvedValueOnce(true)
    helpers.getInstalledSanityVersion.mockResolvedValueOnce('vX')
    helpers.getOrCreateApplication.mockResolvedValueOnce(mockApp)
    helpers.createDeployment.mockResolvedValueOnce({location: 'https://app-host'})
    helpers.checkDir.mockResolvedValueOnce()
    tarPackMock.mockReturnValue({pipe: vi.fn(() => 'tarball')} as unknown as ReturnType<
      typeof tar.pack
    >)
    zlibCreateGzipMock.mockReturnValue('gzipped' as unknown as ReturnType<typeof zlib.createGzip>)

    await deployAppAction(
      {
        argsWithoutOptions: [],
        extOptions: {build: false},
        groupOrCommand: 'deploy',
        argv: ['deploy', '--no-build'],
        extraArguments: [],
      } as CliCommandArguments<DeployAppActionFlags>,
      mockContext,
    )

    // Check that buildSanityStudio was NOT called
    expect(buildSanityStudioMock).not.toHaveBeenCalled()
    expect(helpers.createDeployment).toHaveBeenCalled()
  })

  it('returns an error if API responds with 402', async () => {
    // Mock utility functions
    helpers.dirIsEmptyOrNonExistent.mockResolvedValueOnce(true)
    helpers.getInstalledSanityVersion.mockResolvedValueOnce('vX')
    helpers.getOrCreateApplication.mockRejectedValueOnce({
      statusCode: 402,
      message: 'Application limit reached',
      error: 'Payment Required',
    })
    buildSanityStudioMock.mockResolvedValueOnce({didCompile: true})
    tarPackMock.mockReturnValue({pipe: vi.fn(() => 'tarball')} as unknown as ReturnType<
      typeof tar.pack
    >)
    zlibCreateGzipMock.mockReturnValue('gzipped' as unknown as ReturnType<typeof zlib.createGzip>)

    await deployAppAction(
      {
        argsWithoutOptions: ['customSourceDir'],
        extOptions: {},
      } as CliCommandArguments<DeployAppActionFlags>,
      mockContext,
    )

    expect(helpers.dirIsEmptyOrNonExistent).toHaveBeenCalledWith(
      expect.stringContaining('customSourceDir'),
    )
    expect(helpers.getOrCreateApplication).toHaveBeenCalledWith(
      expect.objectContaining({
        client: expect.anything(),
        context: expect.anything(),
        spinner: expect.anything(),
      }),
    )

    expect(mockContext.output.error).toHaveBeenCalledWith('Application limit reached')
  })

  it('suggests adding appId to config when not configured', async () => {
    // Create a context without appId in the config
    mockContext.cliConfig = {
      // eslint-disable-next-line camelcase
      app: {
        organizationId: 'org-id',
      },
    } as CliConfig

    // Mock utility functions
    helpers.dirIsEmptyOrNonExistent.mockResolvedValueOnce(true)
    helpers.getInstalledSanityVersion.mockResolvedValueOnce('vX')
    helpers.getOrCreateApplication.mockResolvedValueOnce(mockApp)
    helpers.createDeployment.mockResolvedValueOnce({location: 'https://app-host'})
    buildSanityStudioMock.mockResolvedValueOnce({didCompile: true})
    tarPackMock.mockReturnValue({pipe: vi.fn(() => 'tarball')} as unknown as ReturnType<
      typeof tar.pack
    >)
    zlibCreateGzipMock.mockReturnValue('gzipped' as unknown as ReturnType<typeof zlib.createGzip>)

    await deployAppAction(
      {
        argsWithoutOptions: [],
        extOptions: {},
        groupOrCommand: 'deploy',
        argv: ['deploy'],
        extraArguments: [],
      } as CliCommandArguments<DeployAppActionFlags>,
      mockContext,
    )

    // Verify the hint to add appId to config is shown
    expect(mockContext.output.print).toHaveBeenCalledWith(
      expect.stringContaining("Add id: 'app-id'"),
    )
    expect(mockContext.output.print).toHaveBeenCalledWith(expect.stringContaining('to `app`'))
    expect(mockContext.output.print).toHaveBeenCalledWith(
      expect.stringContaining('to avoid prompting on next deploy'),
    )
  })
})
