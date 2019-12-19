import * as React from 'react'
import {useDocumentOperation} from '@sanity/react-hooks'
import {createAction} from 'part:@sanity/base/actions/utils'
import ContentCopyIcon from 'part:@sanity/base/content-copy-icon'
import {useRouter} from 'part:@sanity/base/router'
import {getDraftId} from 'part:@sanity/base/util/draft-utils'

export const DuplicateAction = createAction(function DuplicateAction({id, type, onComplete}) {
  const {duplicate}: any = useDocumentOperation(id, type)
  const router = useRouter()

  const [isDuplicating, setDuplicating] = React.useState(false)
  return {
    icon: ContentCopyIcon,
    disabled: isDuplicating || duplicate.disabled,
    label: isDuplicating ? 'Duplicating…' : 'Duplicate',
    title: duplicate.disabled ? `Cannot duplicate: ${duplicate.disabled}` : 'Duplicate',
    onHandle: () => {
      setDuplicating(true)
      duplicate.execute().then(copy => {
        router.navigateIntent('edit', {id: getDraftId(copy._id), type: copy._type})
        onComplete()
      })
    }
  }
})
