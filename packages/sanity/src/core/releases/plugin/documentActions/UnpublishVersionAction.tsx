import {RevertIcon, TrashIcon, UnpublishIcon} from '@sanity/icons'
import {useToast} from '@sanity/ui'
import {useCallback, useState} from 'react'

import {InsufficientPermissionsMessage} from '../../../components/InsufficientPermissionsMessage'
import {
  type DocumentActionComponent,
  type DocumentActionDescription,
  type DocumentActionProps,
} from '../../../config/document/actions'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {useDocumentPairPermissions} from '../../../store/_legacy/grants/documentPairPermissions'
import {useCurrentUser} from '../../../store/user/hooks'
import {UnpublishVersionDialog} from '../../components/dialog/UnpublishVersionDialog'
import {useVersionOperations} from '../../hooks/useVersionOperations'
import {releasesLocaleNamespace} from '../../i18n'
import {isGoingToUnpublish} from '../../util/isGoingToUnpublish'

/**
 * @internal
 */
export const UnpublishVersionAction: DocumentActionComponent = (
  props: DocumentActionProps,
): DocumentActionDescription | null => {
  const {id, type, release, published, version} = props
  const currentUser = useCurrentUser()
  const isPublished = published !== null
  const {t} = useTranslation(releasesLocaleNamespace)
  const isAlreadyUnpublished = version ? isGoingToUnpublish(version) : false
  const {revertUnpublishVersion} = useVersionOperations()
  const toast = useToast()
  const {t: coreT} = useTranslation()

  const [permissions, isPermissionsLoading] = useDocumentPairPermissions({
    id,
    type,
    version: release,
    permission: 'unpublish',
  })

  const [dialogOpen, setDialogOpen] = useState(false)

  const handleOnClick = useCallback(async () => {
    // if the document is already unpublished, revert the unpublish
    if (isAlreadyUnpublished && version) {
      try {
        await revertUnpublishVersion(version._id)
      } catch (err) {
        toast.push({
          closable: true,
          status: 'error',
          title: coreT('release.action.revert-unpublish-version.failure.title'),
          description: coreT('release.action.revert-unpublish-version.failure.description'),
        })
      }
    } else {
      setDialogOpen(true)
    }
  }, [isAlreadyUnpublished, version, revertUnpublishVersion, toast, coreT])

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
    dialog: dialogOpen &&
      !isAlreadyUnpublished && {
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
    label: isAlreadyUnpublished
      ? t('action.revert-unpublish-actions')
      : t('action.unpublish-doc-actions'),
    icon: isAlreadyUnpublished ? RevertIcon : UnpublishIcon,
    onHandle: handleOnClick,
    disabled: !isPublished,
    /** @todo should be switched once we have the document actions updated */
    title: isAlreadyUnpublished
      ? t('action.revert-unpublish-actions')
      : t('action.unpublish-doc-actions'),
  }
}

UnpublishVersionAction.action = 'unpublishVersion'
UnpublishVersionAction.displayName = 'UnpublishVersionAction'
