import {createContext} from 'react'
import {Path} from '@sanity/types'
import {pathFor} from '@sanity/util/paths'

export interface FocusPathContextValue {
  onFocus: (path: Path) => void
  focusPath: Path
}
const EMPTY_PATH = pathFor([])

export const FocusPathContext = createContext<FocusPathContextValue>({
  onFocus: () => {},
  focusPath: EMPTY_PATH,
})
