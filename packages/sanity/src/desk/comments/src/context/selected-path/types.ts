interface CommentsSelectedPathValue {
  origin: 'form' | 'inspector'
  fieldPath: string | null
  threadId: string | null
}

export type CommentsSelectedPath = CommentsSelectedPathValue | null

export interface CommentsSelectedPathContextValue {
  setSelectedPath: (nextSelectedPath: CommentsSelectedPath) => void
  selectedPath: CommentsSelectedPath
}
