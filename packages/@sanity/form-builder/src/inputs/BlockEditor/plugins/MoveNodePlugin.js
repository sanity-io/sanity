// @flow
import type {SlateChange} from '../typeDefs'

// This plugin removes operations that tries to move a block to the same position
// This makes the editor regenerate a key, and patches get out of sync.

export default function moveNodePlugin() {
  return {
    onCommand(command: any, change: SlateChange, next: void => void) {
      const moveNodeOperations = change.operations.filter(
        op =>
          op.type === 'move_node' &&
          op.path.size === 1 &&
          op.newPath.size === 1 &&
          op.newPath.get(0) === op.path.get(0)
      )
      if (moveNodeOperations.size === 0) {
        return next()
      }
      let applied = false
      moveNodeOperations.forEach(op => {
        const opIndex = change.operations.indexOf(op)
        change.operations = change.operations.splice(opIndex, 1)
        const node = change.value.document.nodes.get(op.path.get(0))
        if (node && node.text === '') {
          change.removeNodeByPath(op.path)
          applied = true
        }
      })
      if (applied) {
        return change
      }
      return next()
    }
  }
}
