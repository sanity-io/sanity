import {useEditor} from '@portabletext/editor'
import {useEffect} from 'react'

/**
 * `EditorProvider` doesn't have a `readOnly` prop. Instead, this custom PTE
 * plugin listens for the prop change and sends a `toggle readOnly` event to
 * the editor.
 *
 * @internal
 */
export function UpdateReadOnlyPlugin(props: {readOnly: boolean}) {
  const editor = useEditor()

  useEffect(() => {
    editor.send({
      type: 'update readOnly',
      readOnly: props.readOnly,
    })
  }, [editor, props.readOnly])

  return null
}
