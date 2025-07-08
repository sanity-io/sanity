import {beforeEach, describe, expect, test, vi} from 'vitest'

import {getChangelog} from '../src/actions/changelog/getChangelog'
import {listPlatforms} from '../src/actions/changelog/listPlatforms'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('CLI: `sanity changelog`', () => {
  let mockOutput: any
  let mockContext: any

  beforeEach(() => {
    mockFetch.mockClear()

    mockOutput = {
      print: vi.fn(),
      error: vi.fn(),
    }

    mockContext = {
      output: mockOutput,
    }
  })

  test('listPlatforms - finding results', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          result: [
            {
              _id: 'platform1',
              title: 'Sanity Studio',
              npmName: 'sanity',
            },
            {
              _id: 'platform2',
              title: 'JavaScript Client',
              npmName: '@sanity/client',
            },
          ],
        }),
    })

    const result = await listPlatforms({}, mockContext)

    expect(result).toEqual([
      {
        _id: 'platform1',
        title: 'Sanity Studio',
        npmName: 'sanity',
      },
      {
        _id: 'platform2',
        title: 'JavaScript Client',
        npmName: '@sanity/client',
      },
    ])
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('https://3do82whm.api.sanity.io/v2025-07-08/data/query/next'),
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }),
    )
  })

  test('listPlatforms - API error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    })

    const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

    await listPlatforms({}, mockContext)

    expect(mockOutput.error).toHaveBeenCalledWith('Failed to fetch platforms')
    expect(mockExit).toHaveBeenCalledWith(1)

    mockExit.mockRestore()
  })

  test('getChangelog - successful fetch', async () => {
    // Mock platform lookup
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          result: {
            _id: 'platform1',
            title: 'Sanity Studio',
            npmName: 'sanity',
          },
        }),
    })

    // Mock changelog fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          result: [
            {
              _id: 'version1',
              semver: '3.5.0',
              date: '2024-07-15',
              summary: 'New features and bug fixes',
              changes: [
                {
                  _id: 'change1',
                  title: 'Added new feature',
                  content: [
                    {
                      _type: 'block',
                      children: [
                        {
                          _type: 'span',
                          text: 'This is a new feature',
                        },
                      ],
                    },
                  ],
                  publishedAt: '2024-07-15T10:00:00Z',
                },
              ],
            },
          ],
        }),
    })

    const result = await getChangelog({platform: 'sanity', limit: 1}, mockContext)

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      platform: {
        title: 'Sanity Studio',
        npmName: 'sanity',
        endpoint: undefined,
      },
      version: '3.5.0',
      date: '2024-07-15',
      summary: 'New features and bug fixes',
      changes: [
        {
          title: 'Added new feature',
          content: [
            {
              _type: 'block',
              children: [
                {
                  _type: 'span',
                  text: 'This is a new feature',
                },
              ],
            },
          ],
          publishedAt: '2024-07-15T10:00:00Z',
          affectedArticles: undefined,
        },
      ],
    })
  })

  test('getChangelog - platform not found', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          result: null,
        }),
    })

    const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

    await getChangelog({platform: 'nonexistent'}, mockContext)

    expect(mockOutput.error).toHaveBeenCalledWith('Platform "nonexistent" not found')
    expect(mockExit).toHaveBeenCalledWith(1)

    mockExit.mockRestore()
  })

  test('getChangelog - always markdown format', async () => {
    // Mock platform lookup
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          result: {
            _id: 'platform1',
            title: 'Sanity Studio',
            npmName: 'sanity',
          },
        }),
    })

    // Mock changelog fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          result: [
            {
              _id: 'version1',
              semver: '3.5.0',
              date: '2024-07-15',
              summary: 'New features',
              changes: [],
            },
          ],
        }),
    })

    await getChangelog({platform: 'sanity', limit: 1}, mockContext)

    expect(mockOutput.print).toHaveBeenCalledWith(expect.stringContaining('## 3.5.0 (7/15/2024)'))
  })
})
