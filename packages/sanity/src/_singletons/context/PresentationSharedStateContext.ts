import type {PresentationSharedStateContextValue} from '../../presentation/overlays/types'
import {createContext} from 'sanity/_createContext'

/**
 * @internal
 */
export const PresentationSharedStateContext =
  createContext<PresentationSharedStateContextValue | null>(
    'sanity/_singletons/context/presentation/shared-state',
    null,
  )
