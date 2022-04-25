import React from 'react'
import {Path} from '@sanity/types'

export interface ChangeIndicatorContextValue {
  value?: unknown
  compareValue: unknown
  focusPath: Path
  path: Path
  fullPath: Path
}

export const ChangeIndicatorContext: React.Context<ChangeIndicatorContextValue> =
  React.createContext({
    compareValue: undefined,
    path: [],
    fullPath: [],
    focusPath: [],
  } as ChangeIndicatorContextValue)
