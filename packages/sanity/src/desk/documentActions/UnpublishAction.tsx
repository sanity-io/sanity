import {UnpublishIcon} from '@sanity/icons'
import React, {useCallback, useMemo, useState} from 'react'
import {ConfirmDeleteDialog} from '../components'
import {deskLocaleNamespace} from '../i18n'
import {
  DocumentActionComponent,
  InsufficientPermissionsMessage,
  useDocumentPairPermissions,
  useCurrentUser,
  useDocumentOperation,
  DocumentActionModalDialogProps,
  useTranslation,
} from 'sanity'

const DISABLED_REASON_KEY = {
  NOT_PUBLISHED: 'action.unpublish.disabled.not-published',
  NOT_READY: 'action.unpublish.disabled.not-ready',
  LIVE_EDIT_ENABLED: 'action.unpublish.disabled.live-edit-enabled',
}

/** @internal */
export const UnpublishAction: DocumentActionComponent = ({
  id,
  type,
  draft,
  onComplete,
  liveEdit,
}) => {
  const {unpublish} = useDocumentOperation(id, type)
  const [isConfirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [permissions, isPermissionsLoading] = useDocumentPairPermissions({
    id,
    type,
    permission: 'unpublish',
  })
  const currentUser = useCurrentUser()
  const {t} = useTranslation(deskLocaleNamespace)

  const handleCancel = useCallback(() => {
    setConfirmDialogOpen(false)
    onComplete()
  }, [onComplete])

  const handleConfirm = useCallback(() => {
    setConfirmDialogOpen(false)
    unpublish.execute()
    onComplete()
  }, [onComplete, unpublish])

  const dialog: DocumentActionModalDialogProps | null = useMemo(() => {
    if (isConfirmDialogOpen) {
      return {
        type: 'dialog',
        onClose: onComplete,
        content: (
          <ConfirmDeleteDialog
            id={draft?._id || id}
            type={type}
            // eslint-disable-next-line no-attribute-string-literals/no-attribute-string-literals
            action="unpublish"
            onCancel={handleCancel}
            onConfirm={handleConfirm}
          />
        ),
      }
    }

    return null
  }, [draft, id, handleCancel, handleConfirm, isConfirmDialogOpen, onComplete, type])

  if (liveEdit) {
    return null
  }

  if (!isPermissionsLoading && !permissions?.granted) {
    return {
      tone: 'critical',
      icon: UnpublishIcon,
      label: 'Unpublish',
      title: (
        <InsufficientPermissionsMessage
          i18nKey="insufficient-permissions-message.action.unpublish-document"
          currentUser={currentUser}
        />
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
}

UnpublishAction.action = 'unpublish'
