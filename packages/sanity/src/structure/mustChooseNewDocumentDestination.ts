import {type EditStateFor} from 'sanity'
import {
  isNewDocument,
  type isPerspectiveWriteable,
} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver'

/**
 * Determine whether the user must choose a new perspective in order to create a document.
 *
 * @returns A boolean reflecting whether the user must choose a new perspective, and `undefined` while indeterminate.
 * @internal
 */
export function mustChooseNewDocumentDestination({
  isSelectedPerspectiveWriteable,
  editState,
}: {
  isSelectedPerspectiveWriteable: ReturnType<typeof isPerspectiveWriteable>
  editState: Pick<EditStateFor, 'ready' | 'draft' | 'published' | 'version'> | null
}): boolean | undefined {
  return isNewDocument(editState) && !isSelectedPerspectiveWriteable.result
}
