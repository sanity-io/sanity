import {type DocumentBadgeComponent} from '../../../../config/document/badges'
import {ScheduledBadge} from './ScheduledBadge'

export default function resolveDocumentBadges(
  existingBadges: DocumentBadgeComponent[],
): DocumentBadgeComponent[] {
  return [...existingBadges, ScheduledBadge]
}
