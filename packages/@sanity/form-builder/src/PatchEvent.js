// @flow
import type {PathSegment, Patch} from './utils/patches'
import {prefixPath, set, unset, setIfMissing, insert} from './utils/patches'

import {flatten} from 'lodash'

export {set, unset, setIfMissing, insert}

type PatchArg = Patch | Array<Patch>

export default class PatchEvent {
  static from(...patches : Array<PatchArg>) {
    return new PatchEvent(flatten(patches))
  }

  patches: Array<Patch>

  constructor(patches : Array<Patch>) {
    this.patches = patches
  }

  prepend(...patches: Array<PatchArg>) : PatchEvent {
    return PatchEvent.from([...flatten(patches), ...this.patches])
  }

  append(...patches: Array<PatchArg>) : PatchEvent {
    return PatchEvent.from([...this.patches, ...flatten(patches)])
  }

  prefixAll(segment : PathSegment) : PatchEvent {
    return PatchEvent.from(this.patches.map(patch => prefixPath(patch, segment)))
  }
}
