import {createContext} from 'react'
import type {PreviewCardContextValue} from 'sanity'

/**
 * @internal
 */
export const PreviewCardContext = createContext<PreviewCardContextValue>({selected: false})
