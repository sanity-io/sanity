import {useDocumentOperation} from '@sanity/react-hooks'
import {createAction} from 'part:@sanity/base/util/document-action-utils'

export const WriteTitleAction = createAction(function PublishAction(docInfo) {
  if (docInfo.isLiveEditEnabled) {
    return null
  }

  const {patch, commit}: any = useDocumentOperation(docInfo.id, docInfo.type)

  return {
    label: 'Set title to foo!',
    onHandle: () => {
      patch([{set: {title: 'foo'}}])
      commit()
    }
  }
})
