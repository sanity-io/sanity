import {type ResponseQueryOptions} from '@sanity/client'
import {use, useEffect, useRef, useState} from 'react'
import {useClient, VARIANTS_STUDIO_CLIENT_OPTIONS} from 'sanity'
import {type RouterState, useRouter} from 'sanity/router'
import {useEffectEvent} from 'use-effect-event'

import {API_VERSION} from './constants'
import {
  type DocumentResolver,
  type DocumentResolverContext,
  type MainDocument,
  type MainDocumentState,
  type PresentationNavigate,
  type PresentationPerspective,
} from './types'
import {createRouteMatcher, type RouteMatch, type RouteMatcher} from './util/matchRoute'

// Helper function to "unwrap" a result when it is either explicitly provided or
// returned as the result of a passed function
function fnOrObj<T, U>(arg: T | ((ctx: U) => T), context: U): T {
  return arg instanceof Function ? arg(context) : arg
}

function getQueryFromResult(
  resolver: DocumentResolver,
  context: DocumentResolverContext,
): string | undefined {
  if (resolver.resolve) {
    const filter = resolver.resolve(context)?.filter
    return filter
      ? `// groq
*[${filter}][0]{_id, _type}`
      : undefined
  }

  if ('type' in resolver) {
    return `// groq
*[_type == "${resolver.type}"][0]{_id, _type}`
  }

  return `// groq
*[${fnOrObj(resolver.filter, context)}][0]{_id, _type}`
}

function getParamsFromResult(
  resolver: DocumentResolver,
  context: DocumentResolverContext,
): Record<string, string> {
  if (resolver.resolve) {
    return resolver.resolve(context)?.params ?? context.params
  }

  if ('type' in resolver) {
    return {}
  }

  return fnOrObj(resolver.params, context) ?? context.params
}

/**
 * Route matching is backed by URLPattern, which needs a polyfill in runtimes without a native
 * implementation. The promise is kept at module level so its identity is stable across render
 * attempts, as `use()` requires.
 */
let urlPatternPolyfillPromise: Promise<unknown> | undefined

/**
 * Compiling a URLPattern is not free and the route is resolved again on every preview URL change,
 * so keep the compiled matchers around. Patterns come from studio config, so the set is small and
 * fixed.
 */
const matchers = new Map<string, RouteMatcher>()

function getMatcher(pattern: string): RouteMatcher {
  const cached = matchers.get(pattern)
  if (cached) return cached
  const matcher = createRouteMatcher(pattern)
  matchers.set(pattern, matcher)
  return matcher
}

export function getRouteContext(
  route: DocumentResolver['route'],
  url: URL,
): DocumentResolverContext | undefined {
  const routes = Array.isArray(route) ? route : [route]

  // `let` as the path is replaced with the pathname for absolute URLs
  for (let path of routes) {
    let {origin} = url

    // Handle absolute URLs
    try {
      const absolute = new URL(path)

      // If we are dealing with an absolute URL, ensure the origins match
      if (absolute.origin !== origin) continue

      origin = absolute.origin
      path = absolute.pathname
    } catch {
      // Ignore, as we assume a relative path
    }

    let result: RouteMatch | undefined
    try {
      result = getMatcher(path)(url.pathname)
    } catch (e) {
      throw new Error(`"${path}" is not a valid route pattern`, {cause: e})
    }
    if (result) {
      // Repeated params (`:path*`, `/*splat`) are arrays of segments at runtime, as they were
      // with path-to-regexp — `DocumentResolverContext` predates this and only declares `string`.
      const params = result.params as DocumentResolverContext['params']
      return {origin, params, path: result.path}
    }
  }
  return undefined
}

