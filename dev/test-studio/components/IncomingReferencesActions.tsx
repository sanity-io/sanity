import {TrashIcon} from '@sanity/icons'
import {useState} from 'react'
import {getDraftId} from 'sanity'
import {type IncomingReferenceAction} from 'sanity/structure'

export const RemoveReferenceAction: IncomingReferenceAction = ({linkedDocument, getClient}) => {
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
            if (linkedDocument._type === 'author') {
              await client.createOrReplace({
                ...linkedDocument,
                _id: getDraftId(linkedDocument._id),
                bestFriend: undefined,
              })
            }
            if (linkedDocument._type === 'book') {
              await client.createOrReplace({
                ...linkedDocument,
                _id: getDraftId(linkedDocument._id),
                author: undefined,
              })
            }
          },
        }
      : null,
    onHandle: () => {
      setDialogOpen(true)
    },
  }
}
