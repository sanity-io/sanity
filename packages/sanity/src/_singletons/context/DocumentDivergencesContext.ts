import {createContext} from 'sanity/_createContext'

import type {DivergenceNavigator} from '../../core/divergence/divergenceNavigator'

/**
 * @internal
 */
export type DocumentDivergencesContextValue =
  | (DivergenceNavigator & {enabled: true; sessionId: string})
  | {enabled: false; sessionId: null}

/**
 * @internal
 */
export const DocumentDivergencesContext = createContext<DocumentDivergencesContextValue | null>(
  'sanity/_singletons/context/document-divergences',
  null,
)
