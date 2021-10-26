import {CollectionBuilder, Collection, SerializeOptions} from './StructureNodes'
import {FixMe} from './types'

// TODO: unify with the RouterSplitPaneContext
export interface ChildResolverOptions {
  parent: unknown
  index: number
  splitIndex: number
  path: string[]
  params: Record<string, string | undefined>
  serializeOptions?: SerializeOptions
}

export type ItemChild = CollectionBuilder | Collection | FixMe | undefined

interface ChildObservable {
  subscribe: (child: ItemChild | Promise<ItemChild>) => Record<string, unknown>
}

export interface ChildResolver {
  (itemId: string, options: ChildResolverOptions):
    | ItemChild
    | Promise<ItemChild>
    | ChildObservable
    | undefined
}
