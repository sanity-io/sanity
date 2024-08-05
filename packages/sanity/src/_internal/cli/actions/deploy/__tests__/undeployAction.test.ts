import {beforeEach, describe, expect, it, jest} from '@jest/globals'
import {type CliCommandArguments, type CliCommandContext} from '@sanity/cli'

import {type UserApplication} from '../helpers'
import * as _helpers from '../helpers'
import undeployStudioAction from '../undeployAction'

// Mock dependencies
jest.mock('../helpers')

type Helpers = typeof _helpers
const helpers = _helpers as {[K in keyof Helpers]: jest.Mock<Helpers[K]>}
type SpinnerInstance = {
  start: jest.Mock<() => SpinnerInstance>
  succeed: jest.Mock<() => SpinnerInstance>
  fail: jest.Mock<() => SpinnerInstance>
}

describe('undeployStudioAction', () => {
  let mockContext: CliCommandContext

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

  let spinnerInstance: SpinnerInstance

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
      chalk: {yellow: jest.fn((str) => str), red: jest.fn((str) => str)},
      output: {
        print: jest.fn(),
        spinner: jest.fn().mockReturnValue(spinnerInstance),
      },
      prompt: {single: jest.fn()},
      cliConfig: {},
    } as unknown as CliCommandContext
  })

  it('does nothing if there is no user application', async () => {
    helpers.getUserApplication.mockResolvedValueOnce(null)

    await undeployStudioAction({} as CliCommandArguments<Record<string, unknown>>, mockContext)

    expect(mockContext.output.print).toHaveBeenCalledWith(
      'Your project has not been assigned a studio hostname.',
    )
    expect(mockContext.output.print).toHaveBeenCalledWith('Nothing to undeploy.')
  })

  it('prompts the user for confirmation and undeploys if confirmed', async () => {
    helpers.getUserApplication.mockResolvedValueOnce(mockApplication)
    helpers.deleteUserApplication.mockResolvedValueOnce(undefined)
    ;(
      mockContext.prompt.single as jest.Mock<typeof mockContext.prompt.single>
    ).mockResolvedValueOnce(true) // User confirms

    await undeployStudioAction({} as CliCommandArguments<Record<string, unknown>>, mockContext)

    expect(mockContext.prompt.single).toHaveBeenCalledWith({
      type: 'confirm',
      default: false,
      message: expect.stringContaining('undeploy'),
    })
    expect(helpers.deleteUserApplication).toHaveBeenCalledWith({
      client: expect.anything(),
      applicationId: 'app-id',
    })
    expect(mockContext.output.print).toHaveBeenCalledWith(
      expect.stringContaining('Studio undeploy scheduled.'),
    )
  })

  it('does not undeploy if the user cancels the prompt', async () => {
    helpers.getUserApplication.mockResolvedValueOnce(mockApplication)
    ;(
      mockContext.prompt.single as jest.Mock<typeof mockContext.prompt.single>
    ).mockResolvedValueOnce(false) // User cancels

    await undeployStudioAction({} as CliCommandArguments<Record<string, unknown>>, mockContext)

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
    ;(
      mockContext.prompt.single as jest.Mock<typeof mockContext.prompt.single>
    ).mockResolvedValueOnce(true) // User confirms

    await expect(
      undeployStudioAction({} as CliCommandArguments<Record<string, unknown>>, mockContext),
    ).rejects.toThrow(errorMessage)

    expect(mockContext.output.spinner('').fail).toHaveBeenCalled()
  })
})
