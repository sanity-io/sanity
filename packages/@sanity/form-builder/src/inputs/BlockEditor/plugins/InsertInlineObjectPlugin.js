// @flow
import {Inline} from 'slate'
import {randomKey} from '@sanity/block-tools'
import type {SlateEditor, Type} from '../typeDefs'

export default function InsertInlineObjectPlugin(blockContentType: Type) {
  return {
    onCommand(command: any, editor: SlateEditor, next: void => void) {
      if (command.type !== 'insertInlineObject') {
        return next()
      }
      const options = command.args[0] || {}
      const {objectType} = options
      const key = options.key || randomKey(12)
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
