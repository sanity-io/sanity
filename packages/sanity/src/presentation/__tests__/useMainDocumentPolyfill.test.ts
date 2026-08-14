/**
 * Hook-level tests for `useMainDocument`, kept separate from `useMainDocument.test.ts` so this
 * file's module registry has never evaluated `urlpattern-polyfill`: the polyfill installs its
 * global once per registry, and these tests need to observe the hook loading it on-demand.
 * `URLPattern` is stubbed away so the lazy path is exercised deterministically, also on runtimes
 * that ship a native implementation (Node 24 and later).
 */
import {renderHook, waitFor} from '@testing-library/react'
import {afterAll, beforeAll, beforeEach, describe, expect, test, vi} from 'vitest'

import {type DocumentResolver, type PresentationNavigate} from '../types'
import {useMainDocument} from '../useMainDocument'

const mockFetch = vi.fn()
const mockUseClient = vi.fn()
const mockUseRouter = vi.fn()

vi.mock('sanity', async (importOriginal) => ({
  ...(await importOriginal()),
  useClient: () => mockUseClient(),
}))

vi.mock('sanity/router', async (importOriginal) => ({
  ...(await importOriginal()),
  useRouter: () => mockUseRouter(),
}))

beforeAll(() => {
  vi.stubGlobal('URLPattern', undefined)
})

afterAll(() => {
  vi.unstubAllGlobals()
})

beforeEach(() => {
  mockFetch.mockReset()
  mockFetch.mockResolvedValue({_id: 'course-intro', _type: 'course'})
  mockUseClient.mockReturnValue({fetch: mockFetch})
  mockUseRouter.mockReturnValue({state: {}})
})

function renderUseMainDocument(options: {
  navigate?: PresentationNavigate
  path: string
  resolvers?: DocumentResolver[]
}) {
  return renderHook(() =>
    useMainDocument({
      navigate: options.navigate,
      navigationHistory: [],
      path: options.path,
      targetOrigin: 'https://example.com',
      resolvers: options.resolvers,
      perspective: 'drafts',
      variant: undefined,
    }),
  )
}

describe('useMainDocument', () => {
  // This test must run first: once a later test makes the hook install the polyfill, the global
  // stays in place for the rest of the file.
  test('does not load the URLPattern polyfill when no resolvers are configured', async () => {
    const {result} = renderUseMainDocument({path: '/no/course/intro'})

    // Give a stray polyfill import the chance to land before asserting it never happened
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(typeof URLPattern).toBe('undefined')
    expect(mockFetch).not.toHaveBeenCalled()
    expect(result.current).toBeUndefined()
  })

  test('lazily loads the URLPattern polyfill, then resolves the main document', async () => {
    const navigate = vi.fn()
    const {result} = renderUseMainDocument({
      navigate,
      path: '/no/course/intro',
      resolvers: [
        {
          // The pattern reported in SAPP-4118
          route: '/:prefix(.*)/course/:slug',
          filter: '_type == "course" && slug.current == $slug',
        },
      ],
    })

    // The hook starts in a runtime without URLPattern and only fetches once the polyfill has
    // loaded and the route has been matched
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
    expect(typeof URLPattern).not.toBe('undefined')
    expect(mockFetch).toHaveBeenCalledWith(
      `// groq\n*[_type == "course" && slug.current == $slug][0]{_id, _type}`,
      {prefix: 'no', slug: 'intro'},
      expect.objectContaining({perspective: 'drafts', tag: 'use-main-document'}),
    )

    await waitFor(() => {
      expect(result.current).toEqual({
        document: {_id: 'course-intro', _type: 'course'},
        path: '/no/course/intro',
      })
    })
    expect(navigate).toHaveBeenCalledWith({state: {id: 'course-intro', type: 'course'}})
  })

  test('resolves the first matching route of the path-to-regexp v8 workaround config', async () => {
    const {result} = renderUseMainDocument({
      path: '/no/course/intro',
      resolvers: [
        {
          route: ['/course/:slug', '/*prefix/course/:slug'],
          filter: 'slug.current == $slug',
        },
      ],
    })

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
    // Repeated params are forwarded to the query as arrays, as they were with path-to-regexp
    expect(mockFetch).toHaveBeenCalledWith(
      `// groq\n*[slug.current == $slug][0]{_id, _type}`,
      {prefix: ['no'], slug: 'intro'},
      expect.objectContaining({perspective: 'drafts', tag: 'use-main-document'}),
    )
    await waitFor(() => {
      expect(result.current).toEqual({
        document: {_id: 'course-intro', _type: 'course'},
        path: '/no/course/intro',
      })
    })
  })
})
