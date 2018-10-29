// @flow

import {randomKey} from '@sanity/block-tools'
import type {SlateEditor} from '../typeDefs'

// This plugin toggles an annotation on the selected content

export default function ToggleAnnotationPlugin() {
  return {
    // eslint-disable-next-line complexity
    onCommand(command: any, editor: SlateEditor, next: void => void) {
      if (command.type !== 'toggleAnnotation') {
        return next()
      }
      const spans = editor.value.inlines.filter(inline => inline.type === 'span')
      const options = command.args[0] || {}
      const {annotationName} = options
      const key = options.key || randomKey(12)

      // Add annotation
      if (spans.size === 0) {
        return editor.command('wrapSpan', {key, annotationName})
      }

      // Remove annotation
      spans.forEach(span => {
        const annotations = span.data.get('annotations')
        if (!annotations || !annotations[annotationName]) {
          return
        }
        // Remove the whole span if this annotation is the only one left
        if (Object.keys(annotations).length === 1 && annotations[annotationName]) {
          editor.unwrapInlineByKey(span.key)
          return
        }
        // If several annotations, remove only this one and leave the span node intact
        Object.keys(annotations).forEach(name => {
          if (annotations[name]._type === annotationName) {
            delete annotations[name]
          }
        })
        const data = {
          ...span.data.toObject(),
          focusedAnnotationName: undefined,
          annotations: annotations
        }
        editor.setNodeByKey(span.key, {data})
      })

      return editor
    }
  }
}
