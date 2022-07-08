import {SetPatch} from './SetPatch'
import {IncPatch} from './IncPatch'
import {InsertPatch} from './InsertPatch'
import {SetIfMissingPatch} from './SetIfMissingPatch'
import {UnsetPatch} from './UnsetPatch'
import {DiffMatchPatch} from './DiffMatchPatch'
import type {PatchTypes, SingleDocumentPatch} from './types'

// Parses a content lake patch into our own personal patch implementations
export function parsePatch(patch: SingleDocumentPatch | SingleDocumentPatch[]): PatchTypes[] {
  const result: PatchTypes[] = []
  if (Array.isArray(patch)) {
    return patch.reduce((r, p) => r.concat(parsePatch(p)), result)
  }

  const {set, setIfMissing, unset, diffMatchPatch, inc, dec, insert} = patch
  if (set) {
    Object.keys(set).forEach((path) => {
      result.push(new SetPatch(patch.id, path, set[path]))
    })
  }

  if (setIfMissing) {
    Object.keys(setIfMissing).forEach((path) => {
      result.push(new SetIfMissingPatch(patch.id, path, setIfMissing[path]))
    })
  }

  if (unset) {
    unset.forEach((path) => {
      result.push(new UnsetPatch(patch.id, path))
    })
  }

  if (diffMatchPatch) {
    Object.keys(diffMatchPatch).forEach((path) => {
      result.push(new DiffMatchPatch(patch.id, path, diffMatchPatch[path]))
    })
  }

  if (inc) {
    Object.keys(inc).forEach((path) => {
      result.push(new IncPatch(patch.id, path, inc[path]))
    })
  }

  if (dec) {
    Object.keys(dec).forEach((path) => {
      result.push(new IncPatch(patch.id, path, -dec[path]))
    })
  }

  if (insert) {
    let location: string
    let path: string
    const spec = insert
    if ('before' in spec) {
      location = 'before'
      path = spec.before
    } else if ('after' in spec) {
      location = 'after'
      path = spec.after
    } else if ('replace' in spec) {
      location = 'replace'
      path = spec.replace
    } else {
      throw new Error('Invalid insert patch')
    }

    result.push(new InsertPatch(patch.id, location, path, spec.items))
  }

  return result
}
