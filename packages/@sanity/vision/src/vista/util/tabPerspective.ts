import {type VistaPerspective} from '../store/types'

/**
 * The perspective a tab's option stands for in the current workspace. A project's tabs and
 * settings are stored once for all of its workspaces, and `scheduledDrafts` only exists where
 * the workspace has scheduled drafts enabled: elsewhere it counts as `global`, in the options
 * and for the request alike, while the stored choice keeps its meaning for the workspaces that
 * have the feature.
 */
export function getEffectivePerspective(
  perspective: VistaPerspective,
  isScheduledDraftsEnabled: boolean,
): VistaPerspective {
  return perspective === 'scheduledDrafts' && !isScheduledDraftsEnabled ? 'global' : perspective
}
