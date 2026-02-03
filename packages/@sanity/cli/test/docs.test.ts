import {beforeEach, describe, expect, test, vi} from 'vitest'

import {readDoc} from '../src/actions/docs/readDoc'
import {searchDocs} from '../src/actions/docs/searchDocs'
import {normalizePath} from '../src/commands/docs/readCommand'
import {browse} from '../src/util/browse'

// Mock fetch globally for the actions
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock the browse utility
vi.mock('../src/util/browse', () => ({
  browse: vi.fn(),
}))

describe('CLI: `sanity docs`', () => {
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
    await browse('https://www.sanity.io/docs')
    expect(mockBrowse).toHaveBeenCalledWith('https://www.sanity.io/docs')
  })

  test('searchDocs - finding results', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve([
          {path: '/docs/schema', title: 'Schema', description: 'Learn about schemas'},
          {path: '/docs/queries', title: 'Queries', description: 'Learn about queries'},
        ]),
    })

    const result = await searchDocs({query: 'test', limit: 10}, mockContext)

    expect(result).toEqual([
      {path: '/docs/schema', title: 'Schema', description: 'Learn about schemas'},
      {path: '/docs/queries', title: 'Queries', description: 'Learn about queries'},
    ])
    expect(mockFetch).toHaveBeenCalledWith(
      new URL('https://www.sanity.io/docs/api/search/semantic?query=test'),
      {signal: expect.any(AbortSignal)},
    )
  })

  test('searchDocs - no results found', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    })

    const result = await searchDocs({query: 'nonexistent'}, mockContext)

    expect(result).toEqual([])
  })

  test('searchDocs - API error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve([]),
    })

    const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

    await searchDocs({query: 'test'}, mockContext)

    expect(mockOutput.error).toHaveBeenCalledWith(
      'The documentation search API is currently unavailable. Please try again later.',
    )
    expect(mockExit).toHaveBeenCalledWith(1)

    mockExit.mockRestore()
  })

  test('searchDocs - with custom limit', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve([
          {path: '/docs/schema', title: 'Schema', description: 'Learn about schemas'},
          {path: '/docs/queries', title: 'Queries', description: 'Learn about queries'},
          {path: '/docs/mutations', title: 'Mutations', description: 'Learn about mutations'},
        ]),
    })

    const result = await searchDocs({query: 'test', limit: 2}, mockContext)

    expect(result).toHaveLength(2)
    expect(result).toEqual([
      {path: '/docs/schema', title: 'Schema', description: 'Learn about schemas'},
      {path: '/docs/queries', title: 'Queries', description: 'Learn about queries'},
    ])
  })

  test('readDoc - successful read', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('# Test Article\n\nThis is test content.'),
    })

    const result = await readDoc({path: '/docs/test-article'}, mockContext)

    expect(result).toBe('# Test Article\n\nThis is test content.')
    expect(mockFetch).toHaveBeenCalledWith('https://www.sanity.io/docs/test-article.md', {
      signal: expect.any(AbortSignal),
    })
  })

  test('readDoc - article not found', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    })

    const result = await readDoc({path: '/docs/nonexistent'}, mockContext)

    expect(result).toBeNull()
    expect(mockOutput.error).toHaveBeenCalledWith('Article not found: /docs/nonexistent')
  })

  test('readDoc - API error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: () => Promise.resolve(''),
    })

    const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

    await readDoc({path: '/docs/test-article'}, mockContext)

    expect(mockOutput.error).toHaveBeenCalledWith(
      'The article API is currently unavailable. Please try again later.',
    )
    expect(mockExit).toHaveBeenCalledWith(1)

    mockExit.mockRestore()
  })

  test('readDoc - network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

    await readDoc({path: '/docs/test-article'}, mockContext)

    expect(mockOutput.error).toHaveBeenCalledWith(
      'The article API is currently unavailable. Please try again later.',
    )
    expect(mockExit).toHaveBeenCalledWith(1)

    mockExit.mockRestore()
  })

  test('normalizePath - handles path input unchanged', () => {
    expect(normalizePath('/docs/studio/installation')).toBe('/docs/studio/installation')
    expect(normalizePath('/docs')).toBe('/docs')
    expect(normalizePath('/docs/content-modeling/schemas')).toBe('/docs/content-modeling/schemas')
  })

  test('normalizePath - converts full URLs to paths', () => {
    expect(normalizePath('https://www.sanity.io/docs/studio/installation')).toBe(
      '/docs/studio/installation',
    )
    expect(normalizePath('https://www.sanity.io/docs')).toBe('/docs')
    expect(normalizePath('https://www.sanity.io/docs/content-modeling/schemas')).toBe(
      '/docs/content-modeling/schemas',
    )
  })

  test('normalizePath - handles URLs with fragments and queries', () => {
    expect(normalizePath('https://www.sanity.io/docs/schema#lift-types')).toBe(
      '/docs/schema#lift-types',
    )
    expect(normalizePath('https://www.sanity.io/docs/schema?version=v3')).toBe(
      '/docs/schema?version=v3',
    )
  })

  test('normalizePath - handles non-Sanity URLs unchanged', () => {
    expect(normalizePath('https://example.com/docs/test')).toBe('https://example.com/docs/test')
    expect(normalizePath('http://localhost:3000/docs')).toBe('http://localhost:3000/docs')
  })
})
