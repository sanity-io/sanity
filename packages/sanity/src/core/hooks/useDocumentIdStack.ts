import {type SanityDocument, type StrictVersionLayeringOptions} from '@sanity/types'
import {useMemo} from 'react'

import {getReleaseIdFromReleaseDocumentId} from '../releases/util/getReleaseIdFromReleaseDocumentId'
import {type EditStateFor} from '../store/_legacy/document/document-pair/editState'
import {useWorkspace} from '../studio/workspace'
import {getVersionId, isDraftId} from '../util/draftUtils'
import {useFilteredReleases} from './useFilteredReleases'

interface Options extends StrictVersionLayeringOptions {
  displayed: Partial<SanityDocument> | null
  documentId: string
  editState: EditStateFor | null
}

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
  strict,
}: Options): DocumentIdStack {
  const {
    document: {
      drafts: {enabled: isDraftModelEnabled},
    },
  } = useWorkspace()

  const filteredReleases = useFilteredReleases({
    displayed,
    documentId,
    strict,
  })

  // In strict mode, only include the draft if it's the displayed version. This
  // ensures layering reflects only the known chronology of versions.
  //
  // For example, when viewing an ASAP version, it's impossible to know whether
  // the draft will be published first.
  const shouldIncludeDraft =
    isDraftModelEnabled && (strict ? isDraftId(displayed?._id ?? '') : true)

  const systemStack = [
    editState?.published?._id,
    shouldIncludeDraft ? editState?.draft?._id : [],
  ].flat()

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
