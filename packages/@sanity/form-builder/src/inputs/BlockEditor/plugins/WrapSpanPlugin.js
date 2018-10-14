// @flow
import {Change} from 'slate'
import {randomKey} from '@sanity/block-tools'

// This plugin creates a span node

export default function WrapSpanPlugin() {
  return {
    // eslint-disable-next-line complexity
    onCommand(command: any, change: Change, next: void => void) {
      if (command.type !== 'wrapSpan') {
        return next()
      }
      const options = command.args[0] || {}
      const key = options.key || randomKey(12)
      const annotationName = options.annotationName || null
      const {value} = change
      const {selection} = value
      if (!selection.isExpanded) {
        change.editor.command('expandToWord')
      }
      const originalSelection = change.value.selection
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
      change.unwrapInline('span').wrapInline(span)

      const currentSpan = value.inlines.filter(inline => inline.key === key).first()
      const data = {
        annotations: currentSpan ? currentSpan.data.get('annotations') || {} : {},
        focusedAnnotationName: annotationName
      }
      if (annotationName) {
        data.annotations[annotationName] = {
          _type: annotationName,
          _key: key
        }
        change.setInlines({data: data})
      }
      return change
    }
  }
}
