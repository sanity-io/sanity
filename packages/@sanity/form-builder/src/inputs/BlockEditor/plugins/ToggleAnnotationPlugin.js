// @flow
import {Change} from 'slate'
import {randomKey} from '@sanity/block-tools'

// This plugin toggles an annotation on the selected content

export default function ToggleAnnotationPlugin() {
  return {
    // eslint-disable-next-line complexity
    onCommand(command: any, change: Change, next: void => void) {
      if (command.type !== 'toggleAnnotation') {
        return next()
      }
      const {value} = change
      const spans = value.inlines.filter(inline => inline.type === 'span')
      const options = command.args[0] || {}
      const {annotationName} = options
      const key = options.key || randomKey(12)

      // Add annotation
      if (spans.size === 0) {
        change.editor.command('wrapSpan', {key, annotationName})
        return change
      }

      // Remove annotation
      spans.forEach(span => {
        const annotations = span.data.get('annotations')
        if (!annotations || !annotations[annotationName]) {
          return
        }
        // Remove the whole span if this annotation is the only one left
        if (Object.keys(annotations).length === 1 && annotations[annotationName]) {
          change.unwrapInlineByKey(span.key)
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
        change.setNodeByKey(span.key, {data})
      })

      return change
    }
  }
}
