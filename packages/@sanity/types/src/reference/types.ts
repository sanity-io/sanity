import type {Path} from '../paths'
import type {SanityDocument} from '../documents'

export interface Reference {
  _type: string
  _ref: string
  _key?: string
  _weak?: boolean
  _strengthenOnPublish?: {
    type: string
    weak?: boolean
    template?: {id: string; params: Record<string, string | number | boolean>}
  }
}

export interface WeakReference extends Reference {
  _weak: true
}

export type ReferenceFilterSearchOptions = {
  filter?: string
  params?: Record<string, unknown>
  tag?: string
}

export type ReferenceFilterResolver = (options: {
  document: SanityDocument
  parent?: Record<string, unknown> | Record<string, unknown>[]
  parentPath: Path
}) => ReferenceFilterSearchOptions | Promise<ReferenceFilterSearchOptions>

export interface ReferenceFilterResolverOptions {
  filter: ReferenceFilterResolver
}
export interface ReferenceFilterQueryOptions {
  filter: string
  filterParams?: Record<string, unknown>
}

export interface ReferenceBaseOptions {
  disableNew?: boolean
}

export type ReferenceFilterOptions = ReferenceFilterResolverOptions | ReferenceFilterQueryOptions
