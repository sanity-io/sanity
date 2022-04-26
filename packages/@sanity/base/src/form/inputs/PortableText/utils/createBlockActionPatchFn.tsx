import {normalizeBlock} from '@sanity/block-tools'
import {PortableTextBlock} from '@sanity/portable-text-editor'
import {insert, unset, set, PatchArg} from '../../../patch'

type UnsetFunction = () => void
type SetFunction = (args0: PortableTextBlock) => void
type InsertFunction = (args0: PortableTextBlock | PortableTextBlock[]) => void

export function createBlockActionPatchFn(
  type: string,
  block: PortableTextBlock,
  onPatch: (...patches: PatchArg[]) => void,
  allowedDecorators: string[]
): UnsetFunction | SetFunction | InsertFunction {
  let toInsert
  switch (type) {
    case 'set':
      return (givenBlock: PortableTextBlock): void => {
        return onPatch(
          set(
            normalizeBlock(givenBlock, {
              allowedDecorators,
            }),

            [{_key: block._key}]
          )
        )
      }
    case 'unset':
      return (): void => {
        return onPatch(unset([{_key: block._key}]))
      }
    case 'insert':
      return (givenBlock: PortableTextBlock | PortableTextBlock[]): void => {
        toInsert = Array.isArray(givenBlock) ? givenBlock : [givenBlock]
        toInsert = toInsert.map((blk) =>
          normalizeBlock(blk, {
            allowedDecorators,
          })
        )

        return onPatch(insert(toInsert, 'after', [{_key: block._key}]))
      }
    default:
      throw new Error(`Patch type ${type} not supported`)
  }
}
