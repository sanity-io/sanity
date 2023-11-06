interface CommentsSelectedPathValue {
  target: 'comment-item' | 'form-field' | 'new-thread-item' | null
  selectedFrom: 'comment-item' | 'form-field' | 'new-thread-item' | 'breadcrumbs' | null
  fieldPath: string | null
  threadId: string | null
}

export type CommentsSelectedPath = CommentsSelectedPathValue | null

export interface CommentsSelectedPathContextValue {
  setSelectedPath: (nextSelectedPath: CommentsSelectedPath) => void
  selectedPath: CommentsSelectedPath
}
