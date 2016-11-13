// @flow
import {targetsToIndicies} from './util'
import {min, max} from 'lodash'

export default class Insert {
  location : string
  path : string
  items : Array<any>
  constructor(location : string, path : string, items : Array<any>) {
    this.location = location
    this.path = path
    this.items = items
  }
  apply(targets, accessor) {
    if (!accessor.isIndexable()) {
      throw new Error('Attempt to apply insert patch to non-array value')
    }
    let mutator : Function
    switch (this.location) {
      case 'before': {
        const pos = minIndex(targets, accessor)
        accessor.mutate(value => {
          if (value.length == 0 && pos == 0) {
            return this.items
          }
          return value.slice(0, pos).concat(this.items).concat(value.slice(pos))
        })
        return
      }
      case 'after': {
        const pos = maxIndex(targets, accessor)
        accessor.mutate(value => {
          if (value.length == 0 && pos == 0) {
            return this.items
          }
          return value.slice(0, pos + 1).concat(this.items).concat(value.slice(pos + 1))
        })
        return
      }
      default: {
        throw new Error(`Unsupported location atm: ${this.location}`)
      }
    }
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