import React from 'react'
import type {Path} from '@sanity/types'

interface ChangeIndicatorContextValue {
  value?: unknown
  compareValue?: unknown
  focusPath: Path
  path: Path
  fullPath: Path
}

export const ChangeIndicatorContext: React.Context<ChangeIndicatorContextValue> = React.createContext(
  {
    path: [],
    fullPath: [],
    focusPath: [],
  } as ChangeIndicatorContextValue
)
