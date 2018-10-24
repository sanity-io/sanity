// @flow

import {randomKey, normalizeBlock} from '@sanity/block-tools'

import type {BlockContentFeatures, SlateChange, SlateNode} from '../typeDefs'

import deserialize from './deserialize'

export default function buildEditorSchema(blockContentFeatures: BlockContentFeatures) {
  const blocks = {}
  blockContentFeatures.types.blockObjects.forEach(type => {
    blocks[type.name] = {isVoid: true}
  })
  const inlines = {}
  blockContentFeatures.types.inlineObjects.forEach(type => {
    inlines[type.name] = {isVoid: true}
  })

  function createEmptyBlock() {
    const key = randomKey(12)
    return deserialize(
      [
        normalizeBlock({
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
        })
      ],
      blockContentFeatures.types.block
    ).document.nodes.first()
  }

  return {
    blocks,
    inlines,
    document: {
      nodes: [
        {
          match: {object: 'block'},
          min: 1
        }
      ],
      normalize: (
        change: SlateChange,
        {code, node, child}: {code: string, node: SlateNode, child: SlateNode}
      ) => {
        if (code === 'child_required') {
          const block = createEmptyBlock()
          change.applyOperations([
            {
              type: 'insert_node',
              path: [0],
              node: block.toJSON({preserveKeys: true, preserveData: true})
            }
          ])
        }
      }
    }
  }
}
