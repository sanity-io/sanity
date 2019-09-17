import {targetsToIndicies} from './util'

export default class UnsetPatch {
  id: string
  path: string
  value: any
  constructor(id: string, path: string) {
    this.id = id
    this.path = path
  }
  apply(targets, accessor) {
    let result = accessor
    switch (accessor.containerType()) {
      case 'array':
        result = result.unsetIndices(targetsToIndicies(targets, accessor))
        break
      case 'object':
        targets.forEach(target => {
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
