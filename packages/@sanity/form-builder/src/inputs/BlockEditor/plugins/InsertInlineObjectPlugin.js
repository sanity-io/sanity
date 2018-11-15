// @flow
import {Inline} from 'slate'
import type {SlateEditor, Type} from '../typeDefs'

export default function InsertInlineObjectPlugin(blockContentType: Type) {
  return {
    onCommand(command: any, editor: SlateEditor, next: void => void) {
      if (command.type !== 'insertInlineObject') {
        return next()
      }
      const options = command.args[0] || {}
      const {objectType} = options
      const {focusBlock, focusText} = editor.value
      const key = options.key || `${focusBlock.key}${focusBlock.nodes.indexOf(focusText) + 1}`
      const inlineProps = {
        key,
        type: objectType.name,
        isVoid: true,
        data: {
          _key: key,
          value: {_type: objectType.name, _key: key}
        }
      }
      const inline = Inline.create(inlineProps)
      editor.insertInline(inline)
      return editor
    }
  }
}
