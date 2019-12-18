import {useDocumentOperation} from '@sanity/react-hooks'
import {createAction} from 'part:@sanity/base/actions/utils'


export default createAction(function SaveAction(docInfo) {
  const {commit} = useDocumentOperation(docInfo.id, docInfo.type)
  return {
    label: 'Save',
    handle: () => {
      console.log('SAVING')
      commit(docInfo.id, docInfo.type)
    }
  }
})
