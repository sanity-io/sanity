export interface CommentsSelectedPath {
  origin: 'form' | 'inspector' | 'url'
  fieldPath: string | null
  threadId: string | null
}

export interface CommentsSelectedPathContextValue {
  setSelectedPath: (nextSelectedPath: CommentsSelectedPath | null) => void
  selectedPath: CommentsSelectedPath | null
}
