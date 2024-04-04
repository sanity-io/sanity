import {createContext} from 'react'

/** @internal */
export interface PreviewCardContextValue {
  selected?: boolean
}

export const PreviewCardContext = createContext<PreviewCardContextValue>({selected: false})
