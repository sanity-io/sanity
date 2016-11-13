// @flow

import Set from './Set'
import Inc from './Inc'
import Insert from './Insert'
import SetIfMissing from './SetIfMissing'
import Unset from './Unset'
import DiffMatchPatch from './DiffMatchPatch'

// Parses a Gradient patch into our own personal patch implementations
export default function parse(patch : Object) : Array<Object> {
  const result = []
  if (patch.set) {
    Object.keys(patch.set).forEach(path => {
      result.push(new Set(path, patch.set[path]))
    })
  }
  if (patch.setIfMissing) {
    Object.keys(patch.setIfMissing).forEach(path => {
      result.push(new SetIfMissing(path, patch.setIfMissing[path]))
    })
  }
  // TODO: merge
  if (patch.unset) {
    patch.unset.forEach(path => {
      result.push(new Unset(path))
    })
  }
  if (patch.diffMatchPatch) {
    Object.keys(patch.diffMatchPatch).forEach(path => {
      result.push(new DiffMatchPatch(path, patch.diffMatchPatch[path]))
    })
  }
  if (patch.inc) {
    Object.keys(patch.inc).forEach(path => {
      result.push(new Inc(path, patch.inc[path]))
    })
  }
  if (patch.dec) {
    Object.keys(patch.dec).forEach(path => {
      result.push(new Inc(path, -patch.dec[path]))
    })
  }
  if (patch.insert) {
    let location : string
    let path : string
    const spec = patch.insert
    if (spec.before) {
      location = 'before'
      path = spec.before
    } else if (spec.after) {
      location = 'after'
      path = spec.after
    } else if (spec.replace) {
      location = 'replace'
      path = spec.replace
    }
    result.push(new Insert(location, path, spec.items))
  }
  return result
}
