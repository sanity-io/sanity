import type {Path} from '@sanity/types'
import {createContext} from 'react'

/** @internal */
export interface HoveredFieldContextValue {
  store: {
    subscribe: (onStoreCallback: () => void) => () => void
    getSnapshot: () => string[]
  }
  onMouseEnter: (path: Path) => void
  onMouseLeave: (path: Path) => void
}

/** @internal */
export const HoveredFieldContext = createContext<HoveredFieldContextValue>({
  store: {
    subscribe: () => () => undefined,
    getSnapshot: () => [],
  },
  onMouseEnter: () => undefined,
  onMouseLeave: () => undefined,
})
