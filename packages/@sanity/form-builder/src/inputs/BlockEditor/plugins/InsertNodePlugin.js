// @flow
import {Operation} from 'slate'
import type {SlateChange} from '../typeDefs'

// This plugin overrides the internal insertNode command to ensure
// that the new block will have the proper keys and data

export default function insertNodePlugin() {
  return {
    onCommand(command: any, change: SlateChange, next: void => void) {
      const insertOperationsInsertingNewBlock = change.operations.filter(
        op => op.type === 'insert_node' && op.path.size === 1
      )
      if (insertOperationsInsertingNewBlock.size === 0) {
        // Nothing to do here
        return next()
      }
      insertOperationsInsertingNewBlock.forEach(op => {
        const data = op.node.data.toJSON()
        data._key = op.node.key
        change.operations = change.operations.push(
          Operation.fromJSON({
            type: 'set_node',
            path: op.path.toJSON(),
            properties: {
              data
            },
            node: op.node.toJSON()
          })
        )
      })
      return next()
    }
  }
}
