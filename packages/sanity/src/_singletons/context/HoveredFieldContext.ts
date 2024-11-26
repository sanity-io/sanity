import type {Path} from '@sanity/types'
import {createContext} from 'sanity/_createContext'

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
export const HoveredFieldContext = createContext<HoveredFieldContextValue>(
  'sanity/_singletons/context/hovered-field',
  {
    store: {
      subscribe: () => () => undefined,
      getSnapshot: () => [],
    },
    onMouseEnter: () => undefined,
    onMouseLeave: () => undefined,
  },
)
