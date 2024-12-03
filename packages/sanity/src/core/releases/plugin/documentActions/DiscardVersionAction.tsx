import {TrashIcon} from '@sanity/icons'
import {useCallback, useState} from 'react'
import {
  DiscardVersionDialog,
  type DocumentActionDescription,
  type DocumentActionProps,
  InsufficientPermissionsMessage,
  useCurrentUser,
  useDocumentPairPermissions,
} from 'sanity'

/**
 * @internal
 */
export const DiscardVersionAction = (
  props: DocumentActionProps,
): DocumentActionDescription | null => {
  const {id, type, release, version} = props
  const currentUser = useCurrentUser()

  const [permissions, isPermissionsLoading] = useDocumentPairPermissions({
    id,
    type,
    version: release,
    permission: 'publish',
  })

  const [dialogOpen, setDialogOpen] = useState(false)

  // Callbacks
  const handleDialogOpen = useCallback(() => {
    setDialogOpen(true)
  }, [])

  const insufficientPermissions = !isPermissionsLoading && !permissions?.granted

  if (insufficientPermissions) {
    return {
      disabled: true,
      icon: TrashIcon,
      label: 'no permissions',
      title: <InsufficientPermissionsMessage currentUser={currentUser} context="discard-changes" />,
    }
  }

  return {
    dialog: dialogOpen &&
      version && {
        type: 'custom',
        component: (
          <DiscardVersionDialog
            documentId={version._id}
            documentType={type}
            onClose={() => setDialogOpen(false)}
          />
        ),
      },
    /** @todo translate */
    label: 'Discard version',
    icon: TrashIcon,
    onHandle: handleDialogOpen,
    /** @todo translate */
    title: 'Discard version',
  }
}
