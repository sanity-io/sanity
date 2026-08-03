import {type DocumentBadgeComponent} from '../../../../config/document/badges'
import {ScheduledBadge} from './ScheduledBadge'

export default function resolveDocumentBadges(
  existingBadges: DocumentBadgeComponent[],
): DocumentBadgeComponent[] {
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  return [...existingBadges, ScheduledBadge]
}
