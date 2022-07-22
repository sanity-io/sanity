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
  const {projectId, dataset, schema, currentUser, client} = source
  return useMemo(() => {
    return {projectId, dataset, schema, currentUser, client}
  }, [projectId, dataset, schema, currentUser, client])
}

/**
 * Reduce a {@link Source} down to a {@link ConfigContext}, without memoization - use for non-react contexts
 *
 * @param source - Source to convert
 * @returns A config context containing only the defined properties of that interface
 * @internal
 */
export function getConfigContextFromSource(source: Source): ConfigContext {
  const {projectId, dataset, schema, currentUser, client} = source
  return {projectId, dataset, schema, currentUser, client}
}
