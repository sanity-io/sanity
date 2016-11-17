import {targetsToIndicies} from './util'

export default class Unset {
  path : string
  value : any
  constructor(path : string) {
    this.path = path
  }
  apply(targets, accessor) {
    if (accessor.isIndexable()) {
      const indicies = targetsToIndicies(targets, accessor)
      // TODO: Optimize to use slice operations
      accessor.deleteIndicies(indicies)
    } else if (accessor.isPlainObject()) {
      targets.forEach(target => {
        accessor.delete(target.name())
      })
    } else {
      throw new Error('Target value is neither indexable or an object. This error should potentially just be silently ignored?')
    }
  }
}
