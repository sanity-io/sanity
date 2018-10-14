// @flow
import {Change} from 'slate'
import {randomKey} from '@sanity/block-tools'
import type {Path} from '../typeDefs'
import {FOCUS_TERMINATOR} from '../../../utils/pathUtils'

// This plugin toggles an annotation on the selected content

export default function ToggleAnnotationPlugin(onFocus?: Path => void) {
  return {
    // eslint-disable-next-line complexity
    onCommand(command: any, change: Change, next: void => void) {
      if (command.type !== 'toggleAnnotation') {
        return next()
      }
      const {value} = change
      const spans = value.inlines.filter(inline => inline.type === 'span')
      const annotationName = command.args[0]

      // Add annotation
      if (spans.size === 0) {
        const key = randomKey(12)
        change.editor.command('wrapSpan', {key, annotationName})
        // Make the block editor focus the annotation input
        if (onFocus) {
          const focusPath = [
            {_key: change.value.focusBlock.key},
            'markDefs',
            {_key: key},
            FOCUS_TERMINATOR
          ]
          setTimeout(() => {
            if (onFocus) {
              onFocus(focusPath)
            }
          }, 200)
        }
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
