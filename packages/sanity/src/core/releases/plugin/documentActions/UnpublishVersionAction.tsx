import {TrashIcon, UnpublishIcon} from '@sanity/icons'
import {useCallback, useState} from 'react'
import {
  type DocumentActionDescription,
  type DocumentActionProps,
  InsufficientPermissionsMessage,
  useCurrentUser,
  useDocumentPairPermissions,
} from 'sanity'

/**
 * @internal
 */
export const UnpublishVersionAction = (
  props: DocumentActionProps,
): DocumentActionDescription | null => {
  const {id, type, bundleId, version, published} = props
  const currentUser = useCurrentUser()
  const isPublished = published !== null

  const [permissions, isPermissionsLoading] = useDocumentPairPermissions({
    id,
    type,
    version: bundleId,
    permission: 'unpublish',
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
      title: (
        <InsufficientPermissionsMessage context="unpublish-document" currentUser={currentUser} />
      ),
    }
  }

  return {
    /*dialog: dialogOpen &&
      version && {
        type: 'custom',
        component: () => 'add unpublish dialog here',
      },*/
    /** @todo translate */
    label: 'Unpublish',
    icon: UnpublishIcon,
    onHandle: handleDialogOpen,
    disabled: !isPublished,
    /** @todo translate */
    title: 'Unpublish',
  }
}
