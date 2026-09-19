import {type EditStateFor} from 'sanity'

import {type isPerspectiveWriteable} from '../core/perspective/isPerspectiveWriteable'
import {isNewDocument} from '../core/store/document/isNewDocument'

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
