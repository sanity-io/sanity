import type {Expression} from '../jsonpath'
import type {ImmutableAccessor} from './ImmutableAccessor'
import {targetsToIndicies} from './util'

export class UnsetPatch {
  id: string
  path: string
  value: unknown

  constructor(id: string, path: string) {
    this.id = id
    this.path = path
  }

  // eslint-disable-next-line class-methods-use-this
  apply(targets: Expression[], accessor: ImmutableAccessor): ImmutableAccessor {
    let result = accessor
    switch (accessor.containerType()) {
      case 'array':
        result = result.unsetIndices(targetsToIndicies(targets, accessor))
        break
      case 'object':
        targets.forEach((target) => {
          result = result.unsetAttribute(target.name())
        })
        break
      default:
        throw new Error(
          'Target value is neither indexable or an object. This error should potentially just be silently ignored?'
        )
    }
    return result
  }
}
