import {TrashIcon} from '@sanity/icons'
import {useCallback, useState} from 'react'
import {useTranslation} from 'react-i18next'

import {InsufficientPermissionsMessage} from '../../../components/InsufficientPermissionsMessage'
import {
  type DocumentActionDescription,
  type DocumentActionProps,
} from '../../../config/document/actions'
import {useDocumentPairPermissions} from '../../../store/_legacy/grants/documentPairPermissions'
import {useCurrentUser} from '../../../store/user/hooks'
import {DiscardVersionDialog} from '../../components/dialog/DiscardVersionDialog'

/**
 * @internal
 */
export const DiscardVersionAction = (
  props: DocumentActionProps,
): DocumentActionDescription | null => {
  const {id, type, release, version} = props
  const currentUser = useCurrentUser()
  const {t} = useTranslation()

  const [permissions, isPermissionsLoading] = useDocumentPairPermissions({
    id,
    type,
    version: release,
    permission: 'discardVersion',
  })

  const [dialogOpen, setDialogOpen] = useState(false)

  // Callbacks
  const handleDialogOpen = useCallback(() => {
    setDialogOpen(true)
  }, [])

  if (!version) return null
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
    disabled: isPermissionsLoading || !permissions?.granted,
    dialog: dialogOpen && {
      type: 'custom',
      component: (
        <DiscardVersionDialog
          documentId={version._id}
          documentType={type}
          onClose={() => setDialogOpen(false)}
        />
      ),
    },
    label: t('release.action.discard-version'),
    icon: TrashIcon,
    onHandle: handleDialogOpen,
    title: t('release.action.discard-version'),
  }
}
