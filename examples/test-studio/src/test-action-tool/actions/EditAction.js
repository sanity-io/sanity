import {useDocumentOperation} from '@sanity/react-hooks'

export default function EditAction(docInfo) {
  const {patch} = useDocumentOperation(docInfo.id, docInfo.type)
  return {
    label: 'Make an edit',
    onHandle: () => {
      patch.execute([
        {
          set: {
            title: `hello ${Math.random().toString(32).substring(2)}`,
          },
        },
      ])
    },
  }
}
