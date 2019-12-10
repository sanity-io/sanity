import {useDocumentOperation} from '@sanity/react-hooks'

export default function SaveAction(docInfo) {
  const {commit} = useDocumentOperation(docInfo.id, docInfo.type)
  return {
    label: 'Save',
    handle: () => {
      commit(docInfo.id, docInfo.type)
    }
  }
}
