import {useDocumentOperation} from '@sanity/react-hooks'
import {createAction} from './createAction'

export default createAction(function SaveAction(docInfo) {
  const {commit} = useDocumentOperation(docInfo.id, docInfo.type)
  return {
    label: 'Save',
    handle: () => {
      commit(docInfo.id, docInfo.type)
    }
  }
})
