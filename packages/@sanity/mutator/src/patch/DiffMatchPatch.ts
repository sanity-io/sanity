import {applyPatches, parsePatch, type Patch} from '@sanity/diff-match-patch'
import {Expression} from '../jsonpath'
import {ImmutableAccessor} from './ImmutableAccessor'

function applyPatch(patch: Patch[], oldValue: unknown) {
  // Silently avoid patching if the value type is not string
  if (typeof oldValue !== 'string') return oldValue
  const [result] = applyPatches(patch, oldValue)
  return result
}

export class DiffMatchPatch {
  path: string
  dmpPatch: Patch[]
  id: string

  constructor(id: string, path: string, dmpPatchSrc: string) {
    this.id = id
    this.path = path
    this.dmpPatch = parsePatch(dmpPatchSrc)
  }

  apply(targets: Expression[], accessor: ImmutableAccessor): ImmutableAccessor {
    let result = accessor

    // The target must be a container type
    if (result.containerType() === 'primitive') {
      return result
    }

    for (const target of targets) {
      if (target.isIndexReference()) {
        for (const index of target.toIndicies(accessor)) {
          // Skip patching unless the index actually currently exists
          const item = result.getIndex(index)
          if (!item) {
            continue
          }

          const oldValue = item.get()
          const nextValue = applyPatch(this.dmpPatch, oldValue)
          result = result.setIndex(index, nextValue)
        }

        continue
      }

      if (target.isAttributeReference() && result.hasAttribute(target.name())) {
        const attribute = result.getAttribute(target.name())
        if (!attribute) {
          continue
        }

        const oldValue = attribute.get()
        const nextValue = applyPatch(this.dmpPatch, oldValue)
        result = result.setAttribute(target.name(), nextValue)
        continue
      }

      throw new Error(`Unable to apply diffMatchPatch to target ${target.toString()}`)
    }

    return result
  }
}
