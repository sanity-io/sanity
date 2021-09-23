import {normalizeBlock} from '@sanity/block-tools'
import {PortableTextBlock} from '@sanity/portable-text-editor'
import PatchEvent, {insert, unset, set} from '../../../PatchEvent'

type UnsetFunction = () => void
type SetFunction = (args0: PortableTextBlock) => void
type InsertFunction = (args0: PortableTextBlock | PortableTextBlock[]) => void

export default function createBlockActionPatchFn(
  type: string,
  block: PortableTextBlock,
  onPatch: (event: PatchEvent) => void,
  allowedDecorators: string[]
): UnsetFunction | SetFunction | InsertFunction {
  let toInsert
  switch (type) {
    case 'set':
      return (givenBlock: PortableTextBlock): void => {
        return onPatch(
          PatchEvent.from(
            set(
              normalizeBlock(givenBlock, {
                allowedDecorators,
              }),
              [{_key: block._key}]
            )
          )
        )
      }
    case 'unset':
      return (): void => {
        return onPatch(PatchEvent.from(unset([{_key: block._key}])))
      }
    case 'insert':
      return (givenBlock: PortableTextBlock | PortableTextBlock[]): void => {
        toInsert = Array.isArray(givenBlock) ? givenBlock : [givenBlock]
        toInsert = toInsert.map((blk) =>
          normalizeBlock(blk, {
            allowedDecorators,
          })
        )
        return onPatch(PatchEvent.from(insert(toInsert, 'after', [{_key: block._key}])))
      }
    default:
      throw new Error(`Patch type ${type} not supported`)
  }
}
