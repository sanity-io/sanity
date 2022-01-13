import {Subject} from 'rxjs'
import {EditorChange, EditorSelection, PortableTextSlateEditor} from '../../types/editor'
import {debugWithName} from '../../utils/debug'
import {toPortableTextRange} from '../../utils/ranges'
import {SLATE_TO_PORTABLE_TEXT_RANGE} from '../../utils/weakMaps'

const debug = debugWithName('plugin:withPortableTextSelections')

// This plugin will make sure that we emit a PT selection if slateEditor.onChange is called.
export function createWithPortableTextSelections(change$: Subject<EditorChange>) {
  return function withPortableTextSelections(
    editor: PortableTextSlateEditor
  ): PortableTextSlateEditor {
    const emitSelection = () => {
      let ptRange: EditorSelection = null
      if (editor.selection) {
        const existing = SLATE_TO_PORTABLE_TEXT_RANGE.get(editor.selection)
        if (existing) {
          ptRange = existing
        } else {
          ptRange = toPortableTextRange(editor, editor.selection)
        }
        SLATE_TO_PORTABLE_TEXT_RANGE.set(editor.selection, ptRange)
      }
      if (ptRange) {
        debug(`Emitting selection ${JSON.stringify(ptRange)}`)
        change$.next({type: 'selection', selection: {...ptRange}})
      } else {
        change$.next({type: 'selection', selection: null})
      }
    }

    const {onChange} = editor
    editor.onChange = () => {
      onChange()
      emitSelection()
    }
    return editor
  }
}
