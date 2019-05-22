// @flow
import {normalizeBlock} from '@sanity/block-tools'
import {FormBuilderValue, Block, Type} from '../typeDefs'
import PatchEvent, {insert, unset, set} from '../../../../PatchEvent'

export default function createBlockActionPatchFn(
  type: string,
  block: FormBuilderValue,
  blockType: Type,
  onPatch: PatchEvent => void
) {
  let toInsert
  return (givenBlock: Block) => {
    switch (type) {
      case 'set':
        return onPatch(
          PatchEvent.from(set(normalizeBlock(givenBlock, blockType), [{_key: block._key}]))
        )
      case 'unset':
        return onPatch(PatchEvent.from(unset([{_key: block._key}])))
      case 'insert':
        toInsert = Array.isArray(givenBlock) ? givenBlock : [givenBlock]
        toInsert = toInsert.map(blk => normalizeBlock(blk, blockType))
        return onPatch(PatchEvent.from(insert(toInsert, 'after', [{_key: block._key}])))
      default:
        throw new Error(`Patch type ${type} not supported`)
    }
  }
}
