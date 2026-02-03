import type {Source} from '../../core/config/types'
import {createContext} from 'sanity/_createContext'

/**
 * @internal
 */
export const SourceContext = createContext<Source | null>('sanity/_singletons/context/source', null)
