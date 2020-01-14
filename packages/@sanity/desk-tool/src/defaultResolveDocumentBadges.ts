import {DraftStatusBadge, LiveEditBadge, PublishedStatusBadge} from './defaultDocumentBadges'
import schema from 'part:@sanity/base/schema'

export default function defaultResolveDocumentBadges(props) {
  const schemaType = schema.get(props.type)
  const isLiveEditEnabled = schemaType.liveEdit === true
  return isLiveEditEnabled ? [LiveEditBadge] : [PublishedStatusBadge, DraftStatusBadge]
}
