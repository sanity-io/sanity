import React from 'react'
import {Path} from '@sanity/types'

/** @internal */
export interface ChangeIndicatorContextValue {
  value?: unknown
  focusPath: Path
  path: Path
  fullPath: Path
  isChanged: boolean
}

/** @internal */
export const ChangeIndicatorContext: React.Context<ChangeIndicatorContextValue> =
  React.createContext({
    path: [],
    fullPath: [],
    focusPath: [],
    isChanged: false,
  } as ChangeIndicatorContextValue)
