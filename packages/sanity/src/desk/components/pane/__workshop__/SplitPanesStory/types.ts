export interface ListPaneNode {
  type: 'list'
  id: string
  title: string
  items: {
    id: string
    title: string
  }[]
}

export interface DocumentPaneNode {
  type: 'document'
  id: string
}

export type PaneNode = ListPaneNode | DocumentPaneNode
