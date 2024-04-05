import {createContext} from 'react'
import type {SearchContextValue} from 'sanity'

/**
 * @internal
 */
export const SearchContext = createContext<SearchContextValue | undefined>(undefined)
