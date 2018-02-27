// @flow

import Expression from '../jsonpath/Expression'
import {targetsToIndicies} from './util'

export default class UnsetPatch {
  path: string
  value: any
  id: string
  constructor(id: string, path: string) {
    this.id = id
    this.path = path
  }
  /* eslint-disable class-methods-use-this */
  apply(targets: Array<Expression>, accessor: Object) {
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
  /* eslint-enable class-methods-use-this */
}
