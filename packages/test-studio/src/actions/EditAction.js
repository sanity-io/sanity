import {useDocumentOperations} from '../test-action-tool/useDocumentOperations'

export default function EditAction(docInfo) {
  const {patch} = useDocumentOperations(docInfo.id, docInfo.type)
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
}
