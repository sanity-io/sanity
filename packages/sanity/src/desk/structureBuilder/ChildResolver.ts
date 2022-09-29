import {CollectionBuilder, Collection, SerializeOptions} from './StructureNodes'
import {StructureContext} from './types'

/** @beta */
// TODO: unify with the RouterSplitPaneContext
export interface ChildResolverOptions {
  parent: unknown
  index: number
  splitIndex: number
  path: string[]
  params: Record<string, string | undefined>
  structureContext: StructureContext
  serializeOptions?: SerializeOptions
}

/** @beta */
export type ItemChild = CollectionBuilder | Collection | undefined

/** @beta */
export interface ChildObservable {
  subscribe: (child: ItemChild | Promise<ItemChild>) => Record<string, unknown>
}

/** @beta */
// TODO: unify with PaneNodeResolver in desk-tool
export interface ChildResolver {
  (itemId: string, options: ChildResolverOptions):
    | ItemChild
    | Promise<ItemChild>
    | ChildObservable
    | undefined
}
