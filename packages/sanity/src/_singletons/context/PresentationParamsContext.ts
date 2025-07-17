import {createContext} from 'sanity/_createContext'

import type {PresentationParamsContextValue} from '../../presentation/types'

/**
 * @internal
 */
export const PresentationParamsContext: React.Context<PresentationParamsContextValue | null> =
  createContext<PresentationParamsContextValue | null>(
    'sanity/_singletons/context/presentation/params',
    null,
  )
