import {SparkleIcon} from '@sanity/icons'
import {type BadgeTone} from '@sanity/ui'
import {type ComponentType, useMemo} from 'react'

import {useTranslation} from '../../i18n'
import {getVersionFromId} from '../../util/draftUtils'
import {isAgentBundleName, useAgentBundles} from './useAgentBundles'

/**
 * Display overrides for an agent bundle version chip.
 *
 * @internal
 */
export type AgentVersionDisplay = {
  displayName: string
  tone: BadgeTone
  icon: ComponentType
}

const AGENT_DISPLAY: Omit<AgentVersionDisplay, 'displayName'> = {
  tone: 'suggest',
  icon: SparkleIcon,
}

/**
 * Filters a list of version document IDs and provides display metadata for
 * agent bundles.
 *
 * - Other users' `agent-*` versions are removed from the returned list.
 * - The current user's `agent-*` versions are kept and can be resolved to
 *   display overrides via `getVersionDisplay`.
 * - Non-agent versions pass through unchanged.
 * - While the SSE connection is still loading, all `agent-*` versions are
 *   kept (optimistic — most users only see their own).
 *
 * Call this hook once and thread the results down — don't call it per-item.
 *
 * @internal
 */
export function useAgentVersionDisplay(versionIds: string[]): {
  /** Version IDs with other users' agent bundles removed. */
  filteredVersionIds: string[]
  /**
   * Returns display overrides for a version document ID if it's the current
   * user's agent bundle, or `null` for all other versions.
   */
  getVersionDisplay: (versionDocumentId: string) => AgentVersionDisplay | null
} {
  const {bundles, loading} = useAgentBundles()
  const {t} = useTranslation()

  // Set for O(1) lookup per `js-set-map-lookups`
  const myBundleIds = useMemo(() => new Set(bundles.map((b) => b.id)), [bundles])

  const filteredVersionIds = useMemo(
    () =>
      versionIds.filter((id) => {
        const name = getVersionFromId(id)
        if (!name || !isAgentBundleName(name)) return true
        // While loading, keep all agent versions (optimistic)
        if (loading) return true
        return myBundleIds.has(name)
      }),
    [versionIds, myBundleIds, loading],
  )

  const getVersionDisplay = useMemo(() => {
    const label = t('version.agent-bundle.proposed-changes')
    const display: AgentVersionDisplay = {...AGENT_DISPLAY, displayName: label}

    return (versionDocumentId: string): AgentVersionDisplay | null => {
      const name = getVersionFromId(versionDocumentId)
      if (!name || !isAgentBundleName(name)) return null
      return display
    }
  }, [t])

  return {filteredVersionIds, getVersionDisplay}
}
