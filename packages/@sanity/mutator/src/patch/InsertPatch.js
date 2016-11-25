// @flow
import {targetsToIndicies} from './util'
import {min, max} from 'lodash'

export default class InsertPatch {
  location : string
  path : string
  items : Array<any>
  constructor(location : string, path : string, items : Array<any>) {
    this.location = location
    this.path = path
    this.items = items
  }
  apply(targets, accessor) {
    let result = accessor
    if (accessor.containerType() != 'array') {
      throw new Error('Attempt to apply insert patch to non-array value')
    }
    switch (this.location) {
      case 'before': {
        const pos = minIndex(targets, accessor)
        result = result.insertItemsAt(pos, this.items)
        break
      }
      case 'after': {
        const pos = maxIndex(targets, accessor)
        result = result.insertItemsAt(pos + 1, this.items)
        break
      }
      default: {
        throw new Error(`Unsupported location atm: ${this.location}`)
      }
    }
    return result
  }

}

function minIndex(targets, accessor) : number {
  let result = min(targetsToIndicies(targets, accessor))
  // Ranges may be zero-length and not turn up in indicies
  targets.forEach(target => {
    if (target.isRange()) {
      const {start} = target.expandRange()
      if (start < result) {
        result = start
      }
    }
  })
  return result
}

function maxIndex(targets, accessor) : number {
  let result = max(targetsToIndicies(targets, accessor))
  // Ranges may be zero-length and not turn up in indicies
  targets.forEach(target => {
    if (target.isRange()) {
      const {end} = target.expandRange()
      if (end > result) {
        result = end
      }
    }
  })
  return result
}