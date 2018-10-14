// @flow
import {Change} from 'slate'

type Options = {}

// This plugin handles tab key when focus is on list element, and changes the level on it

export default function ListItemOnTabKeyPlugin(options: Options = {}) {
  return {
    // eslint-disable-next-line complexity
    onKeyDown(event: SyntheticKeyboardEvent<*>, change: Change, next: void => void) {
      const {key, shiftKey, altKey} = event
      if (key !== 'Tab') {
        return next()
      }
      if (altKey) {
        return next()
      }
      const {value} = change
      const listBlocks = value.blocks.filter(block => block.data.get('listItem'))
      if (listBlocks.size === 0) {
        return next()
      }
      event.preventDefault()
      listBlocks.forEach(listNode => {
        const listItemData = listNode.data.toObject()
        listItemData.level = listItemData.level || 1
        if (shiftKey) {
          listItemData.level--
          listItemData.level = listItemData.level || 1 // Min level 1
        } else {
          listItemData.level++
          listItemData.level = listItemData.level < 11 ? listItemData.level : 10 // Max level 10
        }
        change.setNodeByKey(listNode.key, {data: listItemData})
      })
      return change
    }
  }
}
