import {useDocumentOperation} from '@sanity/react-hooks'
import {createAction} from 'part:@sanity/base/actions/utils'
import CloseIcon from 'part:@sanity/base/close-icon'

export const UnpublishAction = createAction(function UnpublishAction({id, type, onComplete}) {
  const {unpublish}: any = useDocumentOperation(id, type)

  return {
    icon: CloseIcon,
    disabled: Boolean(unpublish.disabled),
    label: 'Unpublish',
    title: unpublish.disabled
      ? `Cannot unpublish. ${unpublish.disabled}`
      : 'Unpublish this document',
    onHandle: () => {
      unpublish.execute()
      onComplete()
    }
  }
})
