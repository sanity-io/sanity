import React from 'react'
import {Path} from '@sanity/types'

interface ChangeIndicatorContextValue {
  value?: any
  compareValue?: any
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
