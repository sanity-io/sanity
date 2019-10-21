import {FormBuilderValue, Block, BlockContentFeatures} from '../typeDefs'
import PatchEvent, {insert, unset, set} from '../../../../PatchEvent'
import {normalizeBlock} from '@sanity/block-tools'

export default function createBlockActionPatchFn(
  type: string,
  block: FormBuilderValue,
  onPatch: (arg0: PatchEvent) => void,
  blockContentFeatures: BlockContentFeatures
) {
  let toInsert
  return (givenBlock: Block) => {
    const allowedDecorators = blockContentFeatures.decorators.map(item => item.value)
    switch (type) {
      case 'set':
        return onPatch(
          PatchEvent.from(
            set(
              normalizeBlock(givenBlock, {
                allowedDecorators
              }),
              [{_key: block._key}]
            )
          )
        )
      case 'unset':
        return onPatch(PatchEvent.from(unset([{_key: block._key}])))
      case 'insert':
        toInsert = Array.isArray(givenBlock) ? givenBlock : [givenBlock]
        toInsert = toInsert.map(blk =>
          normalizeBlock(blk, {
            allowedDecorators
          })
        )
        return onPatch(PatchEvent.from(insert(toInsert, 'after', [{_key: block._key}])))
      default:
        throw new Error(`Patch type ${type} not supported`)
    }
  }
}
