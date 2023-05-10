import {useMemo} from 'react'
import type {Source, ConfigContext, I18nSource} from './types'

/**
 * Reduce a {@link Source} down to a {@link ConfigContext}, memoizing using `React.useMemo`
 *
 * @param source - Source to convert
 * @returns A config context containing only the defined properties of that interface
 * @internal
 */
export function useConfigContextFromSource(source: Source): ConfigContext & {i18n: I18nSource} {
  const {projectId, dataset, schema, currentUser, getClient, i18n} = source
  return useMemo(() => {
    return {projectId, dataset, schema, currentUser, getClient, i18n}
  }, [projectId, dataset, schema, currentUser, getClient, i18n])
}

/**
 * Reduce a {@link Source} down to a {@link ConfigContext}, without memoization - use for non-react contexts
 *
 * @param source - Source to convert
 * @returns A config context containing only the defined properties of that interface
 * @internal
 */
export function getConfigContextFromSource(source: Source): ConfigContext & {i18n: I18nSource} {
  const {projectId, dataset, schema, currentUser, getClient, i18n} = source
  return {projectId, dataset, schema, currentUser, getClient, i18n}
}
