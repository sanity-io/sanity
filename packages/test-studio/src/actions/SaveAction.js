import {useDocumentOperations} from '../test-action-tool/useDocumentOperations'

export default function SaveAction(docInfo) {
  const {commit} = useDocumentOperations(docInfo.id, docInfo.type)
  return {
    label: 'Save',
    handle: () => {
      commit(docInfo.id, docInfo.type)
    }
  }
}
