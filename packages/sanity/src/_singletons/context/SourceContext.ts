import {createContext} from 'sanity/_createContext'

import type {Source} from '../../core/config/types'

/**
 * @internal
 */
export const SourceContext: React.Context<Source | null> = createContext<Source | null>(
  'sanity/_singletons/context/source',
  null,
)
