import {LiveEditBadge} from './badges/LiveEditBadge'
import {PublishedStatusBadge} from './badges/PublishedStatusBadge'
import {DraftStatusBadge} from './badges/DraftStatusBadge'

import schema from 'part:@sanity/base/schema'

export {PublishedStatusBadge} from './badges/PublishedStatusBadge'
export {DraftStatusBadge} from './badges/DraftStatusBadge'
export {LiveEditBadge} from './badges/LiveEditBadge'

export default function defaultResolveDocumentBadges(props) {
  const schemaType = schema.get(props.type)
  const isLiveEditEnabled = schemaType.liveEdit === true
  return isLiveEditEnabled ? [LiveEditBadge] : [PublishedStatusBadge, DraftStatusBadge]
}
