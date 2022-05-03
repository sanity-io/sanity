import {PathSegment} from '@sanity/types'
import {flatten} from 'lodash'
import {prefixPath} from './patch'
import {FormPatch, PatchArg} from './types'

/**
 * @internal
 */
export class PatchEvent {
  static from(input: PatchArg | PatchEvent): PatchEvent {
    if (input instanceof PatchEvent) {
      return input
    }
    return new PatchEvent(Array.isArray(input) ? flatten(input) : [input])
  }

  patches: Array<FormPatch>

  constructor(patches: Array<FormPatch>) {
    this.patches = patches
  }

  prepend(...patches: PatchArg[]): PatchEvent {
    return PatchEvent.from([...flatten(patches), ...this.patches])
  }

  append(...patches: PatchArg[]): PatchEvent {
    return PatchEvent.from([...this.patches, ...flatten(patches)])
  }

  prefixAll(segment: PathSegment): PatchEvent {
    return PatchEvent.from(this.patches.map((patch) => prefixPath(patch, segment)))
  }
}
