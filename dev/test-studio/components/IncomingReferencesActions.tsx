import {TrashIcon} from '@sanity/icons'
import {type IncomingReferenceAction} from '@sanity/types'
import {getDraftId} from 'sanity'

export const RemoveReferenceAction: IncomingReferenceAction = ({document, getClient}) => {
  const client = getClient({apiVersion: '2025-10-01'})
  const handleRemoveReference = async () => {
    if (document._type === 'author') {
      await client.createOrReplace({
        ...document,
        _id: getDraftId(document._id),
        bestFriend: undefined,
      })
    }
    if (document._type === 'book') {
      await client.createOrReplace({
        ...document,
        _id: getDraftId(document._id),
        author: undefined,
      })
    }
  }

  return {
    label: 'Remove reference',
    icon: TrashIcon,
    tone: 'critical',
    onHandle: handleRemoveReference,
  }
}
