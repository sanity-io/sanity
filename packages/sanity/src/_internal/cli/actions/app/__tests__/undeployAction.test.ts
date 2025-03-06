import {type CliCommandArguments, type CliCommandContext} from '@sanity/cli'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {type UserApplication} from '../../deploy/helpers'
import * as _helpers from '../../deploy/helpers'
import undeployCoreAppAction from '../undeployAction'

// Mock dependencies
vi.mock('../../deploy/helpers')

const helpers = vi.mocked(_helpers)
type SpinnerInstance = {
  start: Mock<() => SpinnerInstance>
  succeed: Mock<() => SpinnerInstance>
  fail: Mock<() => SpinnerInstance>
}

describe('undeployCoreAppAction', () => {
  let mockContext: CliCommandContext

  const mockApplication: UserApplication = {
    id: 'app-id',
    organizationId: 'org-id',
    appHost: 'app-host',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    urlType: 'internal',
    projectId: null,
    title: null,
    type: 'coreApp',
  }

  let spinnerInstance: SpinnerInstance

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
      chalk: {yellow: vi.fn((str) => str), red: vi.fn((str) => str)},
      output: {
        print: vi.fn(),
        spinner: vi.fn().mockReturnValue(spinnerInstance),
      },
      prompt: {single: vi.fn()},
      cliConfig: {
        // eslint-disable-next-line camelcase
        __experimental_coreAppConfiguration: {
          appId: 'app-id',
        },
      },
    } as unknown as CliCommandContext
  })

  it('prints an error if there is no appId', async () => {
    await undeployCoreAppAction({} as CliCommandArguments<Record<string, unknown>>, {
      ...mockContext,
      cliConfig: {},
    })

    expect(mockContext.output.print).toHaveBeenCalledWith('No Core application ID provided.')
    expect(mockContext.output.print).toHaveBeenCalledWith(
      'Please set `__experimental_coreAppConfiguration` in sanity.cli.js or sanity.cli.ts.',
    )
    expect(mockContext.output.print).toHaveBeenCalledWith('Nothing to undeploy.')
  })

  it('does nothing if there is no user application', async () => {
    helpers.getUserApplication.mockResolvedValueOnce(null)

    await undeployCoreAppAction({} as CliCommandArguments<Record<string, unknown>>, mockContext)

    expect(mockContext.output.print).toHaveBeenCalledWith(
      'Application with the given ID does not exist.',
    )
    expect(mockContext.output.print).toHaveBeenCalledWith('Nothing to undeploy.')
  })

  it('prompts the user for confirmation and undeploys if confirmed', async () => {
    helpers.getUserApplication.mockResolvedValueOnce(mockApplication)
    helpers.deleteUserApplication.mockResolvedValueOnce(undefined)
    ;(mockContext.prompt.single as Mock<typeof mockContext.prompt.single>).mockResolvedValueOnce(
      true,
    ) // User confirms

    await undeployCoreAppAction({} as CliCommandArguments<Record<string, unknown>>, mockContext)

    expect(mockContext.prompt.single).toHaveBeenCalledWith({
      type: 'confirm',
      default: false,
      message: expect.stringContaining('undeploy'),
    })
    expect(helpers.deleteUserApplication).toHaveBeenCalledWith({
      client: expect.anything(),
      applicationId: 'app-id',
      appType: 'coreApp',
    })
    expect(mockContext.output.print).toHaveBeenCalledWith(
      expect.stringContaining('Application undeploy scheduled.'),
    )
  })

  it('does not undeploy if the user cancels the prompt', async () => {
    helpers.getUserApplication.mockResolvedValueOnce(mockApplication)
    ;(mockContext.prompt.single as Mock<typeof mockContext.prompt.single>).mockResolvedValueOnce(
      false,
    ) // User cancels

    await undeployCoreAppAction({} as CliCommandArguments<Record<string, unknown>>, mockContext)

    expect(mockContext.prompt.single).toHaveBeenCalledWith({
      type: 'confirm',
      default: false,
      message: expect.stringContaining('undeploy'),
    })
    expect(helpers.deleteUserApplication).not.toHaveBeenCalled()
  })

  it('handles errors during the undeploy process', async () => {
    const errorMessage = 'Example error'
    helpers.getUserApplication.mockResolvedValueOnce(mockApplication)
    helpers.deleteUserApplication.mockRejectedValueOnce(new Error(errorMessage))
    ;(mockContext.prompt.single as Mock<typeof mockContext.prompt.single>).mockResolvedValueOnce(
      true,
    ) // User confirms

    await expect(
      undeployCoreAppAction({} as CliCommandArguments<Record<string, unknown>>, mockContext),
    ).rejects.toThrow(errorMessage)

    expect(mockContext.output.spinner('').fail).toHaveBeenCalled()
  })
})
