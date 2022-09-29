import {CopyIcon} from '@sanity/icons'
import {uuid} from '@sanity/uuid'
import React, {useCallback, useState} from 'react'
import {useRouter} from 'sanity/router'
import {
  DocumentActionComponent,
  InsufficientPermissionsMessage,
  useDocumentPairPermissions,
  useDocumentOperation,
  useCurrentUser,
} from 'sanity'

const DISABLED_REASON_TITLE = {
  NOTHING_TO_DUPLICATE: 'This document doesn’t yet exist so there‘s nothing to duplicate',
}

/** @internal */
export const DuplicateAction: DocumentActionComponent = ({id, type, onComplete}) => {
  const {duplicate} = useDocumentOperation(id, type)
  const router = useRouter()
  const [isDuplicating, setDuplicating] = useState(false)
  const [permissions, isPermissionsLoading] = useDocumentPairPermissions({
    id,
    type,
    permission: 'duplicate',
  })

  const currentUser = useCurrentUser()

  const handle = useCallback(() => {
    const dupeId = uuid()

    setDuplicating(true)
    ;(duplicate.execute as any)(dupeId)
    router.navigateIntent('edit', {id: dupeId, type})
    onComplete()
  }, [duplicate, onComplete, router, type])

  if (!isPermissionsLoading && !permissions?.granted) {
    return {
      icon: CopyIcon,
      disabled: true,
      label: 'Duplicate',
      title: (
        <InsufficientPermissionsMessage
          operationLabel="duplicate this document"
          currentUser={currentUser}
        />
      ),
    }
  }

  return {
    icon: CopyIcon,
    disabled: isDuplicating || Boolean(duplicate.disabled) || isPermissionsLoading,
    label: isDuplicating ? 'Duplicating…' : 'Duplicate',
    title:
      (duplicate.disabled &&
        DISABLED_REASON_TITLE[duplicate.disabled as keyof typeof DISABLED_REASON_TITLE]) ||
      '',
    onHandle: handle,
  }
}

DuplicateAction.action = 'duplicate'
