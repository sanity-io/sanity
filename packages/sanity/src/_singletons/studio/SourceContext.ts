import {createContext} from 'react'
import type {Source} from 'sanity'

/**
 * @internal
 */
export const SourceContext = createContext<Source | null>(null)
