import type {SanityCreateConfigContextValue} from '../../core'
import {createContext} from 'sanity/_createContext'

/**
 * @internal
 */
export const SanityCreateConfigContext = createContext<SanityCreateConfigContextValue>(
  'sanity/_singletons/context/start-in-create-enabled',
  {
    startInCreateEnabled: false,
  },
)
