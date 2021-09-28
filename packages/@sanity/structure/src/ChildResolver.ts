import {CollectionBuilder, Collection, SerializePath, SerializeOptions} from './StructureNodes'
import {FixMe} from './types'

export interface ChildResolverOptions {
  index: number
  parent: Collection
  parentPath?: SerializePath
  parameters?: {[key: string]: any}
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
