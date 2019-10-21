import {randomKey, normalizeBlock} from '@sanity/block-tools'
import deserialize from './deserialize'

interface Opts {
  key?: string
  style?: string
}

export default function createEmptyBlock(blockContentFeatures, options: Opts = {}) {
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
  const allowedDecorators = blockContentFeatures.decorators.map(item => item.value)
  return deserialize([normalizeBlock(raw, {allowedDecorators})], blockContentFeatures.types.block).document.nodes.first()
}
