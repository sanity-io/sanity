import {UnpublishIcon} from '@sanity/icons'
import {useCallback, useMemo, useState} from 'react'
import {
  type DocumentActionComponent,
  type DocumentActionModalDialogProps,
  InsufficientPermissionsMessage,
  useCurrentUser,
  useDocumentOperation,
  useDocumentPairPermissions,
  usePerspective,
  useTranslation,
} from 'sanity'

import {ConfirmDeleteDialog} from '../components'
import {structureLocaleNamespace} from '../i18n'

const DISABLED_REASON_KEY = {
  NOT_PUBLISHED: 'action.unpublish.disabled.not-published',
  NOT_READY: 'action.unpublish.disabled.not-ready',
  LIVE_EDIT_ENABLED: 'action.unpublish.disabled.live-edit-enabled',
}

// React Compiler needs functions that are hooks to have the `use` prefix, pascal case are treated as a component, these are hooks even though they're confusingly named `DocumentActionComponent`
/** @internal */
export const useUnpublishAction: DocumentActionComponent = ({
  id,
  type,
  draft,
  liveEdit,
  release,
}) => {
  const {unpublish} = useDocumentOperation(id, type)
  const [isConfirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [permissions, isPermissionsLoading] = useDocumentPairPermissions({
    id,
    type,
    permission: 'unpublish',
  })
  const currentUser = useCurrentUser()
  const {t} = useTranslation(structureLocaleNamespace)
  const {selectedPerspective} = usePerspective()

  const isDraft = selectedPerspective === 'drafts'

  const handleCancel = useCallback(() => {
    setConfirmDialogOpen(false)
  }, [])

  const handleConfirm = useCallback(() => {
    setConfirmDialogOpen(false)
    unpublish.execute()
  }, [unpublish])

  const dialog: DocumentActionModalDialogProps | null = useMemo(() => {
    if (isConfirmDialogOpen) {
      return {
        type: 'dialog',
        onClose: handleCancel,
        content: (
          <ConfirmDeleteDialog
            id={draft?._id || id}
            type={type}
            action="unpublish"
            onCancel={handleCancel}
            onConfirm={handleConfirm}
          />
        ),
      }
    }

    return null
  }, [draft, id, handleCancel, handleConfirm, isConfirmDialogOpen, type])

  return useMemo(() => {
    if (release || isDraft) {
      // Version documents cannot be unpublished by this action, they should be unpublished as part of a release
      // Draft documents can't either
      return null
    }
    if (liveEdit) {
      return null
    }

    if (!isPermissionsLoading && !permissions?.granted) {
      return {
        tone: 'critical',
        icon: UnpublishIcon,
        label: 'Unpublish',
        title: (
          <InsufficientPermissionsMessage context="unpublish-document" currentUser={currentUser} />
        ),
        disabled: true,
      }
    }

    return {
      tone: 'critical',
      icon: UnpublishIcon,
      disabled: Boolean(unpublish.disabled) || isPermissionsLoading,
      label: t('action.unpublish.label'),
      title: unpublish.disabled ? t(DISABLED_REASON_KEY[unpublish.disabled]) : '',
      onHandle: () => setConfirmDialogOpen(true),
      dialog,
    }
  }, [
    release,
    isDraft,
    liveEdit,
    isPermissionsLoading,
    permissions?.granted,
    unpublish.disabled,
    t,
    dialog,
    currentUser,
  ])
}

useUnpublishAction.action = 'unpublish'
useUnpublishAction.displayName = 'UnpublishAction'
