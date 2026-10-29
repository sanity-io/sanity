/**
 * Hook-level tests for `useMainDocument`, kept separate from `useMainDocument.test.ts` so this
 * file's module registry has never evaluated `urlpattern-polyfill`: the polyfill installs its
 * global once per registry, and these tests need to observe the hook loading it on-demand.
 * `URLPattern` is stubbed away so the lazy path is exercised deterministically, also on runtimes
 * that ship a native implementation (Node 24 and later).
 */
import {act, renderHook, type RenderHookResult, waitFor} from '@testing-library/react'
import {Suspense, type ReactNode} from 'react'
import {afterAll, beforeAll, beforeEach, describe, expect, test, vi} from 'vitest'

import {type DocumentResolver, type MainDocumentState, type PresentationNavigate} from '../types'
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

// The hook suspends via `use()` while the polyfill loads, so it must render under a Suspense
// boundary — in the studio, the tool-level boundary in `StudioLayoutComponent` catches it
function wrapper({children}: {children: ReactNode}) {
  return <Suspense fallback={null}>{children}</Suspense>
}

async function renderUseMainDocument(options: {
  navigate?: PresentationNavigate
  path: string
  resolvers?: DocumentResolver[]
}) {
  let harness!: RenderHookResult<MainDocumentState | undefined, unknown>
  // oxlint-disable-next-line testing-library/no-unnecessary-act -- the hook may suspend on the polyfill import, and React refuses to resume work that suspended inside `renderHook`'s internal unawaited sync `act`; mounting inside an awaited async `act` is the fix React's own error message prescribes
  await act(async () => {
    harness = renderHook(
      () =>
        useMainDocument({
          navigate: options.navigate,
          navigationHistory: [],
          path: options.path,
          targetOrigin: 'https://example.com',
          resolvers: options.resolvers,
          perspective: 'drafts',
          variant: undefined,
        }),
      {wrapper},
    )
  })
  return harness
}

describe('useMainDocument', () => {
  // This test must run first: once a later test makes the hook install the polyfill, the global
  // stays in place for the rest of the file.
  test('does not load the URLPattern polyfill when no resolvers are configured', async () => {
    const {result} = await renderUseMainDocument({path: '/no/course/intro'})

    // Give a stray polyfill import the chance to land before asserting it never happened
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(typeof URLPattern).toBe('undefined')
    expect(mockFetch).not.toHaveBeenCalled()
    expect(result.current).toBeUndefined()
  })

  test(
    'suspends while the URLPattern polyfill lazy loads, then resolves the main document',
    {timeout: 30_000},
    async () => {
      const navigate = vi.fn()
      const {result} = await renderUseMainDocument({
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
      // loaded and the route has been matched. The generous timeout covers the cold transform of
      // the polyfill chunk on the first-ever dynamic import in this worker.
      await waitFor(
        () => {
          expect(mockFetch).toHaveBeenCalledTimes(1)
        },
        {timeout: 10_000},
      )
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
    },
  )

  test('resolves the first matching route of the path-to-regexp v8 workaround config', async () => {
    const {result} = await renderUseMainDocument({
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
