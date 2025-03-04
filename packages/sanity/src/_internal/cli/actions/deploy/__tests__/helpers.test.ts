/* eslint-disable @typescript-eslint/no-explicit-any */
import {type Dirent, type Stats} from 'node:fs'
import fs from 'node:fs/promises'
import {Readable} from 'node:stream'
import {type Gzip} from 'node:zlib'

import {type CliCommandContext} from '@sanity/cli'
import {type SanityClient} from '@sanity/client'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {
  checkDir,
  createDeployment,
  deleteUserApplication,
  dirIsEmptyOrNonExistent,
  getOrCreateCoreApplication,
  getOrCreateStudio,
  getOrCreateUserApplicationFromConfig,
} from '../helpers'

vi.mock('node:fs/promises')

const mockFsPromises = vi.mocked(fs)
const mockFsPromisesStat = mockFsPromises.stat
const mockFsPromisesReaddir = mockFsPromises.readdir

const mockClient = {
  request: vi.fn(),
  config: vi.fn(),
} as unknown as SanityClient
const mockClientRequest = vi.mocked(mockClient).request

const mockOutput = {
  print: vi.fn(),
  clear: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  spinner: vi.fn(),
  success: vi.fn(),
} as CliCommandContext['output']
const mockPrompt = {
  single: vi.fn(),
  Separator: vi.fn(),
} as unknown as CliCommandContext['prompt']
const mockSpinner = {
  start: vi.fn(),
  succeed: vi.fn(),
} as unknown as ReturnType<CliCommandContext['output']['spinner']>

const mockFetch = vi.fn<typeof fetch>()
global.fetch = mockFetch

const context = {output: mockOutput, prompt: mockPrompt}

describe('getOrCreateStudio', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('gets the default user application if no `studioHost` is provided', async () => {
    mockClientRequest.mockResolvedValueOnce({
      id: 'default-app',
    })

    const result = await getOrCreateStudio({
      client: mockClient,
      spinner: mockSpinner,
      context,
    })
    expect(mockClientRequest).toHaveBeenCalledWith({
      uri: '/user-applications',
      query: {default: 'true'},
    })
    expect(result).toEqual({id: 'default-app'})
  })

  it('creates a user application by prompting the user for a name', async () => {
    const newApp = {
      id: 'default-app',
      appHost: 'default.sanity.studio',
      urlType: 'internal',
    }
    mockClientRequest.mockResolvedValueOnce(null) // Simulate no existing app
    mockClientRequest.mockResolvedValueOnce([]) // Simulate no list of deployments
    vi.mocked(mockPrompt.single).mockImplementationOnce(
      async ({validate}: Parameters<CliCommandContext['prompt']['single']>[0]) => {
        // Simulate user input and validation
        const appHost = 'default.sanity.studio'
        await validate!(appHost)
        return appHost
      },
    )
    mockClientRequest.mockResolvedValueOnce(newApp)

    const result = await getOrCreateStudio({
      client: mockClient,
      context,
      spinner: mockSpinner,
    })

    expect(mockPrompt.single).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Studio hostname (<value>.sanity.studio):',
      }),
    )
    expect(result).toEqual(newApp)
  })

  it('allows user to select a user application from a list', async () => {
    const existingApp = {
      id: 'default-app',
      appHost: 'default.sanity.studio',
      urlType: 'internal',
    }
    mockClientRequest.mockResolvedValueOnce(null) // Simulate no existing app
    mockClientRequest.mockResolvedValueOnce([existingApp]) // Simulate no list of deployments
    ;(mockPrompt.single as Mock<any>).mockImplementationOnce(async ({choices}: any) => {
      // Simulate user input
      return Promise.resolve(choices[2].value)
    })

    const result = await getOrCreateStudio({
      client: mockClient,
      context,
      spinner: mockSpinner,
    })

    expect(mockPrompt.single).toHaveBeenCalledWith(
      expect.objectContaining({
        choices: expect.arrayContaining([expect.objectContaining({name: 'default.sanity.studio'})]),
      }),
    )
    expect(result).toEqual(existingApp)
  })
})

describe('getOrCreateUserApplicationFromConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('gets an existing user application if a `studioHost` is provided in the config', async () => {
    mockClientRequest.mockResolvedValueOnce({
      id: 'existing-app',
      appHost: 'example.sanity.studio',
      urlType: 'internal',
    })

    const result = await getOrCreateUserApplicationFromConfig({
      client: mockClient,
      spinner: mockSpinner,
      context,
      appHost: 'example',
    })

    expect(mockClientRequest).toHaveBeenCalledWith({
      uri: '/user-applications',
      query: {appHost: 'example'},
    })
    expect(result).toEqual({
      id: 'existing-app',
      urlType: 'internal',
      appHost: 'example.sanity.studio',
    })
  })

  it('creates a user application using `studioHost` if provided in the config', async () => {
    const newApp = {
      id: 'new-app',
      appHost: 'newhost.sanity.studio',
      urlType: 'internal',
    }
    mockClientRequest.mockResolvedValueOnce(null) // Simulate no existing app
    mockClientRequest.mockResolvedValueOnce(newApp)

    const result = await getOrCreateUserApplicationFromConfig({
      client: mockClient,
      spinner: mockSpinner,
      context,
      appHost: 'newhost',
    })

    expect(mockClientRequest).toHaveBeenCalledTimes(2)
    expect(mockClientRequest).toHaveBeenNthCalledWith(1, {
      uri: '/user-applications',
      query: {appHost: 'newhost'},
    })
    expect(mockClientRequest).toHaveBeenNthCalledWith(2, {
      uri: '/user-applications',
      method: 'POST',
      body: {appHost: 'newhost', urlType: 'internal', type: 'studio'},
      query: {appType: 'studio'},
    })
    expect(result).toEqual(newApp)
  })
})

describe('createDeployment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sends the correct request to create a deployment and includes authorization header if token is present', async () => {
    const tarball = Readable.from([Buffer.from('example chunk', 'utf-8')]) as Gzip
    const applicationId = 'test-app-id'
    const version = '1.0.0'

    await createDeployment({
      client: mockClient,
      applicationId,
      version,
      isAutoUpdating: true,
      tarball,
    })

    expect(mockClientRequest).toHaveBeenCalledTimes(1)

    // Extract and validate form data
    const mockRequestCalls = mockClientRequest.mock.calls as Parameters<typeof mockClientRequest>[]
    const {uri, method, body} = mockRequestCalls[0][0]

    expect(uri).toBe(`/user-applications/${applicationId}/deployments`)
    expect(method).toBe('POST')

    // dump the raw content of the form data into a string
    let content = ''
    for await (const chunk of body) {
      content += chunk
    }

    expect(content).toContain('isAutoUpdating')
    expect(content).toContain('true')
    expect(content).toContain('version')
    expect(content).toContain(version)
    expect(content).toContain('example chunk')
  })

  it('streams the tarball contents', async () => {
    const firstEmission = 'first emission\n'
    const secondEmission = 'second emission\n'

    async function* createMockStream() {
      await new Promise((resolve) => setTimeout(resolve, 0))
      yield Buffer.from(firstEmission, 'utf-8')
      await new Promise((resolve) => setTimeout(resolve, 0))
      yield Buffer.from(secondEmission, 'utf-8')
    }

    const mockTarball = Readable.from(createMockStream()) as Gzip
    const applicationId = 'test-app-id'
    const version = '1.0.0'

    await createDeployment({
      client: mockClient,
      applicationId,
      version,
      isAutoUpdating: true,
      tarball: mockTarball,
    })

    expect(mockClientRequest).toHaveBeenCalledTimes(1)

    const mockRequestCalls = mockClientRequest.mock.calls as Parameters<typeof mockClientRequest>[]
    const {body} = mockRequestCalls[0][0]

    // Extract and validate form data
    let emissions = 0
    let content = ''
    for await (const chunk of body) {
      content += chunk
      emissions++
    }

    expect(emissions).toBeGreaterThan(1)

    expect(content).toContain('isAutoUpdating')
    expect(content).toContain('true')

    expect(content).toContain('version')
    expect(content).toContain(version)

    expect(content).toContain(firstEmission)
    expect(content).toContain(secondEmission)
    expect(content).toContain('application/gzip')
  })
})

describe('deleteUserApplication', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sends the correct request to delete the user application', async () => {
    await deleteUserApplication({
      client: mockClient,
      applicationId: 'app-id',
      appType: 'studio',
    })

    expect(mockClientRequest).toHaveBeenCalledWith({
      uri: '/user-applications/app-id',
      method: 'DELETE',
      query: {
        appType: 'studio',
      },
    })
  })

  it('handles errors when deleting the user application', async () => {
    const errorMessage = 'Deletion error'
    mockClientRequest.mockRejectedValueOnce(new Error(errorMessage))

    await expect(
      deleteUserApplication({
        client: mockClient,
        applicationId: 'app-id',
        appType: 'studio',
      }),
    ).rejects.toThrow(errorMessage)

    expect(mockClientRequest).toHaveBeenCalledWith({
      uri: '/user-applications/app-id',
      method: 'DELETE',
      query: {
        appType: 'studio',
      },
    })
  })
})

