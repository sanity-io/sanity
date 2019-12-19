import {omit} from 'lodash'
import {useDocumentOperation} from '@sanity/react-hooks'
import {createAction} from 'part:@sanity/base/actions/utils'
import ContentCopyIcon from 'part:@sanity/base/content-copy-icon'

export const PublishAction = createAction(function PublishAction(docInfo) {
  const {publish}: any = useDocumentOperation(docInfo.id, docInfo.type)

  return {
    icon: ContentCopyIcon,
    disabled: publish.disabled,
    label: 'Publish',
    title: publish.disabled ? `Cannot publish: ${publish.disabled}` : 'Publish',
    onHandle: () => {
      publish.execute(doc => omit(doc, 'reviewers'))
    }
  }
})
