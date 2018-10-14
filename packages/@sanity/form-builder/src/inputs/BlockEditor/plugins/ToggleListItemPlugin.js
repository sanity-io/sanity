// @flow
import type {SlateChange} from '../typeDefs'

// This plugin toggles a list item on and off

export default function ToggleListItemPlugin() {
  return {
    onCommand(command: any, change: SlateChange, next: void => void) {
      if (command.type !== 'toggleListItem') {
        return next()
      }
      const listItemName = command.args[0]
      const {blocks} = change.value
      if (blocks.length === 0) {
        return next()
      }
      const active = blocks.some(block => block.data.get('listItem') === listItemName)
      blocks.forEach(block => {
        const data = block.data ? block.data.toObject() : {}
        if (active) {
          delete data.listItem
        } else {
          data.listItem = listItemName
          data.level = data.level || 1
        }
        change.setNodeByKey(block.key, {data: data})
      })
      change.focus()
      return change
    }
  }
}
