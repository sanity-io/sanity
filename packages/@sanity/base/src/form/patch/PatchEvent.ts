import {PathSegment} from '@sanity/types'
import {flatten} from 'lodash'
import {prefixPath} from './patch'
import {FormPatch} from './types'

export type PatchArg = FormPatch | FormPatch[]

export class PatchEvent {
  static from(...patches: PatchArg[]): PatchEvent {
    return new PatchEvent(flatten(patches))
  }

  patches: Array<FormPatch>

  constructor(patches: Array<FormPatch>) {
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
