import {StructureNode, EditorNode} from './StructureNodes'

export interface ChildResolverOptions {
  index: number
}

export interface ChildResolver {
  (itemId: string, parent: StructureNode, options: ChildResolverOptions):
    | StructureNode
    | EditorNode
    | Promise<StructureNode | EditorNode>
    | undefined
}
