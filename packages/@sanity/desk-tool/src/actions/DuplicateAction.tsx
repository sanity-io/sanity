import {DocumentActionComponent} from '@sanity/base'
import {CopyIcon} from '@sanity/icons'
import {uuid} from '@sanity/uuid'
import {useDocumentOperation} from '@sanity/react-hooks'
import {useRouter} from '@sanity/base/router'
import React, {useCallback, useState} from 'react'
import {
  unstable_useDocumentPermissions as useDocumentPermissions,
  useCurrentUser,
} from '@sanity/base/hooks'
import {InsufficientPermissionsMessage} from '@sanity/base/components'

const DISABLED_REASON_TITLE = {
  NOTHING_TO_DUPLICATE: 'This document doesn’t yet exist so there‘s nothing to duplicate',
}

export const DuplicateAction: DocumentActionComponent = ({id, type, onComplete}) => {
  const {duplicate}: any = useDocumentOperation(id, type)
  const router = useRouter()
  const [isDuplicating, setDuplicating] = useState(false)
  const permissions = useDocumentPermissions({
    id,
    type,
    permission: 'duplicate',
  })

  const {value: currentUser} = useCurrentUser()

  const handle = useCallback(() => {
    const dupeId = uuid()

    setDuplicating(true)
    duplicate.execute(dupeId)
    router.navigateIntent('edit', {id: dupeId, type})
    onComplete()
  }, [duplicate, onComplete, router, type])

  if (!permissions.isLoading && !permissions.value?.granted) {
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
    disabled: isDuplicating || Boolean(duplicate.disabled) || permissions.isLoading,
    label: isDuplicating ? 'Duplicating…' : 'Duplicate',
    title:
      (duplicate.disabled &&
        DISABLED_REASON_TITLE[duplicate.disabled as keyof typeof DISABLED_REASON_TITLE]) ||
      '',
    onHandle: handle,
  }
}
