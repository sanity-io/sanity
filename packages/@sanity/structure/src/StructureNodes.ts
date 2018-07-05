export interface StructureNode {
  id: string
  title?: string
  type: string
}

export interface EditorNode extends StructureNode {
  options: {
    id: string
    type: string
  }
}
