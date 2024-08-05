import zlib from 'node:zlib'

import {beforeEach, describe, expect, it, jest} from '@jest/globals'
import {type CliCommandArguments, type CliCommandContext} from '@sanity/cli'
import tar from 'tar-fs'

import buildSanityStudio from '../../build/buildAction'
import deployStudioAction, {type DeployStudioActionFlags} from '../deployAction'
import * as _helpers from '../helpers'
import {type UserApplication} from '../helpers'

// Mock dependencies
jest.mock('tar-fs')
jest.mock('node:zlib')
jest.mock('../helpers')
jest.mock('../../build/buildAction')

type Helpers = typeof _helpers
const helpers = _helpers as {[K in keyof Helpers]: jest.Mock<Helpers[K]>}
const buildSanityStudioMock = buildSanityStudio as jest.Mock<typeof buildSanityStudio>
const tarPackMock = tar.pack as jest.Mock
const zlibCreateGzipMock = zlib.createGzip as jest.Mock
type SpinnerInstance = {
  start: jest.Mock<() => SpinnerInstance>
  succeed: jest.Mock<() => SpinnerInstance>
  fail: jest.Mock<() => SpinnerInstance>
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
    jest.clearAllMocks()

    spinnerInstance = {
      start: jest.fn(() => spinnerInstance),
      succeed: jest.fn(() => spinnerInstance),
      fail: jest.fn(() => spinnerInstance),
    }

    mockContext = {
      apiClient: jest.fn().mockReturnValue({
        withConfig: jest.fn().mockReturnThis(),
      }),
      workDir: '/fake/work/dir',
      chalk: {cyan: jest.fn((str) => str)},
      output: {
        print: jest.fn(),
        spinner: jest.fn().mockReturnValue(spinnerInstance),
      },
      prompt: {single: jest.fn()},
      cliConfig: {},
    } as unknown as CliCommandContext
  })

  it('builds and deploys the studio if the directory is empty', async () => {
    const mockSpinner = mockContext.output.spinner('')

    // Mock utility functions
    helpers.dirIsEmptyOrNonExistent.mockResolvedValueOnce(true)
    helpers.getInstalledSanityVersion.mockResolvedValueOnce('vX')
    helpers.getOrCreateUserApplication.mockResolvedValueOnce(mockApplication)
    helpers.createDeployment.mockResolvedValueOnce({location: 'https://app-host.sanity.studio'})
    buildSanityStudioMock.mockResolvedValueOnce({didCompile: true})
    tarPackMock.mockReturnValueOnce({pipe: jest.fn().mockReturnValue('tarball')})
    zlibCreateGzipMock.mockReturnValue('gzipped')

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
    expect(helpers.getOrCreateUserApplication).toHaveBeenCalledWith(
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
    })

    expect(mockContext.output.print).toHaveBeenCalledWith(
      '\nSuccess! Studio deployed to https://app-host.sanity.studio',
    )
    expect(mockSpinner.succeed).toHaveBeenCalled()
  })

  it('prompts the user if the directory is not empty', async () => {
    const mockSpinner = mockContext.output.spinner('')

    helpers.dirIsEmptyOrNonExistent.mockResolvedValueOnce(false)
    ;(
      mockContext.prompt.single as jest.Mock<typeof mockContext.prompt.single>
    ).mockResolvedValueOnce(true) // User confirms to proceed
    helpers.getInstalledSanityVersion.mockResolvedValueOnce('vX')
    helpers.getOrCreateUserApplication.mockResolvedValueOnce(mockApplication)
    helpers.createDeployment.mockResolvedValueOnce({location: 'https://app-host.sanity.studio'})
    buildSanityStudioMock.mockResolvedValueOnce({didCompile: true})
    tarPackMock.mockReturnValueOnce({pipe: jest.fn().mockReturnValue('tarball')})
    zlibCreateGzipMock.mockReturnValue('gzipped')

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
})
