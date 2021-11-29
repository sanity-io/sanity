import type {DocumentBadgeComponent} from '@sanity/base'
import {LiveEditBadge} from '../badges/LiveEditBadge'

// @todo: remove these 2 exports (should not be used)
export {PublishedStatusBadge} from '../badges/PublishedStatusBadge'
export {DraftStatusBadge} from '../badges/DraftStatusBadge'

export {LiveEditBadge} from '../badges/LiveEditBadge'

const DEFAULT_BADGES = [LiveEditBadge]

export default function defaultResolveDocumentBadges(): DocumentBadgeComponent[] {
  return DEFAULT_BADGES
}
