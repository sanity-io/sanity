import {createContext} from 'sanity/_createContext'

/**
 * Where the document actions bar (status line, badges, Publish, the action menu) is
 * mounted relative to the document form.
 *
 * @internal
 */
export type DocumentActionsPlacement = 'top' | 'bottom'

/**
 * @internal
 */
export const DocumentActionsPlacementContext = createContext<DocumentActionsPlacement>(
  'sanity/_singletons/context/document-actions-placement',
  'bottom',
)
