import {useDocumentOperation} from '@sanity/react-hooks'
import {createAction} from 'part:@sanity/base/actions/utils'

export default createAction(function EditAction(docInfo) {
  const {patch} = useDocumentOperation(docInfo.id, docInfo.type)
  return {
    label: 'Make an edit',
    onHandle: () => {
      patch.execute([
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
