import {randomKey, normalizeBlock} from '@sanity/block-tools'
import deserialize from './deserialize'

export default function createEmptyBlock(blockContentFeatures) {
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
