import {createContext} from 'sanity/_createContext'

import type {StartInCreateEnabledContextValue} from '../../core/form/create/start-in-create/useStartInCreateEnabled'

/**
 * @internal
 */
export const StartInCreateContext = createContext<StartInCreateEnabledContextValue>(
  'sanity/_singletons/context/start-in-create-enabled',
  {
    enabled: false,
  },
)
