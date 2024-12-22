import {type CliCommandArguments, type CliCommandContext} from '@sanity/cli'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {type UserApplication} from '../helpers'
import * as _helpers from '../helpers'
import undeployStudioAction, {type UndeployStudioActionFlags} from '../undeployAction'

// Mock dependencies
vi.mock('../helpers')

const helpers = vi.mocked(_helpers)
type SpinnerInstance = {
  start: Mock<() => SpinnerInstance>
  succeed: Mock<() => SpinnerInstance>
  fail: Mock<() => SpinnerInstance>
}

describe('undeployStudioAction', () => {
  let mockContext: CliCommandContext

  const mockApplication: UserApplication = {
    id: 'app-id',
    appHost: 'app-host',
    organizationId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    urlType: 'internal',
    projectId: 'example',
    title: null,
    type: 'studio',
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
      cliConfig: {},
    } as unknown as CliCommandContext
  })

  it('does nothing if there is no user application', async () => {
    helpers.getUserApplication.mockResolvedValueOnce(null)

    await undeployStudioAction({} as CliCommandArguments<UndeployStudioActionFlags>, mockContext)

    expect(mockContext.output.print).toHaveBeenCalledWith(
      'Your project has not been assigned a studio hostname',
    )
    expect(mockContext.output.print).toHaveBeenCalledWith(
      'or you do not have studioHost set in sanity.cli.js or sanity.cli.ts.',
    )
    expect(mockContext.output.print).toHaveBeenCalledWith('Nothing to undeploy.')
  })

  it('prompts the user for confirmation and undeploys if confirmed', async () => {
    helpers.getUserApplication.mockResolvedValueOnce(mockApplication)
    helpers.deleteUserApplication.mockResolvedValueOnce(undefined)
    ;(mockContext.prompt.single as Mock<typeof mockContext.prompt.single>).mockResolvedValueOnce(
      true,
    ) // User confirms

    await undeployStudioAction({} as CliCommandArguments<UndeployStudioActionFlags>, mockContext)

    expect(mockContext.prompt.single).toHaveBeenCalledWith({
      type: 'confirm',
      default: false,
      message: expect.stringContaining('undeploy'),
    })
    expect(helpers.deleteUserApplication).toHaveBeenCalledWith({
      client: expect.anything(),
      applicationId: 'app-id',
      appType: 'studio',
    })
    expect(mockContext.output.print).toHaveBeenCalledWith(
      expect.stringContaining('Studio undeploy scheduled.'),
    )
  })

  it('does not undeploy if the user cancels the prompt', async () => {
    helpers.getUserApplication.mockResolvedValueOnce(mockApplication)
    ;(mockContext.prompt.single as Mock<typeof mockContext.prompt.single>).mockResolvedValueOnce(
      false,
    ) // User cancels

    await undeployStudioAction({} as CliCommandArguments<UndeployStudioActionFlags>, mockContext)

    expect(mockContext.prompt.single).toHaveBeenCalledWith({
      type: 'confirm',
      default: false,
      message: expect.stringContaining('undeploy'),
    })
    expect(helpers.deleteUserApplication).not.toHaveBeenCalled()
  })

  it(`if running in unattended mode, it doesn't prompt the user for confirmation`, async () => {
    helpers.getUserApplication.mockResolvedValueOnce(mockApplication)
    helpers.deleteUserApplication.mockResolvedValueOnce(undefined)
    ;(mockContext.prompt.single as Mock<typeof mockContext.prompt.single>).mockResolvedValueOnce(
      true,
    ) // User confirms

    await undeployStudioAction(
      {extOptions: {yes: true}} as CliCommandArguments<UndeployStudioActionFlags>,
      mockContext,
    )

    expect(mockContext.prompt.single).not.toHaveBeenCalledWith({
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

  it('handles errors during the undeploy process', async () => {
    const errorMessage = 'Example error'
    helpers.getUserApplication.mockResolvedValueOnce(mockApplication)
    helpers.deleteUserApplication.mockRejectedValueOnce(new Error(errorMessage))
    ;(mockContext.prompt.single as Mock<typeof mockContext.prompt.single>).mockResolvedValueOnce(
      true,
    ) // User confirms

    await expect(
      undeployStudioAction({} as CliCommandArguments<UndeployStudioActionFlags>, mockContext),
    ).rejects.toThrow(errorMessage)

    expect(mockContext.output.spinner('').fail).toHaveBeenCalled()
  })
})
