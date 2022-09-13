import {useMemo} from 'react'
import type {Source, ConfigContext} from './types'

/**
 * Reduce a {@link Source} down to a {@link ConfigContext}, memoizing using `React.useMemo`
 *
 * @param source - Source to convert
 * @returns A config context containing only the defined properties of that interface
 * @internal
 */
export function useConfigContextFromSource(source: Source): ConfigContext {
  const {projectId, dataset, schema, currentUser, getClient} = source
  return useMemo(() => {
    const client = getClient({apiVersion: '2021-06-07'})
    const context = Object.defineProperty(
      {projectId, dataset, schema, currentUser, getClient, client},
      'client',
      {
        get() {
          console.warn(
            '`configContext.client` is deprecated and will be removed in the next version! Use `configContext.getClient({apiVersion: "2021-06-07"})` instead.'
          )
          return client
        },
      }
    )
    return context
  }, [projectId, dataset, schema, currentUser, getClient])
}

/**
 * Reduce a {@link Source} down to a {@link ConfigContext}, without memoization - use for non-react contexts
 *
 * @param source - Source to convert
 * @returns A config context containing only the defined properties of that interface
 * @internal
 */
export function getConfigContextFromSource(source: Source): ConfigContext {
  const {projectId, dataset, schema, currentUser, getClient} = source
  const client = getClient({apiVersion: '2021-06-07'})
  return {projectId, dataset, schema, currentUser, getClient, client}
}
