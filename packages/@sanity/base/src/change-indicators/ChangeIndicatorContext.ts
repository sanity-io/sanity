import React from 'react'
import {Path} from '@sanity/types'

interface ChangeIndicatorContext {
  value?: any
  compareValue?: any
  focusPath: Path
  path: Path
  fullPath: Path
}

const initial: ChangeIndicatorContext = {path: [], fullPath: [], focusPath: null}

export const ChangeIndicatorContext: React.Context<ChangeIndicatorContext> = React.createContext(
  initial
)
