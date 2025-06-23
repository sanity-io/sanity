import {type EditStateFor} from './document-pair/editState'

/**
 * Determine whether the document represented by the provided `EditState` object has any existing
 * snapshot, meaning a version of the document has been written to the dataset.
 *
 * This is `true` when a document is first created in Studio, but no user action (e.g. editing its
 * value) has caused it to be written to the dataset.
 *
 * This is `undefined` while loading.
 *
 * @returns A boolean reflecting whether any version of the document exists in the dataset, and `undefined` while loading.
 * @internal
 */
export function isNewDocument(
  editState: Pick<EditStateFor, 'ready' | 'draft' | 'published' | 'version'> | null,
): boolean | undefined {
  if (editState?.ready) {
    return [editState.draft, editState.published, editState.version].every(
      (version) => version === null,
    )
  }
  return undefined
}
