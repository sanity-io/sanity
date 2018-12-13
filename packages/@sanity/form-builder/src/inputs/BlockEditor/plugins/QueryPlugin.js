// @flow
import type {SlateEditor, SlateValue} from '../typeDefs'

// Various custom queries

function isNonTextSelection(editorValue: SlateValue) {
  const {focusText, selection} = editorValue
  const {isCollapsed} = selection
  return (
    !focusText ||
    (focusText &&
      isCollapsed &&
      focusText.text.substring(selection.focus.offset - 1, selection.focus.offset).trim() === '' &&
      focusText.text.substring(selection.focus.offset, selection.focus.offset + 1).trim() === '')
  )
}

export default function QueryPlugin() {
  return {
    onQuery(query: any, editor: SlateEditor, next: void => void) {
      const {value} = editor
      switch (query.type) {
        case 'activeMarks':
          return value.marks.map(mrk => mrk.type).sort()
        case 'activeStyles':
          return value.blocks.map(block => block.data.get('style')).sort()
        case 'hasAnnotation':
          return value.inlines.filter(inline => inline.type === 'span').some(span => {
            const annotations = span.data.get('annotations') || {}
            return Object.keys(annotations).find(
              key => annotations[key] && annotations[key]._type === query.args[0]
            )
          })
        case 'hasListItem':
          return value.blocks.some(block => {
            return block.data.get('listItem') === query.args[0]
          })
        case 'hasMark':
          return value.marks.some(mark => mark.type === query.args[0])
        case 'hasStyle':
          return value.blocks.some(block => block.data.get('style') === query.args[0])
        case 'hasSelectionWithText':
          return !isNonTextSelection(query.args[0] || value)
        default:
          return next()
      }
    }
  }
}
