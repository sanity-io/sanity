import {randomKey, normalizeBlock} from '@sanity/block-tools'
import deserialize from './deserialize'

export default function createEmptyBlock(blockContentFeatures, options = {}) {
  const key = options.key || randomKey(12)
  const raw = {
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
    style: options.style || 'normal'
  }
  return deserialize([normalizeBlock(raw)], blockContentFeatures.types.block).document.nodes.first()
}
