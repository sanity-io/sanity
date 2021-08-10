import {DocumentBadgeComponent} from '@sanity/base'
import {LiveEditBadge} from './LiveEditBadge'

// @todo: remove these 2 exports (should not be used)
export {PublishedStatusBadge} from './PublishedStatusBadge'
export {DraftStatusBadge} from './DraftStatusBadge'

export {LiveEditBadge} from './LiveEditBadge'

const DEFAULT_BADGES = [LiveEditBadge]

export default function defaultResolveDocumentBadges(): DocumentBadgeComponent[] {
  return DEFAULT_BADGES
}
