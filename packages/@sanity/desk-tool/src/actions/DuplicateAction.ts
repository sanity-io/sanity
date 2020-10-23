import uuid from '@sanity/uuid'
import {useDocumentOperation} from '@sanity/react-hooks'
import ContentCopyIcon from 'part:@sanity/base/content-copy-icon'
import {useRouter} from 'part:@sanity/base/router'
import React, {useCallback} from 'react'

const DISABLED_REASON_TITLE = {
  NOTHING_TO_DUPLICATE: "This document doesn't yet exist so there's nothing to duplicate",
}

export function DuplicateAction({id, type, onComplete}) {
  const {duplicate}: any = useDocumentOperation(id, type)
  const router = useRouter()

  const [isDuplicating, setDuplicating] = React.useState(false)

  const handle = useCallback(() => {
    const dupeId = uuid()

    setDuplicating(true)
    duplicate.execute(dupeId)
    router.navigateIntent('edit', {id: dupeId, type})
    onComplete()
  }, [duplicate, onComplete, router, type])

  return {
    icon: ContentCopyIcon,
    disabled: Boolean(isDuplicating || duplicate.disabled),
    label: isDuplicating ? 'Duplicating…' : 'Duplicate',
    title: (duplicate.disabled && DISABLED_REASON_TITLE[duplicate.disabled]) || '',
    onHandle: handle,
  }
}
