/** @internal */
export interface CommentsSelectedPathValue {
  origin: 'form' | 'inspector'
  fieldPath: string | null
  threadId: string | null
}

/** @internal */
export type CommentsSelectedPath = CommentsSelectedPathValue | null

/** @internal */
export interface CommentsSelectedPathContextValue {
  setSelectedPath: (nextSelectedPath: CommentsSelectedPath) => void
  selectedPath: CommentsSelectedPath
}
