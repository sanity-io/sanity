import {DocumentActionComponent, DocumentActionDialogProps} from '@sanity/base'
import {useDocumentOperation} from '@sanity/react-hooks'
import {UnpublishIcon} from '@sanity/icons'
import React, {useCallback, useMemo, useState} from 'react'
import {
  unstable_useCheckDocumentPermission as useCheckDocumentPermission,
  useCurrentUser,
} from '@sanity/base/hooks'
import {InsufficientPermissionsMessage} from '@sanity/base/components'
import {ConfirmUnpublish} from '../components/ConfirmUnpublish'

const DISABLED_REASON_TITLE = {
  NOT_PUBLISHED: 'This document is not published',
}

export const UnpublishAction: DocumentActionComponent = ({
  id,
  type,
  draft,
  published,
  onComplete,
  liveEdit,
}) => {
  const {unpublish}: any = useDocumentOperation(id, type)
  const [error, setError] = useState<Error | null>(null)
  const [didUnpublish, setDidUnpublish] = useState(false)
  const [isConfirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const unpublishPermission = useCheckDocumentPermission(id, type, 'unpublish')
  const {value: currentUser} = useCurrentUser()

  const handleCancel = useCallback(() => {
    setConfirmDialogOpen(false)
    onComplete()
  }, [onComplete])

  const handleConfirm = useCallback(() => {
    setConfirmDialogOpen(false)
    unpublish.execute()
    onComplete()
  }, [onComplete, unpublish])

  const dialog: DocumentActionDialogProps | null = useMemo(() => {
    if (error) {
      return {
        type: 'error',
        onClose: () => setError(null),
        title: 'An error occured',
        content: error.message,
      }
    }

    if (didUnpublish) {
      return {
        type: 'success',
        onClose: () => {
          setDidUnpublish(false)
        },
        title: 'Succesfully unpublished the document',
      }
    }

    if (isConfirmDialogOpen) {
      return {
        type: 'legacy',
        onClose: onComplete,
        content: (
          <ConfirmUnpublish
            draft={draft}
            published={published}
            onCancel={handleCancel}
            onConfirm={handleConfirm}
          />
        ),
      }
    }

    return null
  }, [
    didUnpublish,
    draft,
    error,
    handleCancel,
    handleConfirm,
    isConfirmDialogOpen,
    onComplete,
    published,
  ])

  if (!unpublishPermission.granted) {
    return {
      color: 'danger',
      icon: UnpublishIcon,
      label: 'Unpublish',
      title: (
        <InsufficientPermissionsMessage
          operationLabel="unpublish this document"
          currentUser={currentUser}
        />
      ),
      disabled: true,
    }
  }

  if (liveEdit) {
    return null
  }

  return {
    color: 'danger',
    icon: UnpublishIcon,
    disabled: Boolean(unpublish.disabled),
    label: 'Unpublish',
    title: unpublish.disabled ? DISABLED_REASON_TITLE[unpublish.disabled] : '',
    onHandle: () => setConfirmDialogOpen(true),
    dialog,
  }
}
