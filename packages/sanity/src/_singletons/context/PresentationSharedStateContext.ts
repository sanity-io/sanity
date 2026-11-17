import {createContext} from 'react'

import type {PresentationSharedStateContextValue} from '../../presentation/overlays/types'

/**
 * @internal
 */
export const PresentationSharedStateContext =
  createContext<PresentationSharedStateContextValue | null>(null)
