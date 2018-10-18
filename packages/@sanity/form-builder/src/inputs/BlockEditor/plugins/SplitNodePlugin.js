// @flow
import {List} from 'immutable'
import {Change, Operation, Selection} from 'slate'

const VALUE_TO_JSON_OPTS = {preserveKeys: true, perserveData: true}

// This plugin overrides the internal splitNode command to ensure
// that the new block will have the proper keys and data

export default function SplitNodePlugin() {
  return {
    onCommand(command: any, change: Change, next: void => void) {
      const splitOperationsInsertingNewBlock = change.operations.filter(
        op => op.type === 'split_node' && op.path.size === 1
      )
      if (splitOperationsInsertingNewBlock.size === 0) {
        // Nothing to do here
        return next()
      }
      return splitOperationsInsertingNewBlock
        .map(op => {
          const path = List.of(op.path.get(0) + 1)
          let node = change.value.document.nodes.get(path.get(0))
          if (!node) {
            // New block not ready yet
            return false
          }
          node = node.toJSON(VALUE_TO_JSON_OPTS)
          node.data._key = node.key
          if (node.data.value) {
            node.data.value._key = node.key
          }
          const newSelection = {
            anchor: {path: [op.path.get(0) + 1, 0], offset: 0},
            focus: {path: [op.path.get(0) + 1, 0], offset: 0}
          }
          change.operations = change.operations
            .push(
              Operation.create({
                type: 'remove_node',
                path,
                node
              })
            )
            .push(
              Operation.create({
                type: 'insert_node',
                path,
                node
              })
            )
            .push(
              Operation.create({
                type: 'set_selection',
                properties: newSelection,
                selection: Selection.create(newSelection)
              })
            )
          return true
        })
        .filter(Boolean).size > 0
        ? true
        : next()
    }
  }
}
