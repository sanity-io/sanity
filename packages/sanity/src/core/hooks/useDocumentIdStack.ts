import {type SanityDocument, type StrictVersionLayeringOptions} from '@sanity/types'
import {useMemo} from 'react'

import {getReleaseIdFromReleaseDocumentId} from '../releases/util/getReleaseIdFromReleaseDocumentId'
import {type EditStateFor} from '../store/document/document-pair/editState'
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

  const displayedId = displayed?._id
  const editStateId = editState?.id
  const publishedId = editState?.published?._id
  const draftId = editState?.draft?._id
  const hasVersionCheckedOut = editState?.version !== null

  // In strict mode, only include the draft if it's the displayed version. This
  // ensures layering reflects only the known chronology of versions.
  //
  // For example, when viewing an ASAP version, it's impossible to know whether
  // the draft will be published first.
  const shouldIncludeDraft = isDraftModelEnabled && (strict ? isDraftId(displayedId ?? '') : true)

  const systemStack = [publishedId, shouldIncludeDraft ? draftId : []].flat()

  const releaseStack = filteredReleases.currentReleases.map(
    (release) =>
      editStateId && getVersionId(editStateId, getReleaseIdFromReleaseDocumentId(release._id)),
  )

  // Infer the subject is an anonymous version if:
  //
  //   1. The subject has a version checked out.
  //   2. *And* there is no release containing the checked-out version.
  const isAnonymousVersion = hasVersionCheckedOut && !releaseStack.includes(displayedId)
  const anonymousVersionsStack = isAnonymousVersion ? [displayedId] : []

  const stack = systemStack
    .concat(!isAnonymousVersion || !strict ? releaseStack : [])
    .concat(anonymousVersionsStack)
    .filter((id) => typeof id === 'string')

  const position = useMemo(() => stack.findIndex((id) => id === displayedId), [displayedId, stack])

  const previousId = useMemo(() => stack[position - 1] ?? undefined, [position, stack])
  const nextId = useMemo(() => stack[position + 1] ?? undefined, [position, stack])

  return {
    position,
    previousId,
    nextId,
    stack,
  }
}
