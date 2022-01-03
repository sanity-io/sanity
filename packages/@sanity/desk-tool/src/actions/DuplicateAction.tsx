import {DocumentActionComponent, useClient, useConfig, useDatastores} from '@sanity/base'
import {CopyIcon} from '@sanity/icons'
import {uuid} from '@sanity/uuid'
import {
  useDocumentOperation,
  unstable_useDocumentPairPermissions as useDocumentPairPermissions,
  useCurrentUser,
} from '@sanity/base/hooks'
import {useRouter} from '@sanity/base/router'
import React, {useCallback, useState} from 'react'
import {InsufficientPermissionsMessage} from '@sanity/base/components'

const DISABLED_REASON_TITLE = {
  NOTHING_TO_DUPLICATE: 'This document doesn’t yet exist so there‘s nothing to duplicate',
}

export const DuplicateAction: DocumentActionComponent = ({id, type, onComplete}) => {
  const client = useClient()
  const {schema} = useConfig()
  const {grantsStore} = useDatastores()
  const {duplicate} = useDocumentOperation(id, type)
  const router = useRouter()
  const [isDuplicating, setDuplicating] = useState(false)
  const [permissions, isPermissionsLoading] = useDocumentPairPermissions(
    client,
    schema,
    grantsStore,
    {
      id,
      type,
      permission: 'duplicate',
    }
  )

  const {value: currentUser} = useCurrentUser()

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
