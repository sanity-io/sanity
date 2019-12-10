import {useDocumentOperation} from '@sanity/react-hooks'
import {createAction} from 'part:@sanity/base/util/document-action-utils'


export default createAction(function SaveAction(docInfo) {
  const {commit} = useDocumentOperation(docInfo.id, docInfo.type)
  return {
    label: 'Save',
    handle: () => {
      commit(docInfo.id, docInfo.type)
    }
  }
})
