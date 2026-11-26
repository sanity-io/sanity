import {type EditStateFor} from 'sanity'

/**
 * Whether the document pane has nothing to show yet: no snapshot of the document has loaded, and
 * there is no cached copy of it either.
 *
 * The connection state says nothing about this. While the listener is down the snapshots load
 * without it, and a listener that has just connected may not have loaded them yet.
 */
export function isDocumentLoading(editState: EditStateFor | null | undefined): boolean {
  return !editState?.ready && !editState?.draft && !editState?.published && !editState?.version
}
