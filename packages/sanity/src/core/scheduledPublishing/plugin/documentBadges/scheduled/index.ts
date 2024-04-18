import {type DocumentBadgeComponent} from '../../../../config'
import {ScheduledBadge} from './ScheduledBadge'

export default function resolveDocumentBadges(
  existingBadges: DocumentBadgeComponent[],
): DocumentBadgeComponent[] {
  return [...existingBadges, ScheduledBadge]
}