export function useMainDocument(props: {
  navigate?: PresentationNavigate
  navigationHistory: RouterState[]
  path?: string
  targetOrigin: string
  resolvers?: DocumentResolver[]
  perspective: PresentationPerspective
  variant: string | undefined
}): MainDocumentState | undefined {
  const {
    navigate,
    navigationHistory,
    path,
    targetOrigin,
    resolvers = [],
    perspective,
    variant,
  } = props

  /**
   * Lazy load the URLPattern polyfill on-demand, if needed, the same way
   * `actors/resolve-allow-patterns.ts` does — browsers with native support never pay the cost,
   * and neither does a studio without `mainDocuments` resolvers. `use()` suspends rendering until
   * the polyfill has loaded, caught by the studio's tool-level `Suspense` boundary, like the
   * tool's own lazy chunk.
   */
  if (resolvers.length > 0) {
    if (typeof URLPattern === 'undefined') {
      // oxlint-disable-next-line react/todo -- pre-existing violation, to be fixed in a follow-up
      urlPatternPolyfillPromise ??= import('urlpattern-polyfill')
    }
    // Once a load has started, keep unwrapping the same promise on every render: the resolved
    // import installs the `URLPattern` global, so gating `use()` on the `typeof` check alone
    // would change the hook sequence between the suspended attempt and React's replay of it
    if (urlPatternPolyfillPromise !== undefined) {
      use(urlPatternPolyfillPromise)
    }
  }

  const {state: routerState} = useRouter()
  // Fetching with a variant requires the `vX` API version for now
  const client = useClient(variant ? VARIANTS_STUDIO_CLIENT_OPTIONS : {apiVersion: API_VERSION})
  const relativeUrl =
    path || routerState._searchParams?.find(([key]) => key === 'preview')?.[1] || ''

  const [mainDocumentState, setMainDocumentState] = useState<MainDocumentState | undefined>(
    undefined,
  )
  const mainDocumentIdRef = useRef<string | undefined>(undefined)

  const handleResponse = useEffectEvent((doc: MainDocument | undefined, url: URL) => {
    if (!doc || mainDocumentIdRef.current !== doc._id) {
      setMainDocumentState({
        document: doc,
        path: url.pathname,
      })
      mainDocumentIdRef.current = doc?._id

      // We only want to force a navigation to the main document if
      // the path changed but the document ID did not. An explicit
      // document navigation should take precedence over displaying
      // the main document. We determine if an explicit document
      // navigation has occured by comparing the IDs of the last two
      // resultant navigation states.
      if (navigationHistory.at(-1)?.id === navigationHistory.at(-2)?.id) {
        navigate?.({
          state: {
            id: doc?._id,
            type: doc?._type,
          },
        })
      }
    }
  })

  useEffect(() => {
    const url = new URL(relativeUrl, targetOrigin)

    if (resolvers.length) {
      let result:
        | {
            context: DocumentResolverContext
            resolver: DocumentResolver
          }
        | undefined
      for (const resolver of resolvers) {
        const context = getRouteContext(resolver.route, url)
        if (context) {
          result = {context, resolver}
          break
        }
      }

      if (result) {
        const query = getQueryFromResult(result.resolver, result.context)
        const params = getParamsFromResult(result.resolver, result.context)
        if (query) {
          const controller = new AbortController()
          const options: ResponseQueryOptions = {
            perspective: perspective,
            variant,
            signal: controller.signal,
            tag: 'use-main-document',
          }

          client
            .fetch<MainDocument | undefined>(query, params, options)
            .then((doc) => handleResponse(doc, url))
            .catch((e) => {
              if (e instanceof Error && e.name === 'AbortError') return
              setMainDocumentState({document: undefined, path: url.pathname})
              mainDocumentIdRef.current = undefined
            })
          return () => {
            controller.abort()
          }
        }
      }
    }
    // oxlint-disable-next-line react/set-state-in-effect -- pre-existing violation, to be fixed in a follow-up
    setMainDocumentState(undefined)
    mainDocumentIdRef.current = undefined
    return undefined
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- pre-existing violation, to be fixed in a follow-up
  }, [client, perspective, relativeUrl, resolvers, targetOrigin, variant])

  return mainDocumentState
}
