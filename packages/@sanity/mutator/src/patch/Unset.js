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
      accessor.mutate(value => {
        const length = value.length
        const newValue = []
        // Copy every value _not_ in the indicies array over to the newValue
        for (let i = 0; i < length; i++) {
          if (indicies.indexOf(i) == -1) {
            newValue.push(value[i])
          }
        }
        return newValue
      })
    } else if (accessor.isPlainObject()) {
      accessor.mutate(value => {
        targets.forEach(target => {
          delete value[target.name()]
        })
        return value
      })
    } else {
      throw new Error('Target value is neither indexable or an object. This error should potentially just be silently ignored?')
    }
  }
}

