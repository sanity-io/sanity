// @flow

import type {BlockContentFeatures, SlateChange} from '../typeDefs'

import randomKey from './randomKey'
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
      normalize: (change: SlateChange, error: {code: string}) => {
        if (error.code === 'child_required') {
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
            blockContentFeatures.types.block
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
    }
  }
}
