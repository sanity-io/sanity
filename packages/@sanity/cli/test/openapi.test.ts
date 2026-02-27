import {beforeEach, describe, expect, test, vi} from 'vitest'

import {getSpec} from '../src/actions/openapi/getSpec'
import {listSpecs} from '../src/actions/openapi/listSpecs'
import {browse} from '../src/util/browse'

// Mock fetch globally for the actions
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock the browse utility
vi.mock('../src/util/browse', () => ({
  browse: vi.fn(),
}))

describe('CLI: `sanity openapi`', () => {
  let mockOutput: any
  let mockContext: any

  const mockBrowse = vi.mocked(browse)

  beforeEach(() => {
    mockFetch.mockClear()
    mockBrowse.mockClear()

    mockOutput = {
      print: vi.fn(),
      error: vi.fn(),
    }

    mockContext = {
      output: mockOutput,
    }
  })

  test('browse utility calls open', async () => {
    await browse('https://www.sanity.io/docs/http-reference')
    expect(mockBrowse).toHaveBeenCalledWith('https://www.sanity.io/docs/http-reference')
  })

  test('listSpecs - finding results', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          specs: [
            {slug: 'query', title: 'Query API', description: 'Query content with GROQ'},
            {slug: 'assets', title: 'Assets API', description: 'Upload and manage assets'},
          ],
        }),
    })

    const result = await listSpecs({}, mockContext)

    expect(result).toEqual([
      {slug: 'query', title: 'Query API', description: 'Query content with GROQ'},
      {slug: 'assets', title: 'Assets API', description: 'Upload and manage assets'},
    ])
    expect(mockFetch).toHaveBeenCalledWith('https://www.sanity.io/docs/api/openapi', {
      signal: expect.any(AbortSignal),
    })
  })

  test('listSpecs - no results found', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({specs: []}),
    })

    const result = await listSpecs({}, mockContext)

    expect(result).toEqual([])
  })

  test('listSpecs - API error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve([]),
    })

    const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

    await listSpecs({}, mockContext)

    expect(mockOutput.error).toHaveBeenCalledWith(
      'The OpenAPI service is currently unavailable. Please try again later.',
    )
    expect(mockExit).toHaveBeenCalledWith(1)

    mockExit.mockRestore()
  })

  test('listSpecs - network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

    await listSpecs({}, mockContext)

    expect(mockOutput.error).toHaveBeenCalledWith(
      'The OpenAPI service is currently unavailable. Please try again later.',
    )
    expect(mockExit).toHaveBeenCalledWith(1)

    mockExit.mockRestore()
  })

  test('listSpecs - web flag opens browser', async () => {
    const result = await listSpecs({web: true}, mockContext)

    expect(mockOutput.print).toHaveBeenCalledWith(
      'Opening https://www.sanity.io/docs/http-reference',
    )
    expect(mockBrowse).toHaveBeenCalledWith('https://www.sanity.io/docs/http-reference')
    expect(result).toEqual([])
    expect(mockFetch).not.toHaveBeenCalled()
  })

  test('getSpec - successful read JSON', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('{"openapi": "3.0.0", "info": {"title": "Test API"}}'),
    })

    const result = await getSpec({slug: 'query', format: 'json'}, mockContext)

    expect(result).toBe('{"openapi": "3.0.0", "info": {"title": "Test API"}}')
    expect(mockFetch).toHaveBeenCalledWith(
      new URL('https://www.sanity.io/docs/api/openapi/query?format=json'),
      {signal: expect.any(AbortSignal)},
    )
  })

  test('getSpec - successful read YAML', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('openapi: 3.0.0\ninfo:\n  title: Test API'),
    })

    const result = await getSpec({slug: 'query', format: 'yaml'}, mockContext)

    expect(result).toBe('openapi: 3.0.0\ninfo:\n  title: Test API')
    expect(mockFetch).toHaveBeenCalledWith(
      new URL('https://www.sanity.io/docs/api/openapi/query?format=yaml'),
      {signal: expect.any(AbortSignal)},
    )
  })

  test('getSpec - spec not found', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    })

    const result = await getSpec({slug: 'nonexistent-api'}, mockContext)

    expect(result).toBeNull()
    expect(mockOutput.error).toHaveBeenCalledWith(
      'OpenAPI specification not found: nonexistent-api',
    )
  })

  test('getSpec - API error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: () => Promise.resolve(''),
    })

    const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

    await getSpec({slug: 'query'}, mockContext)

    expect(mockOutput.error).toHaveBeenCalledWith(
      'The OpenAPI service is currently unavailable. Please try again later.',
    )
    expect(mockExit).toHaveBeenCalledWith(1)

    mockExit.mockRestore()
  })

  test('getSpec - network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

    await getSpec({slug: 'query'}, mockContext)

    expect(mockOutput.error).toHaveBeenCalledWith(
      'The OpenAPI service is currently unavailable. Please try again later.',
    )
    expect(mockExit).toHaveBeenCalledWith(1)

    mockExit.mockRestore()
  })

  test('getSpec - web flag opens browser', async () => {
    const result = await getSpec({slug: 'query', web: true}, mockContext)

    expect(mockOutput.print).toHaveBeenCalledWith(
      'Opening https://www.sanity.io/docs/http-reference/query',
    )
    expect(mockBrowse).toHaveBeenCalledWith('https://www.sanity.io/docs/http-reference/query')
    expect(result).toBeNull()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  test('getSpec - no format specified uses default (yaml)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('openapi: 3.0.0'),
    })

    await getSpec({slug: 'query'}, mockContext)

    expect(mockFetch).toHaveBeenCalledWith(
      new URL('https://www.sanity.io/docs/api/openapi/query?format=yaml'),
      {signal: expect.any(AbortSignal)},
    )
  })
})
