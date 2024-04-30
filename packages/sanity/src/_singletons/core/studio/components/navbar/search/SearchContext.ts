import {createContext} from 'react'

import type {SearchContextValue} from '../../../../../../core/studio/components/navbar/search/contexts/search/SearchContext'

/**
 * @internal
 */
export const SearchContext = createContext<SearchContextValue | undefined>(undefined)
