import {type ResponseQueryOptions} from '@sanity/client'
import {match, type Path} from 'path-to-regexp'
import {useEffect, useRef, useState} from 'react'
import {useClient} from 'sanity'
import {type RouterState, useRouter} from 'sanity/router'
import {useEffectEvent} from 'use-effect-event'

import {API_VERSION} from './constants'
import {
  type DocumentResolver,
  type DocumentResolverContext,
  type MainDocument,
  type MainDocumentState,
  type PresentationNavigate,
  type PreviewUrlOption,
} from './types'

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

export function getRouteContext(route: Path, url: URL): DocumentResolverContext | undefined {
  const routes = Array.isArray(route) ? route : [route]

  for (route of routes) {
    let origin: DocumentResolverContext['origin'] = undefined
    let path = route

    // Handle absolute URLs
    if (typeof route === 'string') {
      try {
        const absolute = new URL(route)
        origin = absolute.origin
        path = absolute.pathname
      } catch {
        // Ignore, as we assume a relative path
      }
    }

    // If an origin has been explicitly provided, check that it matches
    if (origin && url.origin !== origin) continue

    try {
      const matcher = match<Record<string, string>>(path, {decode: decodeURIComponent})
      const result = matcher(url.pathname)
      if (result) {
        // eslint-disable-next-line @typescript-eslint/no-shadow
        const {params, path} = result
        return {origin, params, path}
      }
    } catch (e) {
      throw new Error(`"${route}" is not a valid route pattern`)
    }
  }
  return undefined
}

export function useMainDocument(props: {
  navigate?: PresentationNavigate
  navigationHistory: RouterState[]
  path?: string
  previewUrl?: PreviewUrlOption
  resolvers?: DocumentResolver[]
}): MainDocumentState | undefined {
  const {navigate, navigationHistory, path, previewUrl, resolvers = []} = props
  const {state: routerState} = useRouter()
  const client = useClient({apiVersion: API_VERSION})
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
          id: doc?._id,
          type: doc?._type,
        })
      }
    }
  })

  useEffect(() => {
    const base =
      // eslint-disable-next-line no-nested-ternary
      typeof previewUrl === 'string'
        ? previewUrl
        : typeof previewUrl === 'object'
          ? previewUrl?.origin || location.origin
          : location.origin
    const url = new URL(relativeUrl, base)

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
            perspective: 'drafts',
            signal: controller.signal,
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
    setMainDocumentState(undefined)
    mainDocumentIdRef.current = undefined
    return undefined
  }, [client, previewUrl, relativeUrl, resolvers])

  return mainDocumentState
}
