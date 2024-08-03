import {createContext} from 'sanity/_createContext'

import type {Source} from '../../core/config/types'

/**
 * @internal
 */
export const SourceContext = createContext<Source | null>('sanity/_singletons/context/source', null)
