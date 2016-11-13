// @flow
import Immutable from 'immutable'

export default class Revision {
  attributes : Immutable.Map<string, any>
  constructor(attributes : Object) {
    this.attributes = Immutable.fromJS(attributes)
  }
}
