// @flow

import type {SlateEditor} from '../typeDefs'

// This plugin expands the selection to the focused word

export default function ExpandToWordPlugin() {
  return {
    // eslint-disable-next-line complexity
    onCommand(command: any, editor: SlateEditor, next: void => void) {
      if (command.type !== 'expandToWord') {
        return next()
      }
      const {focusText, selection} = editor.value
      if (!selection.isExpanded) {
        const {focus} = selection
        const focusOffset = focus.offset
        const charsBefore = focusText.text.slice(0, focusOffset)
        const charsAfter = focusText.text.slice(focusOffset, -1)
        const isEmpty = str => str.match(/\s/g)
        const whiteSpaceBeforeIndex = charsBefore
          .split('')
          .reverse()
          .findIndex(str => isEmpty(str))

        const newStartOffset =
          whiteSpaceBeforeIndex > -1 ? charsBefore.length - whiteSpaceBeforeIndex : -1

        const whiteSpaceAfterIndex = charsAfter.split('').findIndex(obj => isEmpty(obj))
        const newEndOffset =
          charsBefore.length +
          (whiteSpaceAfterIndex > -1 ? whiteSpaceAfterIndex : charsAfter.length + 1)

        // Not near any word, abort
        if (newStartOffset === newEndOffset || (isNaN(newStartOffset) || isNaN(newEndOffset))) {
          return next()
        }
        // Select and highlight current word
        return editor
          .moveAnchorTo(newStartOffset)
          .moveFocusTo(newEndOffset)
          .focus()
      }
      return next()
    }
  }
}
