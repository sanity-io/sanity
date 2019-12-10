import {useDocumentOperation} from '@sanity/react-hooks'
import {createAction} from 'part:@sanity/base/util/document-action-utils'


export default createAction(function EditAction(docInfo) {
  const {patch} = useDocumentOperation(docInfo.id, docInfo.type)
  return {
    label: 'Make an edit',
    handle: () => {
      patch([
        {
          set: {
            title: `hello ${Math.random()
              .toString(32)
              .substring(2)}`
          }
        }
      ])
    }
  }
})
