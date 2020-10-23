import {min, max} from 'lodash'
import {targetsToIndicies} from './util'

export default class InsertPatch {
  location: string
  path: string
  items: Array<any>
  id: string
  constructor(id: string, location: string, path: string, items: Array<any>) {
    this.id = id
    this.location = location
    this.path = path
    this.items = items
  }
  apply(targets, accessor) {
    let result = accessor
    if (accessor.containerType() !== 'array') {
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
      case 'replace': {
        // TODO: Properly implement ranges in compliance with Gradient
        // This will only properly support single contiguous ranges
        const indicies = targetsToIndicies(targets, accessor)
        result = result.unsetIndices(indicies)
        result = result.insertItemsAt(indicies[0], this.items)
        break
      }
      default: {
        throw new Error(`Unsupported location atm: ${this.location}`)
      }
    }
    return result
  }
}

function minIndex(targets, accessor): number {
  let result = min(targetsToIndicies(targets, accessor))
  // Ranges may be zero-length and not turn up in indices
  targets.forEach((target) => {
    if (target.isRange()) {
      const {start} = target.expandRange()
      if (start < result) {
        result = start
      }
    }
  })
  return result
}

function maxIndex(targets, accessor): number {
  let result = max(targetsToIndicies(targets, accessor))
  // Ranges may be zero-length and not turn up in indices
  targets.forEach((target) => {
    if (target.isRange()) {
      const {end} = target.expandRange()
      if (end > result) {
        result = end
      }
    }
  })
  return result
}
