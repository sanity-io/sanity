import {CollectionBuilder, Collection, SerializePath, SerializeOptions} from './StructureNodes'

export interface ChildResolverOptions {
  index: number
  parent: Collection
  parentPath?: SerializePath
  parameters?: {[key: string]: any}
  serializeOptions?: SerializeOptions
}

export type ItemChild = CollectionBuilder | Collection | Function | undefined

interface ChildObservable {
  subscribe: (child: ItemChild | Promise<ItemChild>) => {}
}

export interface ChildResolver {
  (itemId: string, options: ChildResolverOptions):
    | ItemChild
    | Promise<ItemChild>
    | ChildObservable
    | undefined
}
