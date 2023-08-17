import type {SanityClient} from '@sanity/client'
import type {Path} from '../paths'
import type {SanityDocument} from '../documents'

/** @public */
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

/** @internal */
export interface WeakReference extends Reference {
  _weak: true
}

/** @public */
export type ReferenceFilterSearchOptions = {
  filter?: string
  params?: Record<string, unknown>
  tag?: string
}

/** @public */
export interface ReferenceFilterResolverContext {
  document: SanityDocument
  parent?: Record<string, unknown> | Record<string, unknown>[]
  parentPath: Path
  getClient: (options: {apiVersion: string}) => SanityClient
}

/** @public */
export type ReferenceFilterResolver = (
  context: ReferenceFilterResolverContext,
) => ReferenceFilterSearchOptions | Promise<ReferenceFilterSearchOptions>

/** @public */
export interface ReferenceFilterResolverOptions {
  filter?: ReferenceFilterResolver
  filterParams?: never
}

/** @public */
export interface ReferenceFilterQueryOptions {
  filter: string
  filterParams?: Record<string, unknown>
}

/** @public */
export interface ReferenceBaseOptions {
  disableNew?: boolean
}

/** @public */
export type ReferenceFilterOptions = ReferenceFilterResolverOptions | ReferenceFilterQueryOptions
