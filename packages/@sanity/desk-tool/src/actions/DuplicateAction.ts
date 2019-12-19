import {omit} from 'lodash'
import {useDocumentOperation} from '@sanity/react-hooks'
import {createAction} from 'part:@sanity/base/actions/utils'
import ContentCopyIcon from 'part:@sanity/base/content-copy-icon'

export const DuplicateAction = createAction(function DuplicateAction(docInfo) {
  const {duplicate}: any = useDocumentOperation(docInfo.id, docInfo.type)

  return {
    icon: ContentCopyIcon,
    disabled: duplicate.disabled,
    label: 'Duplicate',
    title: duplicate.disabled ? `Cannot duplicate: ${duplicate.disabled}` : 'Duplicate',
    onHandle: () => {
      duplicate.execute(doc => omit(doc, 'reviewers'))
    }
  }
})
