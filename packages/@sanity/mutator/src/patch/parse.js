// @flow

import SetPatch from './SetPatch'
import IncPatch from './IncPatch'
import InsertPatch from './InsertPatch'
import SetIfMissingPatch from './SetIfMissingPatch'
import UnsetPatch from './UnsetPatch'
import DiffMatchPatch from './DiffMatchPatch'

// Parses a Gradient patch into our own personal patch implementations
/* eslint-disable complexity */
export default function parse(patch: Object): Array<Object> {
  const result = []
  if (Array.isArray(patch)) {
    return patch.reduce((res, patch2) => res.concat(parse(patch2)), result)
  }
  if (patch.set) {
    Object.keys(patch.set).forEach(path => {
      result.push(new SetPatch(patch.id, path, patch.set[path]))
    })
  }
  if (patch.setIfMissing) {
    Object.keys(patch.setIfMissing).forEach(path => {
      result.push(new SetIfMissingPatch(patch.id, path, patch.setIfMissing[path]))
    })
  }
  if (patch.unset) {
    patch.unset.forEach(path => {
      result.push(new UnsetPatch(patch.id, path))
    })
  }
  if (patch.diffMatchPatch) {
    Object.keys(patch.diffMatchPatch).forEach(path => {
      result.push(new DiffMatchPatch(patch.id, path, patch.diffMatchPatch[path]))
    })
  }
  if (patch.inc) {
    Object.keys(patch.inc).forEach(path => {
      result.push(new IncPatch(patch.id, path, patch.inc[path]))
    })
  }
  if (patch.dec) {
    Object.keys(patch.dec).forEach(path => {
      result.push(new IncPatch(patch.id, path, -patch.dec[path]))
    })
  }
  if (patch.insert) {
    let location: string
    let path: string
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
    if (!location || !path) {
      throw new Error('Insert patch needs a location (before, after or replace)')
    }
    result.push(new InsertPatch(patch.id, location, path, spec.items))
  }
  return result
}
/* eslint-enable complexity */
