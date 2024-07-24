import {type Stats} from 'node:fs'
import fs from 'node:fs/promises'
import {Readable} from 'node:stream'
import {type Gzip} from 'node:zlib'

import {beforeEach, describe, expect, it, jest} from '@jest/globals'
import {type CliCommandContext} from '@sanity/cli'
import {type SanityClient} from '@sanity/client'

import {
  checkDir,
  createDeployment,
  deleteUserApplication,
  dirIsEmptyOrNonExistent,
  getOrCreateUserApplication,
} from '../helpers'

jest.mock('node:fs/promises')

const mockFsPromises = fs as jest.Mocked<typeof fs>
const mockFsPromisesStat = mockFsPromises.stat as jest.Mock<typeof fs.stat>
const mockFsPromisesReaddir = mockFsPromises.readdir as unknown as jest.Mock<
  () => Promise<string[]>
>

const mockClient = {
  request: jest.fn(),
  config: jest.fn(),
  getUrl: jest.fn(),
} as unknown as SanityClient
const mockClientRequest = mockClient.request as jest.Mock<SanityClient['request']>

const mockOutput = {
  print: jest.fn(),
  clear: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  spinner: jest.fn(),
} as CliCommandContext['output']
const mockPrompt = {single: jest.fn()} as unknown as CliCommandContext['prompt']

const mockFetch = jest.fn<typeof fetch>()
global.fetch = mockFetch

// Mock the Gzip stream
class MockGzip {
  constructor(private chunks: AsyncIterable<Buffer> | Iterable<Buffer>) {}
  [Symbol.asyncIterator]() {
    const chunks = this.chunks
    return (async function* thing() {
      for await (const chunk of chunks) yield chunk
    })()
  }
}

const context = {output: mockOutput, prompt: mockPrompt}

describe('getOrCreateUserApplication', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('gets the default user application if no `studioHost` is provided', async () => {
    mockClientRequest.mockResolvedValueOnce({
      id: 'default-app',
      isDefault: true,
    })

    const result = await getOrCreateUserApplication({client: mockClient, context})
    expect(mockClient.request).toHaveBeenCalledWith({
      uri: '/user-applications',
      query: {default: 'true'},
    })
    expect(result).toEqual({id: 'default-app', isDefault: true})
  })

  it('gets an existing user application if a `studioHost` is provided in the config', async () => {
    mockClientRequest.mockResolvedValueOnce({
      id: 'existing-app',
      appHost: 'example.sanity.studio',
    })

    const result = await getOrCreateUserApplication({
      client: mockClient,
      cliConfig: {studioHost: 'example.sanity.studio'},
      context,
    })

    expect(mockClient.request).toHaveBeenCalledWith({
      uri: '/user-applications',
      query: {appHost: 'example.sanity.studio'},
    })
    expect(result).toEqual({id: 'existing-app', appHost: 'example.sanity.studio'})
  })

  it('creates a user application using `studioHost` if provided in the config', async () => {
    const newApp = {id: 'new-app', appHost: 'newhost.sanity.studio', isDefault: true}
    mockClientRequest.mockResolvedValueOnce(null) // Simulate no existing app
    mockClientRequest.mockResolvedValueOnce(newApp)

    const result = await getOrCreateUserApplication({
      client: mockClient,
      cliConfig: {studioHost: 'newhost'},
      context,
    })

    expect(mockClient.request).toHaveBeenCalledWith({
      uri: '/user-applications',
      method: 'POST',
      body: {appHost: 'newhost', isDefault: true},
    })
    expect(result).toEqual(newApp)
  })

  it('creates a default user application by prompting the user for a name', async () => {
    const newApp = {id: 'default-app', appHost: 'default.sanity.studio', isDefault: true}
    mockClientRequest.mockResolvedValueOnce(null) // Simulate no existing app
    ;(mockPrompt.single as jest.Mock<any>).mockImplementationOnce(
      async ({validate}: Parameters<CliCommandContext['prompt']['single']>[0]) => {
        // Simulate user input and validation
        const appHost = 'default.sanity.studio'
        await validate!(appHost)
        return appHost
      },
    )
    mockClientRequest.mockResolvedValueOnce(newApp)

    const result = await getOrCreateUserApplication({
      client: mockClient,
      context,
    })

    expect(mockPrompt.single).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Studio hostname (<value>.sanity.studio):',
      }),
    )
    expect(result).toEqual(newApp)
  })
})

