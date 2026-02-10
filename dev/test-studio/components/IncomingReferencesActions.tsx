import {TrashIcon} from '@sanity/icons'
import {useState} from 'react'
import {getDraftId} from 'sanity'
import {type IncomingReferenceAction} from 'sanity/structure'

export const RemoveReferenceAction: IncomingReferenceAction = ({document, getClient}) => {
  const [dialogOpen, setDialogOpen] = useState(false)
  const client = getClient({apiVersion: '2025-10-01'})

  return {
    label: 'Remove reference',
    icon: TrashIcon,
    tone: 'critical',
    dialog: dialogOpen
      ? {
          type: 'confirm',
          message: 'Are you sure you want to remove the reference?',
          onCancel: () => {
            setDialogOpen(false)
          },
          onConfirm: async () => {
            const draftId = getDraftId(document._id)

            if (document._type === 'author') {
              await client
                .transaction()
                .createIfNotExists({...document, _id: draftId})
                .patch(draftId, (patch) => patch.unset(['bestFriend']))
                .commit()
            }
            if (document._type === 'book') {
              await client
                .transaction()
                .createIfNotExists({...document, _id: draftId})
                .patch(draftId, (patch) => patch.unset(['author']))
                .commit()
            }
          },
        }
      : null,
    onHandle: () => {
      setDialogOpen(true)
    },
  }
}
