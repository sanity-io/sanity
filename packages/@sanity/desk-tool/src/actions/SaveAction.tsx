import {useDocumentOperation} from '@sanity/react-hooks'
import {createAction} from 'part:@sanity/base/actions/utils'

export const SaveAction = createAction(function DeleteAction({id, type, onComplete}) {
  const {commit}: any = useDocumentOperation(id, type)

  return {
    disabled: commit.disabled,
    label: 'Save',
    onHandle: async () => {
      await commit.execute()
      onComplete()
    }
  }
})
