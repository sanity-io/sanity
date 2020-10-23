import {useDocumentOperation} from '@sanity/react-hooks'
import UnpublishIcon from 'part:@sanity/base/unpublish-icon'
import React, {useCallback, useMemo} from 'react'
import ConfirmUnpublish from '../components/ConfirmUnpublish'

const DISABLED_REASON_TITLE = {
  NOT_PUBLISHED: 'This document is not published',
}

export function UnpublishAction({id, type, draft, published, onComplete, liveEdit}) {
  const {unpublish}: any = useDocumentOperation(id, type)
  const [error, setError] = React.useState<Error | null>(null)
  const [didUnpublish, setDidUnpublish] = React.useState(false)
  const [isConfirmDialogOpen, setConfirmDialogOpen] = React.useState(false)

  const handleCancel = useCallback(() => {
    setConfirmDialogOpen(false)
    onComplete()
  }, [onComplete])

  const handleConfirm = useCallback(() => {
    setConfirmDialogOpen(false)
    unpublish.execute()
    onComplete()
  }, [onComplete, unpublish])

  const dialog = useMemo(() => {
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
        title: 'Unpublish',
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

  if (liveEdit) {
    return null
  }

  return {
    icon: UnpublishIcon,
    disabled: Boolean(unpublish.disabled),
    label: 'Unpublish',
    title: unpublish.disabled ? DISABLED_REASON_TITLE[unpublish.disabled] : '',
    onHandle: () => setConfirmDialogOpen(true),
    dialog,
  }
}
