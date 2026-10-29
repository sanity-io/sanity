import {type BadgeTone} from '@sanity/ui'
import {useMemo} from 'react'

import {useTranslation} from '../../i18n/hooks/useTranslation'
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
 * - While the SSE connection is loading, only the currently active agent
 *   bundle (if any) is kept; all others are hidden until ownership is confirmed.
 *
 * Call this hook once and thread the results down — don't call it per-item.
 *
 * @internal
 */
export function useAgentVersionDisplay(
  versionIds: string[],
  activeBundleId?: string,
): {
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

  const filteredVersionIds = useMemo(() => {
    // Find the most recent agent bundle the current user owns (or the active one while loading)
    const primaryAgentId = versionIds.find((id) => {
      const name = getVersionFromId(id)
      if (!name || !isAgentBundleName(name)) return false
      if (loading) return name === activeBundleId
      return myBundleIds.has(name)
    })

    return versionIds.filter((id) => {
      const name = getVersionFromId(id)
      if (!name || !isAgentBundleName(name)) return true
      return id === primaryAgentId
    })
  }, [versionIds, myBundleIds, loading, activeBundleId])

  const getVersionDisplay = useMemo(() => {
    const ownDisplay: AgentVersionDisplay = {
      displayName: t('version.agent-bundle.proposed-changes'),
      tone: AGENT_TONE,
    }
    const otherDisplay: AgentVersionDisplay = {
      displayName: t('version.agent-bundle.agent-changes'),
      tone: AGENT_TONE,
    }

    return (versionDocumentId: string): AgentVersionDisplay | null => {
      const name = getVersionFromId(versionDocumentId)
      if (!name || !isAgentBundleName(name)) return null
      if (!loading && myBundleIds.has(name)) return ownDisplay
      return otherDisplay
    }
  }, [t, myBundleIds, loading])

  return {filteredVersionIds, getVersionDisplay}
}