describe('createDeployment', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(mockClient.config as jest.Mock<any>).mockReturnValue({token: 'fake-token'})
    ;(mockClient.getUrl as jest.Mock<SanityClient['getUrl']>).mockImplementation(
      (uri) => `http://example.api.sanity.io${uri}`,
    )
  })

  it('sends the correct request to create a deployment and includes authorization header if token is present', async () => {
    const tarball = Readable.from([Buffer.from('example chunk', 'utf-8')]) as Gzip
    const applicationId = 'test-app-id'
    const version = '1.0.0'

    mockFetch.mockResolvedValueOnce(new Response())

    await createDeployment({
      client: mockClient,
      applicationId,
      version,
      isAutoUpdating: true,
      tarball,
    })

    // Check URL and method
    expect(mockClient.getUrl).toHaveBeenCalledWith(
      `/user-applications/${applicationId}/deployments`,
    )
    expect(mockFetch).toHaveBeenCalledTimes(1)
    const url = mockFetch.mock.calls[0][0] as URL
    expect(url.toString()).toBe(
      'http://example.api.sanity.io/user-applications/test-app-id/deployments',
    )

    // Extract and validate form data
    const mockFetchCalls = mockFetch.mock.calls as Parameters<typeof fetch>[]
    const formData = mockFetchCalls[0][1]?.body as unknown as Readable

    // dump the raw content of the form data into a string
    let content = ''
    for await (const chunk of formData) {
      content += chunk
    }

    expect(content).toContain('isAutoUpdating')
    expect(content).toContain('true')
    expect(content).toContain('version')
    expect(content).toContain(version)
    expect(content).toContain('example chunk')

    // Check Authorization header
    const headers = mockFetchCalls[0][1]?.headers as Headers
    expect(headers.get('Authorization')).toBe('Bearer fake-token')
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

    mockFetch.mockResolvedValueOnce(new Response())

    const version = '1.0.0'

    await createDeployment({
      client: mockClient,
      applicationId,
      version,
      isAutoUpdating: true,
      tarball: mockTarball,
    })

    // Check URL and method
    expect(mockClient.getUrl).toHaveBeenCalledWith(
      `/user-applications/${applicationId}/deployments`,
    )
    expect(mockFetch).toHaveBeenCalledTimes(1)
    const url = mockFetch.mock.calls[0][0] as URL
    expect(url.toString()).toBe(
      'http://example.api.sanity.io/user-applications/test-app-id/deployments',
    )

    // Extract and validate form data
    const mockFetchCalls = mockFetch.mock.calls as Parameters<typeof fetch>[]
    const requestInit = mockFetchCalls[0][1] as any

    // this is required to enable streaming with the native fetch API
    // https://github.com/nodejs/node/issues/46221
    expect(requestInit.duplex).toBe('half')

    const formData = requestInit.body as Readable

    let emissions = 0
    let content = ''
    for await (const chunk of formData) {
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
    jest.clearAllMocks()
  })

  it('sends the correct request to delete the user application', async () => {
    await deleteUserApplication({
      client: mockClient,
      applicationId: 'app-id',
    })

    expect(mockClientRequest).toHaveBeenCalledWith({
      uri: '/user-applications/app-id',
      method: 'DELETE',
    })
  })

  it('handles errors when deleting the user application', async () => {
    const errorMessage = 'Deletion error'
    mockClientRequest.mockRejectedValueOnce(new Error(errorMessage))

    await expect(
      deleteUserApplication({client: mockClient, applicationId: 'app-id'}),
    ).rejects.toThrow(errorMessage)

    expect(mockClientRequest).toHaveBeenCalledWith({
      uri: '/user-applications/app-id',
      method: 'DELETE',
    })
  })
})

describe('dirIsEmptyOrNonExistent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
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
    mockFsPromisesReaddir.mockResolvedValueOnce(['file1', 'file2'])

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
    jest.clearAllMocks()
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
