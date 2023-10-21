import {useMemo} from 'react'
import type {Source, ConfigContext, WorkspaceSummary} from './types'

/**
 * Reduce a {@link Source} down to a {@link ConfigContext}, memoizing using `React.useMemo`
 *
 * @param source - Source to convert
 * @param workspace - Workspace to grab i18n source from
 * @returns A config context containing only the defined properties of that interface
 * @internal
 */
export function useConfigContextFromSource(
  source: Source,
  workspace: {i18n: WorkspaceSummary['i18n']},
): ConfigContext {
  const {i18n} = workspace
  const {projectId, dataset, schema, currentUser, getClient} = source
  return useMemo(() => {
    return {projectId, dataset, schema, currentUser, getClient, i18n}
  }, [projectId, dataset, schema, currentUser, getClient, i18n])
}

/**
 * Reduce a {@link Source} down to a {@link ConfigContext}, without memoization - use for non-react contexts
 *
 * @param source - Source to convert
 * @param workspace - Workspace to grab i18n source from
 * @returns A config context containing only the defined properties of that interface
 * @internal
 */
export function getConfigContextFromSource(
  source: Source,
  workspace: {i18n: WorkspaceSummary['i18n']},
): ConfigContext {
  const {i18n} = workspace
  const {projectId, dataset, schema, currentUser, getClient} = source
  return {projectId, dataset, schema, currentUser, getClient, i18n}
}
