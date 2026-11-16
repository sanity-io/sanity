import {type EditorSelection, useEditor} from '@portabletext/editor'
import {useEffect} from 'react'

/**
 * Selects `selection` when the editor has no selection yet, both right away and once the editor
 * emits `ready`. The component must mount together with the editor, as `ready` is emitted once.
 */
export function useInitialSelection(selection: EditorSelection | undefined): void {
  const editor = useEditor()

  useEffect(() => {
    if (!selection) {
      return undefined
    }
    const select = () => {
      // An unresolvable `select` deselects, so never send one over an existing selection.
      if (!editor.getSnapshot().context.selection) {
        editor.send({type: 'select', at: selection})
      }
    }
    select()
    const subscription = editor.on('ready', select)
    return () => subscription.unsubscribe()
  }, [editor, selection])
}
