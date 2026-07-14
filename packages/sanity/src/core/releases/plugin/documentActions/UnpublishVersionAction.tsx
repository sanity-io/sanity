import {RevertIcon} from '@sanity/icons/Revert'
import {TrashIcon} from '@sanity/icons/Trash'
import {UnpublishIcon} from '@sanity/icons/Unpublish'
import {useToast} from '@sanity/ui'
import {useCallback, useState} from 'react'

import {InsufficientPermissionsMessage} from '../../../components/InsufficientPermissionsMessage'
import {
  type DocumentActionComponent,
  type DocumentActionDescription,
  type DocumentActionProps,
} from '../../../config/document/actions'
import {getTargetScopeId, useTargetDocumentState} from '../../../hooks/useTargetDocumentState'
import {useTranslation} from '../../../i18n'
import {useDocumentPairPermissions} from '../../../store/grants/documentPairPermissions'
import {useCurrentUser} from '../../../store/user/hooks'
import {UnpublishVersionDialog} from '../../components/dialog/UnpublishVersionDialog'
import {useVersionOperations} from '../../hooks/useVersionOperations'
import {releasesLocaleNamespace} from '../../i18n'
import {isGoingToUnpublish} from '../../util/isGoingToUnpublish'

// React Compiler needs functions that are hooks to have the `use` prefix, pascal case are treated as a component, these are hooks even though they're confusingly named `DocumentActionComponent`
/** @internal */
export const useUnpublishVersionAction: DocumentActionComponent = (
  props: DocumentActionProps,
): DocumentActionDescription | null => {
  const {id, type, release, published, version} = props
  const currentUser = useCurrentUser()
  const {t} = useTranslation(releasesLocaleNamespace)
  const isAlreadyUnpublished = version ? isGoingToUnpublish(version) : false
  const {revertUnpublishVersion} = useVersionOperations()
  const toast = useToast()
  const {t: coreT} = useTranslation()

  const targetDocumentState = useTargetDocumentState(id)
  // The scope of the document targeted by the selected perspective (undefined when the target is
  // still resolving or the draft/published pair applies). While resolving, the action is disabled
  // below instead of silently operating on the base pair.
  const isTargetReady = targetDocumentState.status === 'ready'
  const scopeId = getTargetScopeId(targetDocumentState)
  const isVariantTarget = isTargetReady && targetDocumentState.variant !== undefined
  // For variant release versions, "is there something published to unpublish" is answered by the
  // variant-of-published sibling — the base `published` document says nothing about the variant.
  const isPublished = isVariantTarget
    ? targetDocumentState.publishedSibling !== undefined
    : published !== null

  const [permissions, isPermissionsLoading] = useDocumentPairPermissions({
    id,
    type,
    version: scopeId,
    permission: 'unpublish',
  })

  const [dialogOpen, setDialogOpen] = useState(false)

  const handleOnClick = useCallback(async () => {
    // if the document is already unpublished, revert the unpublish
    if (isAlreadyUnpublished && version) {
      try {
        await revertUnpublishVersion(version._id)
      } catch {
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

  if (!release || !version) return null

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
    disabled: !isPublished || !isTargetReady,
    /** @todo should be switched once we have the document actions updated */
    title: isAlreadyUnpublished
      ? t('action.revert-unpublish-actions')
      : t('action.unpublish-doc-actions'),
  }
}

useUnpublishVersionAction.action = 'unpublishVersion'
useUnpublishVersionAction.displayName = 'UnpublishVersionAction'
