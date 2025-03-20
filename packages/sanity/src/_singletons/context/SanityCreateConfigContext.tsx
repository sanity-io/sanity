import {createContext} from 'sanity/_createContext'

import type {SanityCreateConfigContextValue} from '../../core/create/context/useSanityCreateConfig'

/**
 * @internal
 */
export const SanityCreateConfigContext = createContext<SanityCreateConfigContextValue>(
  'sanity/_singletons/context/start-in-create-enabled',
  {
    startInCreateEnabled: false,
  },
)
