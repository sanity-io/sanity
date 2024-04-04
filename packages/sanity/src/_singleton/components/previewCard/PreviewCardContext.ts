import {createContext} from 'react'

/**
 * @internal
 * @hidden
 */
export interface PreviewCardContextValue {
  selected?: boolean
}

/**
 * @internal
 * @hidden
 */
export const PreviewCardContext = createContext<PreviewCardContextValue>({selected: false})
