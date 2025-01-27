import {useMemo} from 'react'
import {getReleaseIdFromReleaseDocumentId, getVersionId} from 'sanity'

import {type DocumentPaneContextValue} from '../panes/document/DocumentPaneContext'
import {useFilteredReleases} from './useFilteredReleases'

/**
 * @internal
 */
export interface DocumentIdStack {
  position: number
  previousId?: string
  nextId?: string
  stack: string[]
}

/**
 * Get a stack of document ids representing existing versions of the provided document with release
 * layering applied.
 *
 * @internal
 */
export function useDocumentIdStack({
  displayed,
  documentId,
  editState,
}: Pick<DocumentPaneContextValue, 'displayed' | 'documentId' | 'editState'>): DocumentIdStack {
  const filteredReleases = useFilteredReleases({displayed, documentId})

  const stack = [
    editState?.published && editState.published._id,
    editState?.draft && editState.draft._id,
  ]
    .concat(
      filteredReleases.currentReleases.map(
        (release) =>
          editState?.id &&
          getVersionId(editState.id, getReleaseIdFromReleaseDocumentId(release._id)),
      ),
    )
    .filter((id) => typeof id === 'string')

  const position = useMemo(
    () => stack.findIndex((id) => id === displayed?._id),
    [displayed?._id, stack],
  )

  const previousId = useMemo(() => stack[position - 1] ?? undefined, [position, stack])
  const nextId = useMemo(() => stack[position + 1] ?? undefined, [position, stack])

  return {
    position,
    previousId,
    nextId,
    stack,
  }
}
