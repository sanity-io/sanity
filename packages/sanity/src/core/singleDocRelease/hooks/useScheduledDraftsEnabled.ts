import {FEATURES, useFeatureEnabled} from '../../hooks/useFeatureEnabled'
import {useWorkspace} from '../../studio/workspace'
import {useScheduledDraftsConfigEnabled} from './useScheduledDraftsConfigEnabled'

/**
 * Hook that determines if scheduled drafts functionality is fully enabled.
 * Returns true only when ALL of the following conditions are met:
 * 1. Scheduled drafts is enabled at the workspace level
 * 2. Single doc release feature flag is enabled for the project
 * 3. Draft model is enabled in the workspace
 *
 * @returns boolean - true if all three conditions are met, false otherwise
 * @internal
 */
export function useScheduledDraftsEnabled(): boolean {
  const isScheduledDraftsConfigEnabled = useScheduledDraftsConfigEnabled()
  const {enabled: isSingleDocReleaseEnabled} = useFeatureEnabled(FEATURES.singleDocRelease)
  const {
    document: {
      drafts: {enabled: isDraftModelEnabled},
    },
  } = useWorkspace()

  return isScheduledDraftsConfigEnabled && isSingleDocReleaseEnabled && isDraftModelEnabled
}
