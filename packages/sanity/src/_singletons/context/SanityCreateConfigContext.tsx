import {createContext} from 'sanity/_createContext'

import type {SanityCreateConfigContextValue} from '../../core'

/**
 * @internal
 */
export const SanityCreateConfigContext: React.Context<SanityCreateConfigContextValue> =
  createContext<SanityCreateConfigContextValue>(
    'sanity/_singletons/context/start-in-create-enabled',
    {
      startInCreateEnabled: false,
    },
  )
