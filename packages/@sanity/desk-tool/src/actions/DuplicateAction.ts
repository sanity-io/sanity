import * as React from 'react'
import {useDocumentOperation} from '@sanity/react-hooks'
import ContentCopyIcon from 'part:@sanity/base/content-copy-icon'
import {useRouter} from 'part:@sanity/base/router'
import uuid from '@sanity/uuid'

const DISABLED_REASON_TITLE = {
  NOTHING_TO_DUPLICATE: "This document doesn't yet exist so there's nothing to duplicate"
}

export function DuplicateAction({id, type, onComplete}) {
  const {duplicate}: any = useDocumentOperation(id, type)
  const router = useRouter()

  const [isDuplicating, setDuplicating] = React.useState(false)

  return {
    icon: ContentCopyIcon,
    disabled: Boolean(isDuplicating || duplicate.disabled),
    label: isDuplicating ? 'Duplicating…' : 'Duplicate',
    title: (duplicate.disabled && DISABLED_REASON_TITLE[duplicate.disabled]) || '',
    onHandle: () => {
      setDuplicating(true)
      const dupeId = uuid()
      duplicate.execute(dupeId)
      router.navigateIntent('edit', {id: dupeId, type})
      onComplete()
    }
  }
}
