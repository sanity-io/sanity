import schema from 'part:@sanity/base/schema'
import {LiveEditBadge} from './LiveEditBadge'

// @todo: remove these 2 exports (should not be used)
export {PublishedStatusBadge} from './PublishedStatusBadge'
export {DraftStatusBadge} from './DraftStatusBadge'

export {LiveEditBadge} from './LiveEditBadge'

export default function defaultResolveDocumentBadges(props) {
  const schemaType = schema.get(props.type)

  // Show a `Live` badge
  if (schemaType?.liveEdit === true) {
    return [LiveEditBadge]
  }

  return []
}
