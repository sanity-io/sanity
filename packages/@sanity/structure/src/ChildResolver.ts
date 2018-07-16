import {CollectionBuilder, Collection, SerializePath} from './StructureNodes'

export interface ChildResolverOptions {
  index: number
  parentPath?: SerializePath
}

export type ItemChild = CollectionBuilder | Collection | undefined

export interface ChildResolver {
  (itemId: string, parent: Collection, options: ChildResolverOptions):
    | ItemChild
    | Promise<ItemChild>
    | undefined
}
