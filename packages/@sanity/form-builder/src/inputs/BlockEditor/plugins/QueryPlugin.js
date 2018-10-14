// @flow
import {Change} from 'slate'

// Various custom queries

export default function QueryPlugin() {
  return {
    onQuery(query: any, change: Change, next: void => void) {
      const {value} = change
      switch (query.type) {
        case 'activeMarks':
          return value.marks.map(mrk => mrk.type).sort()
        case 'activeStyles':
          return value.blocks.map(block => block.data.get('style')).sort()
        case 'hasListItem':
          return value.blocks.some(block => {
            return block.data.get('listItem') === query.args[0]
          })
        case 'hasMark':
          return value.marks.some(mark => mark.type === query.args[0])
        case 'hasStyle':
          return value.blocks.some(block => block.data.get('style') === query.args[0])
        default:
          return next()
      }
    }
  }
}
