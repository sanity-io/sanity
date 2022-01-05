import {Path} from '@sanity/types/src'
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
    const getSelection = () => {
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
      return ptRange
    }

    const {onChange} = editor
    editor.onChange = () => {
      onChange()
      const sel = getSelection()
      if (sel) {
        debug(`Emitting selection ${JSON.stringify(sel)}`)
        change$.next({type: 'selection', selection: sel})
      } else {
        change$.next({type: 'selection', selection: null})
      }
    }
    return editor
  }
}
