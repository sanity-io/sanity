// @flow

import {randomKey} from '@sanity/block-tools'
import type {SlateEditor} from '../typeDefs'

// This plugin creates a span node

export default function WrapSpanPlugin() {
  return {
    // eslint-disable-next-line complexity
    onCommand(command: any, editor: SlateEditor, next: void => void) {
      if (command.type !== 'wrapSpan') {
        return next()
      }
      const options = command.args[0] || {}
      const key = options.key || randomKey(12)
      const annotationName = options.annotationName || null
      const {selection} = editor.value
      if (!selection.isExpanded) {
        editor.command('expandToWord')
      }
      const originalSelection = editor.value.selection
      const span = {
        isVoid: false,
        type: 'span',
        object: 'inline',
        data: {
          annotations: {},
          focusedAnnotationName: null,
          originalSelection: originalSelection
        },
        key
      }
      editor.unwrapInline('span').wrapInline(span)

      const currentSpan = editor.value.inlines.filter(inline => inline.key === key).first()
      const data = {
        annotations: currentSpan ? currentSpan.data.get('annotations') || {} : {},
        focusedAnnotationName: annotationName
      }
      if (annotationName) {
        data.annotations[annotationName] = {
          _type: annotationName,
          _key: key
        }
        editor.setInlines({data: data})
      }
      return editor
    }
  }
}
