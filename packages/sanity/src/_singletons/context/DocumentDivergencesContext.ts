import {createContext} from 'react'

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
export const DocumentDivergencesContext = createContext<DocumentDivergencesContextValue>({
  enabled: false,
  sessionId: null,
})
