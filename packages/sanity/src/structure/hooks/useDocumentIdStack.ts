import {useMemo} from 'react'
import {getReleaseIdFromReleaseDocumentId, getVersionId} from 'sanity'

import {type DocumentPaneContextValue} from '../panes/document/DocumentPaneContext'
import {useFilteredReleases} from './useFilteredReleases'

/**
 * @internal
 */
export interface DocumentIdStack {
  /**
   * The position of the displayed document within the stack.
   */
  position: number
  /**
   * The id of the previous document in the stack.
   */
  previousId?: string
  /**
   * The id of the next document in the stack.
   */
  nextId?: string
  /**
   * An array of document ids comprising the stack the displayed document is a member of, ordered per
   * release layering.
   */
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
  const systemStack = [editState?.published?._id, editState?.draft?._id]

  const releaseStack = filteredReleases.currentReleases.map(
    (release) =>
      editState?.id && getVersionId(editState.id, getReleaseIdFromReleaseDocumentId(release._id)),
  )

  const stack = systemStack.concat(releaseStack).filter((id) => typeof id === 'string')

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