describe('dirIsEmptyOrNonExistent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns true if the directory does not exist', async () => {
    mockFsPromisesStat.mockRejectedValueOnce({code: 'ENOENT'})

    const result = await dirIsEmptyOrNonExistent('nonexistentDir')
    expect(result).toBe(true)
  })

  it('returns true if the directory is empty', async () => {
    mockFsPromisesStat.mockResolvedValueOnce({isDirectory: () => true} as Stats)
    mockFsPromisesReaddir.mockResolvedValueOnce([])

    const result = await dirIsEmptyOrNonExistent('emptyDir')
    expect(result).toBe(true)
  })

  it('returns false if the directory is not empty', async () => {
    mockFsPromisesStat.mockResolvedValueOnce({isDirectory: () => true} as Stats)
    mockFsPromisesReaddir.mockResolvedValueOnce([
      {name: 'file1'},
      {name: 'file2'},
    ] as unknown as Dirent[])

    const result = await dirIsEmptyOrNonExistent('notEmptyDir')
    expect(result).toBe(false)
  })

  it('throws an error if the path is not a directory', async () => {
    mockFsPromisesStat.mockResolvedValueOnce({isDirectory: () => false} as Stats)

    await expect(dirIsEmptyOrNonExistent('notADir')).rejects.toThrow(
      'Directory notADir is not a directory',
    )
  })
})

describe('checkDir', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does nothing if the directory and index.html exist', async () => {
    mockFsPromisesStat.mockResolvedValue({isDirectory: () => true} as Stats)

    await checkDir('validDir')

    expect(mockFsPromisesStat).toHaveBeenCalledWith('validDir')
    expect(mockFsPromisesStat).toHaveBeenCalledWith('validDir/index.html')
  })

  it('throws an error if the directory does not exist', async () => {
    mockFsPromisesStat.mockRejectedValueOnce({code: 'ENOENT'})

    await expect(checkDir('missingDir')).rejects.toThrow('Directory "missingDir" does not exist')
  })

  it('throws an error if the path is not a directory', async () => {
    mockFsPromisesStat.mockResolvedValueOnce({isDirectory: () => false} as Stats)

    await expect(checkDir('notADir')).rejects.toThrow('Directory notADir is not a directory')
  })

  it('throws an error if index.html does not exist', async () => {
    mockFsPromisesStat
      .mockResolvedValueOnce({isDirectory: () => true} as Stats)
      .mockRejectedValueOnce({code: 'ENOENT'})

    await expect(checkDir('missingIndex')).rejects.toThrow(
      '"missingIndex/index.html" does not exist - [SOURCE_DIR] must be a directory containing a Sanity studio built using "sanity build"',
    )
  })
})

