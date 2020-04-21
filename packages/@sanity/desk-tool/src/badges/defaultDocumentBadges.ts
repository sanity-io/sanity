/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */

import {LiveEditBadge} from './LiveEditBadge'
import {PublishedStatusBadge} from './PublishedStatusBadge'
import {DraftStatusBadge} from './DraftStatusBadge'

import schema from 'part:@sanity/base/schema'

export {PublishedStatusBadge} from './PublishedStatusBadge'
export {DraftStatusBadge} from './DraftStatusBadge'
export {LiveEditBadge} from './LiveEditBadge'

export default function defaultResolveDocumentBadges(props: any) {
  const schemaType = schema.get(props.type)
  const isLiveEditEnabled = schemaType.liveEdit === true
  return isLiveEditEnabled ? [LiveEditBadge] : [PublishedStatusBadge, DraftStatusBadge]
}
