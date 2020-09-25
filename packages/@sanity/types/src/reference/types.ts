import {Path} from '../paths'
import {SanityDocument} from '../documents'

export interface Reference {
  _ref: string
  _key?: string
  _weak?: boolean
}

export interface WeakReference extends Reference {
  _weak: true
}

export type ReferenceFilterSearchOptions = {
  filter?: string
  params?: Record<string, unknown>
}

export type ReferenceFilterResolver = (options: {
  document: SanityDocument
  parent?: Record<string, unknown> | Record<string, unknown>[]
  parentPath: Path
}) => ReferenceFilterSearchOptions

export type ReferenceOptions =
  | {filter: ReferenceFilterResolver}
  | {filter: string; filterParams?: Record<string, unknown>}
