// @flow

import SetPatch from './SetPatch'
import IncPatch from './IncPatch'
import InsertPatch from './InsertPatch'
import SetIfMissingPatch from './SetIfMissingPatch'
import UnsetPatch from './UnsetPatch'
import DiffMatchPatch from './DiffMatchPatch'

// Parses a Gradient patch into our own personal patch implementations
export default function parse(patch : Object) : Array<Object> {
  const result = []
  if (Array.isArray(patch)) {
    return patch.reduce((r, p) => r.concat(parse(p)), result)
  }
  if (patch.set) {
    Object.keys(patch.set).forEach(path => {
      result.push(new SetPatch(path, patch.set[path]))
    })
  }
  if (patch.setIfMissing) {
    Object.keys(patch.setIfMissing).forEach(path => {
      result.push(new SetIfMissingPatch(path, patch.setIfMissing[path]))
    })
  }
  // TODO: merge
  if (patch.unset) {
    patch.unset.forEach(path => {
      result.push(new UnsetPatch(path))
    })
  }
  if (patch.diffMatchPatch) {
    Object.keys(patch.diffMatchPatch).forEach(path => {
      result.push(new DiffMatchPatch(path, patch.diffMatchPatch[path]))
    })
  }
  if (patch.inc) {
    Object.keys(patch.inc).forEach(path => {
      result.push(new IncPatch(path, patch.inc[path]))
    })
  }
  if (patch.dec) {
    Object.keys(patch.dec).forEach(path => {
      result.push(new IncPatch(path, -patch.dec[path]))
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
    result.push(new InsertPatch(location, path, spec.items))
  }
  return result
}
