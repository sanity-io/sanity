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
const DISABLED_DIVERGENCES_VALUE: DocumentDivergencesContextValue = {
  enabled: false,
  sessionId: null,
}

/**
 * @internal
 */
export const DocumentDivergencesContext = createContext<DocumentDivergencesContextValue>(
  'sanity/_singletons/context/document-divergences',
  DISABLED_DIVERGENCES_VALUE,
)
