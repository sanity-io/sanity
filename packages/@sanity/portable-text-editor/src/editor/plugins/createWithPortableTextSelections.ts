import {Subject} from 'rxjs'
import {Editor, Element, Node} from 'slate'
import {EditorChange, EditorSelection, PortableTextSlateEditor} from '../../types/editor'
import {debugWithName} from '../../utils/debug'
import {toPortableTextRange} from '../../utils/ranges'

const debug = debugWithName('plugin:withPortableTextSelections')

export function createWithPortableTextSelections(change$: Subject<EditorChange>) {
  return function withPortableTextSelections(
    editor: PortableTextSlateEditor
  ): PortableTextSlateEditor {
    let currentSelection: EditorSelection | null = null
    const {onChange} = editor
    editor.onChange = () => {
      onChange()
      if (currentSelection !== editor.selection) {
        let emittedSelection: EditorSelection | null = null
        if (editor.selection) {
          try {
            emittedSelection = toPortableTextRange(editor, editor.selection)
          } catch (err) {
            debug(`Could not make selection`)
            change$.next({type: 'selection', selection: null})
            currentSelection = editor.selection
            return
          }
          let focusVoidNode: Node | undefined
          const [focusBlock] = Editor.node(editor, editor.selection.focus.path, {depth: 1})
          if (focusBlock && Element.isElement(focusBlock) && editor.isVoid(focusBlock)) {
            focusVoidNode = focusBlock
          }
          const [focusInline] = Editor.node(editor, editor.selection.focus.path, {depth: 2})
          if (focusInline && Element.isElement(focusInline) && editor.isVoid(focusInline)) {
            focusVoidNode = focusInline
          }
          if (focusVoidNode) {
            debug(`Void (only) is selected`)
          }
        }
        debug(`Emitting new portable text selection`)
        // debug(`Emitting selection ${JSON.stringify(emittedSelection)}`)
        change$.next({type: 'selection', selection: emittedSelection})
        currentSelection = editor.selection
      }
    }
    return editor
  }
}
