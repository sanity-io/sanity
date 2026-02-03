import {createContext} from 'sanity/_createContext'

import type {PresentationSharedStateContextValue} from '../../presentation/overlays/types'

/**
 * @internal
 */
export const PresentationSharedStateContext =
  createContext<PresentationSharedStateContextValue | null>(
    'sanity/_singletons/context/presentation/shared-state',
    null,
  )
