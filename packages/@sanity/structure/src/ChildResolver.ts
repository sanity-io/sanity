import {SanityClient} from '@sanity/client'
import {Template} from '@sanity/initial-value-templates'
import {Schema} from '@sanity/types'
import {CollectionBuilder, Collection, SerializeOptions} from './StructureNodes'
import {DocumentNodeResolver, StructureBuilder} from './types'

export interface ChildResolverContext {
  client: SanityClient
  resolveStructureDocumentNode?: DocumentNodeResolver
  schema: Schema
  structureBuilder: StructureBuilder
  templates: Template[]
}

/**
 * @todo: unify with the RouterSplitPaneContext
 */
export interface ChildResolverOptions {
  parent: unknown
  index: number
  splitIndex: number
  path: string[]
  params: Record<string, string | undefined>
  serializeOptions?: SerializeOptions
}

export type ItemChild = CollectionBuilder | Collection | undefined

interface ChildObservable {
  subscribe: (child: ItemChild | Promise<ItemChild>) => Record<string, unknown>
}

export interface ChildResolver {
  (context: ChildResolverContext, itemId: string, options: ChildResolverOptions):
    | ItemChild
    | Promise<ItemChild>
    | ChildObservable
    | undefined
}
