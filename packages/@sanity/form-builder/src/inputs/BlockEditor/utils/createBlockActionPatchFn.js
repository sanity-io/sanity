// @flow

import type {FormBuilderValue, Block} from '../typeDefs'
import PatchEvent, {insert, unset, set} from '../../../../PatchEvent'
import {randomKey, normalizeBlock} from '@sanity/block-tools'

export default function createBlockActionPatchFn(
  type: string,
  block: FormBuilderValue,
  onPatch: PatchEvent => void
) {
  return (givenBlock: Block) => {
    switch (type) {
      case 'set':
        return onPatch(PatchEvent.from(set(givenBlock, [{_key: block._key}])))
      case 'unset':
        return onPatch(PatchEvent.from(unset([{_key: block._key}])))
      case 'insert':
        // Make sure the given block key's are unique and normalized
        givenBlock._key = randomKey(12)
        if (givenBlock._type === 'block') {
          normalizeBlock(givenBlock)
        }
        return onPatch(PatchEvent.from(insert([givenBlock], 'after', [{_key: block._key}])))
      default:
        throw new Error(`Patch type ${type} not supported`)
    }
  }
}
