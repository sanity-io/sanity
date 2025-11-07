import {createContext} from 'react'

import {type View} from '../../structureBuilder'

/** @internal */
export interface ListPaneContextValue {
  activeViewId: string | null
  views: View[]
}

/** @internal */
export const ListPaneContext = createContext<ListPaneContextValue | null>(null)
