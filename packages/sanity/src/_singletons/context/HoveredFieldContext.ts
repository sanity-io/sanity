import type {Path} from '@sanity/types'
import {createContext} from 'react'

/** @internal */
export interface HoveredFieldContextValue {
  hoveredStack: string[]
  onMouseEnter: (path: Path) => void
  onMouseLeave: (path: Path) => void
}

/** @internal */
export const HoveredFieldContext = createContext<HoveredFieldContextValue>({
  hoveredStack: [],
  onMouseEnter: () => undefined,
  onMouseLeave: () => undefined,
})
