import type {Path} from '@sanity/types'
import {createContext} from 'sanity/_createContext'

/** @internal */
export interface HoveredFieldContextValue {
  hoveredStack: string[]
  onMouseEnter: (path: Path) => void
  onMouseLeave: (path: Path) => void
}

/** @internal */
export const HoveredFieldContext = createContext<HoveredFieldContextValue>(
  'sanity/_singletons/context/hovered-field',
  {
    hoveredStack: [],
    onMouseEnter: () => undefined,
    onMouseLeave: () => undefined,
  },
)
