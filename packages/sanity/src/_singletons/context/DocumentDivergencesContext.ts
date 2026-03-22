import {createContext} from 'sanity/_createContext'

import type {DivergenceNavigator} from '../../core/divergence/divergenceNavigator'

/**
 * @internal
 */
export type DocumentDivergencesContextValue = DivergenceNavigator

/**
 * @internal
 */
export const DocumentDivergencesContext = createContext<DocumentDivergencesContextValue | null>(
  'sanity/_singletons/context/document-divergences',
  null,
)
