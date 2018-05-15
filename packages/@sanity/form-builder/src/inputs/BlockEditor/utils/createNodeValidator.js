// @flow

import type {SlateNode, Type, Block} from '../typeDefs'

import randomKey from './randomKey'
import deserialize from './deserialize'

export default function createNodeValidator(blockContentType: Type, getValue: void => Block[]) {
  return function validateNode(node: SlateNode) {
    // Make sure document always has a node.
    if (node.object === 'document' && node.nodes.size === 0) {
      return change => {
        const key = randomKey(12)
        const block = deserialize(
          [
            {
              _key: key,
              _type: 'block',
              children: [
                {
                  _type: 'span',
                  _key: `${key}0`,
                  text: '',
                  marks: []
                }
              ],
              style: 'normal'
            }
          ],
          blockContentType
        )
          .document.nodes.first()
          .toJSON({preserveKeys: true, preserveData: true})
        change.applyOperations([
          {
            type: 'insert_node',
            path: [0],
            node: block
          }
        ])
      }
    }

    return undefined
  }
}
