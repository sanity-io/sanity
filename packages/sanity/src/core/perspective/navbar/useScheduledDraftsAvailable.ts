import {FEATURES, useFeatureEnabled} from '../../hooks/useFeatureEnabled'
import {useScheduledDraftsEnabled} from '../../singleDocRelease/hooks/useScheduledDraftsEnabled'
import {useWorkspace} from '../../studio/workspace'

/**
 * Whether {@link ScheduledDraftsMenuItem} will render anything.
 *
 * Shared rather than asked twice, because two places need the same answer and disagreeing is
 * visible: the item decides whether to render itself, and `ReleasesList`'s sticky bottom card
 * decides whether to exist at all. That card draws a top border, so when every item inside it is
 * hidden the border becomes a divider with nothing under it — which is what a studio with releases
 * turned off used to show.
 *
 * @internal
 */
export function useScheduledDraftsAvailable(): boolean {
  const isScheduledDraftsEnabled = useScheduledDraftsEnabled()
  const {enabled: isSingleDocReleaseEnabled} = useFeatureEnabled(FEATURES.singleDocRelease)
  const {
    document: {
      drafts: {enabled: isDraftModelEnabled},
    },
  } = useWorkspace()

  return isScheduledDraftsEnabled && isSingleDocReleaseEnabled && isDraftModelEnabled
}
