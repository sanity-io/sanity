import {PathSegment} from '@sanity/types'
import {flatten} from 'lodash'

import type {Patch} from '../types/patch'
import {prefixPath, set, unset, setIfMissing, insert, diffMatchPatch} from './patches'

type PatchArg = Patch | Array<Patch>

export default class PatchEvent {
  static from(...patches: Array<PatchArg>) {
    return new PatchEvent(flatten(patches))
  }

  patches: Array<Patch>

  constructor(patches: Array<Patch>) {
    this.patches = patches
  }

  prepend(...patches: Array<PatchArg>): PatchEvent {
    return PatchEvent.from([...flatten(patches), ...this.patches])
  }

  append(...patches: Array<PatchArg>): PatchEvent {
    return PatchEvent.from([...this.patches, ...flatten(patches)])
  }

  prefixAll(segment: PathSegment): PatchEvent {
    return PatchEvent.from(this.patches.map((patch) => prefixPath(patch, segment)))
  }
}

export {PatchEvent, set, unset, setIfMissing, insert, diffMatchPatch}
