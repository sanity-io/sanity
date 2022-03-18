import type {Patch} from '@sanity/base/_internal'
import {flatten} from 'lodash'
import {PathSegment} from '@sanity/types'
import {prefixPath, set, unset, setIfMissing, insert, inc, dec} from './patch/patches'

type PatchArg = Patch | Patch[]

export class PatchEvent {
  static from(...patches: PatchArg[]): PatchEvent {
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

export {set, unset, setIfMissing, insert, inc, dec}
