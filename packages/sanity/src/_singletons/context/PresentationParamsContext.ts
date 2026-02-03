import type {PresentationParamsContextValue} from '../../presentation/types'
import {createContext} from 'sanity/_createContext'

/**
 * @internal
 */
export const PresentationParamsContext = createContext<PresentationParamsContextValue | null>(
  'sanity/_singletons/context/presentation/params',
  null,
)
