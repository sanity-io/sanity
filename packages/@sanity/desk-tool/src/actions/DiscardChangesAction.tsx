import {
  DocumentActionComponent,
  DocumentActionModalProps,
  useClient,
  useConfig,
  useDatastores,
} from '@sanity/base'
import {
  useDocumentOperation,
  unstable_useDocumentPairPermissions as useDocumentPairPermissions,
  useCurrentUser,
} from '@sanity/base/hooks'
import {ResetIcon} from '@sanity/icons'
import React, {useCallback, useMemo, useState} from 'react'
import {InsufficientPermissionsMessage} from '@sanity/base/components'

const DISABLED_REASON_TITLE = {
  NO_CHANGES: 'This document has no unpublished changes',
  NOT_PUBLISHED: 'This document is not published',
}

export const DiscardChangesAction: DocumentActionComponent = ({
  id,
  type,
  published,
  liveEdit,
  onComplete,
}) => {
  const client = useClient()
  const {schema} = useConfig()
  const {grantsStore} = useDatastores()
  const {discardChanges} = useDocumentOperation(id, type)
  const [isConfirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [permissions, isPermissionsLoading] = useDocumentPairPermissions(
    client,
    schema,
    grantsStore,
    {
      id,
      type,
      permission: 'discardDraft',
    }
  )
  const {value: currentUser} = useCurrentUser()

  const handleConfirm = useCallback(() => {
    discardChanges.execute()
    onComplete()
  }, [discardChanges, onComplete])

  const handle = useCallback(() => {
    setConfirmDialogOpen(true)
  }, [])

  const modal: DocumentActionModalProps | false = useMemo(
    () =>
      isConfirmDialogOpen && {
        type: 'confirm',
        tone: 'critical',
        onCancel: onComplete,
        onConfirm: handleConfirm,
        message: <>Are you sure you want to discard all changes since last published?</>,
      },
    [handleConfirm, isConfirmDialogOpen, onComplete]
  )

  if (!published || liveEdit) {
    return null
  }

  if (!isPermissionsLoading && !permissions?.granted) {
    return {
      tone: 'critical',
      icon: ResetIcon,
      disabled: true,
      label: 'Discard changes',
      title: (
        <InsufficientPermissionsMessage
          operationLabel="discard changes in this document"
          currentUser={currentUser}
        />
      ),
    }
  }

  return {
    tone: 'critical',
    icon: ResetIcon,
    disabled: Boolean(discardChanges.disabled) || isPermissionsLoading,
    title:
      (discardChanges.disabled &&
        DISABLED_REASON_TITLE[discardChanges.disabled as keyof typeof DISABLED_REASON_TITLE]) ||
      '',
    label: 'Discard changes',
    onHandle: handle,
    modal,
  }
}
