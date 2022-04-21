import {PathSegment} from '@sanity/types'
import {flatten} from 'lodash'
import {prefixPath} from './patch'
import {FIXME_Patch} from './types'

export type PatchArg = FIXME_Patch | FIXME_Patch[]

export class PatchEvent {
  static from(...patches: PatchArg[]): PatchEvent {
    return new PatchEvent(flatten(patches))
  }

  patches: Array<FIXME_Patch>

  constructor(patches: Array<FIXME_Patch>) {
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
