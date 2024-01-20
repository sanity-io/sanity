import {type Path} from '@sanity/types'
import {type Context, createContext} from 'react'

/** @internal */
export interface ChangeIndicatorContextValue {
  value?: unknown
  focusPath: Path
  path: Path
  fullPath: Path
  isChanged: boolean
}

/** @internal */
export const ChangeIndicatorContext: Context<ChangeIndicatorContextValue> = createContext({
  path: [],
  fullPath: [],
  focusPath: [],
  isChanged: false,
} as ChangeIndicatorContextValue)
