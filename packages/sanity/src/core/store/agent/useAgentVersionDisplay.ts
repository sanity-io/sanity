import {type BadgeTone} from '@sanity/ui'
import {useMemo} from 'react'

import {useTranslation} from '../../i18n'
import {getVersionFromId} from '../../util/draftUtils'
import {isAgentBundleName} from './createAgentBundlesStore'
import {useAgentBundles} from './useAgentBundles'

/**
 * Display overrides for an agent bundle version chip.
 *
 * @internal
 */
export type AgentVersionDisplay = {
  displayName: string
  tone: BadgeTone
}

const AGENT_TONE: BadgeTone = 'suggest'

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

  // Set for O(1) lookup
  const myBundleIds = useMemo(() => new Set(bundles.map((b) => b.id)), [bundles])

  const filteredVersionIds = useMemo(
    () =>
      versionIds.filter((id) => {
        const name = getVersionFromId(id)
        if (!name || !isAgentBundleName(name)) return true
        // Hide all agent versions until the endpoint confirms ownership
        if (loading) return false
        return myBundleIds.has(name)
      }),
    [versionIds, myBundleIds, loading],
  )

  const getVersionDisplay = useMemo(() => {
    const label = t('version.agent-bundle.proposed-changes')
    const display: AgentVersionDisplay = {displayName: label, tone: AGENT_TONE}

    return (versionDocumentId: string): AgentVersionDisplay | null => {
      const name = getVersionFromId(versionDocumentId)
      if (!name || !isAgentBundleName(name)) return null
      // Only show display overrides for the current user's bundles
      if (!loading && !myBundleIds.has(name)) return null
      return display
    }
  }, [t, myBundleIds, loading])

  return {filteredVersionIds, getVersionDisplay}
}
