import {type Context} from 'react'
import {createContext} from 'sanity/_createContext'

import type {Source} from '../../core/config/types'

/**
 * @internal
 */
export const SourceContext: Context<Source | null> = createContext<Source | null>(
  'sanity/_singletons/context/source',
  null,
)