describe('getOrCreateCoreApplication', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockContext = {
    output: mockOutput,
    prompt: mockPrompt,
    cliConfig: {
      // eslint-disable-next-line camelcase
      __experimental_coreAppConfiguration: {
        organizationId: 'test-org',
      },
    },
  }

  it('returns an existing core application when selected from the list', async () => {
    const existingApp = {
      id: 'core-app-1',
      appHost: 'test-org-abc123',
      title: 'Existing Core App',
      type: 'coreApp',
      urlType: 'internal',
    }

    mockClientRequest.mockResolvedValueOnce([existingApp]) // getUserApplications response
    ;(mockPrompt.single as Mock<any>).mockImplementationOnce(async ({choices}: any) => {
      // Simulate selecting the existing app
      return Promise.resolve(choices[2].value)
    })

    const result = await getOrCreateCoreApplication({
      client: mockClient,
      context: mockContext,
      spinner: mockSpinner,
    })

    expect(mockClientRequest).toHaveBeenCalledWith({
      uri: '/user-applications',
      query: {organizationId: 'test-org', appType: 'coreApp'},
    })
    expect(mockPrompt.single).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Select an existing deployed application',
        choices: expect.arrayContaining([
          expect.objectContaining({name: 'Create new deployed application'}),
          expect.anything(), // Separator
          expect.objectContaining({name: 'Existing Core App'}),
        ]),
      }),
    )
    expect(result).toEqual(existingApp)
  })

  it('creates a new core application when no existing apps are found', async () => {
    const newApp = {
      id: 'new-core-app',
      appHost: 'test-org-xyz789',
      title: 'New Core App',
      type: 'coreApp',
      urlType: 'internal',
    }

    mockClientRequest.mockResolvedValueOnce([]) // getUserApplications returns empty array

    // Mock the title prompt
    ;(mockPrompt.single as Mock<any>).mockImplementationOnce(async () => {
      return Promise.resolve('New Core App')
    })

    // Mock the creation request
    mockClientRequest.mockImplementationOnce(async ({body, query}) => {
      expect(query).toEqual({organizationId: 'test-org', appType: 'coreApp'})
      expect(body).toMatchObject({
        title: 'New Core App',
        type: 'coreApp',
        urlType: 'internal',
      })
      expect(body.appHost).toMatch(/^[a-z0-9]{12}$/) // nanoid format
      return newApp
    })

    const result = await getOrCreateCoreApplication({
      client: mockClient,
      context: mockContext,
      spinner: mockSpinner,
    })

    expect(mockPrompt.single).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Enter a title for your application:',
        validate: expect.any(Function),
      }),
    )
    expect(result).toEqual(newApp)
  })

  it('creates a new core application when selected from the list', async () => {
    const existingApp = {
      id: 'core-app-1',
      appHost: 'test-org-abc123',
      title: 'Existing Core App',
      type: 'coreApp',
      urlType: 'internal',
    }
    const newApp = {
      id: 'new-core-app',
      appHost: 'test-org-xyz789',
      title: 'New Core App',
      type: 'coreApp',
      urlType: 'internal',
    }

    mockClientRequest.mockResolvedValueOnce([existingApp]) // getUserApplications response

    // Mock selecting "Create new"
    ;(mockPrompt.single as Mock<any>).mockImplementationOnce(async ({choices}: any) => {
      return Promise.resolve('new')
    })

    // Mock the title prompt
    ;(mockPrompt.single as Mock<any>).mockImplementationOnce(async () => {
      return Promise.resolve('New Core App')
    })

    // Mock the creation request
    mockClientRequest.mockImplementationOnce(async ({body, query}) => {
      expect(query).toEqual({organizationId: 'test-org', appType: 'coreApp'})
      expect(body).toMatchObject({
        title: 'New Core App',
        type: 'coreApp',
        urlType: 'internal',
      })
      expect(body.appHost).toMatch(/^[a-z0-9]{12}$/) // nanoid format
      return newApp
    })

    const result = await getOrCreateCoreApplication({
      client: mockClient,
      context: mockContext,
      spinner: mockSpinner,
    })

    expect(result).toEqual(newApp)
  })

  it('retries with a new appHost if creation fails with 409', async () => {
    const newApp = {
      id: 'new-core-app',
      appHost: 'test-org-xyz789',
      title: 'New Core App',
      type: 'coreApp',
      urlType: 'internal',
    }

    mockClientRequest.mockResolvedValueOnce([]) // getUserApplications returns empty array

    // Mock the title prompt
    ;(mockPrompt.single as Mock<any>).mockImplementationOnce(async () => {
      return Promise.resolve('New Core App')
    })

    // Mock first creation attempt failing
    mockClientRequest.mockRejectedValueOnce({
      statusCode: 409,
      response: {body: {message: 'App host already exists'}},
    })

    // Mock second creation attempt succeeding
    mockClientRequest.mockResolvedValueOnce(newApp)

    const result = await getOrCreateCoreApplication({
      client: mockClient,
      context: mockContext,
      spinner: mockSpinner,
    })

    expect(mockClientRequest).toHaveBeenCalledTimes(3) // getUserApplications + 2 creation attempts
    expect(result).toEqual(newApp)
  })

  it('validates that the title is not empty', async () => {
    mockClientRequest.mockResolvedValueOnce([]) // getUserApplications returns empty array

    // Mock the title prompt with validation
    const mockValidate = vi.fn()
    ;(mockPrompt.single as Mock<any>).mockImplementationOnce(async ({validate}: any) => {
      mockValidate.mockImplementation(validate)
      expect(mockValidate('')).toBe('Title is required')
      expect(mockValidate('Valid Title')).toBe(true)
      return Promise.resolve('Valid Title')
    })

    // Mock the creation request
    mockClientRequest.mockImplementationOnce(() =>
      Promise.resolve({
        id: 'new-core-app',
        appHost: 'test-org-xyz789',
        title: 'Valid Title',
        type: 'coreApp',
        urlType: 'internal',
      }),
    )

    await getOrCreateCoreApplication({
      client: mockClient,
      context: mockContext,
      spinner: mockSpinner,
    })

    expect(mockValidate).toHaveBeenCalled()
  })
})
