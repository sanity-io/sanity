import {omit} from 'lodash'
import {useDocumentOperation} from '@sanity/react-hooks'
import {createAction} from 'part:@sanity/base/util/document-action-utils'
import ContentCopyIcon from 'part:@sanity/base/content-copy-icon'

export const WriteTitleAction = createAction(function PublishAction(docInfo) {
  if (docInfo.isLiveEditEnabled) {
    return null
  }

  const {patch, commit} = useDocumentOperation(docInfo.id, docInfo.type)

  return {
    label: 'Set title to foo!',
    onHandle: () => {
      patch([{set: {title: 'foo'}}])
      commit()
    }
  }
})
