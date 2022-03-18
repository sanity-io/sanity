import {PathSegment} from '@sanity/types'
import {flatten} from 'lodash'
import {prefixPath, set, unset, setIfMissing, insert, inc, dec} from './patch'
import {Patch} from './types'

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
