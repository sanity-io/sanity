import {useDocumentOperation} from '@sanity/react-hooks'
import {createAction} from 'part:@sanity/base/actions/utils'
import ContentCopyIcon from 'part:@sanity/base/content-copy-icon'

export const UnpublishAction = createAction(function UnpublishAction(docInfo) {
  const {unpublish}: any = useDocumentOperation(docInfo.id, docInfo.type)

  return {
    icon: ContentCopyIcon,
    disabled: unpublish.disabled,
    label: 'Unpublish',
    title: unpublish.disabled ? `Cannot unpublish. ${unpublish.disabled}` : 'Publish',
    onHandle: () => {
      unpublish.execute()
    }
  }
})
