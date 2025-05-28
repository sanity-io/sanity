import {TrashIcon, UnpublishIcon} from '@sanity/icons'
import {useCallback, useState} from 'react'
import {useTranslation} from 'react-i18next'

import {InsufficientPermissionsMessage} from '../../../components/InsufficientPermissionsMessage'
import {
  type DocumentActionDescription,
  type DocumentActionProps,
} from '../../../config/document/actions'
import {useDocumentPairPermissions} from '../../../store/_legacy/grants/documentPairPermissions'
import {useCurrentUser} from '../../../store/user/hooks'
import {UnpublishVersionDialog} from '../../components/dialog/UnpublishVersionDialog'
import {releasesLocaleNamespace} from '../../i18n'
import {isGoingToUnpublish} from '../../util/isGoingToUnpublish'

/**
 * @internal
 */
export const UnpublishVersionAction = (
  props: DocumentActionProps,
): DocumentActionDescription | null => {
  const {id, type, release, published, version} = props
  const currentUser = useCurrentUser()
  const isPublished = published !== null
  const {t} = useTranslation(releasesLocaleNamespace)
  const isAlreadyUnpublished = version ? isGoingToUnpublish(version) : false

  const [permissions, isPermissionsLoading] = useDocumentPairPermissions({
    id,
    type,
    version: release,
    permission: 'unpublish',
  })

  const [dialogOpen, setDialogOpen] = useState(false)

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
      title: (
        <InsufficientPermissionsMessage context="unpublish-document" currentUser={currentUser} />
      ),
    }
  }

  return {
    dialog: dialogOpen && {
      type: 'custom',
      component: (
        <UnpublishVersionDialog
          documentVersionId={version._id}
          documentType={type}
          onClose={() => setDialogOpen(false)}
        />
      ),
    },
    /** @todo should be switched once we have the document actions updated */
    label: t('action.unpublish-doc-actions'),
    icon: UnpublishIcon,
    onHandle: handleDialogOpen,
    disabled: !isPublished || isAlreadyUnpublished,
    /** @todo should be switched once we have the document actions updated */
    title: t('action.unpublish-doc-actions'),
  }
}
