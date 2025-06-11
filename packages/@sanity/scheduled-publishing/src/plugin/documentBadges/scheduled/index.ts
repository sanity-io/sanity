import {type DocumentBadgeComponent} from 'sanity'

import {ScheduledBadge} from './ScheduledBadge'

export default function resolveDocumentBadges(
  existingBadges: DocumentBadgeComponent[],
): DocumentBadgeComponent[] {
  return [...existingBadges, ScheduledBadge]
}
