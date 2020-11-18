import {useDocumentOperation} from '@sanity/react-hooks'

export default function SaveAction(docInfo) {
  const {commit} = useDocumentOperation(docInfo.id, docInfo.type)
  return {
    label: 'Save',
    onHandle: () => {
      commit.execute()
    },
  }
}
