import React from 'react'
import {Path} from '@sanity/types'

export const ChangeIndicatorContext: React.Context<ChangeIndicatorContextValue> = React.createContext(
  {
    path: [],
    fullPath: [],
    focusPath: [],
  } as ChangeIndicatorContextValue
)

interface ChangeIndicatorContextValue {
  compareValue?: unknown
  focusPath: Path
  path: Path
  fullPath: Path
}

export const ChangeIndicatorValueContext: React.Context<unknown> = React.createContext(undefined)
