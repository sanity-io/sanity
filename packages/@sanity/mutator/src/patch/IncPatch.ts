import type {Expression} from '../jsonpath'
import type {ImmutableAccessor} from './ImmutableAccessor'

function performIncrement(previousValue: unknown, delta: number): number {
  if (typeof previousValue !== 'number' || !Number.isFinite(previousValue)) {
    return previousValue as number
  }

  return previousValue + delta
}

export class IncPatch {
  path: string
  value: number
  id: string

  constructor(id: string, path: string, value: number) {
    this.path = path
    this.value = value
    this.id = id
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

          const previousValue = item.get()
          result = result.setIndex(index, performIncrement(previousValue, this.value))
        }

        continue
      }

      if (target.isAttributeReference()) {
        const attribute = result.getAttribute(target.name())
        if (!attribute) {
          continue
        }

        const previousValue = attribute.get()
        result = result.setAttribute(target.name(), performIncrement(previousValue, this.value))
        continue
      }

      throw new Error(`Unable to apply to target ${target.toString()}`)
    }

    return result
  }
}
