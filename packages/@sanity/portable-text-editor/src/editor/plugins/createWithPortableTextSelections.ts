import {Subject} from 'rxjs'
import {EditorChange, EditorSelection, PortableTextSlateEditor} from '../../types/editor'
import {debugWithName} from '../../utils/debug'
import {toPortableTextRange} from '../../utils/ranges'
import {SLATE_TO_PORTABLE_TEXT_RANGE} from '../../utils/weakMaps'

const debug = debugWithName('plugin:withPortableTextSelections')

export function createWithPortableTextSelections(change$: Subject<EditorChange>) {
  return function withPortableTextSelections(
    editor: PortableTextSlateEditor
  ): PortableTextSlateEditor {
    const {onChange} = editor
    const emitSelection = () => {
      if (editor.selection) {
        let ptRange: EditorSelection = null
        const existing = SLATE_TO_PORTABLE_TEXT_RANGE.get(editor.selection)
        if (existing) {
          ptRange = existing
        } else {
          ptRange = toPortableTextRange(editor, editor.selection)
          SLATE_TO_PORTABLE_TEXT_RANGE.set(editor.selection, ptRange)
        }
        debug(`Emitting selection ${JSON.stringify(ptRange)}`)
        change$.next({type: 'selection', selection: ptRange})
      }
    }
    editor.onChange = () => {
      onChange()
      emitSelection()
    }
    return editor
  }
}
