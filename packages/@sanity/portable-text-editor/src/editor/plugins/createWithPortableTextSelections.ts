import {Subject} from 'rxjs'
import {EditorChange, EditorSelection, PortableTextSlateEditor} from '../../types/editor'
import {PortableTextFeatures} from '../../types/portableText'
import {debugWithName} from '../../utils/debug'
import {toPortableTextRange} from '../../utils/ranges'
import {fromSlateValue} from '../../utils/values'
import {KEY_TO_VALUE_ELEMENT, SLATE_TO_PORTABLE_TEXT_RANGE} from '../../utils/weakMaps'

const debug = debugWithName('plugin:withPortableTextSelections')

// This plugin will make sure that we emit a PT selection whenever the editor has changed.
export function createWithPortableTextSelections(
  change$: Subject<EditorChange>,
  portableTextFeatures: PortableTextFeatures
) {
  return function withPortableTextSelections(
    editor: PortableTextSlateEditor
  ): PortableTextSlateEditor {
    const emitPortableTextSelection = () => {
      let ptRange: EditorSelection = null
      if (editor.selection) {
        const existing = SLATE_TO_PORTABLE_TEXT_RANGE.get(editor.selection)
        if (existing) {
          ptRange = existing
        } else {
          ptRange = toPortableTextRange(
            fromSlateValue(
              editor.children,
              portableTextFeatures.types.block.name,
              KEY_TO_VALUE_ELEMENT.get(editor)
            ),
            editor.selection,
            portableTextFeatures
          )
          SLATE_TO_PORTABLE_TEXT_RANGE.set(editor.selection, ptRange)
        }
      }
      debug(`Emitting selection ${JSON.stringify(ptRange || null)}`)
      if (ptRange) {
        change$.next({type: 'selection', selection: ptRange})
      } else {
        change$.next({type: 'selection', selection: null})
      }
    }

    const {onChange} = editor
    editor.onChange = () => {
      const hasChanges = editor.operations.length > 0
      onChange()
      if (hasChanges) {
        emitPortableTextSelection()
      }
    }
    return editor
  }
}
